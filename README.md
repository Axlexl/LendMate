# LendMate

LendMate is a mobile-first loan application and loan-management prototype built with Expo and React Native. It presents separate borrower and lender/administrator experiences. Current sample data and workflow actions are stored only in the running app session.

## Technology Stack

| Component | Technology |
| --- | --- |
| Application type | Mobile application |
| Mobile framework | React Native |
| Development platform | Expo (SDK 57) |
| Programming language | TypeScript |
| Authentication | Firebase Authentication (planned; not connected) |
| File storage | Firebase Storage (planned; not connected) |
| Backend/API | Node.js with Express (planned; not connected) |
| Relational database | MySQL (planned; not connected) |
| Database language | SQL |
| Development environment | Visual Studio Code |
| Target testing devices | Android emulator and physical Android device |

The intended architecture is a React Native/Expo client using Firebase Authentication for identity and Firebase Storage for borrower-submitted files. The client will call a Node.js/Express API for authorization, loan decisions, payment records, and reporting; the API will own access to MySQL. The mobile client must not connect directly to MySQL or contain database credentials.

## Run Locally

```bash
npm install
npx expo start
```

For the browser prototype:

```bash
npm run web
```

Run the current project checks:

```bash
npx tsc --noEmit
npx expo lint
```

## Source Structure

```text
src/
  app/                  Expo Router routes and root layout
  constants/            Shared app-wide values
  features/
    app-shell/
      components.tsx    App-shell UI primitives and navigation
      model.ts          Screen types, sample records, and formatters
      styles.ts         App-shell styles
      theme.tsx         Light/dark palettes and theme context
      lendmate-app.tsx  Screen state and application workflows
      index.tsx         Feature entry point used by the route
  services/             Firebase setup and authentication operations
```

Keep route files in `src/app/` focused on routing, place feature-specific UI
and workflows under `src/features/`, and keep backend or platform integrations
in `src/services/`. Add shared component, hook, or asset folders when the app
has reusable code or assets to put there rather than keeping empty folders.

## Prototype Workflows

The app opens on the LendMate splash screen. Choose Borrower or Lender / Admin on the login screen to open the corresponding local demo.

### Borrower

- Login and account registration with name, email, phone, password, and password confirmation fields.
- Borrower dashboard with active loan, remaining principal, next installment, application status, and quick actions.
- Loan application with product, requested amount, term, purpose, and an estimated monthly payment.
- Application status, loan details, installment schedule, notification list, payment history, and local payment submission.

### Lender / Administrator

- Admin dashboard with borrower, active-loan, pending-application, overdue, released, and outstanding totals.
- Application list with View, Approve, and Reject actions; decisions update the local application record.
- Borrower list with phone numbers and active-loan counts, plus borrower detail.
- Loan management list with amount, interest, term, remaining balance, and status. Approving a demo application adds a loan record.

## Demo Boundaries

- No Firebase project, API server, or MySQL database is configured or contacted. Login/registration validates demo form input only; it does not authenticate identities or enforce roles.
- Records and changes live in component memory and reset when the app reloads. They are not suitable for real borrowers or lending decisions.
- Requirement submission is currently a text checklist. Actual document upload, private storage rules, and identity verification require the planned Firebase integration.
- Payment records and schedule statuses are examples. No money is transferred or reconciled.
- The application estimator is an illustrative value for the supplied ₱10,000 / 3-month screen example; the separately shown loan detail is also seeded sample data. Neither is a production quote or financial advice. Confirm the lender's pricing model and local requirements before implementing real repayment calculations.
- Before production, implement server-side authentication/role authorization, validation, audit persistence, data retention/privacy rules, transaction handling, payment reconciliation, and tested SQL migrations/API contracts.

## Planned Modules

Splash, login, registration, borrower dashboard/application/status/loan/schedule screens, and admin dashboard/application/borrower/loan screens are represented in the mobile prototype. Persistent storage, real authentication, role authorization, document upload, payment verification, API integration, and production security remain future implementation work.