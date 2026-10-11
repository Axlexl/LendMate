# Requirements Document

## Introduction

LendMate Core Data defines the data model, integrity constraints, and transactional workflows for the LendMate mobile loan management app (React Native / Expo). The existing prototype uses in-memory local state only. This feature establishes the full typed data layer — entities, relationships, business rules, and the seven core transaction flows — so that the app can be progressively wired to its planned backend (Node.js/Express + MySQL via Firebase Authentication).

The requirements are derived directly from the system specification sections 4.2 Integrity Constraints and 4.3 Transaction Map, shaped for implementation within the mobile client and its intended architecture (client → API → MySQL; no direct database access from the app).

## Glossary

- **System**: The LendMate mobile application together with its API and database back-end.
- **App**: The React Native / Expo mobile client.
- **API**: The planned Node.js/Express back-end service that owns business logic and database access.
- **User**: A registered account that may hold either a Borrower or Administrator role.
- **Borrower**: A User with the borrower role who can apply for and manage loans.
- **Administrator**: A User with the admin role who can evaluate and manage loan applications and loan records.
- **Staff**: A User assigned a limited administrative role with permissions defined per staff member.
- **LoanProduct**: A configured lending product (e.g., Personal Loan, Business Loan, Education Loan) that defines the allowable loan amount range, term range, and applicable interest rate.
- **LoanApplication**: A request submitted by a Borrower to borrow a specific amount under a specific LoanProduct for a stated purpose.
- **Loan**: An active or completed lending record created from an approved LoanApplication.
- **PaymentSchedule**: A set of installment records generated for a Loan, each specifying a due date and expected amount.
- **Payment**: A recorded payment transaction submitted against a Loan.
- **Notification**: An in-app message sent to a User about an account or loan event.
- **LoanDocument**: A file uploaded by a Borrower and attached to a LoanApplication.
- **ActivityLog**: An audit record capturing a significant change to a loan-related entity.
- **Data_Layer**: The TypeScript module(s) in the App that hold entity type definitions and enforce in-memory integrity constraints.
- **Validator**: The module responsible for validating inputs before they are submitted to the API or stored.
- **Scheduler**: The system component that checks PaymentSchedule records for overdue status.
- **Balance_Calculator**: The module that computes remaining loan balances and validates payment amounts.

---

## Requirements

### Requirement 1: Entity Data Model

**User Story:** As a developer, I want a complete, typed data model for all LendMate entities, so that the App and API share a consistent contract and referential integrity can be enforced.

#### Acceptance Criteria

