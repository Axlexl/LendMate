// ─── Types ───────────────────────────────────────────────────────────────────

export type Role = 'borrower' | 'admin';
export type Screen =
  | 'splash' | 'login' | 'register' | 'terms' | 'underage'
  | 'dashboard' | 'apply' | 'application-status' | 'loan-details'
  | 'schedule' | 'payments' | 'notifications' | 'review' | 'profile' | 'change-password'
  | 'admin-dashboard' | 'admin-applications' | 'admin-borrowers'
  | 'admin-borrower-detail' | 'admin-loans' | 'admin-reviews' | 'admin-payments'
  | 'admin-loan-products';

export type LoanProduct = {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  defaultTerm: number;
  interestRate: number; // percent e.g. 10
  purposes: string[];
};

export type IconName =
  | 'bell' | 'home' | 'file' | 'users' | 'wallet'
  | 'calendar' | 'arrow' | 'check' | 'clock' | 'back' | 'shield' | 'star'
  | 'camera' | 'upload';

export type Review = {
  id: string;
  borrower: string;
  stars: number;       // 1–5
  comment: string;
  date: string;
};

export type ApplicationRecord = {
  id: string; borrower: string; borrowerUid?: string; amount: number; product: string;
  term?: number;
  status: 'PENDING' | 'UNDER REVIEW' | 'APPROVED' | 'REJECTED';
  isCustomAmount?: boolean;
  adminInterestRate?: number;
  submittedAt?: string;
  // applicant profile info fetched from Firestore
  email?: string; phone?: string; dateOfBirth?: string; idType?: string; idNumber?: string;
};

export type AdminLoanRecord = {
  id: string; borrower: string; borrowerUid?: string; amount: number; interest: number;
  term: number; remaining: number; status: 'ACTIVE' | 'PAID'; approvedAt?: string;
};

// ─── Seed data ────────────────────────────────────────────────────────────────

// Start empty — data is only created by real user actions
export const adminApplications: ApplicationRecord[] = [];
export const initialAdminLoans: AdminLoanRecord[] = [];
export const borrowers: { id: string; name: string; phone: string; activeLoans: number; status: string }[] = [];
export const seedReviews: Review[] = [];

export const defaultLoanProducts: LoanProduct[] = [
  { id: 'lp1', name: 'Personal Loan', description: 'Flexible use for any personal need', minAmount: 1000, maxAmount: 200000, defaultTerm: 6, interestRate: 10, purposes: ['Emergency', 'Medical', 'Other'] },
  { id: 'lp2', name: 'Business Loan', description: 'Grow your business', minAmount: 5000, maxAmount: 500000, defaultTerm: 12, interestRate: 12, purposes: ['Business', 'Expansion', 'Equipment'] },
  { id: 'lp3', name: 'Education Loan', description: 'School and training expenses', minAmount: 1000, maxAmount: 100000, defaultTerm: 6, interestRate: 8, purposes: ['Education', 'Tuition', 'Books'] },
];

export const installments = [
  { number: 1, due: 'Oct 15', amount: 3667, status: 'PAID' },
  { number: 2, due: 'Nov 15', amount: 3667, status: 'PENDING' },
  { number: 3, due: 'Dec 15', amount: 3666, status: 'PENDING' },
];

export const todayLong = new Intl.DateTimeFormat('en-US', {
  month: 'long', day: 'numeric', year: 'numeric',
}).format(new Date());

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function money(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP', maximumFractionDigits: 0,
  }).format(value);
}

export function initials(name: string, max = 2) {
  return name.split(' ').map((p) => p[0]).slice(0, max).join('');
}
