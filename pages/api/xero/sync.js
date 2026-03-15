import { getTokens, saveSnapshot } from '../../../lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const manualBalance = body?.manual_balance ?? null

    const tokens = await getTokens(req, res)

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
    const invoices = invoicesRes.status === 200 ? JSON.parse(await invoicesRes.text()) : { Invoices: [] }

    // fetch confirmed bills (payables)
    const billsRes = await fetch('https://api.xero.com/api.xro/2.0/Invoices?where=Status%3D%3D%22AUTHORISED%22%26%26Type%3D%3D%22ACCPAY%22', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Xero-tenant-id': tenantId,
        Accept: 'application/json'
      }
    })
    const bills = billsRes.status === 200 ? JSON.parse(await billsRes.text()) : { Invoices: [] }

    // fetch last 90 days of bank transactions for historical income forecast
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

    const today = new Date()

    // build confirmed inflows from invoices
    const confirmedInflows = (invoices.Invoices || []).map(inv => {
      const dueDate = parseXeroDate(inv.DueDate)
      return {
        id: inv.InvoiceID,
        amount: inv.AmountDue,
        due_date: dueDate,
        is_overdue: dueDate ? new Date(dueDate) < today : false,
        type: 'confirmed'
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
      starting_cash: manualBalance !== null ? manualBalance : 0,
      inflows: allInflows,
      outflows
    }

    await saveSnapshot(req, res, snapshot)
    res.json({ ok: true })
  } catch (err) {
    console.error('Xero sync error:', err.message)
    res.status(500).json({ error: err.message })
  }
}