1. THE Data_Layer SHALL define a `User` entity with fields: unique identifier (UUID string), full name (max 150 characters), email address (max 254 characters), phone number (max 20 characters), hashed password, role (one of: `borrower` | `admin` | `staff`), and account creation timestamp (ISO 8601).
2. THE Data_Layer SHALL define a `Borrower` entity with fields: unique identifier (UUID string), a foreign key referencing exactly one `User` identifier, and borrower status (one of: `ACTIVE` | `REVIEW` | `SUSPENDED`).
3. THE Data_Layer SHALL define a `LoanProduct` entity with fields: unique identifier (UUID string), product name (max 100 characters), minimum loan amount (positive integer in PHP, minimum 1), maximum loan amount (positive integer in PHP), minimum term in months (positive integer, minimum 1), maximum term in months (positive integer), interest rate (decimal, 0.00–1.00 representing 0%–100%), and product status (one of: `ACTIVE` | `INACTIVE`).
4. THE Data_Layer SHALL define a `LoanApplication` entity with fields: unique identifier (UUID string), a foreign key referencing one `Borrower` identifier, a foreign key referencing one `LoanProduct` identifier, requested amount (positive integer), requested term in months (positive integer), stated purpose (max 255 characters), application status (one of: `PENDING` | `UNDER_REVIEW` | `APPROVED` | `REJECTED`), and submission timestamp (ISO 8601).
5. THE Data_Layer SHALL define a `Loan` entity with fields: unique identifier (UUID string), a foreign key referencing one `LoanApplication` identifier, a foreign key referencing one `Borrower` identifier, principal amount (positive integer), approved interest rate (decimal, 0.00–1.00), total payable amount (positive integer), remaining balance (non-negative integer), loan status (one of: `ACTIVE` | `PAID` | `OVERDUE`), disbursement date (ISO 8601 date), and maturity date (ISO 8601 date, must be after disbursement date).
6. THE Data_Layer SHALL define a `PaymentSchedule` entity with fields: unique identifier (UUID string), a foreign key referencing one `Loan` identifier, installment number (positive integer, unique per Loan), due date (ISO 8601 date), scheduled amount (positive integer), and schedule status (one of: `PENDING` | `PAID` | `PARTIALLY_PAID` | `OVERDUE`).
7. THE Data_Layer SHALL define a `Payment` entity with fields: unique identifier (UUID string), a foreign key referencing one `Loan` identifier, an optional foreign key referencing one `PaymentSchedule` identifier (null when no matching unpaid schedule exists), payment amount (positive integer), payment method (max 50 characters), reference number (max 100 characters, unique across all Payment records), payment timestamp (ISO 8601), and payment status (one of: `PENDING_VERIFICATION` | `VERIFIED` | `REJECTED`).
8. THE Data_Layer SHALL define a `Notification` entity with fields: unique identifier (UUID string), a foreign key referencing one `User` identifier, notification title (max 150 characters), message body (max 1000 characters), read flag (boolean, default false), and creation timestamp (ISO 8601).
9. THE Data_Layer SHALL define a `LoanDocument` entity with fields: unique identifier (UUID string), a foreign key referencing one `LoanApplication` identifier, document type label (max 100 characters), storage URL (max 2048 characters), and upload timestamp (ISO 8601).
10. THE Data_Layer SHALL define an `ActivityLog` entity with fields: unique identifier (UUID string), a foreign key referencing one `User` identifier, entity type affected (one of: `LoanApplication` | `Loan` | `Payment` | `PaymentSchedule`), entity identifier (UUID string), action description (max 255 characters), and timestamp (ISO 8601).
11. WHEN a `LoanApplication` is defined, THE Data_Layer SHALL enforce that the requested amount is greater than or equal to the minimum loan amount of the referenced `LoanProduct` and less than or equal to the maximum loan amount of the referenced `LoanProduct`.
12. WHEN a `Loan` is defined, THE Data_Layer SHALL enforce that the maturity date is strictly after the disbursement date.

---

### Requirement 2: Referential Integrity Constraints

**User Story:** As a developer, I want referential integrity enforced at the data layer, so that orphaned or inconsistent records cannot be created by the App or accepted by the API.

#### Acceptance Criteria

1. WHEN a `Borrower` record is submitted for creation, IF the referenced `User` identifier does not exist, THEN THE Validator SHALL return an error identifying the invalid reference and SHALL NOT persist the record.
2. WHEN a `Borrower` record is submitted for creation, IF a `Borrower` record already exists for the same `User` identifier, THEN THE Validator SHALL return an error stating that the user already has a borrower profile and SHALL NOT persist the record.
3. WHEN a `LoanApplication` is submitted for creation, IF the referenced `Borrower` identifier does not exist, THEN THE Validator SHALL return an error identifying the invalid reference and SHALL NOT persist the record.
4. WHEN a `LoanApplication` is submitted for creation, IF the referenced `LoanProduct` identifier does not exist, THEN THE Validator SHALL return an error identifying the invalid reference and SHALL NOT persist the record.
5. WHEN a `Loan` record is submitted for creation, IF the referenced `LoanApplication` identifier does not exist, THEN THE Validator SHALL return an error identifying the invalid reference and SHALL NOT persist the record.
6. WHEN a `Loan` record is submitted for creation, IF the referenced `Borrower` identifier does not exist, THEN THE Validator SHALL return an error identifying the invalid reference and SHALL NOT persist the record.
7. WHEN a `PaymentSchedule` record is submitted for creation, IF the referenced `Loan` identifier does not exist, THEN THE Validator SHALL return an error identifying the invalid reference and SHALL NOT persist the record.
8. WHEN a `Payment` record is submitted for creation, IF the referenced `Loan` identifier does not exist, THEN THE Validator SHALL return an error identifying the invalid reference and SHALL NOT persist the record.
9. WHEN a `Payment` record is submitted for creation with a `PaymentSchedule` reference, IF the referenced `PaymentSchedule` identifier does not exist on the same `Loan`, THEN THE Validator SHALL return an error identifying the schedule mismatch and SHALL NOT persist the record.
10. WHEN a `Notification` record is submitted for creation, IF the referenced `User` identifier does not exist, THEN THE Validator SHALL return an error identifying the invalid reference and SHALL NOT persist the record.
11. WHEN a `LoanDocument` record is submitted for creation, IF the referenced `LoanApplication` identifier does not exist, THEN THE Validator SHALL return an error identifying the invalid reference and SHALL NOT persist the record.
12. WHEN an `ActivityLog` record is submitted for creation, IF the referenced `User` identifier does not exist, THEN THE Validator SHALL return an error identifying the invalid reference and SHALL NOT persist the record.

