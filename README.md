# Cash Runway

A 60-day cash verdict for small businesses on Xero: will the bank balance stay above zero, and if not, when does it run out and why?

Live: [cashrunway.halim.pro](https://cashrunway.halim.pro) · [Demo with a sample company](https://cashrunway.halim.pro/demo), no sign-in needed

Cash Runway is a free portfolio project. Xero now ships its own Cash Flow Manager inside Xero Analytics; this project shows how the engine behind a tool like that can be built, end to end.

## What it does

1. **Connects to Xero read-only.** OAuth 2.0 via NextAuth, with refresh-token rotation persisted on every refresh, so syncing keeps working after the 30-minute access token expires.
2. **Syncs** unpaid invoices and bills, the bank summary report, and 90 days of spend and receive bank transactions. Every list is paginated, and the requests retry on 401 (refresh) and 429 (rate limit).
3. **Projects the bank balance day by day for 60 days:**
   - unpaid invoices in full on their due date
   - overdue invoices excluded and flagged
   - bills on their due date, overdue bills on day one
   - recurring spending detected per supplier from the median gap between payments, classified as weekly, fortnightly or monthly
   - other income from the last 90 days at 80%
   - payroll, VAT and other commitments the user enters
   - foreign-currency documents converted with each document's Xero rate
4. **Returns a verdict:**
   - *fine*: the lowest point stays above two weeks of average spending
   - *tight*: it stays positive but dips below that
   - *at risk*: it goes below zero

   The verdict comes with the shortfall date, the lowest point, the biggest payments ahead, and what collecting overdue invoices would change.

## Security

- Xero access and refresh tokens are encrypted with AES-256-GCM before they reach the database (`lib/crypto.js`).
- Row level security is on for every table, and only the server's service role can read them.
- Financial figures are never written to logs.
- "Disconnect Xero and delete my data" revokes the Xero connection and deletes every row for that user.

## Project layout

```
lib/runway/engine.mjs      Day-by-day projection, recurring detection, verdict (pure, tested)
lib/runway/xeroMap.mjs     Xero JSON to snapshot: currency conversion, bank summary parsing
lib/runway/demo.mjs        Sample company, generated relative to today
lib/xero.js                Token storage, refresh with rotation, paginated Xero client, revoke
lib/crypto.js              AES-256-GCM token encryption
pages/index.js             Server-rendered landing page
pages/demo.js              Interactive demo, no sign-in
pages/app.js               Signed-in dashboard: sync, organisation picker, commitments, delete
pages/api/                 Auth, sync, runway, settings, organisations, account deletion
db/schema.sql              Tables and row level security
test/                      node:test suite for the engine, Xero mapping and encryption
```

## Running locally

```bash
cp .env.example .env.local
npm install
npm test
npm run dev
```

Environment variables: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `TOKEN_ENCRYPTION_KEY`.

The Xero app's redirect URI must be `{NEXTAUTH_URL}/api/auth/callback/xero`.

## Limitations

- Payroll and tax are not read from Xero; users add them as commitments.
- Invoice timing assumes customers pay on the due date.
- Bills paid through Xero's normal bill flow are only counted while they are open, not projected forward as recurring.

Built by [Mohamed Abdulhalim](https://halim.pro).
