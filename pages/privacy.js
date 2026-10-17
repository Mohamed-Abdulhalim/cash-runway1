import Legal from '../components/Legal'

const sections = [
  ['Who we are', 'Cash Runway is a free portfolio project built and operated by Mohamed Abdulhalim, an independent developer. Contact: mohamed@halim.pro.'],
  ['What we read from Xero', ['When you connect Xero, we read, without changing anything:', [
    'Your name and email from your Xero login, and your organisation names',
    'Unpaid sales invoices and bills: contact name, number, amount due, currency and due date',
    'Bank balances from the Xero bank summary report',
    'The last 90 days of spend-money and receive-money bank transactions: contact name, date and amount',
  ]]],
  ['What we store', [
    'A single snapshot of the data above from your latest sync. Each sync replaces the previous one; we keep no history.',
    'Payroll, tax and other commitments you type in yourself.',
    'Your Xero access and refresh tokens, encrypted with AES-256-GCM before they are saved, so the service can sync without asking you to sign in every time.',
    'Data is stored in Supabase (hosted on AWS). We do not log your financial figures.',
  ]],
  ['How we use it', 'Only to calculate and show your cash runway. We do not sell or share your data, and we use no advertising or analytics trackers.'],
  ['Deleting your data', 'Use "Disconnect Xero and delete my data" at the bottom of your dashboard. This revokes Cash Runway\'s access in Xero and deletes your account, tokens, snapshot and commitments immediately. You can also remove the app from Xero\'s connected apps, or email mohamed@halim.pro.'],
  ['Your rights', [['Access the data we hold about you', 'Ask for corrections', 'Delete your data at any time', 'Withdraw consent by disconnecting Xero']]],
  ['Changes', 'If this policy changes, the date at the top will change too.'],
]

export default function Privacy() {
  return <Legal title="Privacy policy" updated="October 2026" sections={sections} />
}