---

### Requirement 3: Business Rule Validation

**User Story:** As a lending officer, I want the system to enforce business rules on every loan transaction, so that no invalid loan amounts, terms, or payments can be processed.

#### Acceptance Criteria

1. WHEN a `LoanApplication` is submitted, IF the requested amount is less than the minimum loan amount of the referenced `LoanProduct`, THEN THE Validator SHALL reject it with an error message stating the minimum allowed amount and SHALL NOT create the application record.
2. WHEN a `LoanApplication` is submitted, IF the requested amount is greater than the maximum loan amount of the referenced `LoanProduct`, THEN THE Validator SHALL reject it with an error message stating the maximum allowed amount and SHALL NOT create the application record.
3. WHEN a `LoanApplication` is submitted, IF the requested term is less than the minimum term of the referenced `LoanProduct`, THEN THE Validator SHALL reject it with an error message stating the minimum allowed term and SHALL NOT create the application record.
4. WHEN a `LoanApplication` is submitted, IF the requested term is greater than the maximum term of the referenced `LoanProduct`, THEN THE Validator SHALL reject it with an error message stating the maximum allowed term and SHALL NOT create the application record.
5. WHEN a `Loan` record is submitted for creation, IF the source `LoanApplication` does not have status `APPROVED`, THEN THE Validator SHALL reject the creation with an error message and SHALL NOT create the loan record.
6. WHEN a `Payment` is submitted, IF the payment amount is less than or equal to zero, THEN THE Validator SHALL reject it with an error message and SHALL NOT create the payment record.
7. WHEN a `Payment` is submitted, IF the payment amount is greater than the current remaining balance of the associated `Loan`, THEN THE Validator SHALL reject it with an error message stating that the payment exceeds the remaining balance and SHALL NOT create the payment record.
8. WHEN a `Loan` remaining balance reaches zero after a verified `Payment`, THE System SHALL set the loan status to `PAID` (see Requirement 10).
9. WHEN a `PaymentSchedule` record is evaluated by the Scheduler, IF the current date is past the due date and the schedule status is not `PAID`, THEN THE Scheduler SHALL set the schedule status to `OVERDUE`.
10. WHEN a Borrower requests any `Loan`, `PaymentSchedule`, or `Payment` record, THE System SHALL return only records where the associated `Borrower` identifier matches the authenticated user's own `Borrower` identifier.
11. WHEN a user attempts to approve or reject a `LoanApplication`, THE System SHALL verify that the user holds the Administrator role or a Staff role with explicit approval permission before executing the action; IF the user does not meet this condition, THE System SHALL return an authorization error and SHALL NOT update the application status.
12. WHEN a user attempts to access loan disbursement or loan status management functions, THE System SHALL verify that the user holds the Administrator role or a Staff role with explicit loan management permission; IF the user does not meet this condition, THE System SHALL return an authorization error.
13. WHEN any of the following events occurs — a `LoanApplication` status change, a `Loan` status change, a `Payment` verification, or a `PaymentSchedule` status change to `OVERDUE` — THE System SHALL create an `ActivityLog` entry referencing the `User` responsible for the action (see Requirement 13).

