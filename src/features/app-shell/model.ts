// ─── Types ───────────────────────────────────────────────────────────────────

export type Role = 'borrower' | 'admin';
export type Screen =
  | 'splash' | 'login' | 'register' | 'terms' | 'underage'
  | 'dashboard' | 'apply' | 'application-status' | 'loan-details'
  | 'schedule' | 'payments' | 'notifications' | 'review' | 'profile'
  | 'admin-dashboard' | 'admin-applications' | 'admin-borrowers'
  | 'admin-borrower-detail' | 'admin-loans' | 'admin-reviews' | 'admin-payments';

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
  id: string; borrower: string; amount: number; product: string;
  term?: number;
  status: 'PENDING' | 'UNDER REVIEW' | 'APPROVED' | 'REJECTED';
};

export type AdminLoanRecord = {
  id: string; borrower: string; amount: number; interest: number;
  term: number; remaining: number; status: 'ACTIVE' | 'PAID';
};

// ─── Seed data ────────────────────────────────────────────────────────────────

// Start empty — data is only created by real user actions
export const adminApplications: ApplicationRecord[] = [];
export const initialAdminLoans: AdminLoanRecord[] = [];
export const borrowers: { id: string; name: string; phone: string; activeLoans: number; status: string }[] = [];
export const seedReviews: Review[] = [];

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
