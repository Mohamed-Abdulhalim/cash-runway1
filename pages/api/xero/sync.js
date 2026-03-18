import { getTokens, saveSnapshot } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Step 1: parsing body')
    let body = {}
    try {
      body = typeof req.body === 'string' ? (req.body ? JSON.parse(req.body) : {}) : (req.body || {})
    } catch (e) {
      body = {}
    }
    const manualBalance = body?.manual_balance ?? null
    console.log('Step 2: getting tokens')
    const tokens = await getTokens(req, res)
    console.log('Step 3: tokens retrieved, access_token exists:', !!tokens?.access_token)

    const connections = await fetch('https://api.xero.com/connections', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Accept: 'application/json'
      }
    }).then(r => r.json())

    if (!connections.length) {
      return res.status(400).json({ error: 'No Xero organisation connected' })
    }

    const tenantId = connections[0].tenantId

    function parseXeroDate(dateStr) {
      if (!dateStr) return null
      const match = dateStr.match(/\/Date\((\d+)/)
      if (match) return new Date(parseInt(match[1])).toISOString().split('T')[0]
      return dateStr
    }

    // fetch confirmed invoices (receivables)
    const invoicesRes = await fetch('https://api.xero.com/api.xro/2.0/Invoices?where=Status%3D%3D%22AUTHORISED%22%26%26Type%3D%3D%22ACCREC%22', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Xero-tenant-id': tenantId,
        Accept: 'application/json'
      }
    })
    const invoicesText = await invoicesRes.text()
    console.log('Invoices status:', invoicesRes.status, 'body length:', invoicesText.length)
    const invoices = (invoicesRes.status === 200 && invoicesText) ? JSON.parse(invoicesText) : { Invoices: [] }

    // fetch confirmed bills (payables)
    const billsRes = await fetch('https://api.xero.com/api.xro/2.0/Invoices?where=Status%3D%3D%22AUTHORISED%22%26%26Type%3D%3D%22ACCPAY%22', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Xero-tenant-id': tenantId,
        Accept: 'application/json'
      }
    })
    const billsText = await billsRes.text()
    console.log('Bills status:', billsRes.status, 'body length:', billsText.length)
    const bills = (billsRes.status === 200 && billsText) ? JSON.parse(billsText) : { Invoices: [] }

    // fetch bank balance automatically
    let startingCash = 0
    try {
      const accountsRes = await fetch('https://api.xero.com/api.xro/2.0/Accounts?where=Type%3D%3D%22BANK%22', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Xero-tenant-id': tenantId,
          Accept: 'application/json'
        }
      })
      const accountsText = await accountsRes.text()
      if (accountsRes.status === 200 && accountsText) {
        const accounts = JSON.parse(accountsText)
        startingCash = (accounts.Accounts || [])
          .reduce((sum, a) => sum + (a.Balance || 0), 0)
        console.log('Bank balance from Xero:', startingCash)
      }
    } catch (e) {
      console.log('Could not fetch bank balance, defaulting to 0')
    }

    let monthlyIncomeAverage = 0
    try {
      const bankTxRes = await fetch(`https://api.xero.com/api.xro/2.0/BankTransactions?where=Type%3D%3D%22RECEIVE%22%26%26Status%3D%3D%22AUTHORISED%22`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Xero-tenant-id': tenantId,
          Accept: 'application/json'
        }
      })
      const bankTxText = await bankTxRes.text()
      if (bankTxRes.status === 200 && bankTxText) {
        const bankTx = JSON.parse(bankTxText)
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        const recentTransactions = (bankTx.BankTransactions || [])
          .filter(tx => new Date(parseXeroDate(tx.Date)) >= ninetyDaysAgo)
        const totalIncome = recentTransactions
          .reduce((sum, tx) => sum + (tx.Total || 0), 0)
        monthlyIncomeAverage = totalIncome / 3
        console.log('Monthly average income:', monthlyIncomeAverage)
      }
    } catch (e) {
      console.log('Bank transactions unavailable, skipping historical forecast')
    }

    // detect recurring spend patterns from bank transactions
    const projectedOutflows = []
    try {
      const spendTxRes = await fetch(`https://api.xero.com/api.xro/2.0/BankTransactions?where=Type%3D%3D%22SPEND%22%26%26Status%3D%3D%22AUTHORISED%22`, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Xero-tenant-id': tenantId,
          Accept: 'application/json'
        }
      })
      const spendTxText = await spendTxRes.text()
      if (spendTxRes.status === 200 && spendTxText) {
        const spendTx = JSON.parse(spendTxText)
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        // group transactions by contact name
        const byContact = {}
        ;(spendTx.BankTransactions || [])
          .filter(tx => new Date(parseXeroDate(tx.Date)) >= ninetyDaysAgo)
          .forEach(tx => {
            const name = tx.Contact?.Name || 'Unknown'
            if (!byContact[name]) byContact[name] = []
            byContact[name].push({
              amount: tx.Total || 0,
              date: parseXeroDate(tx.Date)
            })
          })

        // flag contacts with 2+ transactions in 90 days as recurring
        Object.entries(byContact).forEach(([name, txs]) => {
          if (txs.length >= 2) {
            const avgAmount = txs.reduce((sum, t) => sum + t.amount, 0) / txs.length
            for (let month = 1; month <= 2; month++) {
              const projectedDate = new Date()
              projectedDate.setMonth(projectedDate.getMonth() + month)
              projectedDate.setDate(1)
              projectedOutflows.push({
                id: `recurring_${name}_${month}`,
                amount: avgAmount,
                due_date: projectedDate.toISOString().split('T')[0],
                is_overdue: false,
                type: 'recurring'
              })
            }
          }
        })
        console.log('Projected recurring outflows detected:', projectedOutflows.length)
      }
    } catch (e) {
      console.log('Could not detect recurring spend patterns')
    }

    const today = new Date()

    // build confirmed inflows from invoices
    const confirmedInflows = (invoices.Invoices || [])
      .filter(inv => inv.Status === 'AUTHORISED')
      .map(inv => {
        const dueDate = parseXeroDate(inv.DueDate)
        return {
          id: inv.InvoiceID,
          amount: inv.AmountDue,
          due_date: dueDate,
          is_overdue: dueDate ? new Date(dueDate) < today : false,
          type: 'confirmed',
          is_reconciled: !!inv.FullyPaidOnDate
        }
      })

    // build projected inflows from historical average
    const projectedInflows = []
    if (monthlyIncomeAverage > 0) {
      for (let month = 1; month <= 2; month++) {
        const projectedDate = new Date()
        projectedDate.setMonth(projectedDate.getMonth() + month)
        projectedDate.setDate(1)
        projectedInflows.push({
          id: `projected_${month}`,
          amount: monthlyIncomeAverage * 0.8,
          due_date: projectedDate.toISOString().split('T')[0],
          is_overdue: false,
          type: 'projected'
        })
      }
    }

    const allInflows = [...confirmedInflows, ...projectedInflows]

    const outflows = (bills.Invoices || []).map(bill => {
      const dueDate = parseXeroDate(bill.DueDate)
      return {
        id: bill.InvoiceID,
        amount: bill.AmountDue,
        due_date: dueDate,
        is_overdue: dueDate ? new Date(dueDate) < today : false
      }
    })

    const snapshot = {
      starting_cash: startingCash,
      inflows: allInflows,
      outflows: [...outflows, ...projectedOutflows]
    }

    await saveSnapshot(req, res, snapshot)
    res.json({ ok: true })
  } catch (err) {
    console.error('Xero sync error:', err.message)
    res.status(500).json({ error: err.message })
  }
}