---

### Requirement 4: User Registration (Transaction 1)

**User Story:** As a new user, I want to register an account with my personal details, so that I can access the LendMate platform as a Borrower.

#### Acceptance Criteria

1. WHEN a registration form is submitted, IF the full name field is empty or contains only whitespace characters, THEN THE Validator SHALL display an error message and SHALL NOT submit the form.
2. WHEN a registration form is submitted, IF the email address does not contain exactly one `@` character followed by at least one `.` character, THEN THE Validator SHALL display an error message and SHALL NOT submit the form.
3. WHEN a registration form is submitted, IF the phone number contains fewer than 7 numeric digit characters (non-digit characters excluded from the count), THEN THE Validator SHALL display an error message and SHALL NOT submit the form.
4. WHEN a registration form is submitted, IF the password is fewer than 8 characters long, THEN THE Validator SHALL display an error message and SHALL NOT submit the form.
5. WHEN a registration form is submitted, IF the confirmed password does not exactly match the password, THEN THE Validator SHALL display an error message and SHALL NOT submit the form.
6. WHEN all validation passes, THE System SHALL create a `User` record with role `borrower` and a linked `Borrower` record in a single atomic operation; IF either record creation fails, THEN THE System SHALL roll back both operations and display an error message to the user.
7. IF the submitted email address is already associated with an existing `User` record, THEN THE System SHALL return an error message stating that the email is already registered and SHALL NOT create any new record.
8. WHEN a `User` and `Borrower` record are successfully created, THE System SHALL navigate the App to the Terms and Conditions screen.

---

### Requirement 5: Loan Application (Transaction 2)

**User Story:** As a Borrower, I want to apply for a loan by selecting a product, amount, and term, so that I can request financing through the App.

#### Acceptance Criteria

1. THE App SHALL retrieve `LoanProduct` records with status `ACTIVE` from the API and present them as selectable options on the loan application form; IF the API request fails, THE App SHALL display an error message and SHALL NOT allow form submission.
2. WHEN a loan application form is submitted, IF no `LoanProduct` is selected, THEN THE Validator SHALL display an error and SHALL NOT submit the form.
3. WHEN a loan application form is submitted, IF the requested amount is outside the minimum or maximum loan amount of the selected `LoanProduct`, THEN THE Validator SHALL display an error message stating the allowed range and SHALL NOT submit the form.
4. WHEN a loan application form is submitted, IF the selected term is outside the minimum or maximum term of the selected `LoanProduct`, THEN THE Validator SHALL display an error message stating the allowed range and SHALL NOT submit the form.
5. WHEN a loan application form is submitted, IF the loan purpose field is empty or contains only whitespace, THEN THE Validator SHALL display an error message and SHALL NOT submit the form.
6. WHEN all validation passes, THE System SHALL create a `LoanApplication` record with status `PENDING` and return the application identifier to the App; IF the API request fails, THE App SHALL display an error message and the Borrower SHALL remain on the application form.
7. WHEN a `LoanApplication` is created with status `PENDING`, THE App SHALL display the application status screen showing status `PENDING`; the status SHALL display as `UNDER_REVIEW` only after a separate, subsequent status change is received from the API.
8. WHEN a `LoanApplication` is created, THE System SHALL create a `Notification` for the `Borrower`'s `User` confirming that the application was received.

---

### Requirement 6: Loan Document Upload

**User Story:** As a Borrower, I want to attach supporting documents to my loan application, so that the lending team can verify my eligibility.

#### Acceptance Criteria

1. THE App SHALL allow a Borrower to upload one or more files to an existing `LoanApplication` that has status `PENDING` or `UNDER_REVIEW`; each file SHALL be of type PDF, JPG, or PNG and SHALL NOT exceed 10 MB; files that do not meet these constraints SHALL be rejected with an error message before upload begins.
2. WHEN a valid document file is selected, THE App SHALL send the file to the API before creating the `LoanDocument` record; THE System SHALL create the `LoanDocument` record only after the file is successfully stored, referencing the `LoanApplication` identifier, the document type label, and the storage URL.
3. IF a document upload fails at any step, THEN THE System SHALL display an error message to the Borrower identifying which file failed; previously uploaded documents for the same `LoanApplication` SHALL remain unaffected.
4. WHERE Firebase Storage is configured, THE System SHALL store uploaded files under a storage path that includes the `LoanApplication` identifier as a path segment, ensuring files are scoped to their application.

