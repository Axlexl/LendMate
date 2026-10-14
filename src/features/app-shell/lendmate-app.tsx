import * as ImagePicker from 'expo-image-picker';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { acceptTerms, changePassword, deleteLoanProduct, fetchUserProfile, handleGoogleResponse, listenApplications, listenBorrowerLoan, listenLoanProducts, listenLoans, listenRegisteredBorrowers, onAuthChange, registerWithEmail, saveApplication, saveLoan, saveLoanProduct, sendPasswordReset, signInWithEmail, signOut, updateApplicationStatus, useGoogleSignIn, type UserProfile } from '@/services/auth';
import { AppIcon, Avatar, BrandMark, Btn, DetailRow, InputField, LoadingOverlay, LogoutModal, NavBar, PageTitle, StatusBadge, TermsScreen } from './components';
import { adminApplications, borrowers, defaultLoanProducts, initialAdminLoans, initials, money, seedReviews, todayLong, type AdminLoanRecord, type ApplicationRecord, type IconName, type LoanProduct, type Review, type Role, type Screen } from './model';
import { createStyles } from './styles';
import { ThemeContext, palettes } from './theme';
// ─── Main app ─────────────────────────────────────────────────────────────────

export default function LendMateApp() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [role, setRole] = useState<Role>('borrower');
  const [isDark, setIsDark] = useState(false);
  const [, setTermsAccepted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<UserProfile | null>(null);
  const [formError, setFormError] = useState('');
  // Prevents onAuthChange from hijacking navigation when we're already handling it
  const skipAuthRedirect = useRef(false);
  const goTo = useCallback((target: Screen) => {
    setFormError('');
    setScreen(target);
  }, []);

  const [notifications, setNotifications] = useState<{ id: string; title: string; detail: string; icon: 'calendar' | 'file' | 'check' | 'bell' | 'clock'; read: boolean }[]>([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  // ── Age verification fields ──────────────────────────────────────────────────
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [idType, setIdType] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idPhotoUri, setIdPhotoUri] = useState<string | null>(null);
  const [profilePhotoUri, setProfilePhotoUri] = useState<string | null>(null);
  // ────────────────────────────────────────────────────────────────────────────
  const [formLoading, setFormLoading] = useState(false);

  // ── Google Sign-In hook ──────────────────────────────────────────────────────
  const { request: googleRequest, response: googleResponse, promptAsync: googlePrompt } = useGoogleSignIn();

  // ── Persistent auth state ────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
      if (skipAuthRedirect.current) {
        // We're already handling navigation (register/login flow) — just clear the loading gate
        setAuthLoading(false);
        return;
      }
      if (user) {
        const profile = await fetchUserProfile(user.uid);
        if (profile) {
          setFirebaseUser(profile);
          setFullName(profile.fullName);
          setEmail(profile.email ?? '');
          setPhone(profile.phone ?? '');
          setRole(profile.role as Role);
          setTermsAccepted(profile.termsAccepted);
          if (!profile.termsAccepted) {
            setScreen('terms');
          } else {
            setScreen(profile.role === 'admin' ? 'admin-dashboard' : 'dashboard');
          }
        } else {
          setScreen('login');
        }
      } else {
        setFirebaseUser(null);
        setScreen('splash');
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // ── Handle Google OAuth response ─────────────────────────────────────────────
  useEffect(() => {
    if (googleResponse) {
      (async () => {
        setFormLoading(true);
        const result = await handleGoogleResponse(googleResponse);
        setFormLoading(false);
        if (result.ok) {
          setFirebaseUser(result.profile);
          setFullName(result.profile.fullName);
          setEmail(result.profile.email ?? '');
          setPhone(result.profile.phone ?? '');
          setRole(result.profile.role as Role);
          setTermsAccepted(result.profile.termsAccepted);
          setFormError('');
          goTo(result.profile.termsAccepted
            ? (result.profile.role === 'admin' ? 'admin-dashboard' : 'dashboard')
            : 'terms');
        } else {
          setFormError(result.error);
        }
      })();
    }
  }, [googleResponse, goTo]);
  // ── Sync palette with dark mode ──────────────────────────────────────────────
  const p = isDark ? palettes.dark : palettes.light;
  const sh = useMemo(() => createStyles(p), [p]);

  const toggleDark = () => setIsDark((v) => !v);
  const [loanProduct, setLoanProduct] = useState('Personal Loan');
  const [loanAmount, setLoanAmount] = useState('');
  const [loanTerm, setLoanTerm] = useState(3);
  const [loanPurpose, setLoanPurpose] = useState('Emergency');
  const [application, setApplication] = useState<ApplicationRecord | null>(null);
  const [applicationDecision, setApplicationDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [approvedLoan, setApprovedLoan] = useState<AdminLoanRecord | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('GCash');
  const [payRef, setPayRef] = useState('');
  const [payError, setPayError] = useState('');
  const [loanRemaining, setLoanRemaining] = useState(0);
  const [selectedBorrower, setSelectedBorrower] = useState<typeof borrowers[0] | null>(null);
  // Real borrowers — grows as users register.
  const [registeredBorrowers, setRegisteredBorrowers] = useState(borrowers);
  const [adminApps, setAdminApps] = useState(adminApplications);
  const [adminLoans, setAdminLoans] = useState(initialAdminLoans);
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<AdminLoanRecord | null>(null);
  const [reviews, setReviews] = useState<Review[]>(seedReviews);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  // ── Select-delete state for admin ────────────────────────────────────────────
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
  const [selectedBorrowerIds, setSelectedBorrowerIds] = useState<Set<string>>(new Set());
  const [selectedReviewIds, setSelectedReviewIds] = useState<Set<string>>(new Set());
  const [appSelectMode, setAppSelectMode] = useState(false);
  const [borrowerSelectMode, setBorrowerSelectMode] = useState(false);
  const [reviewSelectMode, setReviewSelectMode] = useState(false);
  // ── Loan list select/delete state ────────────────────────────────────────────
  const [loanSelectMode, setLoanSelectMode] = useState(false);
  const [selectedLoanIds, setSelectedLoanIds] = useState<Set<string>>(new Set());
  // ── Loan edit state ───────────────────────────────────────────────────────────
  const [loanEditMode, setLoanEditMode] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editInterestRate, setEditInterestRate] = useState('');
  const [editTerm, setEditTerm] = useState('');
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'PAID'>('ACTIVE');
  const [editError, setEditError] = useState('');
  // ── Admin interest rate input per application ─────────────────────────────────
  // Maps application id → admin-entered interest rate string (e.g. "15")
  const [adminAppInterestRates, setAdminAppInterestRates] = useState<Record<string, string>>({});
  // ── Admin custom interest rate per application ────────────────────────────────
  // Maps appId -> admin-entered interest rate string
  const [adminRates, setAdminRates] = useState<Record<string, string>>({});
  // ── Admin Loan Products ───────────────────────────────────────────────────────
  const [loanProducts, setLoanProducts] = useState<LoanProduct[]>(defaultLoanProducts);
  const [showLoanProductForm, setShowLoanProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<LoanProduct | null>(null);
  const [lpName, setLpName] = useState('');
  const [lpDescription, setLpDescription] = useState('');
  const [lpMinAmount, setLpMinAmount] = useState('');
  const [lpMaxAmount, setLpMaxAmount] = useState('');
  const [lpDefaultTerm, setLpDefaultTerm] = useState('');
  const [lpInterestRate, setLpInterestRate] = useState('');
  const [lpPurposes, setLpPurposes] = useState<string[]>([]);
  const [lpNewPurpose, setLpNewPurpose] = useState('');
  const [lpFormError, setLpFormError] = useState('');
  // ── Change Password state ─────────────────────────────────────────────────────
  const [cpCurrentPassword, setCpCurrentPassword] = useState('');
  const [cpNewPassword, setCpNewPassword] = useState('');
  const [cpConfirmPassword, setCpConfirmPassword] = useState('');
  const [cpLoading, setCpLoading] = useState(false);
  const [cpError, setCpError] = useState('');
  const [cpSuccess, setCpSuccess] = useState(false);
  // ── Real-time date/time ────────────────────────────────────────────────────────
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  const todayDisplay = now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const loanApprovedDate = now.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });

  // ── Firestore real-time listeners ─────────────────────────────────────────────
  useEffect(() => {
    if (!firebaseUser) return;
    // Listen to loan products (admin manages, users see)
    const unsubLP = listenLoanProducts((products) => {
      if (products.length > 0) setLoanProducts(products);
    });
    return () => { unsubLP(); };
  }, [firebaseUser]);

  useEffect(() => {
    if (!firebaseUser) return;
    if (firebaseUser.role === 'admin') {
      // Admin listens to all applications
      const unsubApps = listenApplications((apps) => {
        setAdminApps(apps.map((a) => ({
          id: a.id, borrower: a.borrower, borrowerUid: a.borrowerUid, amount: a.amount,
          product: a.product, term: a.term, status: a.status as ApplicationRecord['status'],
          isCustomAmount: a.isCustomAmount, submittedAt: a.submittedAt,
          email: a.email, phone: a.phone, dateOfBirth: a.dateOfBirth, idType: a.idType, idNumber: a.idNumber,
        })));
      });
      // Admin listens to all loans
      const unsubLoans = listenLoans((loans) => {
        setAdminLoans(loans.map((l) => ({
          id: l.id, borrower: l.borrower, borrowerUid: l.borrowerUid, amount: l.amount,
          interest: l.interest, term: l.term, remaining: l.remaining,
          status: l.status as AdminLoanRecord['status'], approvedAt: l.approvedAt,
        })));
      });
      // Admin listens to all registered borrowers from users collection
      const unsubBorrowers = listenRegisteredBorrowers((bs) => {
        setRegisteredBorrowers(bs);
      });
      return () => { unsubApps(); unsubLoans(); unsubBorrowers(); };
    } else {
      // Borrower listens to their own loan
      const unsubLoan = listenBorrowerLoan(firebaseUser.uid, (loan) => {
        if (loan) {
          const loanRecord: AdminLoanRecord = {
            id: loan.id, borrower: loan.borrower, borrowerUid: loan.borrowerUid,
            amount: loan.amount, interest: loan.interest, term: loan.term,
            remaining: loan.remaining, status: loan.status as 'ACTIVE' | 'PAID', approvedAt: loan.approvedAt,
          };
          setApprovedLoan(loanRecord);
          setLoanRemaining(loan.remaining);
        }
      });
      return () => { unsubLoan(); };
    }
  }, [firebaseUser]);

  const signIn = async () => {
    if (!email.includes('@') || password.length < 6) {
      setFormError('Enter a valid email and a password of at least 6 characters.');
      return;
    }
    skipAuthRedirect.current = true;
    setFormLoading(true);
    const result = await signInWithEmail(email, password);
    setFormLoading(false);
    if (result.ok) {
      setFirebaseUser(result.profile);
      setFullName(result.profile.fullName);
      setEmail(result.profile.email ?? email);
      setPhone(result.profile.phone ?? '');
      setRole(result.profile.role as Role);
      setTermsAccepted(result.profile.termsAccepted);
      setFormError('');
      goTo(result.profile.termsAccepted
        ? (result.profile.role === 'admin' ? 'admin-dashboard' : 'dashboard')
        : 'terms');
    } else {
      skipAuthRedirect.current = false;
      setFormError(result.error);
    }
  };

  const register = async () => {
    // Basic field validation
    if (!fullName.trim() || !email.includes('@') || phone.trim().length < 7 ||
      password.length < 6 || password !== confirmPassword) {
      setFormError('Complete every field. Passwords must match and have at least 6 characters.');
      return;
    }

    // Date of birth validation
    const day = parseInt(dobDay, 10);
    const month = parseInt(dobMonth, 10);
    const year = parseInt(dobYear, 10);
    if (!dobDay || !dobMonth || !dobYear ||
      isNaN(day) || isNaN(month) || isNaN(year) ||
      month < 1 || month > 12 ||
      day < 1 || day > 31 ||
      year < 1900 || year > new Date().getFullYear()) {
      setFormError('Enter a valid date of birth.');
      return;
    }
    const dob = new Date(year, month - 1, day);
    if (
      isNaN(dob.getTime()) ||
      dob.getFullYear() !== year ||
      dob.getMonth() !== month - 1 ||
      dob.getDate() !== day
    ) {
      setFormError('Enter a valid date of birth.');
      return;
    }
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;

    if (age < 18) {
      goTo('underage');
      return;
    }

    // Government ID validation
    if (!idType) {
      setFormError('Select a valid government-issued ID type.');
      return;
    }
    if (!idNumber.trim() || idNumber.trim().length < 4) {
      setFormError('Enter your ID number.');
      return;
    }

    skipAuthRedirect.current = true;
    setFormLoading(true);
    const result = await registerWithEmail(fullName, email, phone, password, {
      dateOfBirth: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      idType,
      idNumber: idNumber.trim(),
    });
    setFormLoading(false);
    if (result.ok) {
      setFirebaseUser(result.profile);
      setFullName(result.profile.fullName);
      setRole('borrower');
      setTermsAccepted(false);
      setFormError('');
      // Add to the real borrowers list so admin sees them immediately
      const uid = result.profile.uid;
      setRegisteredBorrowers((prev) => {
        if (prev.some((b) => b.id === uid)) return prev;
        return [{ id: uid, name: result.profile.fullName, phone: result.profile.phone || '—', activeLoans: 0, status: 'ACTIVE' }, ...prev];
      });
      goTo('terms');
    } else {
      skipAuthRedirect.current = false;
      setFormError(result.error);
    }
  };

  const handleLogout = async () => {
    skipAuthRedirect.current = false;
    setShowLogout(false);
    // Show loading screen while signing out
    setTransitioning(true);
    await signOut();
    setFirebaseUser(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setTermsAccepted(false);
    setTimeout(() => {
      setTransitioning(false);
      goTo('splash');
    }, 1400);
  };

  const submitApplication = () => {
    const amount = Number(loanAmount.replace(/,/g, ''));
    if (!amount || amount < 1000 || amount > 500000) {
      setFormError('Enter a loan amount from ₱1,000 to ₱500,000.');
      return;
    }
    const presets = [5000, 10000, 20000, 50000];
    const isCustomAmount = !presets.includes(amount);
    const appId = String(10026 + adminApps.filter((r) => Number(r.id) >= 10026).length);
    const submittedAt = now.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
    const newApplication: ApplicationRecord = {
      id: appId,
      borrower: fullName,
      borrowerUid: firebaseUser?.uid,
      amount,
      product: loanProduct,
      term: loanTerm,
      status: 'UNDER REVIEW',
      isCustomAmount,
      submittedAt,
      email: email,
      phone: phone,
      idType: idType || firebaseUser?.idType,
      dateOfBirth: firebaseUser?.dateOfBirth,
      idNumber: idNumber || firebaseUser?.idNumber,
    };
    setApplication(newApplication);
    setAdminApps((prev) => [{ ...newApplication, status: 'PENDING' }, ...prev]);
    setApplicationDecision(null);
    // Persist to Firestore
    saveApplication({
      id: appId, borrower: fullName, borrowerUid: firebaseUser?.uid ?? '',
      amount, product: loanProduct, term: loanTerm, status: 'PENDING',
      isCustomAmount, submittedAt,
      email: email || '', phone: phone || '',
      idType: idType || firebaseUser?.idType || '',
      dateOfBirth: firebaseUser?.dateOfBirth || '',
      idNumber: idNumber || firebaseUser?.idNumber || '',
    });
    goTo('application-status');
  };

  const decide = (record: ApplicationRecord, status: 'APPROVED' | 'REJECTED') => {
    const updated = { ...record, status };
    setAdminApps((prev) => prev.map((item) => item.id === record.id ? updated : item));
    setSelectedApp(updated);
    // Persist status update
    updateApplicationStatus(record.id, status);
    if (application && record.id === application.id) {
      setApplication(updated);
      setApplicationDecision(status);
    }
    if (status === 'APPROVED') {
      const adminRate = adminAppInterestRates[record.id];
      const ratePercent = record.isCustomAmount && adminRate
        ? Math.max(0, Math.min(100, Number(adminRate)))
        : 10;
      const interest = Math.round(record.amount * (ratePercent / 100));
      const totalPayable = record.amount + interest;
      const approvedAt = now.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
      const newLoan: AdminLoanRecord = {
        id: `1${record.id}`, borrower: record.borrower, borrowerUid: record.borrowerUid,
        amount: record.amount, interest, term: record.term ?? 3,
        remaining: totalPayable, status: 'ACTIVE', approvedAt,
      };
      setAdminLoans((prev) => [newLoan, ...prev]);
      setSelectedLoan(newLoan);
      // Persist loan to Firestore
      saveLoan({
        id: newLoan.id, borrower: newLoan.borrower, borrowerUid: record.borrowerUid ?? '',
        amount: newLoan.amount, interest: newLoan.interest, term: newLoan.term,
        remaining: newLoan.remaining, status: 'ACTIVE', approvedAt,
      });
      if (application?.id === record.id) {
        setApprovedLoan(newLoan);
        setLoanRemaining(totalPayable);
      }
      // Ensure borrower appears in the borrowers list
      if (record.borrowerUid) {
        setRegisteredBorrowers((prev) => {
          if (prev.some((b) => b.id === record.borrowerUid)) return prev;
          return [{ id: record.borrowerUid!, name: record.borrower, phone: record.phone || '—', email: record.email || '', activeLoans: 1, status: 'ACTIVE' }, ...prev];
        });
      }
      // Notify the borrower
      const installAmt = Math.ceil(totalPayable / (record.term ?? 3));
      // Calculate next due date (1 month from now, same day)
      const nextDue = new Date(now);
      nextDue.setMonth(nextDue.getMonth() + 1);
      const nextDueStr = nextDue.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
      setNotifications((prev) => [
        {
          id: `notif-approved-${record.id}`,
          title: 'Loan Approved!',
          detail: `Your ${record.product} of ${money(record.amount)} was approved on ${approvedAt}. First payment: ${money(installAmt)}.`,
          icon: 'check' as const,
          read: false,
        },
        {
          id: `notif-due-${record.id}`,
          title: 'Payment Due Reminder',
          detail: `Your first installment of ${money(installAmt)} is due on ${nextDueStr}.`,
          icon: 'calendar' as const,
          read: false,
        },
        ...prev,
      ]);
    }
  };

  const monthlyEst = loanAmount
    ? Math.round((Number(loanAmount.replace(/,/g, '')) * 1.1) / loanTerm)
    : 0;

  // ── Shared page header ──────────────────────────────────────────────────────
  const Header = ({ bell = true }: { bell?: boolean }) => (
    <View style={[sh.header, { backgroundColor: p.surface, borderBottomColor: p.line }]}>
      <Pressable style={sh.headerBrand} onPress={() => goTo('splash')}>
        <BrandMark size="compact" />
        <Text style={[sh.headerWordmark, { color: p.navy }]}>
          <Text style={{ color: p.navy }}>Lend</Text>
          <Text style={{ color: p.green }}>Mate</Text>
        </Text>
      </Pressable>
      <View style={sh.headerRight}>
        {/* Dark / Light mode toggle */}
        <Pressable
          style={({ pressed }) => [sh.headerIconBtn, { backgroundColor: p.background, borderColor: p.line }, pressed && sh.headerIconBtnPressed]}
          onPress={toggleDark}
          accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <Svg width={18} height={18} viewBox="0 0 24 24">
            {isDark ? (
              // Sun icon
              <>
                <Path d="M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z"
                  stroke="#F9C74F" strokeWidth="1.75" strokeLinecap="round" fill="none" />
                <Path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
                  stroke="#F9C74F" strokeWidth="1.75" strokeLinecap="round" fill="none" />
              </>
            ) : (
              // Moon icon
              <Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                stroke={p.navy} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            )}
          </Svg>
        </Pressable>

        {bell && (
          <Pressable
            style={({ pressed }) => [sh.headerIconBtn, { backgroundColor: p.background, borderColor: p.line }, pressed && sh.headerIconBtnPressed]}
            onPress={() => goTo('notifications')}
            accessibilityLabel="Notifications"
          >
            <AppIcon name="bell" size={19} color={p.navy} />
            {notifications.some(n => !n.read) && (
              <View style={[sh.notifBadge, { backgroundColor: p.green, borderColor: p.surface }]}>
                <Text style={sh.notifBadgeText}>{notifications.filter(n => !n.read).length}</Text>
              </View>
            )}
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [sh.profileBtn, { backgroundColor: p.navy }, pressed && { opacity: 0.8 }]}
          onPress={() => goTo('profile')}
          accessibilityLabel="My Profile"
        >
          <Text style={sh.profileInitials}>
            {role === 'admin' ? 'AD' : initials(fullName || 'U')}
          </Text>
        </Pressable>
      </View>
    </View>
  );

  // ── Splash ──────────────────────────────────────────────────────────────────
  const renderSplash = () => (
    <View style={[sh.splash, { backgroundColor: p.surface }]}>
      <View style={sh.splashTop}>
        <BrandMark size="full" />
        <Text style={[sh.splashTagline, { color: p.navy }]}>Borrow Smart. Pay Easy. Stay on Track.</Text>
      </View>
      <View style={sh.splashBottom}>
        <View style={sh.splashFeatures}>
          {[
            ['check', 'Fast loan approvals'],
            ['calendar', 'Clear repayment schedules'],
            ['shield', 'Secure & private'],
          ].map(([icon, label]) => (
            <View key={label} style={sh.splashFeatureRow}>
              <View style={sh.splashFeatureIcon}>
                <AppIcon name={icon as IconName} size={14} color={p.green} />
              </View>
              <Text style={[sh.splashFeatureLabel, { color: p.text }]}>{label}</Text>
            </View>
          ))}
        </View>
        <Btn title="Get Started" onPress={() => {
          setTransitioning(true);
          setTimeout(() => {
            setTransitioning(false);
            goTo('login');
          }, 700);
        }} />
        <Text style={[sh.splashNote, { color: p.muted }]}>Already have an account?{' '}
          <Text style={sh.splashNoteLink} onPress={() => goTo('login')}>Sign in</Text>
        </Text>
      </View>
    </View>
  );

  // ── Login ───────────────────────────────────────────────────────────────────
  const renderLogin = () => (
    <KeyboardAvoidingView style={sh.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={sh.loginScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── Green hero top ───────────────────────────────────────────── */}
        <View style={sh.loginHero}>
          <Pressable style={sh.loginHeroBrand} onPress={() => goTo('splash')}>
            <BrandMark size="compact" light />
            <Text style={sh.loginHeroWordmark}>
              <Text style={{ color: p.surface }}>Lend</Text>
              <Text style={{ color: '#A5E1B6' }}>Mate</Text>
            </Text>
          </Pressable>
          <Text style={sh.loginHeroTitle}>Welcome back</Text>
          <Text style={sh.loginHeroSub}>Sign in to your loan account.</Text>
        </View>

        {/* ── White form card ──────────────────────────────────────────── */}
        <View style={[sh.loginCard, { backgroundColor: p.surface }]}>
          <InputField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <InputField label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry />

          <Pressable style={sh.forgotRow} onPress={async () => {
            if (!email.trim() || !email.includes('@')) {
              setFormError('Enter your email address above first, then tap Forgot Password.');
              return;
            }
            setFormLoading(true);
            const result = await sendPasswordReset(email.trim());
            setFormLoading(false);
            if (result.ok) {
              setFormError('✓ Password reset email sent. Check your inbox (and spam folder).');
            } else {
              setFormError(result.error ?? 'Could not send reset email. Please try again.');
            }
          }}>
            <Text style={[sh.forgotText, { color: p.greenDark }]}>Forgot Password?</Text>
          </Pressable>

          {formError ? <View style={sh.errorBox}><Text style={sh.errorText}>{formError}</Text></View> : null}

          <Btn title={formLoading ? 'Signing in…' : 'Sign In'} onPress={signIn} disabled={formLoading} />

          <View style={sh.dividerRow}>
            <View style={sh.dividerLine} />
            <Text style={sh.dividerText}>or</Text>
            <View style={sh.dividerLine} />
          </View>

          <Pressable
            style={({ pressed }) => [sh.googleBtn, pressed && sh.googleBtnPressed]}
            onPress={() => { setFormError(''); googlePrompt(); }}
            disabled={!googleRequest || formLoading}
          >
            <Svg width={18} height={18} viewBox="0 0 48 48">
              <Path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21c10.5 0 20-7.6 20-21 0-1.3-.2-2.7-.5-4z" fill="#FFC107" />
              <Path d="M6.3 14.7l7 5.1C15.1 16.1 19.2 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 5.1 29.6 3 24 3 16.3 3 9.7 7.9 6.3 14.7z" fill="#FF3D00" />
              <Path d="M24 45c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6C29.6 36 26.9 37 24 37c-6.1 0-10.7-3.1-11.8-8.5l-7 5.4C8.6 41.1 15.7 45 24 45z" fill="#4CAF50" />
              <Path d="M44.5 20H24v8.5h11.8c-.6 2.6-2.2 4.7-4.3 6.1l6.6 5.6C42.1 37.4 45 31.2 45 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2" />
            </Svg>
            <Text style={sh.googleBtnText}>Continue with Google</Text>
          </Pressable>
        </View>

        {/* ── Register CTA ────────────────────────────────────────────── */}
        <View style={[sh.loginRegisterBox, { backgroundColor: p.background }]}>
          <Text style={[sh.loginRegisterLabel, { color: p.muted }]}>New to LendMate?</Text>
          <Pressable
            style={({ pressed }) => [sh.loginRegisterBtn, pressed && sh.loginRegisterBtnPressed]}
            onPress={() => { setFormError(''); goTo('register'); }}
          >
            <Text style={[sh.loginRegisterBtnText, { color: p.greenDark }]}>Create an Account</Text>
          </Pressable>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ── Register ────────────────────────────────────────────────────────────────
  const renderRegister = () => {
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    const GOV_IDS = [
      { label: 'National ID', sub: 'PhilSys' },
      { label: 'Passport', sub: 'Philippine' },
      { label: "Driver's License", sub: 'LTO' },
      { label: 'SSS ID', sub: 'Social Security' },
      { label: 'UMID', sub: 'SSS / GSIS' },
      { label: 'PhilHealth', sub: 'Health Insurance' },
      { label: 'Voter ID', sub: 'COMELEC' },
      { label: 'PRC ID', sub: 'Professional' },
      { label: 'Postal ID', sub: 'PHLPost' },
      { label: 'TIN ID', sub: 'BIR' },
      { label: 'GSIS ID', sub: 'Gov. Service' },
    ];

    const pickIdPhoto = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setFormError('Please allow access to your photo library to upload your ID.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setIdPhotoUri(result.assets[0].uri);
      }
    };

    const takeIdPhoto = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setFormError('Please allow camera access to take a photo of your ID.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) {
        setIdPhotoUri(result.assets[0].uri);
      }
    };

    const selectedMonthLabel = dobMonth ? MONTHS[parseInt(dobMonth, 10) - 1] : null;

    return (
      <KeyboardAvoidingView style={sh.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={sh.authScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <PageTitle title="Create Account" subtitle="Fill in your details to get started." onBack={() => goTo('login')} />

          <InputField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your full name" autoCapitalize="words" />
          <InputField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
          <InputField label="Phone Number" value={phone} onChangeText={setPhone} placeholder="09XXXXXXXXX" keyboardType="phone-pad" />
          <InputField label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />
          <InputField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat your password" secureTextEntry />

          {/* ── Date of Birth ─────────────────────────────────────────── */}
          <View style={sh.fieldWrap}>
            <Text style={sh.fieldLabel}>Date of Birth</Text>
            <Text style={sh.fieldHint}>Must be 18 years old or older.</Text>

            {/* Month grid */}
            <View style={sh.dobMonthGrid}>
              {MONTHS.map((m, i) => {
                const val = String(i + 1);
                const active = dobMonth === val;
                return (
                  <Pressable
                    key={m}
                    onPress={() => setDobMonth(val)}
                    style={[sh.dobMonthCell, active && sh.dobMonthCellActive]}
                  >
                    <Text style={[sh.dobMonthText, active && sh.dobMonthTextActive]}>
                      {m.slice(0, 3)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Day + Year inline */}
            <View style={sh.dobDayYearRow}>
              <View style={sh.dobDayYearField}>
                <Text style={[sh.dobDayYearLabel, { color: p.muted }]}>Day</Text>
                <TextInput
                  value={dobDay}
                  onChangeText={(v) => setDobDay(v.replace(/\D/g, '').slice(0, 2))}
                  keyboardType="numeric"
                  placeholder="DD"
                  placeholderTextColor={p.mutedLight}
                  maxLength={2}
                  style={[sh.dobDayYearInput, { backgroundColor: p.surface, borderColor: p.line, color: p.text }]}
                />
              </View>
              <View style={sh.dobDayYearSep}>
                <Text style={[sh.dobDayYearSepText, { color: p.navy }]}>
                  {selectedMonthLabel ?? '—'}
                </Text>
              </View>
              <View style={sh.dobDayYearField}>
                <Text style={[sh.dobDayYearLabel, { color: p.muted }]}>Year</Text>
                <TextInput
                  value={dobYear}
                  onChangeText={(v) => setDobYear(v.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="numeric"
                  placeholder="YYYY"
                  placeholderTextColor={p.mutedLight}
                  maxLength={4}
                  style={[sh.dobDayYearInput, { backgroundColor: p.surface, borderColor: p.line, color: p.text }]}
                />
              </View>
            </View>
          </View>

          {/* ── Government ID type ───────────────────────────────────── */}
          <View style={sh.fieldWrap}>
            <Text style={sh.fieldLabel}>Government-Issued ID</Text>
            <Text style={sh.fieldHint}>Select the ID you will use for verification.</Text>
            <View style={sh.idGrid}>
              {GOV_IDS.map(({ label, sub }) => {
                const active = idType === label;
                return (
                  <Pressable
                    key={label}
                    onPress={() => setIdType(label)}
                    style={[sh.idGridCell, active && sh.idGridCellActive]}
                  >
                    <Text style={[sh.idGridLabel, active && sh.idGridLabelActive]}>{label}</Text>
                    <Text style={[sh.idGridSub, active && sh.idGridSubActive]}>{sub}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {idType ? (<>
            <InputField
              label="ID Number"
              value={idNumber}
              onChangeText={setIdNumber}
              placeholder={`Enter your ${idType} number`}
              autoCapitalize="characters"
            />

            {/* ── ID Photo upload ──────────────────────────────────── */}
            <View style={sh.fieldWrap}>
              <Text style={sh.fieldLabel}>ID Photo</Text>
              <Text style={sh.fieldHint}>Take or upload a clear photo of your {idType}.</Text>

              {idPhotoUri ? (
                <View style={sh.idPhotoPreviewWrap}>
                  <Image source={{ uri: idPhotoUri }} style={sh.idPhotoPreview} resizeMode="cover" />
                  <Pressable style={sh.idPhotoRetake} onPress={pickIdPhoto}>
                    <Text style={sh.idPhotoRetakeText}>Change photo</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={sh.idPhotoActions}>
                  <Pressable
                    style={({ pressed }) => [sh.idPhotoBtn, pressed && sh.idPhotoBtnPressed]}
                    onPress={takeIdPhoto}
                  >
                    <Svg width={22} height={22} viewBox="0 0 24 24">
                      <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
                        stroke={p.green} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      <Path d="M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
                        stroke={p.green} strokeWidth="1.75" fill="none" />
                    </Svg>
                    <Text style={sh.idPhotoBtnText}>Take Photo</Text>
                  </Pressable>

                  <Pressable
                    style={({ pressed }) => [sh.idPhotoBtn, pressed && sh.idPhotoBtnPressed]}
                    onPress={pickIdPhoto}
                  >
                    <Svg width={22} height={22} viewBox="0 0 24 24">
                      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
                        stroke={p.green} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </Svg>
                    <Text style={sh.idPhotoBtnText}>Upload from Gallery</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </>) : null}

          {formError ? <View style={sh.errorBox}><Text style={sh.errorText}>{formError}</Text></View> : null}

          <Btn title={formLoading ? 'Creating account…' : 'Create Account'} onPress={register} disabled={formLoading} />

          <View style={sh.authSwitchRow}>
            <Text style={[sh.authSwitchText, { color: p.muted }]}>Already have an account?</Text>
            <Pressable onPress={() => goTo('login')}><Text style={[sh.authSwitchLink, { color: p.greenDark }]}>Sign In</Text></Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  // ── Underage block ───────────────────────────────────────────────────────────
  const renderUnderage = () => (
    <View style={[sh.underageScreen, { backgroundColor: p.surface }]}>
      <View style={sh.underageIconWrap}>
        <Svg width={48} height={48} viewBox="0 0 24 24">
          <Path d="M12 3 4 7v5c0 5 3.6 9.3 8 10.3C16.4 21.3 20 17 20 12V7z"
            stroke={p.red} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          <Path d="M12 8v4M12 16v.1"
            stroke={p.red} strokeWidth="2" strokeLinecap="round" fill="none" />
        </Svg>
      </View>
      <Text style={[sh.underageTitle, { color: p.red }]}>Age Restriction</Text>
      <Text style={[sh.underageBody, { color: p.text }]}>
        LendMate is only available to users who are{' '}
        <Text style={sh.underageBold}>18 years of age or older.</Text>
        {'\n\n'}
        Based on the date of birth you entered, you do not meet the minimum age requirement to register for a loan account.
      </Text>
      <View style={sh.underageLegal}>
        <AppIcon name="shield" size={14} color={p.muted} />
        <Text style={[sh.underageLegalText, { color: p.muted }]}>
          This restriction is in compliance with Philippine lending regulations and the LendMate Terms of Service.
        </Text>
      </View>
      <Btn title="Go Back" onPress={() => goTo('register')} variant="secondary" />
    </View>
  );

  // ── Terms wrapper ────────────────────────────────────────────────────────────
  const renderTerms = () => (
    <TermsScreen
      role={role}
      onAgree={async () => {
        setTransitioning(true);
        if (firebaseUser) {
          await acceptTerms(firebaseUser.uid);
        }
        setTermsAccepted(true);
        // Show loading overlay for 1.8s then navigate
        setTimeout(() => {
          setTransitioning(false);
          goTo(role === 'admin' ? 'admin-dashboard' : 'dashboard');
        }, 1800);
      }}
    />
  );

  // ── Review screen (borrower) ─────────────────────────────────────────────────
  const renderReview = () => {
    const submitReview = () => {
      if (reviewStars === 0) return;
      const newReview: Review = {
        id: `r${Date.now()}`,
        borrower: fullName || 'Borrower',
        stars: reviewStars,
        comment: reviewComment.trim(),
        date: todayLong,
      };
      setReviews((prev) => [newReview, ...prev]);
      setReviewSubmitted(true);
      setReviewStars(0);
      setReviewComment('');
      goTo('dashboard');
    };

    return (
      <View style={[sh.flex, { backgroundColor: p.background }]}>
        <Header bell={false} />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]} keyboardShouldPersistTaps="handled">
          <PageTitle title="Rate Your Experience" subtitle="Help us improve LendMate." onBack={() => goTo('dashboard')} />

          {/* Star picker */}
          <View style={[sh.reviewStarCard, { backgroundColor: p.surface, borderColor: p.line }]}>
            <Text style={[sh.reviewStarPrompt, { color: p.navy }]}>How would you rate your experience?</Text>
            <View style={sh.reviewStarRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  onPress={() => setReviewStars(star)}
                  style={({ pressed }) => [sh.reviewStarBtn, pressed && { opacity: 0.7 }]}
                  accessibilityLabel={`${star} star${star > 1 ? 's' : ''}`}
                >
                  <Svg width={36} height={36} viewBox="0 0 24 24">
                    <Path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      stroke={star <= reviewStars ? '#F4B400' : p.line}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      fill={star <= reviewStars ? '#F4B400' : 'transparent'}
                    />
                  </Svg>
                </Pressable>
              ))}
            </View>
            <Text style={[sh.reviewStarLabel, { color: p.muted }]}>
              {reviewStars === 0 ? 'Tap a star to rate' :
                reviewStars === 1 ? 'Poor' :
                reviewStars === 2 ? 'Fair' :
                reviewStars === 3 ? 'Good' :
                reviewStars === 4 ? 'Very Good' : 'Excellent!'}
            </Text>
          </View>

          {/* Comment */}
          <View style={sh.fieldWrap}>
            <Text style={[sh.fieldLabel, { color: p.text }]}>Your Comment <Text style={{ color: p.mutedLight, fontWeight: '400' }}>(optional)</Text></Text>
            <TextInput
              value={reviewComment}
              onChangeText={setReviewComment}
              placeholder="Tell us about your experience with LendMate…"
              placeholderTextColor={p.mutedLight}
              multiline
              numberOfLines={4}
              style={[sh.reviewTextarea, { backgroundColor: p.surface, borderColor: p.line, color: p.text }]}
            />
          </View>

          <Btn title="Submit Review" onPress={submitReview} disabled={reviewStars === 0} />
        </ScrollView>
      </View>
    );
  };

  // ── Admin Reviews screen ──────────────────────────────────────────────────────
  const renderAdminReviews = () => {
    const avg = reviews.length
      ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1)
      : '0.0';
    const dist = [5, 4, 3, 2, 1].map((s) => ({
      stars: s,
      count: reviews.filter((r) => r.stars === s).length,
    }));
    const toggleSelectReview = (id: string) =>
      setSelectedReviewIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    const deleteSelected = () => {
      setReviews((prev) => prev.filter((r) => !selectedReviewIds.has(r.id)));
      setSelectedReviewIds(new Set());
      setReviewSelectMode(false);
    };
    const deleteAll = () => { setReviews([]); setSelectedReviewIds(new Set()); setReviewSelectMode(false); };

    return (
      <View style={[sh.flex, { backgroundColor: p.background }]}>
        <Header />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <View>
              <Text style={[sh.pageTitleText, { color: p.navy }]}>Reviews</Text>
              <Text style={[sh.pageTitleSub, { color: p.muted }]}>All borrower ratings</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              {reviews.length > 0 && (
                <Pressable onPress={() => { setReviewSelectMode((v) => !v); setSelectedReviewIds(new Set()); }}>
                  <Text style={{ color: reviewSelectMode ? p.muted : p.navy, fontSize: 13, fontWeight: '700' }}>
                    {reviewSelectMode ? 'Cancel' : 'Select'}
                  </Text>
                </Pressable>
              )}
              {reviews.length > 0 && !reviewSelectMode && (
                <Pressable onPress={deleteAll}>
                  <Text style={{ color: p.red, fontSize: 13, fontWeight: '700' }}>Delete All</Text>
                </Pressable>
              )}
              {reviewSelectMode && selectedReviewIds.size > 0 && (
                <Pressable onPress={deleteSelected}
                  style={{ backgroundColor: p.red, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Delete ({selectedReviewIds.size})</Text>
                </Pressable>
              )}
            </View>
          </View>

          {/* Aggregate hero — only shown when there are reviews */}
          {reviews.length > 0 && (
            <View style={[sh.reviewAggCard, { backgroundColor: p.surface, borderColor: p.line }]}>
              <View style={sh.reviewAggLeft}>
                <Text style={[sh.reviewAggScore, { color: p.navy }]}>{avg}</Text>
                <View style={sh.reviewAggStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Svg key={s} width={16} height={16} viewBox="0 0 24 24">
                      <Path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        stroke={s <= Math.round(parseFloat(avg)) ? '#F4B400' : p.line}
                        strokeWidth="1.5" strokeLinejoin="round"
                        fill={s <= Math.round(parseFloat(avg)) ? '#F4B400' : 'transparent'}
                      />
                    </Svg>
                  ))}
                </View>
                <Text style={[sh.reviewAggCount, { color: p.muted }]}>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</Text>
              </View>
              <View style={sh.reviewAggRight}>
                {dist.map(({ stars: s, count }) => (
                  <View key={s} style={sh.reviewBarRow}>
                    <Text style={[sh.reviewBarLabel, { color: p.muted }]}>{s}</Text>
                    <View style={[sh.reviewBarTrack, { backgroundColor: p.line }]}>
                      <View style={[sh.reviewBarFill, {
                        width: reviews.length ? `${Math.round((count / reviews.length) * 100)}%` as any : '0%',
                        backgroundColor: '#F4B400',
                      }]} />
                    </View>
                    <Text style={[sh.reviewBarCount, { color: p.muted }]}>{count}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {reviews.length === 0 && (
            <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.muted }]}>
              <Text style={[sh.infoBoxBody, { color: p.muted }]}>No reviews yet.</Text>
            </View>
          )}

          {/* Individual reviews */}
          {reviews.map((r) => {
            const isSelected = selectedReviewIds.has(r.id);
            return (
            <Pressable
              key={r.id}
              onPress={() => reviewSelectMode && toggleSelectReview(r.id)}
              style={[sh.reviewCard, { backgroundColor: isSelected ? p.greenPale : p.surface, borderColor: isSelected ? p.green : p.line }]}
            >
              <View style={sh.reviewCardHead}>
                {reviewSelectMode && (
                  <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: isSelected ? p.green : p.line, backgroundColor: isSelected ? p.green : p.surface, alignItems: 'center', justifyContent: 'center', marginRight: 4 }}>
                    {isSelected && <AppIcon name="check" size={12} color="#fff" />}
                  </View>
                )}
                <Avatar name={r.borrower} />
                <View style={sh.reviewCardMeta}>
                  <Text style={[sh.reviewCardName, { color: p.text }]}>{r.borrower}</Text>
                  <Text style={[sh.reviewCardDate, { color: p.muted }]}>{r.date}</Text>
                </View>
                <View style={sh.reviewCardStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Svg key={s} width={13} height={13} viewBox="0 0 24 24">
                      <Path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        stroke={s <= r.stars ? '#F4B400' : p.line}
                        strokeWidth="1.5" strokeLinejoin="round"
                        fill={s <= r.stars ? '#F4B400' : 'transparent'}
                      />
                    </Svg>
                  ))}
                </View>
              </View>
              {r.comment ? (
                <Text style={[sh.reviewCardComment, { color: p.text }]}>{r.comment}</Text>
              ) : null}
            </Pressable>
            );
          })}
        </ScrollView>
        <NavBar role="admin" screen={screen} onSelect={goTo} />
      </View>
    );
  };

  // ── Admin Payments screen ─────────────────────────────────────────────────────
  const renderAdminPayments = () => {
    // Build real payment records from actual admin loans
    const allPayments = adminLoans.map((loan, i) => ({
      id: `PAY-${loan.id}`,
      borrower: loan.borrower,
      loanId: loan.id,
      amount: Math.ceil((loan.amount + loan.interest) / loan.term),
      date: todayLong,
      method: '—',
      status: loan.status === 'PAID' ? 'PAID' : loan.remaining < loan.amount + loan.interest ? 'PARTIAL' : 'ACTIVE',
    }));

    const totalPaid = adminLoans.filter((l) => l.status === 'PAID').reduce((sum, l) => sum + l.amount + l.interest, 0);
    const pendingCount = adminLoans.filter((l) => l.status === 'ACTIVE' && l.remaining > 0).length;

    return (
      <View style={[sh.flex, { backgroundColor: p.background }]}>
        <Header />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
          <PageTitle title="Payments" subtitle="All borrower payment transactions." onBack={() => goTo('admin-dashboard')} />

          {/* Summary strip */}
          <View style={[sh.portfolioCard, { marginBottom: 16 }]}>
            <View style={sh.portfolioHalf}>
              <Text style={[sh.eyebrowSmall, { color: p.muted }]}>TOTAL COLLECTED</Text>
              <Text style={[sh.portfolioAmt, { color: p.surface }]}>{money(totalPaid)}</Text>
            </View>
            <View style={sh.portfolioDivider} />
            <View style={sh.portfolioHalf}>
              <Text style={[sh.eyebrowSmall, { color: p.muted }]}>PENDING</Text>
              <Text style={[sh.portfolioOutstanding]}>{pendingCount} payment{pendingCount !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Payment list */}
          <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
            {allPayments.map((pay, i) => (
              <View key={pay.id} style={[sh.historyRow, i === allPayments.length - 1 && sh.historyRowLast, { borderBottomColor: p.line }]}>
                <View style={[sh.historyDot,
                  pay.status === 'PAID' ? sh.historyDotPaid : sh.historyDotPending,
                  { backgroundColor: pay.status === 'PAID' ? p.greenPale : p.amberPale }]}>
                  <AppIcon
                    name={pay.status === 'PAID' ? 'check' : 'clock'}
                    size={14}
                    color={pay.status === 'PAID' ? p.greenDark : p.amber}
                  />
                </View>
                <View style={sh.historyCopy}>
                  <Text style={[sh.historyDate, { color: p.text }]}>{pay.borrower}</Text>
                  <Text style={[sh.historyMethod, { color: p.muted }]}>Loan #{pay.loanId} · {pay.date}</Text>
                  <Text style={[sh.historyMethod, { color: p.mutedLight }]}>{pay.method}</Text>
                </View>
                <View style={sh.historyRight}>
                  <Text style={[sh.historyAmount, { color: p.navy }]}>{money(pay.amount)}</Text>
                  <Text style={[sh.historyStatus, pay.status === 'PAID' ? sh.paidText : sh.pendingText]}>
                    {pay.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
        <NavBar role="admin" screen={screen} onSelect={goTo} />
      </View>
    );
  };

  // ── Borrower Dashboard ───────────────────────────────────────────────────────
  const renderDashboard = () => {
    const now = new Date();
    const hour = now.getHours();
    const greeting =
      hour >= 5 && hour < 12 ? 'Good morning' :
      hour >= 12 && hour < 17 ? 'Good afternoon' :
      hour >= 17 && hour < 21 ? 'Good evening' : 'Good night';
    const dateLabel = now.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });

    return (
    <>
      <Header />
      <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]} showsVerticalScrollIndicator={false}>
        <View style={sh.greeting}>
          <Text style={[sh.greetingTitle, { color: p.navy }]}>{greeting}, {fullName.split(' ')[0]}</Text>
          <Text style={[sh.greetingSub, { color: p.muted }]}>{dateLabel}</Text>
        </View>

        <View style={sh.heroCard}>
          <View style={sh.heroCardTop}>
            <Text style={sh.heroEyebrow}>{approvedLoan ? 'ACTIVE LOAN' : 'LOAN BALANCE'}</Text>
            {(approvedLoan || application) && (
              <StatusBadge status={approvedLoan ? (loanRemaining === 0 ? 'PAID' : 'ACTIVE') : applicationDecision ?? application?.status ?? 'PENDING'} />
            )}
          </View>
          <Text style={sh.heroAmount}>{money(loanRemaining)}</Text>
          <Text style={sh.heroCaption}>
            {approvedLoan
              ? `${application?.product ?? 'Loan'} · #${approvedLoan.id}`
              : application
                ? `Application ${applicationDecision === 'REJECTED' ? 'was not approved' : 'awaiting review'}`
                : 'No active loan'}
          </Text>
          <View style={sh.heroDivider} />
          <View style={sh.heroBottom}>
            <View>
              <Text style={sh.heroSmallLabel}>{approvedLoan ? 'Remaining balance' : 'Current balance'}</Text>
              <Text style={sh.heroBalance}>{money(loanRemaining)}</Text>
            </View>
            <View style={sh.heroIconBubble}>
              <AppIcon name="wallet" size={20} color={p.greenPale} />
            </View>
          </View>
        </View>

        {approvedLoan && loanRemaining > 0 && (
          <Pressable style={({ pressed }) => [sh.nextPayCard, { backgroundColor: p.surface, borderColor: p.line }, pressed && sh.cardPressed]} onPress={() => goTo('schedule')}>
            <View style={[sh.nextPayIcon, { backgroundColor: p.greenPale }]}>
              <AppIcon name="calendar" size={18} color={p.green} />
            </View>
            <View style={sh.nextPayCopy}>
              <Text style={[sh.eyebrowSmall, { color: p.muted }]}>LOAN PAYMENT SCHEDULE</Text>
              <Text style={[sh.nextPayAmount, { color: p.navy }]}>{money(Math.ceil((approvedLoan.amount + approvedLoan.interest) / approvedLoan.term))}</Text>
              <Text style={[sh.nextPayDate, { color: p.muted }]}>{approvedLoan.term}-month repayment term</Text>
            </View>
            <AppIcon name="arrow" size={17} color={p.muted} />
          </Pressable>
        )}

        {/* Actions */}
        <View style={sh.actionRow}>
          {!application && !approvedLoan && <Btn title="Apply for Loan" onPress={() => goTo('apply')} />}
          {approvedLoan && <Btn title="View Loan" onPress={() => goTo('loan-details')} />}
          {application && !approvedLoan && <Btn title="Application Status" onPress={() => goTo('application-status')} />}
          {(application || approvedLoan) && <Btn title="Apply Again" onPress={() => goTo('apply')} variant="secondary" />}
        </View>

        {approvedLoan && (
          <Pressable style={({ pressed }) => [sh.ghostRow, pressed && { backgroundColor: p.greenPale }]} onPress={() => goTo('payments')}>
            <AppIcon name="file" size={16} color={p.navy} />
            <Text style={[sh.ghostRowText, { color: p.navy }]}>Payment History</Text>
            <AppIcon name="arrow" size={15} color={p.muted} />
          </Pressable>
        )}

        {/* Application summary */}
        <View style={sh.sectionRow}>
          <Text style={[sh.sectionLabel, { color: p.navy }]}>Application</Text>
          {application && (
            <Pressable onPress={() => goTo('application-status')}><Text style={[sh.sectionLink, { color: p.greenDark }]}>View</Text></Pressable>
          )}
        </View>
        {application ? (
          <Pressable style={({ pressed }) => [sh.summaryCard, { backgroundColor: p.surface, borderColor: p.line }, pressed && sh.cardPressed]} onPress={() => goTo('application-status')}>
            <View style={[sh.summaryIcon, { backgroundColor: p.greenPale }]}><AppIcon name="file" size={17} color={p.green} /></View>
            <View style={sh.summaryCopy}>
              <Text style={[sh.summaryTitle, { color: p.text }]}>Application #{application.id}</Text>
              <Text style={[sh.summarySub, { color: p.muted }]}>Requested {money(application.amount)} · {application.term ?? 3} months</Text>
            </View>
            <StatusBadge status={applicationDecision ?? application.status} />
          </Pressable>
        ) : (
          <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.green }]}>
            <Text style={[sh.infoBoxTitle, { color: p.navy }]}>No application yet</Text>
            <Text style={[sh.infoBoxBody, { color: p.muted }]}>Choose an amount and repayment term with Apply for Loan. Your application will be sent to the administrator for review.</Text>
          </View>
        )}

        {/* Review prompt */}
        <View style={sh.sectionRow}>
          <Text style={[sh.sectionLabel, { color: p.navy }]}>Rate Your Experience</Text>
        </View>
        {reviewSubmitted ? (
          <View style={[sh.reviewSubmittedCard, { backgroundColor: p.greenPale, borderColor: p.greenMid }]}>
            <AppIcon name="check" size={18} color={p.greenDark} />
            <Text style={[sh.reviewSubmittedText, { color: p.greenDark }]}>Thank you for your feedback!</Text>
          </View>
        ) : (
          <Pressable
            style={({ pressed }) => [sh.reviewPromptCard, { backgroundColor: p.surface, borderColor: p.line }, pressed && sh.cardPressed]}
            onPress={() => goTo('review')}
          >
            <View style={[sh.reviewPromptIcon, { backgroundColor: p.amberPale }]}>
              <Svg width={20} height={20} viewBox="0 0 24 24">
                <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  stroke={p.amber} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </Svg>
            </View>
            <View style={sh.reviewPromptCopy}>
              <Text style={[sh.reviewPromptTitle, { color: p.text }]}>How was your experience?</Text>
              <Text style={[sh.reviewPromptSub, { color: p.muted }]}>Tap to leave a rating and comment.</Text>
            </View>
            <AppIcon name="arrow" size={16} color={p.muted} />
          </Pressable>
        )}
      </ScrollView>
      <NavBar role="borrower" screen={screen} onSelect={goTo} />
    </>
    );
  };

  // ── Apply ────────────────────────────────────────────────────────────────────
  const renderApply = () => {
    const amt = Number(loanAmount.replace(/,/g, '')) || 0;
    return (
      <>
        <Header bell={false} />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]} keyboardShouldPersistTaps="handled">
          <PageTitle title="Apply for a Loan" subtitle="Choose product, amount, and term." onBack={() => goTo('dashboard')} />

          <Text style={[sh.fieldLabel, { color: p.text }]}>Loan Product</Text>
          <View style={sh.choiceList}>
            {loanProducts.map((prod) => (
              <Pressable key={prod.id} onPress={() => setLoanProduct(prod.name)}
                style={[sh.choiceRow, { backgroundColor: p.surface, borderColor: loanProduct === prod.name ? p.green : p.line },
                  loanProduct === prod.name && { backgroundColor: p.greenPale }]}>
                <View style={[sh.radio, { borderColor: loanProduct === prod.name ? p.green : p.mutedLight }, loanProduct === prod.name && sh.radioActive]}>
                  {loanProduct === prod.name && <View style={[sh.radioDot, { backgroundColor: p.green }]} />}
                </View>
                <View style={sh.choiceCopy}>
                  <Text style={[sh.choiceTitle, { color: p.text }]}>{prod.name}</Text>
                  <Text style={[sh.choiceNote, { color: p.muted }]}>{prod.description} · {prod.interestRate}% interest · up to {money(prod.maxAmount)}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Text style={[sh.fieldLabel, { color: p.text }]}>Amount</Text>
          <View style={[sh.amountRow, { backgroundColor: p.surface, borderColor: p.line }]}>
            <Text style={[sh.currencySign, { color: p.greenDark }]}>₱</Text>
            <TextInput
              value={loanAmount}
              onChangeText={setLoanAmount}
              keyboardType="numeric"
              style={[sh.amountInput, { color: p.navy }]}
              placeholder="10,000"
              placeholderTextColor={p.mutedLight}
            />
          </View>
          <View style={sh.presets}>
            {[5000, 10000, 20000, 50000].map((preset) => (
              <Pressable key={preset} onPress={() => setLoanAmount(String(preset))}
                style={[sh.preset, { backgroundColor: amt === preset ? p.greenPale : p.surface, borderColor: amt === preset ? p.green : p.line }]}>
                <Text style={[sh.presetText, { color: amt === preset ? p.greenDark : p.muted }]}>{money(preset)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[sh.fieldLabel, { color: p.text }]}>Repayment Term</Text>
          <View style={sh.termRow}>
            {[3, 6, 12].map((t) => (
              <Pressable key={t} onPress={() => setLoanTerm(t)}
                style={[sh.termChip, { backgroundColor: loanTerm === t ? p.greenPale : p.surface, borderColor: loanTerm === t ? p.green : p.line }]}>
                <Text style={[sh.termChipNum, { color: loanTerm === t ? p.greenDark : p.text }]}>{t}</Text>
                <Text style={[sh.termChipLabel, { color: loanTerm === t ? p.greenDark : p.muted }]}>mo</Text>
              </Pressable>
            ))}
          </View>

          <Text style={[sh.fieldLabel, { color: p.text }]}>Purpose</Text>
          <View style={sh.pillRow}>
            {['Emergency', 'Education', 'Medical', 'Business', 'Other'].map((purpose) => (
              <Pressable key={purpose} onPress={() => { setLoanPurpose(purpose); }}
                style={[sh.pill, { backgroundColor: loanPurpose === purpose ? p.greenPale : p.surface, borderColor: loanPurpose === purpose ? p.green : p.line }]}>
                <Text style={[sh.pillText, { color: loanPurpose === purpose ? p.greenDark : p.muted, fontWeight: loanPurpose === purpose ? '700' : '600' }]}>{purpose}</Text>
              </Pressable>
            ))}
          </View>
          {/* Custom purpose input shown when Other is selected or user types a custom reason */}
          <View style={[sh.fieldWrap, { marginTop: 2 }]}>
            <Text style={[sh.fieldLabel, { color: p.text }]}>
              Specify reason <Text style={{ color: p.mutedLight, fontWeight: '400' }}>(optional – add your own)</Text>
            </Text>
            <View style={[sh.inputWrap, { backgroundColor: p.surface, borderColor: p.line }]}>
              <TextInput
                value={loanPurpose === 'Emergency' || loanPurpose === 'Education' || loanPurpose === 'Medical' || loanPurpose === 'Business' || loanPurpose === 'Other' ? '' : loanPurpose}
                onChangeText={(v) => { if (v.trim()) setLoanPurpose(v); }}
                placeholder="e.g. Home renovation, Car repair…"
                placeholderTextColor={p.mutedLight}
                style={[sh.inputInner, { color: p.text }]}
                maxLength={80}
              />
            </View>
          </View>

          <View style={[sh.estimateCard, { backgroundColor: p.greenPale }]}>
            <Text style={[sh.estimateLabel, { color: p.greenDark }]}>LOAN BREAKDOWN</Text>
            <Text style={[sh.estimateAmount, { color: p.navy }]}>{monthlyEst ? money(monthlyEst) : '—'}</Text>
            <Text style={[{ color: p.greenDark, fontSize: 11, fontWeight: '700', marginBottom: 10 }]}>/ month</Text>
            {monthlyEst ? (
              <View style={{ gap: 6 }}>
                {[
                  ['Principal', money(Number(loanAmount.replace(/,/g, '')) || 0)],
                  ['Interest (10%)', money(Math.round((Number(loanAmount.replace(/,/g, '')) || 0) * 0.1))],
                  ['Total Payable', money(Math.round((Number(loanAmount.replace(/,/g, '')) || 0) * 1.1))],
                  ['Term', `${loanTerm} month${loanTerm !== 1 ? 's' : ''}`],
                  ['Monthly Payment', money(monthlyEst)],
                ].map(([label, val]) => (
                  <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: p.muted, fontSize: 12 }}>{label}</Text>
                    <Text style={{ color: p.navy, fontSize: 12, fontWeight: '700' }}>{val}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            {/* Custom amount notice */}
            {[5000, 10000, 20000, 50000].includes(Number(loanAmount.replace(/,/g, ''))) === false && Number(loanAmount.replace(/,/g, '')) >= 1000 ? (
              <View style={{ marginTop: 10, backgroundColor: p.amberPale, borderRadius: 8, padding: 10 }}>
                <Text style={{ color: p.amber, fontSize: 12, fontWeight: '700', marginBottom: 2 }}>Custom Amount</Text>
                <Text style={{ color: p.muted, fontSize: 11, lineHeight: 16 }}>
                  This amount is outside the standard presets. The interest rate will be reviewed and set by the lending officer before approval.
                </Text>
              </View>
            ) : null}
            <Text style={[sh.estimateNote, { color: p.muted, marginTop: 10 }]}>
              {monthlyEst ? 'Illustration only. Final terms set after review.' : 'Enter an amount to see the breakdown.'}
            </Text>
          </View>

          {formError ? <View style={[sh.errorBox, { backgroundColor: p.redPale }]}><Text style={[sh.errorText, { color: p.red }]}>{formError}</Text></View> : null}
          <Btn title="Submit Application" onPress={submitApplication} />
        </ScrollView>
        <NavBar role="borrower" screen={screen} onSelect={goTo} />
      </>
    );
  };

  // ── Application Status ───────────────────────────────────────────────────────
  const renderAppStatus = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
        <PageTitle title="Application Status" subtitle="Track your application progress." onBack={() => goTo('dashboard')} />

        {application ? (
          <>
            <View style={[sh.statusHero, { backgroundColor: p.greenPale }]}>
              <View style={[sh.statusIcon, { backgroundColor: p.surface }]}>
                <AppIcon name={applicationDecision === 'APPROVED' ? 'check' : 'clock'} size={24} color={p.green} />
              </View>
              <Text style={[sh.statusLabel, { color: p.greenDark }]}>{applicationDecision ?? application.status}</Text>
              <Text style={[sh.statusDesc, { color: p.text }]}>
                {applicationDecision === 'APPROVED' ? 'Your application has been approved and your loan is now active.' :
                  applicationDecision === 'REJECTED' ? 'Please contact the lending team for next steps.' :
                    'Our team is currently reviewing your application.'}
              </Text>
            </View>

            <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
              <DetailRow label="Application #" value={application.id} />
              <DetailRow label="Loan product" value={application.product} />
              <DetailRow label="Requested amount" value={money(application.amount)} />
              <DetailRow label="Repayment term" value={`${application.term ?? 3} Months`} />
              <DetailRow label="Submitted" value={todayLong} />
              <DetailRow label="Status" value={applicationDecision ?? application.status} last />
            </View>

            <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.green }]}>
              <Text style={[sh.infoBoxTitle, { color: p.navy }]}>What happens next?</Text>
              <Text style={[sh.infoBoxBody, { color: p.muted }]}>You&apos;ll be notified when your status changes. Keep your profile and supporting documents up to date.</Text>
            </View>

            {applicationDecision === 'APPROVED' && <Btn title="View Approved Loan" onPress={() => goTo('loan-details')} />}
          </>
        ) : (
          <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.green }]}>
            <Text style={[sh.infoBoxTitle, { color: p.navy }]}>No application submitted</Text>
            <Text style={[sh.infoBoxBody, { color: p.muted }]}>You have no loan balance. Choose the amount and repayment term you need, then submit it for administrator review.</Text>
            <Btn title="Apply for Loan" onPress={() => goTo('apply')} />
          </View>
        )}
      </ScrollView>
      <NavBar role="borrower" screen={screen} onSelect={goTo} />
    </>
  );

  // ── Loan Details ─────────────────────────────────────────────────────────────
  const renderLoanDetails = () => {
    if (!approvedLoan) {
      return (
        <>
          <Header />
          <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
            <PageTitle title="Loan Details" subtitle="No approved loan yet" onBack={() => goTo('dashboard')} />
            <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.green }]}>
              <Text style={[sh.infoBoxTitle, { color: p.navy }]}>No loan available</Text>
              <Text style={[sh.infoBoxBody, { color: p.muted }]}>Your account is currently at zero balance. Once an administrator approves your application, the approved amount and repayment schedule will appear here.</Text>
            </View>
          </ScrollView>
          <NavBar role="borrower" screen={screen} onSelect={goTo} />
        </>
      );
    }

    const totalDue = approvedLoan.amount + approvedLoan.interest;
    const paidPercent = Math.round(((totalDue - loanRemaining) / totalDue) * 100);

    const submitPayment = () => {
      const amt = Number(payAmount.replace(/,/g, ''));
      if (!amt || amt <= 0) { setPayError('Enter a valid amount.'); return; }
      if (amt > loanRemaining) { setPayError(`Amount cannot exceed the remaining balance of ${money(loanRemaining)}.`); return; }
      if (!payRef.trim()) { setPayError('Enter a reference number.'); return; }
      setLoanRemaining((prev) => Math.max(0, prev - amt));
      setPaymentSubmitted(true);
      setShowPayModal(false);
      setPayAmount('');
      setPayRef('');
      setPayError('');
    };

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
          <PageTitle title="Loan Details" subtitle={`${application?.product ?? 'Loan'} · #${approvedLoan.id}`} onBack={() => goTo('dashboard')} />

          <View style={sh.loanHero}>
            <View style={sh.loanHeroTop}>
              <Text style={sh.heroEyebrow}>LOAN AMOUNT</Text>
              <StatusBadge status={loanRemaining === 0 ? 'PAID' : 'ACTIVE'} />
            </View>
            <Text style={sh.loanheroAmount}>{money(approvedLoan.amount)}</Text>
            <Text style={sh.loanHeroSub}>Remaining balance {money(loanRemaining)}</Text>
            <View style={sh.progressTrack}>
              <View style={[sh.progressFill, { width: `${Math.min(100, Math.max(0, paidPercent))}%` }]} />
            </View>
            <View style={sh.progressLabels}>
              <Text style={sh.progressLabel}>{paidPercent}% paid</Text>
              <Text style={sh.progressLabel}>Released {approvedLoan.approvedAt ?? loanApprovedDate}</Text>
            </View>
          </View>

          <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
            <DetailRow label="Principal" value={money(approvedLoan.amount)} />
            <DetailRow label="Interest (10%)" value={money(approvedLoan.interest)} />
            <DetailRow label="Total Payable" value={money(totalDue)} />
            <DetailRow label="Remaining" value={money(loanRemaining)} />
            <DetailRow label="Term" value={`${approvedLoan.term} Months`} />
            <DetailRow label="Status" value={loanRemaining === 0 ? 'PAID' : 'ACTIVE'} last />
          </View>

          {loanRemaining > 0 && (
            <View style={[sh.payNowCard, { backgroundColor: p.surface, borderColor: p.line }]}>
              <View style={sh.payNowLeft}>
                <Text style={[sh.payNowLabel, { color: p.muted }]}>NEXT INSTALLMENT</Text>
                <Text style={[sh.payNowAmount, { color: p.navy }]}>{money(Math.min(loanRemaining, Math.ceil(totalDue / approvedLoan.term)))}</Text>
                <Text style={[sh.payNowDue, { color: p.muted }]}>Due end of month</Text>
              </View>
              <View style={sh.payNowActions}>
                <Btn
                  title="Pay Now"
                  onPress={() => { setPayAmount(String(Math.min(loanRemaining, Math.ceil(totalDue / approvedLoan.term)))); setShowPayModal(true); }}
                  size="sm"
                />
                <Pressable
                  style={({ pressed }) => [sh.advancePayBtn, { borderColor: p.green }, pressed && { opacity: 0.7 }]}
                  onPress={() => { setPayAmount(''); setShowPayModal(true); }}
                >
                  <Text style={[sh.advancePayText, { color: p.greenDark }]}>Advance Pay</Text>
                </Pressable>
              </View>
            </View>
          )}

          {paymentSubmitted && (
            <View style={[sh.successBanner, { backgroundColor: p.greenPale }]}>
              <AppIcon name="check" size={16} color={p.greenDark} />
              <Text style={[sh.successText, { color: p.greenDark }]}>Payment submitted for verification.</Text>
            </View>
          )}

          <Btn title="View Payment Schedule" onPress={() => goTo('schedule')} />
          <Btn title="Payment History" onPress={() => goTo('payments')} variant="secondary" />
        </ScrollView>
        <NavBar role="borrower" screen={screen} onSelect={goTo} />

        {/* ── Payment modal ───────────────────────────────────────────── */}
        <Modal visible={showPayModal} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setShowPayModal(false)}>
          <Pressable style={sh.modalBackdrop} onPress={() => setShowPayModal(false)}>
            <Pressable style={[sh.payModalCard, { backgroundColor: p.surface }]} onPress={() => {}}>
              <Text style={[sh.payModalTitle, { color: p.navy }]}>Submit Payment</Text>
              <Text style={[sh.payModalSub, { color: p.muted }]}>Remaining balance: {money(loanRemaining)}</Text>

              {/* Amount */}
              <View style={sh.fieldWrap}>
                <Text style={[sh.fieldLabel, { color: p.text }]}>Amount (₱)</Text>
                <View style={[sh.amountRow, { backgroundColor: p.background, borderColor: p.line }]}>
                  <Text style={[sh.currencySign, { color: p.greenDark }]}>₱</Text>
                  <TextInput
                    value={payAmount}
                    onChangeText={setPayAmount}
                    keyboardType="numeric"
                    placeholder="Enter amount"
                    placeholderTextColor={p.mutedLight}
                    style={[sh.amountInput, { color: p.navy }]}
                  />
                </View>
                {/* Quick presets */}
                <View style={sh.presets}>
                  {[1100, 2000, 3667, loanRemaining].filter((v, i, a) => a.indexOf(v) === i).map((preset) => (
                    <Pressable key={preset} onPress={() => setPayAmount(String(preset))}
                      style={[sh.preset, Number(payAmount) === preset && sh.presetActive, { borderColor: p.line, backgroundColor: p.surface }]}>
                      <Text style={[sh.presetText, Number(payAmount) === preset && sh.presetTextActive, { color: p.muted }]}>{money(preset)}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Payment method */}
              <View style={sh.fieldWrap}>
                <Text style={[sh.fieldLabel, { color: p.text }]}>Payment Method</Text>
                <View style={sh.pillRow}>
                  {['GCash', 'Bank Transfer', 'Over the Counter'].map((m) => (
                    <Pressable key={m} onPress={() => setPayMethod(m)}
                      style={[sh.pill, payMethod === m && sh.pillActive, { borderColor: payMethod === m ? p.green : p.line, backgroundColor: payMethod === m ? p.greenPale : p.surface }]}>
                      <Text style={[sh.pillText, { color: payMethod === m ? p.greenDark : p.muted }]}>{m}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Reference number */}
              <View style={sh.fieldWrap}>
                <Text style={[sh.fieldLabel, { color: p.text }]}>Reference Number</Text>
                <View style={[sh.inputWrap, { backgroundColor: p.background, borderColor: p.line }]}>
                  <TextInput
                    value={payRef}
                    onChangeText={setPayRef}
                    placeholder="e.g. GC-123456789"
                    placeholderTextColor={p.mutedLight}
                    autoCapitalize="characters"
                    style={[sh.inputInner, { color: p.text }]}
                  />
                </View>
              </View>

              {payError ? <View style={[sh.errorBox, { backgroundColor: p.redPale }]}><Text style={[sh.errorText, { color: p.red }]}>{payError}</Text></View> : null}

              <View style={sh.modalActions}>
                <Pressable style={({ pressed }) => [sh.modalBtnCancel, { backgroundColor: p.background, borderColor: p.line }, pressed && { opacity: 0.7 }]}
                  onPress={() => { setShowPayModal(false); setPayError(''); }}>
                  <Text style={[sh.modalBtnCancelText, { color: p.text }]}>Cancel</Text>
                </Pressable>
                <Pressable style={({ pressed }) => [sh.modalBtnConfirm, pressed && sh.modalBtnConfirmPressed]}
                  onPress={submitPayment}>
                  <Text style={sh.modalBtnConfirmText}>Submit</Text>
                </Pressable>
              </View>
            </Pressable>
          </Pressable>
        </Modal>
      </>
    );
  };

  // ── Schedule ─────────────────────────────────────────────────────────────────
  const renderSchedule = () => {
    if (!approvedLoan) {
      return (
        <>
          <Header />
          <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
            <PageTitle title="Payment Schedule" subtitle="No approved loan" onBack={() => goTo('dashboard')} />
            <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.green }]}>
              <Text style={[sh.infoBoxTitle, { color: p.navy }]}>No payment schedule yet</Text>
              <Text style={[sh.infoBoxBody, { color: p.muted }]}>Your approved loan details will appear here after the admin accepts your application.</Text>
            </View>
          </ScrollView>
          <NavBar role="borrower" screen={screen} onSelect={goTo} />
        </>
      );
    }

    const totalDue = approvedLoan.amount + approvedLoan.interest;
    const baseInstallment = Math.floor(totalDue / approvedLoan.term);
    const remainder = totalDue % approvedLoan.term;
    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
          <PageTitle title="Payment Schedule" subtitle={`Loan #${approvedLoan.id} · ${approvedLoan.term} installments`} onBack={() => goTo('loan-details')} />

          <View style={[sh.scheduleBanner, { backgroundColor: p.greenPale }]}>
            <Text style={[sh.eyebrowSmall, { color: p.muted }]}>NEXT DUE</Text>
            {(() => {
              const nextDue = new Date(approvedLoan.approvedAt ? new Date(approvedLoan.approvedAt) : now);
              nextDue.setMonth(nextDue.getMonth() + 1);
              return <Text style={[sh.scheduleDueDate, { color: p.navy }]}>{nextDue.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</Text>;
            })()}
            <Text style={[sh.scheduleDueSub, { color: p.muted }]}>Estimated amount · {money(baseInstallment + (remainder > 0 ? 1 : 0))}</Text>
          </View>

          <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
            {Array.from({ length: approvedLoan.term }, (_, idx) => idx + 1).map((item, i) => {
              // Calculate actual due date for each installment
              const dueDate = new Date(approvedLoan.approvedAt ? new Date(approvedLoan.approvedAt) : now);
              dueDate.setMonth(dueDate.getMonth() + item);
              const dueDateStr = dueDate.toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' });
              return (
              <View key={item} style={[sh.installRow, i === approvedLoan.term - 1 && sh.installRowLast]}>
                <View style={sh.installNum}>
                  <Text style={sh.installNumText}>{String(item).padStart(2, '0')}</Text>
                </View>
                <View style={sh.installCopy}>
                  <Text style={[sh.installTitle, { color: p.text }]}>Installment {item}</Text>
                  <Text style={[sh.installDate, { color: p.muted }]}>Due {dueDateStr}</Text>
                </View>
                <View style={sh.installRight}>
                  <Text style={[sh.installAmount, { color: p.navy }]}>{money(baseInstallment + (item <= remainder ? 1 : 0))}</Text>
                  <Text style={[sh.installStatus, sh.pendingText]}>PENDING</Text>
                </View>
              </View>
              );
            })}
          </View>

          <View style={[sh.callout, { backgroundColor: p.surface, borderColor: p.line }]}>
            <Text style={[sh.calloutTitle, { color: p.navy }]}>Record a payment</Text>
            <Text style={[sh.calloutBody, { color: p.muted }]}>Submit a payment reference for lender verification.</Text>
            <Btn title="Submit Payment" onPress={() => goTo('payments')} />
          </View>
        </ScrollView>
        <NavBar role="borrower" screen={screen} onSelect={goTo} />
      </>
    );
  };

  // ── Payments ─────────────────────────────────────────────────────────────────
  const renderPayments = () => {
    if (!approvedLoan) {
      return (
        <>
          <Header />
          <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
            <PageTitle title="Payment History" subtitle="No payments yet" onBack={() => goTo('dashboard')} />
            <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.green }]}>
              <Text style={[sh.infoBoxTitle, { color: p.navy }]}>No payments recorded</Text>
              <Text style={[sh.infoBoxBody, { color: p.muted }]}>When your loan is approved, your payment submissions and completed transactions will be listed here.</Text>
            </View>
          </ScrollView>
          <NavBar role="borrower" screen={screen} onSelect={goTo} />
        </>
      );
    }

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
          <PageTitle title="Payment History" subtitle="Your submitted and completed payments." onBack={() => goTo('dashboard')} />

          {paymentSubmitted && (
            <View style={[sh.successBanner, { backgroundColor: p.greenPale }]}>
              <AppIcon name="check" size={16} color={p.greenDark} />
              <Text style={[sh.successText, { color: p.greenDark }]}>Payment submitted for lender verification.</Text>
            </View>
          )}

          <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
            {[
              { date: todayLong, amount: Math.ceil((approvedLoan.amount + approvedLoan.interest) / approvedLoan.term), status: paymentSubmitted ? 'PENDING VERIFICATION' : 'DUE', method: paymentSubmitted ? 'GCash · Ref. LM-10025' : 'Not submitted' },
            ].map((entry, i, arr) => (
              <View key={entry.date} style={[sh.historyRow, i === arr.length - 1 && sh.historyRowLast]}>
                <View style={[sh.historyDot, entry.status === 'PAID' ? sh.historyDotPaid : sh.historyDotPending]}>
                  <AppIcon name={entry.status === 'PAID' ? 'check' : 'clock'} size={14}
                    color={entry.status === 'PAID' ? p.greenDark : p.amber} />
                </View>
                <View style={sh.historyCopy}>
                  <Text style={[sh.historyDate, { color: p.text }]}>{entry.date}</Text>
                  <Text style={[sh.historyMethod, { color: p.muted }]}>{entry.method}</Text>
                </View>
                <View style={sh.historyRight}>
                  <Text style={[sh.historyAmount, { color: p.navy }]}>{money(entry.amount)}</Text>
                  <Text style={[sh.historyStatus, entry.status === 'PAID' ? sh.paidText : sh.pendingText]}>
                    {entry.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {!paymentSubmitted && (
            <View style={[sh.callout, { backgroundColor: p.surface, borderColor: p.line }]}>
              <Text style={[sh.calloutTitle, { color: p.navy }]}>Submit a payment</Text>
              <Text style={[sh.calloutBody, { color: p.muted }]}>Demo flow only — no funds are transferred.</Text>
              <Btn title="Submit Payment" onPress={() => setPaymentSubmitted(true)} />
            </View>
          )}
        </ScrollView>
        <NavBar role="borrower" screen={screen} onSelect={goTo} />
      </>
    );
  };

  // ── Notifications ────────────────────────────────────────────────────────────
  const renderNotifications = () => {
    const unreadCount = notifications.filter((n) => !n.read).length;
    const markRead = (id: string) =>
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    const deleteOne = (id: string) =>
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    const deleteAll = () => setNotifications([]);

    return (
      <>
        <Header bell={false} />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
          <View style={sh.pageTitleRow}>
            <Pressable onPress={() => goTo(role === 'admin' ? 'admin-dashboard' : 'dashboard')} style={[sh.backBtn, { marginRight: 10 }]}>
              <AppIcon name="back" size={20} color={p.navy} />
            </Pressable>
            <View style={sh.pageTitleCopy}>
              <Text style={[sh.pageTitleText, { color: p.navy }]}>Notifications</Text>
              {unreadCount > 0 && (
                <Text style={[sh.pageTitleSub, { color: p.muted }]}>{unreadCount} unread</Text>
              )}
            </View>
            {notifications.length > 0 && (
              <Pressable
                onPress={deleteAll}
                style={({ pressed }) => [sh.notifDeleteAllBtn, { borderColor: p.red, backgroundColor: pressed ? p.redPale : 'transparent' }]}
              >
                <Text style={[sh.notifDeleteAllText, { color: p.red }]}>Delete All</Text>
              </Pressable>
            )}
          </View>

          {notifications.length === 0 ? (
            <View style={sh.reviewEmpty}>
              <Text style={[sh.reviewEmptyText, { color: p.muted }]}>No notifications.</Text>
            </View>
          ) : (
            notifications.map((item, i) => (
              <Pressable
                key={item.id}
                style={[sh.notifRow, i === notifications.length - 1 && sh.notifRowLast, { borderBottomColor: p.line, backgroundColor: item.read ? p.background : p.surface }]}
                onPress={() => markRead(item.id)}
              >
                <View style={[sh.notifIcon, { backgroundColor: item.read ? p.background : p.greenPale }]}>
                  <AppIcon name={item.icon} size={17} color={p.green} />
                </View>
                <View style={sh.notifCopy}>
                  <Text style={[sh.notifTitle, { color: p.text, fontWeight: item.read ? '500' : '700' }]}>{item.title}</Text>
                  <Text style={[sh.notifDetail, { color: p.muted }]}>{item.detail}</Text>
                </View>
                {!item.read && <View style={[sh.notifUnread, { backgroundColor: p.green }]} />}
                <Pressable
                  onPress={() => deleteOne(item.id)}
                  style={({ pressed }) => [sh.notifDeleteBtn, pressed && { opacity: 0.6 }]}
                  hitSlop={8}
                >
                  <Svg width={14} height={14} viewBox="0 0 24 24">
                    <Path d="m18 6-12 12M6 6l12 12"
                      stroke={p.muted} strokeWidth="2" strokeLinecap="round" fill="none" />
                  </Svg>
                </Pressable>
              </Pressable>
            ))
          )}
        </ScrollView>
        {role === 'borrower' && <NavBar role="borrower" screen={screen} onSelect={goTo} />}
      </>
    );
  };

  // ── Admin Dashboard ───────────────────────────────────────────────────────────
  const renderAdminDashboard = () => {
    const totalBorrowers = registeredBorrowers.length;
    const activeLoans = adminLoans.filter((l) => l.status === 'ACTIVE').length;
    const pendingApps = adminApps.filter((a) => a.status === 'PENDING' || a.status === 'UNDER REVIEW').length;
    const overdueLoans = adminLoans.filter((l) => l.remaining > 0 && l.status === 'ACTIVE').length;
    const totalReleased = adminLoans.reduce((t, l) => t + l.amount, 0);
    const totalOutstanding = adminLoans.reduce((t, l) => t + l.remaining, 0);

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
          <View style={sh.adminHead}>
            <Text style={[sh.adminTitle, { color: p.navy }]}>Portfolio Overview</Text>
            <Text style={[sh.adminDate, { color: p.muted }]}>{todayDisplay}</Text>
          </View>

          <View style={sh.statsGrid}>
            {[
              ['Borrowers', String(totalBorrowers), 'green'],
              ['Active Loans', String(activeLoans), 'navy'],
              ['Pending', String(pendingApps), 'green'],
              ['Overdue', String(overdueLoans), 'amber'],
            ].map(([label, val, accent]) => (
              <View key={label} style={[sh.statCard, { backgroundColor: p.surface, borderColor: p.line }]}>
                <View style={[sh.statBar, accent === 'navy' && sh.statBarNavy, accent === 'amber' && sh.statBarAmber]} />
                <Text style={[sh.statLabel, { color: p.muted }]}>{label}</Text>
                <Text style={[sh.statVal, { color: p.navy }]}>{val}</Text>
              </View>
            ))}
          </View>

          <View style={sh.portfolioCard}>
            <View style={sh.portfolioHalf}>
              <Text style={[sh.eyebrowSmall, { color: p.muted }]}>TOTAL RELEASED</Text>
              <Text style={sh.portfolioAmt}>{money(totalReleased)}</Text>
            </View>
            <View style={sh.portfolioDivider} />
            <View style={sh.portfolioHalf}>
              <Text style={[sh.eyebrowSmall, { color: p.muted }]}>OUTSTANDING</Text>
              <Text style={sh.portfolioOutstanding}>{money(totalOutstanding)}</Text>
            </View>
          </View>

          <View style={sh.sectionRow}>
            <Text style={[sh.sectionLabel, { color: p.navy }]}>Needs Review</Text>
            <Pressable onPress={() => goTo('admin-applications')}><Text style={[sh.sectionLink, { color: p.greenDark }]}>See all</Text></Pressable>
          </View>
          {adminApps.filter((a) => a.status === 'PENDING' || a.status === 'UNDER REVIEW').slice(0, 2).map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [sh.adminListRow, pressed && sh.cardPressed]}
              onPress={() => { setSelectedApp(item); goTo('admin-applications'); }}
            >
              <Avatar name={item.borrower} />
              <View style={sh.adminListCopy}>
                <Text style={[sh.adminListName, { color: p.text }]}>#{item.id} · {item.borrower}</Text>
                <Text style={[sh.adminListMeta, { color: p.muted }]}>{money(item.amount)} · {item.product}</Text>
              </View>
              <StatusBadge status={item.status} />
            </Pressable>
          ))}

          <View style={sh.sectionRow}>
            <Text style={[sh.sectionLabel, { color: p.navy }]}>Quick Access</Text>
          </View>
          <View style={[sh.quickGrid, { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }]}>
            {([
              ['file', 'Applications', 'admin-applications'],
              ['users', 'Borrowers', 'admin-borrowers'],
              ['wallet', 'Loans', 'admin-loans'],
              ['calendar', 'Payments', 'admin-payments'],
              ['star', 'Loan Products', 'admin-loan-products'],
              ['shield', 'Reviews', 'admin-reviews'],
            ] as [IconName, string, Screen][]).map(([icon, label, dest]) => (
              <Pressable key={label} onPress={() => goTo(dest)} style={({ pressed }) => [sh.quickCard, { backgroundColor: p.surface, borderColor: p.line, width: '30.5%' }, pressed && sh.cardPressed]}>
                <View style={[sh.quickIcon, { backgroundColor: p.greenPale }]}><AppIcon name={icon} size={19} color={p.green} /></View>
                <Text style={[sh.quickLabel, { color: p.navy }]}>{label}</Text>
              </Pressable>
            ))}
          </View>

          {/* ── Reviews summary ────────────────────────────────────────── */}
          <View style={sh.sectionRow}>
            <Text style={[sh.sectionLabel, { color: p.navy }]}>Reviews</Text>
            <Pressable onPress={() => goTo('admin-reviews')}><Text style={[sh.sectionLink, { color: p.greenDark }]}>See all</Text></Pressable>
          </View>
          <Pressable
            style={({ pressed }) => [sh.reviewSummaryCard, { backgroundColor: p.surface, borderColor: p.line }, pressed && sh.cardPressed]}
            onPress={() => goTo('admin-reviews')}
          >
            <View style={sh.reviewSummaryLeft}>
              <Text style={[sh.reviewSummaryScore, { color: p.navy }]}>
                {reviews.length
                  ? (reviews.reduce((s, r) => s + r.stars, 0) / reviews.length).toFixed(1)
                  : '—'}
              </Text>
              <View style={sh.reviewSummaryStars}>
                {[1, 2, 3, 4, 5].map((s) => {
                  const avg = reviews.length ? reviews.reduce((a, r) => a + r.stars, 0) / reviews.length : 0;
                  return (
                    <Svg key={s} width={15} height={15} viewBox="0 0 24 24">
                      <Path
                        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                        stroke={s <= Math.round(avg) ? '#F4B400' : p.line}
                        strokeWidth="1.5" strokeLinejoin="round"
                        fill={s <= Math.round(avg) ? '#F4B400' : 'transparent'}
                      />
                    </Svg>
                  );
                })}
              </View>
            </View>
            <View style={sh.reviewSummaryMid}>
              <Text style={[sh.reviewSummaryTotal, { color: p.text }]}>{reviews.length} rating{reviews.length !== 1 ? 's' : ''}</Text>
              <Text style={[sh.reviewSummarySub, { color: p.muted }]}>Tap to view all comments</Text>
            </View>
            <AppIcon name="arrow" size={16} color={p.muted} />
          </Pressable>

          {/* ── Upcoming Payments ──────────────────────────────────────── */}
          <View style={sh.sectionRow}>
            <Text style={[sh.sectionLabel, { color: p.navy }]}>Upcoming Payments</Text>
          </View>
          {adminLoans.filter((l) => l.status === 'ACTIVE' && l.remaining > 0).length === 0 ? (
            <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.muted }]}>
              <Text style={[sh.infoBoxBody, { color: p.muted }]}>No upcoming payments.</Text>
            </View>
          ) : (
            <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
              {adminLoans.filter((l) => l.status === 'ACTIVE' && l.remaining > 0).map((loan, i, arr) => {
                const installAmt = Math.ceil((loan.amount + loan.interest) / loan.term);
                return (
                  <View key={loan.id} style={[sh.installRow, i === arr.length - 1 && sh.installRowLast, { borderBottomColor: p.line }]}>
                    <View style={[sh.installNum, { backgroundColor: p.greenPale }]}>
                      <Text style={[sh.installNumText, { color: p.greenDark }]}>{String(i + 1).padStart(2, '0')}</Text>
                    </View>
                    <View style={sh.installCopy}>
                      <Text style={[sh.installTitle, { color: p.text }]}>{loan.borrower}</Text>
                      <Text style={[sh.installDate, { color: p.muted }]}>Loan #{loan.id} · {loan.term} months</Text>
                    </View>
                    <View style={sh.installRight}>
                      <Text style={[sh.installAmount, { color: p.navy }]}>{money(installAmt)}</Text>
                      <Text style={[sh.installStatus, sh.pendingText]}>PENDING</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Recent Payment Records ─────────────────────────────────── */}
          <View style={sh.sectionRow}>
            <Text style={[sh.sectionLabel, { color: p.navy }]}>Recent Payments</Text>
          </View>
          {adminLoans.length === 0 ? (
            <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.muted }]}>
              <Text style={[sh.infoBoxBody, { color: p.muted }]}>No payment records yet.</Text>
            </View>
          ) : (
            <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
              {adminLoans.map((loan, i, arr) => (
                <View key={loan.id} style={[sh.historyRow, i === arr.length - 1 && sh.historyRowLast, { borderBottomColor: p.line }]}>
                  <View style={[sh.historyDot, loan.status === 'PAID' ? sh.historyDotPaid : sh.historyDotPending, { backgroundColor: loan.status === 'PAID' ? p.greenPale : p.amberPale }]}>
                    <AppIcon name={loan.status === 'PAID' ? 'check' : 'clock'} size={14}
                      color={loan.status === 'PAID' ? p.greenDark : p.amber} />
                  </View>
                  <View style={sh.historyCopy}>
                    <Text style={[sh.historyDate, { color: p.text }]}>{loan.borrower}</Text>
                    <Text style={[sh.historyMethod, { color: p.muted }]}>Loan #{loan.id} · {money(loan.amount)}</Text>
                  </View>
                  <View style={sh.historyRight}>
                    <Text style={[sh.historyAmount, { color: p.navy }]}>{money(loan.remaining)}</Text>
                    <Text style={[sh.historyStatus, loan.status === 'PAID' ? sh.paidText : sh.pendingText]}>
                      {loan.status === 'PAID' ? 'PAID' : 'ACTIVE'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

        </ScrollView>
        <NavBar role="admin" screen={screen} onSelect={goTo} />
      </>
    );
  };

  // ── Admin Applications ────────────────────────────────────────────────────────
  const renderAdminApplications = () => {
    const pendingCount = adminApps.filter((a) => a.status === 'PENDING' || a.status === 'UNDER REVIEW').length;
    const toggleApp = (item: ApplicationRecord) =>
      setSelectedApp((prev) => (prev?.id === item.id ? null : item));
    const toggleSelectApp = (id: string) =>
      setSelectedAppIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    const deleteSelected = () => {
      setAdminApps((prev) => prev.filter((a) => !selectedAppIds.has(a.id)));
      setSelectedAppIds(new Set());
      setAppSelectMode(false);
    };
    const deleteAll = () => { setAdminApps([]); setSelectedAppIds(new Set()); setAppSelectMode(false); };

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
          <PageTitle title="Applications" subtitle="Review and process requests." />

          {/* Filter bar + select/delete controls */}
          <View style={[sh.filterBar, { borderBottomColor: p.line }]}>
            <Text style={[sh.filterLabel, { color: p.navy }]}>
              {appSelectMode ? `${selectedAppIds.size} selected` : 'ALL APPLICATIONS'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Text style={[sh.filterCount, { color: p.greenDark }]}>{pendingCount} pending</Text>
              {adminApps.length > 0 && (
                <Pressable onPress={() => { setAppSelectMode((v) => !v); setSelectedAppIds(new Set()); }}>
                  <Text style={[sh.filterCount, { color: appSelectMode ? p.muted : p.navy }]}>
                    {appSelectMode ? 'Cancel' : 'Select'}
                  </Text>
                </Pressable>
              )}
              {adminApps.length > 0 && !appSelectMode && (
                <Pressable onPress={deleteAll}>
                  <Text style={[sh.filterCount, { color: p.red }]}>Delete All</Text>
                </Pressable>
              )}
              {appSelectMode && selectedAppIds.size > 0 && (
                <Pressable onPress={deleteSelected}
                  style={{ backgroundColor: p.red, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Delete ({selectedAppIds.size})</Text>
                </Pressable>
              )}
            </View>
          </View>

          {adminApps.length === 0 && (
            <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.muted, marginTop: 12 }]}>
              <Text style={[sh.infoBoxBody, { color: p.muted }]}>No applications yet.</Text>
            </View>
          )}

          {adminApps.map((item) => {
            const isOpen = selectedApp?.id === item.id;
            const isSelected = selectedAppIds.has(item.id);
            return (
              <Pressable
                key={item.id}
                onPress={() => appSelectMode ? toggleSelectApp(item.id) : toggleApp(item)}
                style={[sh.appCard, { backgroundColor: isSelected ? p.greenPale : p.surface, borderColor: isOpen ? p.greenMid : isSelected ? p.green : p.line }]}
              >
                <View style={sh.appCardHeader}>
                  {appSelectMode && (
                    <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: isSelected ? p.green : p.line, backgroundColor: isSelected ? p.green : p.surface, alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                      {isSelected && <AppIcon name="check" size={12} color="#fff" />}
                    </View>
                  )}
                  <Avatar name={item.borrower} />
                  <View style={sh.appCardCopy}>
                    <Text style={[sh.appCardName, { color: p.text }]}>#{item.id} · {item.borrower}</Text>
                    <Text style={[sh.appCardMeta, { color: p.muted }]}>{money(item.amount)} · {item.product}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                  <View style={{ marginLeft: 6, transform: [{ rotate: isOpen && !appSelectMode ? '90deg' : '0deg' }] }}>
                    <AppIcon name="arrow" size={15} color={p.muted} />
                  </View>
                </View>

                {!appSelectMode && (
                  <View style={sh.appCardActions}>
                    <Pressable onPress={() => toggleApp(item)} style={({ pressed }) => [sh.actionBtnBase, sh.actionBtnView, { borderColor: p.line }, pressed && sh.actionBtnViewPressed]}>
                      <Text style={[sh.actionBtnViewText, { color: p.navy }]}>{isOpen ? 'Close' : 'View'}</Text>
                    </Pressable>
                    {(item.status === 'PENDING' || item.status === 'UNDER REVIEW') && (<>
                      <Pressable
                        onPress={() => {
                          if (item.isCustomAmount && !adminAppInterestRates[item.id]) return;
                          decide(item, 'APPROVED');
                        }}
                        style={({ pressed }) => [
                          sh.actionBtnBase, sh.actionBtnApprove,
                          item.isCustomAmount && !adminAppInterestRates[item.id] && { opacity: 0.35 },
                          pressed && sh.actionBtnApprovePressed,
                        ]}
                      >
                        <Text style={sh.actionBtnApproveText}>Approve</Text>
                      </Pressable>
                      <Pressable onPress={() => decide(item, 'REJECTED')} style={({ pressed }) => [sh.actionBtnBase, sh.actionBtnReject, pressed && sh.actionBtnRejectPressed]}>
                        <Text style={sh.actionBtnRejectText}>Reject</Text>
                      </Pressable>
                    </>)}
                  </View>
                )}

                {isOpen && !appSelectMode && (
                  <View style={[sh.appCardExpanded, { borderTopColor: p.line }]}>
                    {/* ── Applicant profile info ── */}
                    <View style={{ marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: p.line }}>
                      <Text style={{ color: p.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 }}>APPLICANT INFO</Text>
                      <DetailRow label="Full Name" value={item.borrower} />
                      {item.email ? <DetailRow label="Email" value={item.email} /> : null}
                      {item.phone ? <DetailRow label="Phone" value={item.phone} /> : null}
                      {item.dateOfBirth ? <DetailRow label="Date of Birth" value={item.dateOfBirth} /> : null}
                      {item.idType ? <DetailRow label="ID Type" value={item.idType} /> : null}
                      {item.idNumber ? <DetailRow label="ID Number" value={item.idNumber} last /> : null}
                    </View>
                    {/* ── Loan details ── */}
                    <Text style={{ color: p.muted, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 8 }}>LOAN DETAILS</Text>
                    <DetailRow label="Requested" value={money(item.amount)} />
                    <DetailRow label="Product" value={item.product} />
                    <DetailRow label="Term" value={`${item.term ?? 3} months`} />
                    {item.submittedAt ? <DetailRow label="Submitted" value={item.submittedAt} /> : null}
                    <DetailRow label="Status" value={item.status} last />

                    {/* ── Custom amount: admin sets interest rate before approving ── */}
                    {item.isCustomAmount && (item.status === 'PENDING' || item.status === 'UNDER REVIEW') && (
                      <View style={{ marginTop: 12, padding: 12, backgroundColor: p.amberPale, borderRadius: 10, borderWidth: 1, borderColor: p.amber }}>
                        <Text style={{ color: p.amber, fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 6 }}>
                          CUSTOM AMOUNT — SET INTEREST RATE
                        </Text>
                        <Text style={{ color: p.muted, fontSize: 12, marginBottom: 10, lineHeight: 17 }}>
                          This borrower requested {money(item.amount)}, which is outside the standard presets.
                          Set an interest rate before approving.
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', height: 44, borderWidth: 1.5, borderColor: p.line, borderRadius: 10, backgroundColor: p.surface, paddingHorizontal: 12 }}>
                            <TextInput
                              value={adminAppInterestRates[item.id] ?? ''}
                              onChangeText={(v) => setAdminAppInterestRates((prev) => ({ ...prev, [item.id]: v.replace(/[^0-9.]/g, '') }))}
                              keyboardType="numeric"
                              placeholder="e.g. 12"
                              placeholderTextColor={p.mutedLight}
                              style={{ flex: 1, color: p.text, fontSize: 16, fontWeight: '700' }}
                            />
                            <Text style={{ color: p.muted, fontSize: 16, fontWeight: '700' }}>%</Text>
                          </View>
                          {adminAppInterestRates[item.id] ? (
                            <View style={{ alignItems: 'flex-end' }}>
                              <Text style={{ color: p.muted, fontSize: 11 }}>Interest</Text>
                              <Text style={{ color: p.navy, fontSize: 14, fontWeight: '800' }}>
                                {money(Math.round(item.amount * (Number(adminAppInterestRates[item.id]) / 100)))}
                              </Text>
                              <Text style={{ color: p.muted, fontSize: 11 }}>Total</Text>
                              <Text style={{ color: p.navy, fontSize: 13, fontWeight: '700' }}>
                                {money(item.amount + Math.round(item.amount * (Number(adminAppInterestRates[item.id]) / 100)))}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        {/* Require rate before approving */}
                        {!adminAppInterestRates[item.id] && (
                          <Text style={{ color: p.amber, fontSize: 11, fontStyle: 'italic' }}>
                            Enter a rate above to enable approval.
                          </Text>
                        )}
                      </View>
                    )}

                    {item.status === 'APPROVED' && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={[sh.successTextSmall, { color: p.greenDark }]}>
                          Approved · Interest: {item.isCustomAmount && adminAppInterestRates[item.id]
                            ? `${adminAppInterestRates[item.id]}%`
                            : '10% (standard)'}
                        </Text>
                      </View>
                    )}
                    {item.status === 'REJECTED' && <Text style={[sh.rejectTextSmall, { color: p.red }]}>Rejected.</Text>}
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
        <NavBar role="admin" screen={screen} onSelect={goTo} />
      </>
    );
  };

  // ── Admin Borrowers ───────────────────────────────────────────────────────────
  const renderAdminBorrowers = () => {
    const toggleSelectBorrower = (id: string) =>
      setSelectedBorrowerIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    const deleteSelected = () => {
      setRegisteredBorrowers((prev) => prev.filter((b) => !selectedBorrowerIds.has(b.id)));
      setSelectedBorrowerIds(new Set());
      setBorrowerSelectMode(false);
    };
    const deleteAll = () => { setRegisteredBorrowers([]); setSelectedBorrowerIds(new Set()); setBorrowerSelectMode(false); };

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
          <View style={[sh.filterBar, { borderBottomColor: p.line }]}>
            <Text style={[sh.filterLabel, { color: p.navy }]}>
              {borrowerSelectMode ? `${selectedBorrowerIds.size} selected` : `BORROWERS (${registeredBorrowers.length})`}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              {registeredBorrowers.length > 0 && (
                <Pressable onPress={() => { setBorrowerSelectMode((v) => !v); setSelectedBorrowerIds(new Set()); }}>
                  <Text style={[sh.filterCount, { color: borrowerSelectMode ? p.muted : p.navy }]}>
                    {borrowerSelectMode ? 'Cancel' : 'Select'}
                  </Text>
                </Pressable>
              )}
              {registeredBorrowers.length > 0 && !borrowerSelectMode && (
                <Pressable onPress={deleteAll}>
                  <Text style={[sh.filterCount, { color: p.red }]}>Delete All</Text>
                </Pressable>
              )}
              {borrowerSelectMode && selectedBorrowerIds.size > 0 && (
                <Pressable onPress={deleteSelected}
                  style={{ backgroundColor: p.red, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Delete ({selectedBorrowerIds.size})</Text>
                </Pressable>
              )}
            </View>
          </View>

          {registeredBorrowers.length === 0 ? (
            <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.muted, marginTop: 12 }]}>
              <Text style={[sh.infoBoxBody, { color: p.muted }]}>No borrowers have registered yet.</Text>
            </View>
          ) : registeredBorrowers.map((b) => {
            const isSelected = selectedBorrowerIds.has(b.id);
            return (
              <Pressable
                key={b.id}
                style={({ pressed }) => [sh.borrowerRow, { backgroundColor: isSelected ? p.greenPale : p.surface, borderColor: isSelected ? p.green : p.line }, pressed && sh.cardPressed]}
                onPress={() => {
                  if (borrowerSelectMode) { toggleSelectBorrower(b.id); }
                  else { setSelectedBorrower(b); goTo('admin-borrower-detail'); }
                }}
              >
                {borrowerSelectMode && (
                  <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: isSelected ? p.green : p.line, backgroundColor: isSelected ? p.green : p.surface, alignItems: 'center', justifyContent: 'center' }}>
                    {isSelected && <AppIcon name="check" size={12} color="#fff" />}
                  </View>
                )}
                <Avatar name={b.name} />
                <View style={sh.borrowerCopy}>
                  <Text style={[sh.borrowerName, { color: p.text }]}>{b.name}</Text>
                  <Text style={[sh.borrowerMeta, { color: p.muted }]}>
                    {b.phone !== '—' ? b.phone + ' · ' : ''}
                    {adminApps.filter((a) => a.borrower === b.name).length} application{adminApps.filter((a) => a.borrower === b.name).length !== 1 ? 's' : ''}
                  </Text>
                </View>
                <StatusBadge status={b.status} />
                {!borrowerSelectMode && <AppIcon name="arrow" size={16} color={p.muted} />}
              </Pressable>
            );
          })}
        </ScrollView>
        <NavBar role="admin" screen={screen} onSelect={goTo} />
      </>
    );
  };

  // ── Admin Borrower Detail ─────────────────────────────────────────────────────
  const renderAdminBorrowerDetail = () => {
    if (!selectedBorrower) {
      return (
        <>
          <Header bell={false} />
          <View style={[sh.flex, { alignItems: 'center', justifyContent: 'center', backgroundColor: p.background }]}>
            <Text style={{ color: p.muted, fontSize: 14 }}>No borrower selected.</Text>
          </View>
          <NavBar role="admin" screen={screen} onSelect={goTo} />
        </>
      );
    }
    const borrowerApps = adminApps.filter((a) => a.borrower === selectedBorrower.name);
    const borrowerLoans = adminLoans.filter((l) => l.borrower === selectedBorrower.name);

    const removeBorrower = () => {
      setRegisteredBorrowers((prev) => prev.filter((b) => b.id !== selectedBorrower.id));
      goTo('admin-borrowers');
    };

    return (
      <>
        <Header bell={false} />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
          <PageTitle title="Borrower Profile" subtitle={`ID: ${selectedBorrower.id}`} onBack={() => goTo('admin-borrowers')} />

          {/* Profile header */}
          <View style={[sh.profilePanel, { backgroundColor: p.surface, borderRadius: 16, paddingVertical: 24, marginBottom: 14, borderWidth: 1, borderColor: p.line }]}>
            {profilePhotoUri ? (
              <View style={{ width: 72, height: 72, borderRadius: 36, overflow: 'hidden', borderWidth: 2, borderColor: p.green }}>
                <Image source={{ uri: profilePhotoUri }} style={{ width: 72, height: 72 }} resizeMode="cover" />
              </View>
            ) : (
              <Avatar name={selectedBorrower.name} large />
            )}
            <Text style={[sh.profileName, { color: p.navy, marginTop: 8 }]}>{selectedBorrower.name}</Text>
            <StatusBadge status={selectedBorrower.status} />
          </View>

          {/* Account info */}
          <Text style={[sh.sectionLabel, { color: p.navy, marginBottom: 8 }]}>Account Information</Text>
          <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
            <DetailRow label="Full Name" value={selectedBorrower.name} />
            <DetailRow label="Phone" value={selectedBorrower.phone} />
            <DetailRow label="Borrower ID" value={selectedBorrower.id} />
            <DetailRow label="Status" value={selectedBorrower.status} last />
          </View>

          {/* Applications */}
          {borrowerApps.length > 0 && (
            <>
              <Text style={[sh.sectionLabel, { color: p.navy, marginBottom: 8, marginTop: 4 }]}>
                Applications ({borrowerApps.length})
              </Text>
              <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
                {borrowerApps.map((a, i) => (
                  <View key={a.id} style={[sh.detailRow, i === borrowerApps.length - 1 && sh.detailRowLast, { borderBottomColor: p.line }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[sh.detailLabel, { color: p.text, fontWeight: '700' }]}>#{a.id} · {a.product}</Text>
                      <Text style={[sh.detailLabel, { color: p.muted, marginTop: 2 }]}>{money(a.amount)}</Text>
                    </View>
                    <StatusBadge status={a.status} />
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Active loans */}
          {borrowerLoans.length > 0 && (
            <>
              <Text style={[sh.sectionLabel, { color: p.navy, marginBottom: 8, marginTop: 4 }]}>
                Loans ({borrowerLoans.length})
              </Text>
              <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
                {borrowerLoans.map((l, i) => (
                  <View key={l.id} style={[sh.detailRow, i === borrowerLoans.length - 1 && sh.detailRowLast, { borderBottomColor: p.line }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[sh.detailLabel, { color: p.text, fontWeight: '700' }]}>Loan #{l.id}</Text>
                      <Text style={[sh.detailLabel, { color: p.muted, marginTop: 2 }]}>{money(l.amount)} · {l.term} mo</Text>
                    </View>
                    <StatusBadge status={l.status} />
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Government ID */}
          <Text style={[sh.sectionLabel, { color: p.navy, marginBottom: 8, marginTop: 4 }]}>Government ID on File</Text>
          {idType && selectedBorrower.name === fullName ? (
            <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
              <DetailRow label="ID Type" value={idType} />
              {idNumber ? <DetailRow label="ID Number" value={idNumber} last={!idPhotoUri} /> : null}
              {idPhotoUri ? (
                <View style={{ paddingVertical: 12 }}>
                  <Text style={[sh.fieldHint, { color: p.muted, marginBottom: 8 }]}>ID Photo</Text>
                  <Image source={{ uri: idPhotoUri }} style={sh.profileIdPhoto} resizeMode="cover" />
                </View>
              ) : (
                <View style={{ paddingVertical: 10 }}>
                  <Text style={[sh.fieldHint, { color: p.amber }]}>No ID photo uploaded.</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.muted }]}>
              <Text style={[sh.infoBoxBody, { color: p.muted }]}>No government ID on file for this borrower.</Text>
            </View>
          )}

          {/* Remove borrower */}
          <View style={{ marginTop: 16 }}>
            <Btn title="Remove Borrower" variant="danger" onPress={removeBorrower} />
          </View>
        </ScrollView>
        <NavBar role="admin" screen={screen} onSelect={goTo} />
      </>
    );
  };

  // ── Admin Loans ───────────────────────────────────────────────────────────────
  const renderAdminLoans = () => {
    const toggleSelectLoan = (id: string) =>
      setSelectedLoanIds((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
    const deleteSelected = () => {
      setAdminLoans((prev) => prev.filter((l) => !selectedLoanIds.has(l.id)));
      setSelectedLoanIds(new Set());
      setLoanSelectMode(false);
    };
    const deleteAll = () => { setAdminLoans([]); setSelectedLoanIds(new Set()); setLoanSelectMode(false); };

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
          <View style={[sh.filterBar, { borderBottomColor: p.line, marginBottom: 8 }]}>
            <Text style={[sh.filterLabel, { color: p.navy }]}>
              {loanSelectMode ? `${selectedLoanIds.size} selected` : `LOANS (${adminLoans.length})`}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              {adminLoans.length > 0 && (
                <Pressable onPress={() => { setLoanSelectMode((v) => !v); setSelectedLoanIds(new Set()); }}>
                  <Text style={{ color: loanSelectMode ? p.muted : p.navy, fontSize: 12, fontWeight: '700' }}>
                    {loanSelectMode ? 'Cancel' : 'Select'}
                  </Text>
                </Pressable>
              )}
              {adminLoans.length > 0 && !loanSelectMode && (
                <Pressable onPress={deleteAll}>
                  <Text style={{ color: p.red, fontSize: 12, fontWeight: '700' }}>Delete All</Text>
                </Pressable>
              )}
              {loanSelectMode && selectedLoanIds.size > 0 && (
                <Pressable onPress={deleteSelected}
                  style={{ backgroundColor: p.red, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7 }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Delete ({selectedLoanIds.size})</Text>
                </Pressable>
              )}
            </View>
          </View>

          {adminLoans.length === 0 && (
            <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.muted }]}>
              <Text style={[sh.infoBoxBody, { color: p.muted }]}>No loans yet.</Text>
            </View>
          )}

          {adminLoans.map((loan) => {
            const isSelected = selectedLoanIds.has(loan.id);
            return (
              <Pressable
                key={loan.id}
                style={({ pressed }) => [sh.loanCard, { backgroundColor: isSelected ? p.greenPale : p.surface, borderColor: isSelected ? p.green : p.line }, pressed && sh.cardPressed]}
                onPress={() => {
                  if (loanSelectMode) { toggleSelectLoan(loan.id); }
                  else { setSelectedLoan(loan); goTo('loan-details'); }
                }}
              >
                <View style={sh.loanCardHead}>
                  {loanSelectMode && (
                    <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: isSelected ? p.green : p.line, backgroundColor: isSelected ? p.green : p.surface, alignItems: 'center', justifyContent: 'center', marginRight: 6 }}>
                      {isSelected && <AppIcon name="check" size={12} color="#fff" />}
                    </View>
                  )}
                  <Text style={[sh.loanCardTitle, { color: p.navy, flex: 1 }]}>Loan #{loan.id}</Text>
                  <StatusBadge status={loan.status} />
                </View>
                <Text style={[sh.loanCardBorrower, { color: p.muted }]}>{loan.borrower}</Text>
                {!loanSelectMode && (
                  <>
                    <View style={[sh.loanCardDetails, { borderColor: p.line }]}>
                      <DetailRow label="Amount" value={money(loan.amount)} />
                      <DetailRow label="Interest" value={`10% · ${money(loan.interest)}`} />
                      <DetailRow label="Term" value={`${loan.term} months`} />
                      <DetailRow label="Remaining" value={money(loan.remaining)} last />
                    </View>
                    <View style={sh.loanCardFooter}>
                      <Text style={[sh.loanCardLink, { color: p.greenDark }]}>View full details</Text>
                      <AppIcon name="arrow" size={14} color={p.green} />
                    </View>
                  </>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
        <NavBar role="admin" screen={screen} onSelect={goTo} />
      </>
    );
  };

  // ── Admin Loan Detail ──────────────────────────────────────────────────────────
  const renderAdminLoanDetail = () => {
    if (!selectedLoan) {
      return (
        <>
          <Header />
          <View style={[sh.flex, { alignItems: 'center', justifyContent: 'center', backgroundColor: p.background }]}>
            <Text style={{ color: p.muted, fontSize: 14 }}>No loan selected.</Text>
          </View>
          <NavBar role="admin" screen={screen} onSelect={goTo} />
        </>
      );
    }

    // Local edit state — using top-level state (hooks can't be inside render functions)
    // editMode, editAmount, editInterestRate, editTerm, editStatus, editError are declared at component top

    const enterEditMode = () => {
      setEditAmount(String(selectedLoan.amount));
      setEditInterestRate(String(Math.round((selectedLoan.interest / selectedLoan.amount) * 100)));
      setEditTerm(String(selectedLoan.term));
      setEditStatus(selectedLoan.status);
      setEditError('');
      setLoanEditMode(true);
    };

    const cancelEdit = () => { setLoanEditMode(false); setEditError(''); };

    const saveChanges = () => {
      const amount = Number(editAmount.replace(/,/g, ''));
      const rate = Number(editInterestRate) / 100;
      const term = Number(editTerm);
      if (!amount || amount < 100) { setEditError('Enter a valid amount (min ₱100).'); return; }
      if (isNaN(rate) || rate < 0 || rate > 1) { setEditError('Enter interest rate between 0 and 100%.'); return; }
      if (!term || term < 1 || term > 120) { setEditError('Enter a term between 1 and 120 months.'); return; }
      const interest = Math.round(amount * rate);
      const totalPayable = amount + interest;
      const updatedLoan: AdminLoanRecord = {
        ...selectedLoan,
        amount,
        interest,
        term,
        remaining: editStatus === 'PAID' ? 0 : Math.min(selectedLoan.remaining, totalPayable),
        status: editStatus,
      };
      setAdminLoans((prev) => prev.map((l) => l.id === selectedLoan.id ? updatedLoan : l));
      setSelectedLoan(updatedLoan);
      setLoanEditMode(false);
      setEditError('');
    };

    const deleteLoan = () => {
      setAdminLoans((prev) => prev.filter((l) => l.id !== selectedLoan.id));
      goTo('admin-loans');
    };

    const totalPayable = selectedLoan.amount + selectedLoan.interest;
    const paidPercent = totalPayable > 0 ? Math.round(((totalPayable - selectedLoan.remaining) / totalPayable) * 100) : 0;

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]} keyboardShouldPersistTaps="handled">
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <View style={{ flex: 1 }}>
              <Pressable onPress={() => goTo('admin-loans')} style={[sh.backBtn, { backgroundColor: p.background }]}>
                <AppIcon name="back" size={20} color={p.navy} />
              </Pressable>
            </View>
            <Pressable
              onPress={() => { setLoanEditMode((v) => !v); setEditError(''); }}
              style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9, borderWidth: 1.5, borderColor: loanEditMode ? p.muted : p.green, backgroundColor: loanEditMode ? p.background : p.greenPale }}
            >
              <Text style={{ color: loanEditMode ? p.muted : p.greenDark, fontSize: 13, fontWeight: '700' }}>
                {loanEditMode ? 'Cancel' : 'Edit Loan'}
              </Text>
            </Pressable>
          </View>

          {/* Hero card */}
          <View style={sh.loanHero}>
            <View style={sh.loanHeroTop}>
              <Text style={sh.heroEyebrow}>LOAN #{selectedLoan.id} · {selectedLoan.borrower}</Text>
              <StatusBadge status={selectedLoan.status} />
            </View>
            <Text style={sh.loanheroAmount}>{money(selectedLoan.amount)}</Text>
            <Text style={sh.loanHeroSub}>
              Remaining {money(selectedLoan.remaining)} · {paidPercent}% paid
            </Text>
            <View style={sh.progressTrack}>
              <View style={[sh.progressFill, { width: `${paidPercent}%` }]} />
            </View>
          </View>

          {/* ── View mode ─────────────────────────────────────────────── */}
          {!loanEditMode ? (
            <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
              <DetailRow label="Borrower" value={selectedLoan.borrower} />
              <DetailRow label="Principal" value={money(selectedLoan.amount)} />
              <DetailRow label="Interest Rate" value={`${Math.round((selectedLoan.interest / selectedLoan.amount) * 100)}%`} />
              <DetailRow label="Total Interest" value={money(selectedLoan.interest)} />
              <DetailRow label="Total Payable" value={money(totalPayable)} />
              <DetailRow label="Remaining" value={money(selectedLoan.remaining)} />
              <DetailRow label="Term" value={`${selectedLoan.term} months`} />
              <DetailRow label="Status" value={selectedLoan.status} last />
            </View>
          ) : (
            /* ── Edit mode ──────────────────────────────────────────── */
            <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.green }]}>
              <View style={{ padding: 4, paddingBottom: 10 }}>
                <Text style={{ color: p.green, fontSize: 11, fontWeight: '800', letterSpacing: 0.5, marginBottom: 12 }}>
                  EDITING LOAN #{selectedLoan.id}
                </Text>

                {/* Principal Amount */}
                <Text style={[sh.fieldLabel, { color: p.text, marginBottom: 6 }]}>Principal Amount (₱)</Text>
                <View style={[sh.amountRow, { backgroundColor: p.background, borderColor: p.line, marginBottom: 14 }]}>
                  <Text style={[sh.currencySign, { color: p.greenDark }]}>₱</Text>
                  <TextInput
                    value={editAmount}
                    onChangeText={setEditAmount}
                    keyboardType="numeric"
                    placeholder="10,000"
                    placeholderTextColor={p.mutedLight}
                    style={[sh.amountInput, { color: p.navy }]}
                  />
                </View>

                {/* Interest Rate */}
                <Text style={[sh.fieldLabel, { color: p.text, marginBottom: 6 }]}>Interest Rate (%)</Text>
                <View style={[sh.amountRow, { backgroundColor: p.background, borderColor: p.line, marginBottom: 14 }]}>
                  <TextInput
                    value={editInterestRate}
                    onChangeText={setEditInterestRate}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor={p.mutedLight}
                    style={[sh.amountInput, { color: p.navy, fontSize: 18 }]}
                  />
                  <Text style={{ color: p.muted, fontSize: 18, fontWeight: '700', marginLeft: 4 }}>%</Text>
                </View>

                {/* Computed interest preview */}
                {editAmount && editInterestRate ? (
                  <View style={[sh.estimateCard, { backgroundColor: p.greenPale, marginBottom: 14 }]}>
                    <Text style={[sh.estimateLabel, { color: p.greenDark }]}>COMPUTED INTEREST</Text>
                    <Text style={[sh.estimateAmount, { color: p.navy }]}>
                      {money(Math.round(Number(editAmount.replace(/,/g, '')) * (Number(editInterestRate) / 100)))}
                    </Text>
                    <Text style={[sh.estimateNote, { color: p.muted }]}>
                      Total payable: {money(
                        Number(editAmount.replace(/,/g, '')) +
                        Math.round(Number(editAmount.replace(/,/g, '')) * (Number(editInterestRate) / 100))
                      )}
                    </Text>
                  </View>
                ) : null}

                {/* Term */}
                <Text style={[sh.fieldLabel, { color: p.text, marginBottom: 6 }]}>Repayment Term (months)</Text>
                <View style={sh.termRow}>
                  {[1, 3, 6, 12, 24].map((t) => (
                    <Pressable key={t} onPress={() => setEditTerm(String(t))}
                      style={[sh.termChip, String(t) === editTerm && sh.termChipActive, { flex: 0, width: 52 }]}>
                      <Text style={[sh.termChipNum, String(t) === editTerm && sh.termChipNumActive]}>{t}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={[sh.amountRow, { backgroundColor: p.background, borderColor: p.line, marginBottom: 14 }]}>
                  <TextInput
                    value={editTerm}
                    onChangeText={setEditTerm}
                    keyboardType="numeric"
                    placeholder="Custom months"
                    placeholderTextColor={p.mutedLight}
                    style={[sh.amountInput, { color: p.navy, fontSize: 16 }]}
                  />
                </View>

                {/* Status */}
                <Text style={[sh.fieldLabel, { color: p.text, marginBottom: 8 }]}>Loan Status</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  {(['ACTIVE', 'PAID'] as const).map((s) => (
                    <Pressable key={s} onPress={() => setEditStatus(s)}
                      style={{ flex: 1, height: 44, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
                        borderColor: editStatus === s ? p.green : p.line,
                        backgroundColor: editStatus === s ? p.greenPale : p.background }}>
                      <Text style={{ color: editStatus === s ? p.greenDark : p.muted, fontWeight: '700', fontSize: 13 }}>{s}</Text>
                    </Pressable>
                  ))}
                </View>

                {editError ? (
                  <View style={[sh.errorBox, { backgroundColor: p.redPale, marginBottom: 10 }]}>
                    <Text style={[sh.errorText, { color: p.red }]}>{editError}</Text>
                  </View>
                ) : null}

                <Btn title="Save Changes" onPress={saveChanges} />
              </View>
            </View>
          )}

          {/* Actions */}
          {!loanEditMode && (
            <>
              <Btn title="Payment History" onPress={() => goTo('payments')} variant="secondary" />
              <View style={{ marginTop: 10 }}>
                <Btn title="Delete This Loan" onPress={deleteLoan} variant="danger" />
              </View>
            </>
          )}
        </ScrollView>
        <NavBar role="admin" screen={screen} onSelect={goTo} />
      </>
    );
  };

  // ── Profile screen ────────────────────────────────────────────────────────────
  const renderProfile = () => {
    const pickProfilePhoto = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { setFormError('Allow photo library access to set a profile picture.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) setProfilePhotoUri(result.assets[0].uri);
    };

    const takeProfilePhoto = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { setFormError('Allow camera access to take a profile picture.'); return; }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) setProfilePhotoUri(result.assets[0].uri);
    };

    const pickIdPhoto = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { setFormError('Allow photo library access to upload your ID.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) setIdPhotoUri(result.assets[0].uri);
    };

    const takeIdPhoto = async () => {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { setFormError('Allow camera access to take a photo of your ID.'); return; }
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [16, 10],
        quality: 0.85,
      });
      if (!result.canceled && result.assets[0]) setIdPhotoUri(result.assets[0].uri);
    };

    const missingIdPhoto = role === 'borrower' && idType && !idPhotoUri;

    return (
      <View style={[sh.flex, { backgroundColor: p.background }]}>
        <Header bell={false} />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]} keyboardShouldPersistTaps="handled">
          <PageTitle
            title="My Profile"
            subtitle="Your account details"
            onBack={() => goTo(role === 'admin' ? 'admin-dashboard' : 'dashboard')}
          />

          {/* ── Profile photo + name ──────────────────────────────────── */}
          <View style={[sh.profilePanel, { backgroundColor: p.surface, borderRadius: 16, paddingVertical: 24, marginBottom: 14, borderWidth: 1, borderColor: p.line }]}>
            <Pressable onPress={pickProfilePhoto} style={{ alignItems: 'center' }}>
              {profilePhotoUri ? (
                <View style={{ width: 80, height: 80, borderRadius: 40, overflow: 'hidden', borderWidth: 2, borderColor: p.green }}>
                  <Image source={{ uri: profilePhotoUri }} style={{ width: 80, height: 80 }} resizeMode="cover" />
                </View>
              ) : (
                <View style={[sh.borrowerLargeInitials, { backgroundColor: p.navyCard, width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: p.line }]}>
                  <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: '800' }}>
                    {role === 'admin' ? 'AD' : initials(fullName || 'U')}
                  </Text>
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 }}>
                <AppIcon name="camera" size={13} color={p.green} />
                <Text style={{ color: p.green, fontSize: 12, fontWeight: '700' }}>
                  {profilePhotoUri ? 'Change photo' : 'Add photo'}
                </Text>
              </View>
            </Pressable>
            {profilePhotoUri && (
              <Pressable onPress={takeProfilePhoto} style={{ marginTop: 4 }}>
                <Text style={{ color: p.muted, fontSize: 11, textAlign: 'center' }}>Take new photo</Text>
              </Pressable>
            )}
            <Text style={[sh.profileName, { color: p.navy, marginTop: 10 }]}>{fullName || '—'}</Text>
            <View style={[sh.badge, { backgroundColor: role === 'admin' ? p.amberPale : p.greenPale, marginTop: 6 }]}>
              <Text style={[sh.badgeText, { color: role === 'admin' ? p.amber : p.greenDark }]}>
                {role === 'admin' ? 'Administrator' : 'Borrower'}
              </Text>
            </View>
          </View>

          {/* ── Account info ──────────────────────────────────────────── */}
          <Text style={[sh.sectionLabel, { color: p.navy, marginBottom: 8 }]}>Account Information</Text>
          <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
            <DetailRow label="Full Name" value={fullName || '—'} />
            <DetailRow label="Email" value={email || firebaseUser?.email || '—'} />
            <DetailRow label="Phone" value={phone || '—'} />
            <DetailRow label="Role" value={role === 'admin' ? 'Administrator' : 'Borrower'} last />
          </View>

          {/* ── Government ID — borrowers only ───────────────────────── */}
          {role === 'borrower' && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, marginTop: 4 }}>
                <Text style={[sh.sectionLabel, { color: p.navy }]}>Government ID</Text>
                {missingIdPhoto && (
                  <View style={[sh.badge, { backgroundColor: p.amberPale }]}>
                    <Text style={[sh.badgeText, { color: p.amber }]}>PHOTO MISSING</Text>
                  </View>
                )}
              </View>

              {idType ? (
                <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: missingIdPhoto ? p.amber : p.line }]}>
                  <DetailRow label="ID Type" value={idType} />
                  {idNumber ? <DetailRow label="ID Number" value={idNumber} last={false} /> : null}
                  {idPhotoUri ? (
                    <View style={{ paddingVertical: 12 }}>
                      <Text style={[sh.fieldHint, { color: p.muted, marginBottom: 8 }]}>ID Photo</Text>
                      <Image source={{ uri: idPhotoUri }} style={sh.profileIdPhoto} resizeMode="cover" />
                      <Pressable
                        style={({ pressed }) => [sh.idPhotoRetake, { backgroundColor: p.greenPale }, pressed && { opacity: 0.7 }]}
                        onPress={pickIdPhoto}
                      >
                        <Text style={[sh.idPhotoRetakeText, { color: p.greenDark }]}>Change photo</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View style={{ paddingVertical: 12 }}>
                      <Text style={[sh.fieldHint, { color: p.amber, marginBottom: 10, fontWeight: '600' }]}>
                        No ID photo uploaded. Please add one to complete your verification.
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Pressable
                          style={({ pressed }) => [sh.idPhotoBtn, { flex: 1 }, pressed && sh.idPhotoBtnPressed]}
                          onPress={takeIdPhoto}
                        >
                          <AppIcon name="camera" size={20} color={p.green} />
                          <Text style={[sh.idPhotoBtnText, { color: p.muted }]}>Take Photo</Text>
                        </Pressable>
                        <Pressable
                          style={({ pressed }) => [sh.idPhotoBtn, { flex: 1 }, pressed && sh.idPhotoBtnPressed]}
                          onPress={pickIdPhoto}
                        >
                          <AppIcon name="upload" size={20} color={p.green} />
                          <Text style={[sh.idPhotoBtnText, { color: p.muted }]}>Upload</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.amber }]}>
                  <Text style={[sh.infoBoxTitle, { color: p.navy }]}>No ID on file</Text>
                  <Text style={[sh.infoBoxBody, { color: p.muted }]}>
                    You did not provide a government ID during registration. Please re-register or contact support.
                  </Text>
                </View>
              )}
            </>
          )}

          {formError ? (
            <View style={[sh.errorBox, { backgroundColor: p.redPale, marginTop: 8 }]}>
              <Text style={[sh.errorText, { color: p.red }]}>{formError}</Text>
            </View>
          ) : null}

          {/* ── Logout ───────────────────────────────────────────────── */}
          <View style={{ marginTop: 16, gap: 10 }}>
            <Btn title="Change Password" variant="secondary" onPress={() => {
              setCpCurrentPassword(''); setCpNewPassword(''); setCpConfirmPassword('');
              setCpError(''); setCpSuccess(false);
              goTo('change-password');
            }} />
            <Btn title="Log Out" variant="danger" onPress={() => setShowLogout(true)} />
          </View>
        </ScrollView>

        {role === 'borrower' && <NavBar role="borrower" screen={screen} onSelect={goTo} />}
        {role === 'admin' && <NavBar role="admin" screen={screen} onSelect={goTo} />}
      </View>
    );
  };

  // ── Change Password ────────────────────────────────────────────────────────────
  const renderChangePassword = () => (
    <View style={[sh.flex, { backgroundColor: p.background }]}>
      <Header bell={false} />
      <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]} keyboardShouldPersistTaps="handled">
        <PageTitle title="Change Password" subtitle="Update your account password." onBack={() => goTo('profile')} />

        <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line, padding: 16 }]}>
          {cpSuccess ? (
            <View style={{ alignItems: 'center', padding: 20, gap: 12 }}>
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: p.greenPale, alignItems: 'center', justifyContent: 'center' }}>
                <AppIcon name="check" size={26} color={p.green} />
              </View>
              <Text style={{ color: p.navy, fontSize: 18, fontWeight: '800', textAlign: 'center' }}>Password Updated</Text>
              <Text style={{ color: p.muted, fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
                Your password has been changed successfully. Use your new password next time you sign in.
              </Text>
              <Btn title="Back to Profile" onPress={() => goTo('profile')} />
            </View>
          ) : (
            <>
              <InputField
                label="Current Password"
                value={cpCurrentPassword}
                onChangeText={setCpCurrentPassword}
                placeholder="Enter current password"
                secureTextEntry
              />
              <InputField
                label="New Password"
                value={cpNewPassword}
                onChangeText={setCpNewPassword}
                placeholder="At least 6 characters"
                secureTextEntry
              />
              <InputField
                label="Confirm New Password"
                value={cpConfirmPassword}
                onChangeText={setCpConfirmPassword}
                placeholder="Repeat new password"
                secureTextEntry
              />
              {cpError ? (
                <View style={[sh.errorBox, { backgroundColor: p.redPale, marginTop: 4 }]}>
                  <Text style={[sh.errorText, { color: p.red }]}>{cpError}</Text>
                </View>
              ) : null}
              <Btn
                title={cpLoading ? 'Updating…' : 'Update Password'}
                disabled={cpLoading}
                onPress={async () => {
                  if (!cpCurrentPassword) { setCpError('Enter your current password.'); return; }
                  if (cpNewPassword.length < 6) { setCpError('New password must be at least 6 characters.'); return; }
                  if (cpNewPassword !== cpConfirmPassword) { setCpError('Passwords do not match.'); return; }
                  setCpLoading(true); setCpError('');
                  const result = await changePassword(cpCurrentPassword, cpNewPassword);
                  setCpLoading(false);
                  if (result.ok) { setCpSuccess(true); } else { setCpError(result.error ?? 'Could not update password.'); }
                }}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );

  // ── Admin Loan Products ────────────────────────────────────────────────────────
  const renderAdminLoanProducts = () => {
    const openAdd = () => {
      setEditingProduct(null);
      setLpName(''); setLpDescription(''); setLpMinAmount(''); setLpMaxAmount('');
      setLpDefaultTerm('6'); setLpInterestRate('10'); setLpPurposes([]); setLpNewPurpose(''); setLpFormError('');
      setShowLoanProductForm(true);
    };
    const openEdit = (prod: LoanProduct) => {
      setEditingProduct(prod);
      setLpName(prod.name); setLpDescription(prod.description);
      setLpMinAmount(String(prod.minAmount)); setLpMaxAmount(String(prod.maxAmount));
      setLpDefaultTerm(String(prod.defaultTerm)); setLpInterestRate(String(prod.interestRate));
      setLpPurposes([...prod.purposes]); setLpNewPurpose(''); setLpFormError('');
      setShowLoanProductForm(true);
    };
    const deleteProd = (id: string) => {
      setLoanProducts((prev) => prev.filter((p) => p.id !== id));
      deleteLoanProduct(id);
    };
    const removePurpose = (purpose: string) => {
      setLpPurposes((prev) => prev.filter((item) => item !== purpose));
    };
    const addPurpose = () => {
      const trimmed = lpNewPurpose.trim();
      if (!trimmed || lpPurposes.includes(trimmed)) { setLpNewPurpose(''); return; }
      setLpPurposes((prev) => [...prev, trimmed]);
      setLpNewPurpose('');
    };
    const saveProduct = () => {
      if (!lpName.trim()) { setLpFormError('Product name is required.'); return; }
      const min = Number(lpMinAmount);
      const max = Number(lpMaxAmount);
      const term = Number(lpDefaultTerm);
      const rate = Number(lpInterestRate);
      if (!min || min < 100) { setLpFormError('Enter a valid minimum amount (min ₱100).'); return; }
      if (!max || max < min) { setLpFormError('Maximum amount must be greater than minimum.'); return; }
      if (!term || term < 1) { setLpFormError('Enter a valid default term (months).'); return; }
      if (isNaN(rate) || rate < 0 || rate > 100) { setLpFormError('Enter an interest rate between 0 and 100%.'); return; }
      if (editingProduct) {
        const updated: LoanProduct = { ...editingProduct, name: lpName.trim(), description: lpDescription.trim(), minAmount: min, maxAmount: max, defaultTerm: term, interestRate: rate, purposes: lpPurposes };
        setLoanProducts((prev) => prev.map((x) => x.id === editingProduct.id ? updated : x));
        saveLoanProduct(updated);
      } else {
        const newProd: LoanProduct = { id: `lp${Date.now()}`, name: lpName.trim(), description: lpDescription.trim(), minAmount: min, maxAmount: max, defaultTerm: term, interestRate: rate, purposes: lpPurposes };
        setLoanProducts((prev) => [...prev, newProd]);
        saveLoanProduct(newProd);
      }
      setShowLoanProductForm(false);
      setEditingProduct(null);
    };

    return (
      <View style={[sh.flex, { backgroundColor: p.background }]}>
        <Header />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]} keyboardShouldPersistTaps="handled">
          {/* Header row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <View>
              <Text style={[sh.pageTitleText, { color: p.navy }]}>Loan Products</Text>
              <Text style={[sh.pageTitleSub, { color: p.muted }]}>Manage available loan offerings</Text>
            </View>
            <Pressable
              onPress={openAdd}
              style={({ pressed }) => [{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: pressed ? p.greenMid : p.green }]}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>+ Add Product</Text>
            </Pressable>
          </View>

          {loanProducts.length === 0 && (
            <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.muted }]}>
              <Text style={[sh.infoBoxBody, { color: p.muted }]}>No loan products yet. Tap + Add Product to create one.</Text>
            </View>
          )}

          {loanProducts.map((prod) => (
            <View key={prod.id} style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line, marginBottom: 12 }]}>
              {/* Product header */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: p.navy, fontSize: 16, fontWeight: '800' }}>{prod.name}</Text>
                  <Text style={{ color: p.muted, fontSize: 12, marginTop: 2 }}>{prod.description}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Pressable onPress={() => openEdit(prod)} style={({ pressed }) => [{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: pressed ? p.greenMid : p.greenPale }]}>
                    <Text style={{ color: p.greenDark, fontWeight: '700', fontSize: 12 }}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => deleteProd(prod.id)} style={({ pressed }) => [{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: pressed ? '#ffc8c8' : p.redPale }]}>
                    <Text style={{ color: p.red, fontWeight: '700', fontSize: 12 }}>Delete</Text>
                  </Pressable>
                </View>
              </View>
              {/* Details */}
              <DetailRow label="Amount Range" value={`${money(prod.minAmount)} – ${money(prod.maxAmount)}`} />
              <DetailRow label="Default Term" value={`${prod.defaultTerm} months`} />
              <DetailRow label="Interest Rate" value={`${prod.interestRate}%`} last={prod.purposes.length === 0} />
              {/* Purposes */}
              {prod.purposes.length > 0 && (
                <View style={{ paddingTop: 10 }}>
                  <Text style={{ color: p.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.4, marginBottom: 6 }}>PURPOSES</Text>
                  <View style={sh.pillRow}>
                    {prod.purposes.map((purpose) => (
                      <View key={purpose} style={[sh.pill, { backgroundColor: p.greenPale, borderColor: p.green }]}>
                        <Text style={[sh.pillText, { color: p.greenDark, fontWeight: '600' }]}>{purpose}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* ── Add / Edit Modal — full screen for more space ────────── */}
        <Modal visible={showLoanProductForm} transparent={false} animationType="slide" statusBarTranslucent onRequestClose={() => setShowLoanProductForm(false)}>
          <SafeAreaView style={[sh.flex, { backgroundColor: p.background }]}>
            {/* Modal header */}
            <View style={[sh.header, { backgroundColor: p.surface, borderBottomColor: p.line }]}>
              <Pressable onPress={() => { setShowLoanProductForm(false); setLpFormError(''); }} style={sh.backBtn}>
                <AppIcon name="back" size={20} color={p.navy} />
              </Pressable>
              <Text style={{ flex: 1, color: p.navy, fontSize: 17, fontWeight: '800', marginLeft: 8 }}>
                {editingProduct ? 'Edit Loan Product' : 'New Loan Product'}
              </Text>
              <Pressable
                onPress={saveProduct}
                style={({ pressed }) => [{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: pressed ? p.greenMid : p.green }]}
              >
                <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>Save</Text>
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={[sh.page, { paddingTop: 20 }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={{ color: p.muted, fontSize: 13, marginBottom: 16, lineHeight: 18 }}>
                {editingProduct ? 'Update the product details below.' : 'Fill in the details for the new loan offering.'}
              </Text>

              <InputField label="Product Name *" value={lpName} onChangeText={setLpName} placeholder="e.g. Personal Loan" />
              <InputField label="Description" value={lpDescription} onChangeText={setLpDescription} placeholder="Short description of the product" />

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
                <View style={{ flex: 1 }}>
                  <InputField label="Min Amount (₱) *" value={lpMinAmount} onChangeText={setLpMinAmount} placeholder="1000" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <InputField label="Max Amount (₱) *" value={lpMaxAmount} onChangeText={setLpMaxAmount} placeholder="500000" keyboardType="numeric" />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[sh.fieldLabel, { color: p.text, marginBottom: 6 }]}>Default Term (mo) *</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    {[3, 6, 12].map((t) => (
                      <Pressable key={t} onPress={() => setLpDefaultTerm(String(t))}
                        style={[sh.termChip, { flex: 1 }, String(t) === lpDefaultTerm && sh.termChipActive]}>
                        <Text style={[sh.termChipNum, String(t) === lpDefaultTerm && sh.termChipNumActive]}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={[sh.inputWrap, { backgroundColor: p.surface, borderColor: p.line }]}>
                    <TextInput value={lpDefaultTerm} onChangeText={setLpDefaultTerm} placeholder="Custom" keyboardType="numeric" placeholderTextColor={p.mutedLight} style={[sh.inputInner, { color: p.text }]} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[sh.fieldLabel, { color: p.text, marginBottom: 6 }]}>Interest Rate (%) *</Text>
                  <View style={[sh.amountRow, { backgroundColor: p.surface, borderColor: p.line, marginTop: 0, height: 50 }]}>
                    <TextInput value={lpInterestRate} onChangeText={setLpInterestRate} placeholder="10" keyboardType="numeric" placeholderTextColor={p.mutedLight} style={[sh.amountInput, { color: p.navy }]} />
                    <Text style={{ color: p.muted, fontSize: 16, fontWeight: '700', marginLeft: 4 }}>%</Text>
                  </View>
                </View>
              </View>

              {/* Purposes */}
              <View style={[sh.fieldWrap, { marginTop: 8 }]}>
                <Text style={[sh.fieldLabel, { color: p.text }]}>Loan Purposes</Text>
                <Text style={[sh.fieldHint, { color: p.mutedLight }]}>These will appear as quick-select options for borrowers.</Text>
                {lpPurposes.length > 0 && (
                  <View style={[sh.pillRow, { marginBottom: 10 }]}>
                    {lpPurposes.map((purpose) => (
                      <Pressable key={purpose} onPress={() => removePurpose(purpose)}
                        style={[sh.pill, { backgroundColor: p.greenPale, borderColor: p.green, flexDirection: 'row', gap: 4, alignItems: 'center' }]}>
                        <Text style={[sh.pillText, { color: p.greenDark }]}>{purpose}</Text>
                        <Text style={{ color: p.red, fontSize: 15, fontWeight: '800', lineHeight: 16 }}>×</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[sh.inputWrap, { flex: 1, backgroundColor: p.surface, borderColor: p.line }]}>
                    <TextInput
                      value={lpNewPurpose}
                      onChangeText={setLpNewPurpose}
                      placeholder="Add purpose (e.g. Medical)"
                      placeholderTextColor={p.mutedLight}
                      style={[sh.inputInner, { color: p.text }]}
                      onSubmitEditing={addPurpose}
                      returnKeyType="done"
                    />
                  </View>
                  <Pressable onPress={addPurpose} style={({ pressed }) => [{ paddingHorizontal: 18, height: 50, borderRadius: 11, backgroundColor: pressed ? p.greenMid : p.green, alignItems: 'center', justifyContent: 'center' }]}>
                    <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>Add</Text>
                  </Pressable>
                </View>
              </View>

              {lpFormError ? (
                <View style={[sh.errorBox, { backgroundColor: p.redPale, marginBottom: 8 }]}>
                  <Text style={[sh.errorText, { color: p.red }]}>{lpFormError}</Text>
                </View>
              ) : null}

              <Btn title={editingProduct ? 'Save Changes' : 'Create Product'} onPress={saveProduct} />
              <Btn title="Cancel" variant="ghost" onPress={() => { setShowLoanProductForm(false); setLpFormError(''); }} />
            </ScrollView>
          </SafeAreaView>
        </Modal>

        <NavBar role="admin" screen={screen} onSelect={goTo} />
      </View>
    );
  };

  // ── Router ────────────────────────────────────────────────────────────────────
  // ── Auth loading gate ───────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <ThemeContext.Provider value={p}>
        <SafeAreaView style={[sh.root, { backgroundColor: p.background }]}>
          <LoadingOverlay visible message="Checking your session…" />
        </SafeAreaView>
      </ThemeContext.Provider>
    );
  }

  let content: React.ReactNode;
  if (screen === 'splash') content = renderSplash();
  else if (screen === 'login') content = renderLogin();
  else if (screen === 'register') content = renderRegister();
  else if (screen === 'underage') content = renderUnderage();
  else if (screen === 'terms') content = renderTerms();
  else if (screen === 'review') content = renderReview();
  else if (screen === 'profile') content = renderProfile();
  else if (screen === 'change-password') content = renderChangePassword();
  else if (screen === 'dashboard') content = renderDashboard();
  else if (screen === 'apply') content = renderApply();
  else if (screen === 'application-status') content = renderAppStatus();
  else if (screen === 'loan-details') content = role === 'admin' ? renderAdminLoanDetail() : renderLoanDetails();
  else if (screen === 'schedule') content = renderSchedule();
  else if (screen === 'payments') content = renderPayments();
  else if (screen === 'notifications') content = renderNotifications();
  else if (screen === 'admin-dashboard') content = renderAdminDashboard();
  else if (screen === 'admin-applications') content = renderAdminApplications();
  else if (screen === 'admin-borrowers') content = renderAdminBorrowers();
  else if (screen === 'admin-borrower-detail') content = renderAdminBorrowerDetail();
  else if (screen === 'admin-reviews') content = renderAdminReviews();
  else if (screen === 'admin-payments') content = renderAdminPayments();
  else if (screen === 'admin-loan-products') content = renderAdminLoanProducts();
  else content = renderAdminLoans();

  return (
    <ThemeContext.Provider value={p}>
      <SafeAreaView style={[sh.root, { backgroundColor: p.background }]}>
        {content}
        <LoadingOverlay visible={transitioning} message="Welcome to LendMate…" />
        <LogoutModal
          visible={showLogout}
          onConfirm={handleLogout}
          onCancel={() => setShowLogout(false)}
        />
      </SafeAreaView>
    </ThemeContext.Provider>
  );
}

