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
  | 'calendar' | 'arrow' | 'check' | 'clock' | 'back' | 'shield' | 'star';

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

export const adminApplications: ApplicationRecord[] = [
  { id: '1025', borrower: 'Juan Dela Cruz', amount: 10000, product: 'Personal Loan', status: 'PENDING' },
  { id: '1024', borrower: 'Maria Santos', amount: 25000, product: 'Business Loan', status: 'UNDER REVIEW' },
  { id: '1023', borrower: 'Ana Lopez', amount: 15000, product: 'Education Loan', status: 'PENDING' },
];

export const initialAdminLoans: AdminLoanRecord[] = [
  { id: '10025', borrower: 'Juan Dela Cruz', amount: 10000, interest: 1000, term: 3, remaining: 7500, status: 'ACTIVE' },
  { id: '10024', borrower: 'Maria Santos', amount: 20000, interest: 2000, term: 6, remaining: 12500, status: 'ACTIVE' },
  { id: '10023', borrower: 'Ana Lopez', amount: 15000, interest: 1500, term: 6, remaining: 0, status: 'PAID' },
];

export const borrowers = [
  { id: 'BR-1044', name: 'Juan Dela Cruz', phone: '09123456789', activeLoans: 2, status: 'ACTIVE' },
  { id: 'BR-1042', name: 'Maria Santos', phone: '09987654321', activeLoans: 1, status: 'ACTIVE' },
  { id: 'BR-1047', name: 'Ana Lopez', phone: '09223334455', activeLoans: 1, status: 'REVIEW' },
];

export const seedReviews: Review[] = [
  { id: 'r1', borrower: 'Juan Dela Cruz', stars: 5, comment: 'Very smooth process! The loan was approved quickly and the payment schedule is easy to follow.', date: 'October 3, 2026' },
  { id: 'r2', borrower: 'Maria Santos', stars: 4, comment: 'Good experience overall. The app is clean and easy to use. Would like faster approval times.', date: 'October 6, 2026' },
  { id: 'r3', borrower: 'Ana Lopez', stars: 5, comment: 'Excellent service. I was able to track my loan and payments without any confusion. Highly recommended!', date: 'October 9, 2026' },
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