---

### Requirement 7: Loan Evaluation (Transaction 3)

**User Story:** As an Administrator, I want to review pending applications and approve or reject them, so that only eligible borrowers receive loans.

#### Acceptance Criteria

1. THE App SHALL present a list of `LoanApplication` records with status `PENDING` or `UNDER_REVIEW` to users with the Administrator role or a Staff role with explicit approval permission.
2. WHEN an Administrator or permitted Staff user selects a `LoanApplication`, THE App SHALL display the associated `Borrower` profile information and all `LoanDocument` records linked to that application.
3. WHEN an Administrator or permitted Staff user approves a `LoanApplication`, THE System SHALL update the application status to `APPROVED`; this action SHALL only be permitted when the current status is `PENDING` or `UNDER_REVIEW`.
4. WHEN an Administrator rejects a `LoanApplication`, THE System SHALL update the application status to `REJECTED`; rejection is restricted to the Administrator role only and SHALL only be permitted when the current status is `PENDING` or `UNDER_REVIEW`.
5. WHEN a `LoanApplication` status is updated, THE System SHALL create an `ActivityLog` entry referencing the acting user's `User` identifier, the application identifier, the previous status, and the new status.
6. WHEN a `LoanApplication` status is updated, THE System SHALL create a `Notification` for the `Borrower`'s `User` stating the new application status.
7. IF a user without the Administrator role or explicit Staff approval permission attempts to approve a `LoanApplication`, THEN THE System SHALL return an authorization error and SHALL NOT update the application status.
8. IF a user without the Administrator role attempts to reject a `LoanApplication`, THEN THE System SHALL return an authorization error and SHALL NOT update the application status, regardless of any other role flags or permissions assigned to that user.

---

### Requirement 8: Loan Approval and Disbursement (Transaction 4)

**User Story:** As the System, I want to automatically create a Loan record and generate a payment schedule when an application is approved, so that the borrower has a clear repayment plan.

#### Acceptance Criteria

1. WHEN a `LoanApplication` status is set to `APPROVED`, THE System SHALL create a `Loan` record referencing the `LoanApplication` identifier and the associated `Borrower` identifier.
2. WHEN a `Loan` record is created, THE Balance_Calculator SHALL set the principal amount equal to the approved loan amount from the `LoanApplication`.
3. WHEN a `Loan` record is created, THE Balance_Calculator SHALL calculate total interest as: principal × LoanProduct interest rate (rounded to the nearest whole PHP).
4. WHEN a `Loan` record is created, THE Balance_Calculator SHALL set the total payable amount equal to the sum of the principal and the total interest.
5. WHEN a `Loan` record is created, THE Balance_Calculator SHALL set the remaining balance equal to the total payable amount.
6. WHEN a `Loan` record is created, THE System SHALL generate one `PaymentSchedule` record per installment period equal to the approved term; each record SHALL contain the installment number, the due date (disbursement date plus installment number × one calendar month), and the scheduled amount (total payable ÷ number of installments, with any remainder added to the final installment).
7. WHEN a `Loan` record is created, THE System SHALL set the loan status to `ACTIVE`.
8. WHEN the `Loan` is created and all `PaymentSchedule` records are generated, THE System SHALL create a `Notification` for the `Borrower`'s `User` confirming loan activation and stating the loan identifier and total payable amount; IF the `Loan` or any `PaymentSchedule` creation fails, THE System SHALL roll back all created records and return an error.

---

### Requirement 9: Payment Processing (Transaction 5)

**User Story:** As a Borrower, I want to submit a payment and have my loan balance updated, so that my progress towards full repayment is tracked accurately.

#### Acceptance Criteria

