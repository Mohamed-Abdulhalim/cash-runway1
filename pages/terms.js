import Legal from '../components/Legal'

const sections = [
  ['The service', 'Cash Runway is a free portfolio project by Mohamed Abdulhalim. It connects to your Xero account with read-only access and projects your bank balance for the next 60 days. By using it you agree to these terms.'],
  ['Not financial advice', 'Projections are estimates for information only. They are not financial, accounting or legal advice. Check important decisions with a qualified professional.'],
  ['How accurate it is', 'Projections only know what is in your Xero data and what you enter yourself. Payments outside Xero, invoices you have not raised, and late payments will make reality differ from the projection.'],
  ['Your responsibilities', [[
    'Only connect Xero organisations you are allowed to access',
    'Keep your Xero login secure',
    'Do not use the service for anything unlawful',
  ]]],
  ['Availability', 'The service is provided as is, without any guarantee of availability. It may change or stop at any time.'],
  ['Liability', 'To the extent the law allows, the operator is not liable for losses arising from use of, or reliance on, the projections.'],
  ['Open source', 'The source code is public on GitHub. You are welcome to read it and learn from it.'],
  ['Contact', 'Questions: mohamed@halim.pro.'],
]

export default function Terms() {
  return <Legal title="Terms of service" updated="October 2026" sections={sections} />
}