1. THE App SHALL display the `PaymentSchedule` records for the Borrower's active `Loan` ordered by installment number ascending, showing due date, scheduled amount, and schedule status for each record.
2. WHEN a Borrower submits payment information, THE System SHALL create a `Payment` record with status `PENDING_VERIFICATION`.
3. WHEN a `Payment` record is created, THE System SHALL identify the earliest `PaymentSchedule` record for the same `Loan` with status `PENDING` or `PARTIALLY_PAID`, ordered by installment number ascending, and associate the `Payment` with that schedule.
4. IF no `PaymentSchedule` record with status `PENDING` or `PARTIALLY_PAID` exists for the `Loan`, THEN THE System SHALL create the `Payment` with the `PaymentSchedule` foreign key set to null.
5. WHEN a `Payment` is verified by an Administrator or permitted Staff user, THE Balance_Calculator SHALL deduct the payment amount from the `Loan` remaining balance.
6. WHEN a `Payment` is verified, THE System SHALL update the associated `PaymentSchedule` record status to `PAID` if the cumulative payments for that schedule equal or exceed the scheduled amount, or to `PARTIALLY_PAID` if the cumulative payments are greater than zero but less than the scheduled amount.
7. WHEN a `Payment` is verified, THE System SHALL create a `Notification` for the Borrower's `User` confirming the payment amount, updated remaining balance, and verification timestamp.
8. WHEN a `Payment` is verified and the `Loan` remaining balance reaches zero, THE System SHALL set the `Loan` status to `PAID` (see Requirement 10).
9. IF a `Payment` amount would cause the `Loan` remaining balance to fall below zero, THEN THE Validator SHALL reject the payment with an error message stating the maximum acceptable payment amount and SHALL NOT create the payment record.

---

### Requirement 10: Loan Completion (Transaction 7)

**User Story:** As the System, I want to automatically close a loan when the final payment is made, so that both the Borrower and Administrator can confirm that all obligations are settled.

#### Acceptance Criteria

1. WHEN the `Loan` remaining balance reaches zero after a `Payment` is verified, THE Balance_Calculator SHALL set the `Loan` status to `PAID`.
2. WHEN a `Loan` status is set to `PAID`, THE System SHALL update all `PaymentSchedule` records for that `Loan` that do not already have status `PAID` to status `PAID`.
3. WHEN a `Loan` status is set to `PAID`, THE System SHALL create an `ActivityLog` entry referencing the `User` who verified the final payment, the `Loan` identifier, and the action description `"Loan completed — remaining balance zero"`.
4. WHEN a `Loan` status is set to `PAID`, THE System SHALL create a `Notification` for the `Borrower`'s `User` confirming loan completion and stating that the remaining balance is zero.
5. WHERE a `Loan` status is `PAID`, THE App SHALL display the loan record with a remaining balance of zero and status `PAID` to both the authenticated Borrower and any Administrator or Staff user viewing the record.

---

### Requirement 11: Overdue Monitoring (Transaction 6)

**User Story:** As the System, I want to automatically identify and flag overdue installments, so that Borrowers are reminded and Administrators can take action.

#### Acceptance Criteria

1. WHILE the System is running, THE Scheduler SHALL evaluate all `PaymentSchedule` records with status `PENDING` or `PARTIALLY_PAID` once every 24 hours.
2. WHEN a `PaymentSchedule` record is evaluated and the due date is earlier than the current date and the schedule status is not `PAID`, THEN THE Scheduler SHALL set the schedule status to `OVERDUE`.
3. WHEN a `PaymentSchedule` status is set to `OVERDUE`, IF a `Notification` for this specific `PaymentSchedule` identifier with the event type `OVERDUE` has not already been created, THEN THE System SHALL create a `Notification` for the associated Borrower's `User` identifying the overdue installment number, due date, and scheduled amount.
4. WHEN a `PaymentSchedule` status is set to `OVERDUE`, THE System SHALL create an `ActivityLog` entry referencing the System's service account `User` identifier, the `PaymentSchedule` entity type, the schedule identifier, and the action description `"Installment marked overdue"`.
5. THE App SHALL display `PaymentSchedule` records with status `OVERDUE` using a visually distinct color (red or amber as defined in the app palette) and SHALL display the label `OVERDUE` alongside the installment row, distinct from the `PENDING` (no color highlight) and `PAID` (green) states.

---

### Requirement 12: Notification Delivery

**User Story:** As a User, I want to receive in-app notifications for important account events, so that I am always informed about my loan and application status.

#### Acceptance Criteria

1. WHERE the authenticated User has one or more `Notification` records, THE App SHALL display those records ordered by creation timestamp descending.
2. IF the authenticated User has no `Notification` records, THEN THE App SHALL display an empty-state message indicating that there are no notifications.
3. WHEN a `Notification` record is rendered in the list, THE App SHALL display the notification title, message body, and creation timestamp.
4. WHEN a Borrower taps a `Notification` entry to view its detail screen, THE System SHALL set the `Notification` read flag to true; rendering the notification in the list view alone SHALL NOT set the read flag to true.
5. THE App SHALL display an unread indicator badge on the notification bell icon when the authenticated User has at least one `Notification` record with a read flag of false.
6. THE App SHALL only retrieve and display `Notification` records where the `User` foreign key matches the authenticated user's own `User` identifier.

---

### Requirement 13: Activity Log

**User Story:** As an Administrator, I want important changes to loan records to be audited, so that I can review who made which decision and when.

#### Acceptance Criteria

1. WHEN a `LoanApplication` status is changed, THE System SHALL create an `ActivityLog` entry with entity type `LoanApplication`, the application identifier, the acting user's `User` identifier, and an action description stating the previous and new status values.
2. WHEN a `Loan` status is changed, THE System SHALL create an `ActivityLog` entry with entity type `Loan`, the loan identifier, the acting user's `User` identifier, and an action description stating the previous and new status values.
3. WHEN a `Payment` is verified, THE System SHALL create an `ActivityLog` entry with entity type `Payment`, the payment identifier, the verifying user's `User` identifier, and an action description stating the verified amount and updated remaining balance.
4. WHEN a `PaymentSchedule` status is changed to `OVERDUE`, THE System SHALL create an `ActivityLog` entry with entity type `PaymentSchedule`, the schedule identifier, the System's service account `User` identifier, and the action description `"Installment marked overdue"`.
5. THE App SHALL display `ActivityLog` records to users with the Administrator role or a Staff role with explicit log-viewing permission, ordered by timestamp descending.
6. WHEN an `ActivityLog` entry is created, THE System SHALL record: the acting `User` identifier, the entity type (one of: `LoanApplication` | `Loan` | `Payment` | `PaymentSchedule`), the entity identifier, an action description of no more than 255 characters, and the timestamp of the event.

---

### Requirement 14: Role-Based Access Control

**User Story:** As a security requirement, I want access to loan data and actions to be restricted by user role, so that Borrowers cannot access other borrowers' data and only authorized staff can make lending decisions.

#### Acceptance Criteria

1. WHEN a Borrower requests `Loan`, `PaymentSchedule`, or `Payment` records, THE System SHALL return only records where the `Borrower` foreign key matches the authenticated user's own `Borrower` identifier.
2. WHEN a Borrower requests `LoanApplication` records, THE System SHALL return only records where the `Borrower` foreign key matches the authenticated user's own `Borrower` identifier.
3. IF a user without the Administrator role or a permitted Staff role attempts to access `LoanApplication` status transition functions or `Loan` disbursement and status management functions, THEN THE System SHALL return an authorization error indicating insufficient permissions and SHALL NOT execute the requested action.
4. WHEN a Staff user attempts any action, THE System SHALL look up the Staff user's assigned permissions and verify that the requested action is covered before executing it.
5. IF a Staff user's assigned permissions do not cover the requested action, THEN THE System SHALL return an authorization error indicating insufficient permissions and SHALL NOT execute the action.
6. THE App SHALL hide all Administrator and Staff UI controls — including application approval/rejection buttons, loan management screens, and the activity log view — from users authenticated with the Borrower role.
