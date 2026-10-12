import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';

import { ThemedText } from '@/components/themed-text';
import {
  registerWithEmail,
  signInWithEmail,
  signOut,
  onAuthChange,
  acceptTerms,
  fetchUserProfile,
  useGoogleSignIn,
  handleGoogleResponse,
  type UserProfile,
} from '@/lib/auth';

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = 'borrower' | 'admin';
type Screen =
  | 'splash' | 'login' | 'register' | 'terms' | 'underage'
  | 'dashboard' | 'apply' | 'application-status' | 'loan-details'
  | 'schedule' | 'payments' | 'notifications' | 'review' | 'profile'
  | 'admin-dashboard' | 'admin-applications' | 'admin-borrowers'
  | 'admin-borrower-detail' | 'admin-loans' | 'admin-reviews' | 'admin-payments';

type IconName =
  | 'bell' | 'home' | 'file' | 'users' | 'wallet'
  | 'calendar' | 'arrow' | 'check' | 'clock' | 'back' | 'shield' | 'star';

type Review = {
  id: string;
  borrower: string;
  stars: number;       // 1–5
  comment: string;
  date: string;
};

type ApplicationRecord = {
  id: string; borrower: string; amount: number; product: string;
  status: 'PENDING' | 'UNDER REVIEW' | 'APPROVED' | 'REJECTED';
};

type AdminLoanRecord = {
  id: string; borrower: string; amount: number; interest: number;
  term: number; remaining: number; status: 'ACTIVE' | 'PAID';
};

// ─── Seed data ────────────────────────────────────────────────────────────────

const initialApplication: ApplicationRecord = {
  id: '10025', borrower: 'Christian Santiago',
  amount: 10000, product: 'Personal Loan', status: 'UNDER REVIEW',
};

const adminApplications: ApplicationRecord[] = [
  { id: '1025', borrower: 'Juan Dela Cruz', amount: 10000, product: 'Personal Loan', status: 'PENDING' },
  { id: '1024', borrower: 'Maria Santos', amount: 25000, product: 'Business Loan', status: 'UNDER REVIEW' },
  { id: '1023', borrower: 'Ana Lopez', amount: 15000, product: 'Education Loan', status: 'PENDING' },
];

const initialAdminLoans: AdminLoanRecord[] = [
  { id: '10025', borrower: 'Juan Dela Cruz', amount: 10000, interest: 1000, term: 3, remaining: 7500, status: 'ACTIVE' },
  { id: '10024', borrower: 'Maria Santos', amount: 20000, interest: 2000, term: 6, remaining: 12500, status: 'ACTIVE' },
  { id: '10023', borrower: 'Ana Lopez', amount: 15000, interest: 1500, term: 6, remaining: 0, status: 'PAID' },
];

const borrowers = [
  { id: 'BR-1044', name: 'Juan Dela Cruz', phone: '09123456789', activeLoans: 2, status: 'ACTIVE' },
  { id: 'BR-1042', name: 'Maria Santos', phone: '09987654321', activeLoans: 1, status: 'ACTIVE' },
  { id: 'BR-1047', name: 'Ana Lopez', phone: '09223334455', activeLoans: 1, status: 'REVIEW' },
];

const seedReviews: Review[] = [
  { id: 'r1', borrower: 'Juan Dela Cruz', stars: 5, comment: 'Very smooth process! The loan was approved quickly and the payment schedule is easy to follow.', date: 'October 3, 2026' },
  { id: 'r2', borrower: 'Maria Santos', stars: 4, comment: 'Good experience overall. The app is clean and easy to use. Would like faster approval times.', date: 'October 6, 2026' },
  { id: 'r3', borrower: 'Ana Lopez', stars: 5, comment: 'Excellent service. I was able to track my loan and payments without any confusion. Highly recommended!', date: 'October 9, 2026' },
];

const installments = [
  { number: 1, due: 'Oct 15', amount: 3667, status: 'PAID' },
  { number: 2, due: 'Nov 15', amount: 3667, status: 'PENDING' },
  { number: 3, due: 'Dec 15', amount: 3666, status: 'PENDING' },
];

const todayLong = new Intl.DateTimeFormat('en-US', {
  month: 'long', day: 'numeric', year: 'numeric',
}).format(new Date());

// ─── Helpers ──────────────────────────────────────────────────────────────────

function money(value: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency', currency: 'PHP', maximumFractionDigits: 0,
  }).format(value);
}

function initials(name: string, max = 2) {
  return name.split(' ').map((p) => p[0]).slice(0, max).join('');
}

// ─── Design tokens — light & dark ────────────────────────────────────────────

const palettes = {
  light: {
    navy: '#103B5D',
    navyDeep: '#0A2B45',
    green: '#15934B',
    greenDark: '#08783B',
    greenPale: '#E8F5EE',
    greenMid: '#D0EDDB',
    background: '#F4F6F5',
    surface: '#FFFFFF',
    text: '#152B38',
    muted: '#6B7C85',
    mutedLight: '#9AAAB3',
    line: '#DFE7E3',
    amber: '#C47A13',
    amberPale: '#FDF3E3',
    red: '#C0392B',
    redPale: '#FDECEA',
  },
  dark: {
    // In dark mode, navy becomes a soft off-white — not bright blue
    navy: '#D4DFE8',
    navyDeep: '#E8EDF2',
    // Green stays as the single accent — slightly muted so it doesn't shout
    green: '#3DB065',
    greenDark: '#2E9954',
    greenPale: '#0A1F12',
    greenMid: '#0E2518',
    // Backgrounds — dark grays, not full black
    background: '#111315',
    surface: '#1C1F22',
    // Text
    text: '#DCE4EA',
    muted: '#7A8D99',
    mutedLight: '#4A5E6A',
    // Borders — subtle, not noticeable
    line: '#252B30',
    // Status colors — same hue, reduced brightness
    amber: '#C98A28',
    amberPale: '#1E1508',
    red: '#C94A4A',
    redPale: '#200B0B',
  },
} as const;

type Palette = typeof palettes.light;

// palette constant for StyleSheet.create() — always light (dark mode via inline styles + ThemeContext)
const palette = palettes.light;

// ─── Theme context ────────────────────────────────────────────────────────────

const ThemeContext = React.createContext<Palette>(palettes.light);

// ─── Shared components ────────────────────────────────────────────────────────

function AppIcon({ name, size = 20, color }: {
  name: IconName; size?: number; color?: string;
}) {
  const palette = React.useContext(ThemeContext);
  const resolvedColor = color ?? p.navy;
  const s = { stroke: resolvedColor, strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityLabel={name}>
      {name === 'bell' && (<>
        <Path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" {...s} />
        <Path d="M10 21h4" {...s} />
      </>)}
      {name === 'home' && <Path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" {...s} />}
      {name === 'file' && (<>
        <Path d="M6 3h8l5 5v13H6z" {...s} />
        <Path d="M14 3v6h5M9 13h7M9 17h7" {...s} />
      </>)}
      {name === 'users' && (<>
        <Circle cx="9" cy="8" r="3.5" {...s} />
        <Path d="M2.5 20c.5-3.5 2.7-5.5 6.5-5.5s6 2 6.5 5.5M16 5a3.5 3.5 0 0 1 0 6.8M17 14.5c2.5.6 3.9 2.4 4.4 5.5" {...s} />
      </>)}
      {name === 'wallet' && (<>
        <Path d="M4 6h15a2 2 0 0 1 2 2v11H5a2 2 0 0 1-2-2V6a3 3 0 0 1 3-3h12" {...s} />
        <Path d="M16 12h5M17 12v.1" {...s} />
      </>)}
      {name === 'calendar' && (<>
        <Path d="M4 5h16v16H4zM8 3v4M16 3v4M4 10h16" {...s} />
        <Path d="m8 15 2 2 5-5" {...s} />
      </>)}
      {name === 'arrow' && <Path d="M5 12h14m-6-6 6 6-6 6" {...s} />}
      {name === 'check' && <Path d="m5 12 4 4L19 6" {...s} />}
      {name === 'clock' && (<>
        <Circle cx="12" cy="12" r="9" {...s} />
        <Path d="M12 7v5l3 2" {...s} />
      </>)}
      {name === 'back' && <Path d="m15 18-6-6 6-6" {...s} />}
      {name === 'shield' && (<>
        <Path d="M12 3 4 7v5c0 5 3.6 9.3 8 10.3C16.4 21.3 20 17 20 12V7z" {...s} />
        <Path d="m9 12 2 2 4-4" {...s} />
      </>)}
      {name === 'star' && (
        <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
          stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
          fill={color === 'currentColor' || color?.includes('#F') ? color : 'none'} />
      )}
    </Svg>
  );
}

function BrandMark({ size = 'full', light = false }: { size?: 'full' | 'compact'; light?: boolean }) {
  const p = useContext(ThemeContext);
  const compact = size === 'compact';
  const navyColor = light ? '#FFFFFF' : p.navy;
  const greenColor = light ? '#A5E1B6' : p.green;
  return (
    <View style={compact ? sh.brandLockupCompact : sh.brandLockup}>
      <Svg width={compact ? 36 : 96} height={compact ? 32 : 80} viewBox="0 0 120 100">
        <Path d="M17 12c-6 0-10 4-10 10v43c0 16 12 27 29 27h34c7 0 13-3 18-8l17-17c3-3 3-8 0-11-3-3-8-3-11 0L79 71c-3 3-6 4-10 4H45c-5 0-8-4-8-9V23c0-7-5-11-10-11z" fill={navyColor} />
        <Path d="M43 48V17c0-5 5-7 9-4l22 20 22-20c4-3 9-1 9 4v42" fill="none" stroke={greenColor} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        <Ellipse cx="75" cy="53" rx="13" ry="5.5" fill={greenColor} />
        <Path d="M62 53v8c0 3 6 5 13 5s13-2 13-5v-8c0 3-6 5-13 5s-13-2-13-5z" fill={greenColor} />
        <Path d="M62 62v7c0 3 6 5 13 5s13-2 13-5v-7c0 3-6 5-13 5s-13-2-13-5z" fill={greenColor} />
      </Svg>
      {!compact && (
        <Text style={sh.wordmark}>
          <Text style={[sh.wordmarkNavy, { color: light ? p.surface : p.navy }]}>Lend</Text>
          <Text style={[sh.wordmarkGreen, { color: light ? '#A5E1B6' : p.green }]}>Mate</Text>
        </Text>
      )}
    </View>
  );
}

function Btn({
  title, onPress, disabled = false, variant = 'primary', size = 'md',
}: {
  title: string; onPress: () => void; disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
}) {
  const p = useContext(ThemeContext);
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        sh.btn,
        size === 'sm' && sh.btnSm,
        variant === 'primary' && [sh.btnPrimary, { backgroundColor: p.green, shadowColor: p.green }],
        variant === 'secondary' && [sh.btnSecondary, { backgroundColor: p.surface, borderColor: p.green }],
        variant === 'ghost' && sh.btnGhost,
        variant === 'danger' && [sh.btnDanger, { backgroundColor: p.redPale, borderColor: p.red }],
        disabled && sh.btnDisabled,
        pressed && !disabled && sh.btnPressed,
      ]}
    >
      {({ pressed }) => (
        <Text style={[
          sh.btnText,
          size === 'sm' && sh.btnTextSm,
          variant === 'secondary' && [sh.btnTextSecondary, { color: p.greenDark }],
          variant === 'ghost' && [sh.btnTextGhost, { color: p.navy }],
          variant === 'danger' && [sh.btnTextDanger, { color: p.red }],
          pressed && !disabled && variant === 'primary' && sh.btnTextPressed,
        ]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

function PageTitle({ title, subtitle, onBack }: {
  title: string; subtitle?: string; onBack?: () => void;
}) {
  const p = useContext(ThemeContext);
  return (
    <View style={sh.pageTitleRow}>
      {onBack && (
        <Pressable
          accessibilityLabel="Go back"
          onPress={onBack}
          style={({ pressed }) => [sh.backBtn, { backgroundColor: p.background }, pressed && sh.backBtnPressed]}
        >
          <AppIcon name="back" size={20} color={p.navy} />
        </Pressable>
      )}
      <View style={sh.pageTitleCopy}>
        <Text style={[sh.pageTitleText, { color: p.navy }]}>{title}</Text>
        {subtitle && <Text style={[sh.pageTitleSub, { color: p.muted }]}>{subtitle}</Text>}
      </View>
    </View>
  );
}

function InputField({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize = 'sentences',
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words';
}) {
  const p = useContext(ThemeContext);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);
  const isPassword = !!secureTextEntry;
  return (
    <View style={sh.fieldWrap}>
      <Text style={[sh.fieldLabel, { color: p.text }]}>{label}</Text>
      <View style={[sh.inputWrap, { backgroundColor: p.surface, borderColor: focused ? p.green : p.line }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder ?? label}
          placeholderTextColor={p.mutedLight}
          secureTextEntry={isPassword && !visible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[sh.inputInner, { color: p.text }]}
        />
        {isPassword && (
          <Pressable onPress={() => setVisible((v) => !v)} style={sh.eyeBtn} accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
            <Svg width={18} height={18} viewBox="0 0 24 24">
              {visible ? (<>
                <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke={p.muted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke={p.muted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" stroke={p.muted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Path d="m1 1 22 22" stroke={p.muted} strokeWidth="1.75" strokeLinecap="round" fill="none" />
              </>) : (<>
                <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={p.muted} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <Circle cx="12" cy="12" r="3" stroke={p.muted} strokeWidth="1.75" fill="none" />
              </>)}
            </Svg>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function DetailRow({ label, value, last = false }: {
  label: string; value: string; last?: boolean;
}) {
  const p = useContext(ThemeContext);
  return (
    <View style={[sh.detailRow, last && sh.detailRowLast, { borderBottomColor: p.line }]}>
      <Text style={[sh.detailLabel, { color: p.muted }]}>{label}</Text>
      <Text style={[sh.detailValue, { color: p.text }]}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const p = useContext(ThemeContext);
  const isGreen = ['ACTIVE', 'APPROVED', 'PAID'].includes(status);
  const isRed = status === 'REJECTED';
  const bg = isGreen ? p.greenPale : isRed ? p.redPale : p.amberPale;
  const color = isGreen ? p.greenDark : isRed ? p.red : p.amber;
  return (
    <View style={[sh.badge, { backgroundColor: bg }]}>
      <Text style={[sh.badgeText, { color }]}>{status}</Text>
    </View>
  );
}

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  const p = useContext(ThemeContext);
  return (
    <View style={[sh.avatar, large && sh.avatarLarge, { backgroundColor: p.greenMid }]}>
      <Text style={[sh.avatarText, large && sh.avatarTextLarge, { color: p.greenDark }]}>{initials(name)}</Text>
    </View>
  );
}

function LoadingOverlay({ visible, message = 'Setting up your account…' }: {
  visible: boolean; message?: string;
}) {
  const p = useContext(ThemeContext);
  const dot1 = useRef(new (require('react-native').Animated.Value)(0.3)).current;
  const dot2 = useRef(new (require('react-native').Animated.Value)(0.3)).current;
  const dot3 = useRef(new (require('react-native').Animated.Value)(0.3)).current;
  useEffect(() => {
    if (!visible) return;
    const Animated = require('react-native').Animated;
    const anims = [dot1, dot2, dot3].map((dot, i) =>
      Animated.loop(Animated.sequence([
        Animated.delay(i * 140),
        Animated.timing(dot, { toValue: 1, duration: 320, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(dot, { toValue: 0.3, duration: 320, useNativeDriver: Platform.OS !== 'web' }),
      ]))
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [visible, dot1, dot2, dot3]);
  if (!visible) return null;
  const { Animated } = require('react-native');
  return (
    <View style={[sh.loadingOverlay, { backgroundColor: p.surface + 'F7' }]}>
      <View style={sh.loadingCard}>
        <View style={sh.loadingLogoWrap}>
          <Svg width={52} height={44} viewBox="0 0 120 100">
            <Path d="M17 12c-6 0-10 4-10 10v43c0 16 12 27 29 27h34c7 0 13-3 18-8l17-17c3-3 3-8 0-11-3-3-8-3-11 0L79 71c-3 3-6 4-10 4H45c-5 0-8-4-8-9V23c0-7-5-11-10-11z" fill={p.navy} />
            <Path d="M43 48V17c0-5 5-7 9-4l22 20 22-20c4-3 9-1 9 4v42" fill="none" stroke={p.green} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
            <Ellipse cx="75" cy="53" rx="13" ry="5.5" fill={p.green} />
            <Path d="M62 53v8c0 3 6 5 13 5s13-2 13-5v-8c0 3-6 5-13 5s-13-2-13-5z" fill={p.green} />
            <Path d="M62 62v7c0 3 6 5 13 5s13-2 13-5v-7c0 3-6 5-13 5s-13-2-13-5z" fill={p.green} />
          </Svg>
        </View>
        <Text style={sh.loadingTitle}>
          <Text style={{ color: p.navy }}>Lend</Text>
          <Text style={{ color: p.green }}>Mate</Text>
        </Text>
        <Text style={[sh.loadingMessage, { color: p.muted }]}>{message}</Text>
        <View style={sh.loadingDots}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[sh.loadingDot, { opacity: dot, backgroundColor: p.green }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

function LogoutModal({ visible, onConfirm, onCancel }: {
  visible: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  const p = useContext(ThemeContext);
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <Pressable style={sh.modalBackdrop} onPress={onCancel}>
        <Pressable style={[sh.modalCard, { backgroundColor: p.surface }]} onPress={() => {}}>
          <View style={[sh.modalIconWrap, { backgroundColor: p.redPale }]}>
            <AppIcon name="back" size={22} color={p.red} />
          </View>
          <Text style={[sh.modalTitle, { color: p.navy }]}>Log Out</Text>
          <Text style={[sh.modalBody, { color: p.muted }]}>Are you sure you want to log out of your LendMate account?</Text>
          <View style={sh.modalActions}>
            <Pressable style={({ pressed }) => [sh.modalBtnCancel, { backgroundColor: p.background, borderColor: p.line }, pressed && sh.modalBtnCancelPressed]} onPress={onCancel}>
              <Text style={[sh.modalBtnCancelText, { color: p.navy }]}>Cancel</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [sh.modalBtnConfirm, pressed && sh.modalBtnConfirmPressed]} onPress={onConfirm}>
              <Text style={sh.modalBtnConfirmText}>Log Out</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Terms screen ─────────────────────────────────────────────────────────────

function TermsScreen({ onAgree }: { role: Role; onAgree: () => void }) {
  const p = useContext(ThemeContext);
  const scrollRef = useRef<ScrollView>(null);
  const [reachedBottom, setReachedBottom] = useState(false);
  const [checked, setChecked] = useState(false);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 40) {
      setReachedBottom(true);
    }
  };

  const ready = reachedBottom && checked;

  const sections = [
    ['1. Acceptance of Terms', 'By accessing and using the LendMate application, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use the service. These terms apply to all users including borrowers, administrators, and any other persons who access the platform.'],
    ['2. Description of Service', 'LendMate is a loan management platform that facilitates the process of applying for, tracking, and repaying loans. The service is intended solely for use within the Philippines and is subject to applicable local financial regulations. LendMate does not guarantee the availability of any loan product at any time.'],
    ['3. Eligibility', 'To use this service you must be at least 18 years of age, a resident of the Philippines with a valid government-issued identification, and have the legal capacity to enter into a binding contract. By registering, you represent and warrant that you meet all eligibility requirements.'],
    ['4. Account Registration', 'You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate and complete. LendMate reserves the right to suspend or terminate accounts where false information is detected.'],
    ['5. Loan Applications', "Submitting a loan application does not guarantee approval. All applications are subject to review and approval by LendMate's lending team. Approved loan amounts, interest rates, and repayment terms are final and communicated through the application. Misrepresentation of information in a loan application is grounds for immediate rejection and possible legal action."],
    ['6. Repayment Obligations', 'By accepting a loan, you agree to repay the full principal plus applicable interest according to the agreed schedule. Late or missed payments may result in additional fees, negative reporting to credit bureaus, and legal proceedings to recover the outstanding amount. It is your responsibility to ensure payments are submitted on time.'],
    ['7. Data Privacy', 'LendMate collects and processes your personal data in accordance with the Philippine Data Privacy Act of 2012 (Republic Act No. 10173). Your information may be used to assess your creditworthiness, process your application, and communicate account updates. We do not sell your personal data to third parties. You have the right to access, correct, and request deletion of your personal data.'],
    ['8. Prohibited Conduct', 'You agree not to use the platform for any unlawful purpose, to submit fraudulent applications, to impersonate another person, or to attempt unauthorized access to any part of the system. Any violation of these prohibitions may result in immediate account termination and referral to appropriate authorities.'],
    ['9. Limitation of Liability', 'LendMate shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service. The platform is provided on an "as is" basis. We make no warranties, expressed or implied, regarding the accuracy, reliability, or suitability of the service for any particular purpose.'],
    ['10. Amendments', 'LendMate reserves the right to modify these Terms and Conditions at any time. Users will be notified of material changes via in-app notification or email. Continued use of the service after amendments constitutes acceptance of the updated terms. It is your responsibility to review the terms periodically.'],
    ['11. Governing Law', 'These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any disputes arising from the use of the service shall be subject to the exclusive jurisdiction of the courts of the Philippines.'],
    ['12. Contact', 'For questions or concerns regarding these terms, contact LendMate support at support@lendmate.ph or through the in-app help center.'],
  ];

  return (
    <View style={[sh.flex, { backgroundColor: p.background }]}>
      {/* Header */}
      <View style={[sh.termsHeader, { backgroundColor: p.surface, borderBottomColor: p.line }]}>
        <View style={[sh.termsIconBg, { backgroundColor: p.greenPale }]}>
          <AppIcon name="shield" size={22} color={p.green} />
        </View>
        <View style={sh.termsHeaderCopy}>
          <Text style={[sh.termsHeaderTitle, { color: p.navy }]}>Terms &amp; Conditions</Text>
          <Text style={[sh.termsHeaderSub, { color: p.muted }]}>Read all sections before continuing.</Text>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        ref={scrollRef}
        style={[sh.termsScroll, { backgroundColor: p.background }]}
        contentContainerStyle={sh.termsBody}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator
      >
        <Text style={[sh.termsEffective, { color: p.mutedLight }]}>Effective October 11, 2026</Text>
        {sections.map(([heading, body]) => (
          <View key={heading} style={sh.termsSection}>
            <Text style={[sh.termsSectionTitle, { color: p.navy }]}>{heading}</Text>
            <Text style={[sh.termsSectionBody, { color: p.text }]}>{body}</Text>
          </View>
        ))}
        <View style={[sh.termsEndMark, { borderTopColor: p.line }]}>
          <AppIcon name="check" size={16} color={p.greenDark} />
          <Text style={[sh.termsEndMarkText, { color: p.greenDark }]}>End of Terms &amp; Conditions</Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[sh.termsFooter, { backgroundColor: p.surface, borderTopColor: p.line }]}>
        {!reachedBottom && (
          <View style={sh.termsHint}>
            <Text style={[sh.termsHintText, { color: p.mutedLight }]}>Scroll down to read all terms ↓</Text>
          </View>
        )}
        <Pressable
          style={sh.termsCheckRow}
          onPress={() => reachedBottom && setChecked((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
        >
          <View style={[sh.checkbox, { borderColor: reachedBottom ? p.green : p.line, backgroundColor: checked ? p.green : p.surface }]}>
            {checked && <AppIcon name="check" size={12} color={p.surface} />}
          </View>
          <Text style={[sh.checkboxLabel, { color: reachedBottom ? p.text : p.mutedLight }]}>
            I have read and agree to the Terms &amp; Conditions
          </Text>
        </Pressable>
        <Btn title="I Agree & Continue" onPress={onAgree} disabled={!ready} />
      </View>
    </View>
  );
}

// ─── Bottom navigation bar ────────────────────────────────────────────────────

function NavBar({ role, screen, onSelect }: {
  role: Role; screen: Screen; onSelect: (s: Screen) => void;
}) {
  const p = useContext(ThemeContext);
  const items: { label: string; icon: IconName; screen: Screen }[] =
    role === 'borrower'
      ? [
        { label: 'Home', icon: 'home', screen: 'dashboard' },
        { label: 'My Loan', icon: 'wallet', screen: 'loan-details' },
        { label: 'Schedule', icon: 'calendar', screen: 'schedule' },
        { label: 'History', icon: 'file', screen: 'payments' },
      ]
      : [
        { label: 'Overview', icon: 'home', screen: 'admin-dashboard' },
        { label: 'Applications', icon: 'file', screen: 'admin-applications' },
        { label: 'Borrowers', icon: 'users', screen: 'admin-borrowers' },
        { label: 'Loans', icon: 'wallet', screen: 'admin-loans' },
      ];

  return (
    <View style={[sh.navbar, { backgroundColor: p.surface, borderTopColor: p.line }]}>
      {items.map((item) => {
        const active = item.screen === screen ||
          (screen === 'application-status' && item.screen === 'dashboard');
        return (
          <Pressable
            key={item.label}
            onPress={() => onSelect(item.screen)}
            style={({ pressed }) => [sh.navItem, pressed && sh.navItemPressed]}
          >
            <View style={sh.navIconWrap}>
              <AppIcon name={item.icon} size={18} color={active ? p.green : p.muted} />
            </View>
            <Text style={[sh.navLabel, { color: active ? p.green : p.muted }, active && sh.navLabelActive]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main app ─────────────────────────────────────────────────────────────────

export default function LendMateApp() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [role, setRole] = useState<Role>('borrower');
  const [isDark, setIsDark] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<UserProfile | null>(null);
  // Prevents onAuthChange from hijacking navigation when we're already handling it
  const skipAuthRedirect = useRef(false);

  const [notifications, setNotifications] = useState([
    { id: 'n1', title: 'Payment reminder', detail: '₱1,100 due October 15, 2026', icon: 'calendar' as const, read: false },
    { id: 'n2', title: 'Application under review', detail: 'Application #10025 is being reviewed.', icon: 'file' as const, read: false },
    { id: 'n3', title: 'Payment received', detail: 'Your October 1 payment was recorded.', icon: 'check' as const, read: true },
  ]);
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
  // ────────────────────────────────────────────────────────────────────────────
  const [formError, setFormError] = useState('');
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleResponse]);
  // ── Sync palette with dark mode ──────────────────────────────────────────────
  const p = isDark ? palettes.dark : palettes.light;

  const toggleDark = () => setIsDark((v) => !v);
  const [loanProduct, setLoanProduct] = useState('Personal Loan');
  const [loanAmount, setLoanAmount] = useState('10000');
  const [loanTerm, setLoanTerm] = useState(3);
  const [loanPurpose, setLoanPurpose] = useState('Emergency');
  const [application, setApplication] = useState(initialApplication);
  const [applicationDecision, setApplicationDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState('GCash');
  const [payRef, setPayRef] = useState('');
  const [payError, setPayError] = useState('');
  const [loanRemaining, setLoanRemaining] = useState(7500);
  const [selectedBorrower, setSelectedBorrower] = useState(borrowers[0]);
  const [adminApps, setAdminApps] = useState(adminApplications);
  const [adminLoans, setAdminLoans] = useState(initialAdminLoans);
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<AdminLoanRecord>(initialAdminLoans[0]);
  const [reviews, setReviews] = useState<Review[]>(seedReviews);
  const [reviewStars, setReviewStars] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const goTo = (target: Screen) => { setFormError(''); setScreen(target); };

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
    if (isNaN(dob.getTime())) {
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
      goTo('terms');
    } else {
      skipAuthRedirect.current = false;
      setFormError(result.error);
    }
  };

  const handleLogout = async () => {
    skipAuthRedirect.current = false;
    setShowLogout(false);
    await signOut();
    setFirebaseUser(null);
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setTermsAccepted(false);
    goTo('splash');
  };

  const submitApplication = () => {
    const amount = Number(loanAmount.replace(/,/g, ''));
    if (!amount || amount < 1000 || amount > 500000) {
      setFormError('Enter a loan amount from ₱1,000 to ₱500,000.');
      return;
    }
    const appId = String(10026 + adminApps.filter((r) => Number(r.id) >= 10026).length);
    setApplication({ id: appId, borrower: fullName, amount, product: loanProduct, status: 'UNDER REVIEW' });
    setAdminApps((prev) => [{ id: appId, borrower: fullName, amount, product: loanProduct, status: 'PENDING' }, ...prev]);
    setApplicationDecision(null);
    goTo('application-status');
  };

  const decide = (record: ApplicationRecord, status: 'APPROVED' | 'REJECTED') => {
    const updated = { ...record, status };
    setAdminApps((prev) => prev.map((item) => item.id === record.id ? updated : item));
    setSelectedApp(updated);
    if (record.id === application.id) { setApplication({ ...application, status }); setApplicationDecision(status); }
    if (status === 'APPROVED') {
      const newLoan: AdminLoanRecord = {
        id: `1${record.id}`, borrower: record.borrower, amount: record.amount,
        interest: Math.round(record.amount * 0.1), term: 3,
        remaining: Math.round(record.amount * 0.75), status: 'ACTIVE',
      };
      setAdminLoans((prev) => [newLoan, ...prev]);
      setSelectedLoan(newLoan);
    }
  };

  const monthlyEst = Math.round((Number(loanAmount.replace(/,/g, '')) * 1.05) / loanTerm);

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
          style={({ pressed }) => [sh.headerIconBtn, { backgroundColor: isDark ? '#2A3038' : p.background, borderColor: p.line }, pressed && sh.headerIconBtnPressed]}
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
            style={({ pressed }) => [sh.headerIconBtn, { backgroundColor: isDark ? '#2A3038' : p.background, borderColor: p.line }, pressed && sh.headerIconBtnPressed]}
            onPress={() => goTo('notifications')}
            accessibilityLabel="Notifications"
          >
            <AppIcon name="bell" size={19} color={p.navy} />
            <View style={sh.notifDot} />
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
        <Btn title="Get Started" onPress={() => goTo('login')} />
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

          <Pressable style={sh.forgotRow} onPress={() => setFormError('A password reset email will be sent to your address.')}>
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

    return (
      <View style={[sh.flex, { backgroundColor: p.background }]}>
        <Header />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
          <PageTitle title="Reviews" subtitle="All borrower ratings and comments." onBack={() => goTo('admin-dashboard')} />

          {/* Aggregate hero */}
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

          {/* Individual reviews */}
          {reviews.map((r) => (
            <View key={r.id} style={[sh.reviewCard, { backgroundColor: p.surface, borderColor: p.line }]}>
              <View style={sh.reviewCardHead}>
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
            </View>
          ))}

          {reviews.length === 0 && (
            <View style={sh.reviewEmpty}>
              <Text style={[sh.reviewEmptyText, { color: p.muted }]}>No reviews yet.</Text>
            </View>
          )}
        </ScrollView>
        <NavBar role="admin" screen={screen} onSelect={goTo} />
      </View>
    );
  };

  // ── Admin Payments screen ─────────────────────────────────────────────────────
  const renderAdminPayments = () => {
    const allPayments = [
      { id: 'PAY-001', borrower: 'Juan Dela Cruz', loanId: '10025', amount: 3667, date: 'October 1, 2026', method: 'Bank Transfer', status: 'PAID' },
      { id: 'PAY-002', borrower: 'Maria Santos', loanId: '10024', amount: 5000, date: 'October 8, 2026', method: 'GCash', status: 'PAID' },
      { id: 'PAY-003', borrower: 'Christian Santiago', loanId: '10025', amount: 1100, date: 'October 11, 2026', method: 'GCash · Ref. LM-10025', status: 'PENDING VERIFICATION' },
      { id: 'PAY-004', borrower: 'Ana Lopez', loanId: '10023', amount: 3667, date: 'September 15, 2026', method: 'Bank Transfer', status: 'PAID' },
      { id: 'PAY-005', borrower: 'Ana Lopez', loanId: '10023', amount: 3667, date: 'October 10, 2026', method: 'Over the counter', status: 'PAID' },
    ];

    const totalPaid = allPayments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingCount = allPayments.filter((p) => p.status === 'PENDING VERIFICATION').length;

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
  const renderDashboard = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]} showsVerticalScrollIndicator={false}>
        <View style={sh.greeting}>
          <Text style={[sh.greetingTitle, { color: p.navy }]}>Good morning, {fullName.split(' ')[0]} 👋</Text>
          <Text style={[sh.greetingSub, { color: p.muted }]}>Here's your loan at a glance.</Text>
        </View>

        {/* Hero card — always dark navy, unchanged */}
        <View style={sh.heroCard}>
          <View style={sh.heroCardTop}>
            <Text style={sh.heroEyebrow}>ACTIVE LOAN</Text>
            <StatusBadge status="ACTIVE" />
          </View>
          <Text style={sh.heroAmount}>{money(10000)}</Text>
          <Text style={sh.heroCaption}>Personal Loan · #10025</Text>
          <View style={sh.heroDivider} />
          <View style={sh.heroBottom}>
            <View>
              <Text style={sh.heroSmallLabel}>Remaining principal</Text>
              <Text style={sh.heroBalance}>{money(6500)}</Text>
            </View>
            <View style={sh.heroIconBubble}>
              <AppIcon name="wallet" size={20} color={p.greenPale} />
            </View>
          </View>
        </View>

        {/* Next payment */}
        <Pressable style={({ pressed }) => [sh.nextPayCard, { backgroundColor: p.surface, borderColor: p.line }, pressed && sh.cardPressed]} onPress={() => goTo('schedule')}>
          <View style={[sh.nextPayIcon, { backgroundColor: p.greenPale }]}>
            <AppIcon name="calendar" size={18} color={p.green} />
          </View>
          <View style={sh.nextPayCopy}>
            <Text style={[sh.eyebrowSmall, { color: p.muted }]}>NEXT PAYMENT DUE</Text>
            <Text style={[sh.nextPayAmount, { color: p.navy }]}>{money(1100)}</Text>
            <Text style={[sh.nextPayDate, { color: p.muted }]}>October 15, 2026</Text>
          </View>
          <AppIcon name="arrow" size={17} color={p.muted} />
        </Pressable>

        {/* Actions */}
        <View style={sh.actionRow}>
          <Btn title="Apply for Loan" onPress={() => goTo('apply')} />
          <Btn title="View Loan" onPress={() => goTo('loan-details')} variant="secondary" />
        </View>

        <Pressable style={({ pressed }) => [sh.ghostRow, pressed && { backgroundColor: p.greenPale }]} onPress={() => goTo('payments')}>
          <AppIcon name="file" size={16} color={p.navy} />
          <Text style={[sh.ghostRowText, { color: p.navy }]}>Payment History</Text>
          <AppIcon name="arrow" size={15} color={p.muted} />
        </Pressable>

        {/* Application summary */}
        <View style={sh.sectionRow}>
          <Text style={[sh.sectionLabel, { color: p.navy }]}>Application</Text>
          <Pressable onPress={() => goTo('application-status')}><Text style={[sh.sectionLink, { color: p.greenDark }]}>View</Text></Pressable>
        </View>
        <Pressable style={({ pressed }) => [sh.summaryCard, { backgroundColor: p.surface, borderColor: p.line }, pressed && sh.cardPressed]} onPress={() => goTo('application-status')}>
          <View style={[sh.summaryIcon, { backgroundColor: p.greenPale }]}><AppIcon name="file" size={17} color={p.green} /></View>
          <View style={sh.summaryCopy}>
            <Text style={[sh.summaryTitle, { color: p.text }]}>Application #{application.id}</Text>
            <Text style={[sh.summarySub, { color: p.muted }]}>Submitted {application.id === '10025' ? 'October 2, 2026' : todayLong}</Text>
          </View>
          <StatusBadge status={applicationDecision ?? application.status} />
        </Pressable>

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

  // ── Apply ────────────────────────────────────────────────────────────────────
  const renderApply = () => {
    const amt = Number(loanAmount.replace(/,/g, '')) || 0;
    return (
      <>
        <Header bell={false} />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]} keyboardShouldPersistTaps="handled">
          <PageTitle title="Apply for a Loan" subtitle="Choose product, amount, and term." onBack={() => goTo('dashboard')} />

          <Text style={sh.fieldLabel}>Loan Product</Text>
          <View style={sh.choiceList}>
            {[['Personal Loan', 'Flexible use'], ['Business Loan', 'Grow your business'], ['Education Loan', 'School expenses']].map(([p, note]) => (
              <Pressable key={p} onPress={() => setLoanProduct(p)} style={[sh.choiceRow, loanProduct === p && sh.choiceRowActive]}>
                <View style={[sh.radio, loanProduct === p && sh.radioActive]}>
                  {loanProduct === p && <View style={sh.radioDot} />}
                </View>
                <View style={sh.choiceCopy}>
                  <Text style={[sh.choiceTitle, { color: p.text }]}>{p}</Text>
                  <Text style={[sh.choiceNote, { color: p.muted }]}>{note}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          <Text style={sh.fieldLabel}>Amount</Text>
          <View style={sh.amountRow}>
            <Text style={sh.currencySign}>₱</Text>
            <TextInput
              value={loanAmount}
              onChangeText={setLoanAmount}
              keyboardType="numeric"
              style={sh.amountInput}
              placeholder="10,000"
              placeholderTextColor={p.mutedLight}
            />
          </View>
          <View style={sh.presets}>
            {[5000, 10000, 20000, 50000].map((p) => (
              <Pressable key={p} onPress={() => setLoanAmount(String(p))} style={[sh.preset, amt === p && sh.presetActive]}>
                <Text style={[sh.presetText, amt === p && sh.presetTextActive]}>{money(p)}</Text>
              </Pressable>
            ))}
          </View>

          <Text style={sh.fieldLabel}>Repayment Term</Text>
          <View style={sh.termRow}>
            {[3, 6, 12].map((t) => (
              <Pressable key={t} onPress={() => setLoanTerm(t)} style={[sh.termChip, loanTerm === t && sh.termChipActive]}>
                <Text style={[sh.termChipNum, loanTerm === t && sh.termChipNumActive]}>{t}</Text>
                <Text style={[sh.termChipLabel, loanTerm === t && sh.termChipLabelActive]}>mo</Text>
              </Pressable>
            ))}
          </View>

          <Text style={sh.fieldLabel}>Purpose</Text>
          <View style={sh.pillRow}>
            {['Emergency', 'Education', 'Medical', 'Business', 'Other'].map((p) => (
              <Pressable key={p} onPress={() => setLoanPurpose(p)} style={[sh.pill, loanPurpose === p && sh.pillActive]}>
                <Text style={[sh.pillText, loanPurpose === p && sh.pillTextActive]}>{p}</Text>
              </Pressable>
            ))}
          </View>

          <View style={[sh.estimateCard, { backgroundColor: p.greenPale }]}>
            <Text style={[sh.estimateLabel, { color: p.greenDark }]}>ESTIMATED MONTHLY PAYMENT</Text>
            <Text style={[sh.estimateAmount, { color: p.navy }]}>{money(monthlyEst)}</Text>
            <Text style={[sh.estimateNote, { color: p.muted }]}>Illustration only. Final terms set after review.</Text>
          </View>

          {formError ? <View style={sh.errorBox}><Text style={sh.errorText}>{formError}</Text></View> : null}
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

        <View style={[sh.statusHero, { backgroundColor: p.greenPale }]}>
          <View style={[sh.statusIcon, { backgroundColor: p.surface }]}>
            <AppIcon name={applicationDecision === 'APPROVED' ? 'check' : 'clock'} size={24} color={p.green} />
          </View>
          <Text style={[sh.statusLabel, { color: p.greenDark }]}>{applicationDecision ?? application.status}</Text>
          <Text style={[sh.statusDesc, { color: p.text }]}>
            {applicationDecision === 'APPROVED' ? 'Your application has been approved.' :
              applicationDecision === 'REJECTED' ? 'Please contact the lending team for next steps.' :
                'Our team is currently reviewing your application.'}
          </Text>
        </View>

        <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
          <DetailRow label="Application #" value={application.id} />
          <DetailRow label="Loan product" value={application.product} />
          <DetailRow label="Amount" value={money(application.amount)} />
          <DetailRow label="Submitted" value={application.id === '10025' ? 'October 2, 2026' : 'October 11, 2026'} />
          <DetailRow label="Status" value={applicationDecision ?? application.status} last />
        </View>

        <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.green }]}>
          <Text style={[sh.infoBoxTitle, { color: p.navy }]}>What happens next?</Text>
          <Text style={[sh.infoBoxBody, { color: p.muted }]}>You'll be notified when your status changes. Keep your profile and supporting documents up to date.</Text>
        </View>

        {applicationDecision === 'APPROVED' && <Btn title="View Approved Loan" onPress={() => goTo('loan-details')} />}
      </ScrollView>
      <NavBar role="borrower" screen={screen} onSelect={goTo} />
    </>
  );

  // ── Loan Details ─────────────────────────────────────────────────────────────
  const renderLoanDetails = () => {
    const paidPercent = Math.round(((11000 - loanRemaining) / 11000) * 100);

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
          <PageTitle title="Loan Details" subtitle="Personal Loan · #10025" onBack={() => goTo('dashboard')} />

          <View style={sh.loanHero}>
            <View style={sh.loanHeroTop}>
              <Text style={sh.heroEyebrow}>LOAN AMOUNT</Text>
              <StatusBadge status={loanRemaining === 0 ? 'PAID' : 'ACTIVE'} />
            </View>
            <Text style={sh.loanHeroAmount}>{money(10000)}</Text>
            <Text style={sh.loanHeroSub}>Remaining balance {money(loanRemaining)}</Text>
            <View style={sh.progressTrack}>
              <View style={[sh.progressFill, { width: `${paidPercent}%` }]} />
            </View>
            <View style={sh.progressLabels}>
              <Text style={sh.progressLabel}>{paidPercent}% paid</Text>
              <Text style={sh.progressLabel}>Released Oct 1, 2026</Text>
            </View>
          </View>

          <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
            <DetailRow label="Principal" value={money(10000)} />
            <DetailRow label="Interest (10%)" value={money(1000)} />
            <DetailRow label="Total Payable" value={money(11000)} />
            <DetailRow label="Remaining" value={money(loanRemaining)} />
            <DetailRow label="Term" value="3 Months" />
            <DetailRow label="Status" value={loanRemaining === 0 ? 'PAID' : 'ACTIVE'} last />
          </View>

          {loanRemaining > 0 && (
            <View style={[sh.payNowCard, { backgroundColor: p.surface, borderColor: p.line }]}>
              <View style={sh.payNowLeft}>
                <Text style={[sh.payNowLabel, { color: p.muted }]}>NEXT INSTALLMENT</Text>
                <Text style={[sh.payNowAmount, { color: p.navy }]}>{money(Math.min(loanRemaining, 3667))}</Text>
                <Text style={[sh.payNowDue, { color: p.muted }]}>Due October 15, 2026</Text>
              </View>
              <View style={sh.payNowActions}>
                <Btn
                  title="Pay Now"
                  onPress={() => { setPayAmount(String(Math.min(loanRemaining, 3667))); setShowPayModal(true); }}
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
  const renderSchedule = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
        <PageTitle title="Payment Schedule" subtitle="Loan #10025 · 3 installments" onBack={() => goTo('loan-details')} />

        <View style={[sh.scheduleBanner, { backgroundColor: p.greenPale }]}>
          <Text style={[sh.eyebrowSmall, { color: p.muted }]}>NEXT DUE</Text>
          <Text style={[sh.scheduleDueDate, { color: p.navy }]}>October 15</Text>
          <Text style={[sh.scheduleDueSub, { color: p.muted }]}>Upcoming installment · {money(1100)} due</Text>
        </View>

        <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
          {installments.map((item, i) => (
            <View key={item.number} style={[sh.installRow, i === installments.length - 1 && sh.installRowLast]}>
              <View style={sh.installNum}>
                <Text style={sh.installNumText}>{String(item.number).padStart(2, '0')}</Text>
              </View>
              <View style={sh.installCopy}>
                <Text style={[sh.installTitle, { color: p.text }]}>Installment {item.number}</Text>
                <Text style={[sh.installDate, { color: p.muted }]}>{item.due}, 2026</Text>
              </View>
              <View style={sh.installRight}>
                <Text style={[sh.installAmount, { color: p.navy }]}>{money(item.amount)}</Text>
                <Text style={[sh.installStatus, item.status === 'PAID' ? sh.paidText : sh.pendingText]}>
                  {item.status}
                </Text>
              </View>
            </View>
          ))}
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

  // ── Payments ─────────────────────────────────────────────────────────────────
  const renderPayments = () => (
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
            { date: 'October 1, 2026', amount: 3667, status: 'PAID', method: 'Bank transfer' },
            {
              date: 'October 11, 2026', amount: 1100,
              status: paymentSubmitted ? 'PENDING VERIFICATION' : 'DUE',
              method: paymentSubmitted ? 'GCash · Ref. LM-10025' : 'Not submitted',
            },
          ].map((p, i, arr) => (
            <View key={p.date} style={[sh.historyRow, i === arr.length - 1 && sh.historyRowLast]}>
              <View style={[sh.historyDot, p.status === 'PAID' ? sh.historyDotPaid : sh.historyDotPending]}>
                <AppIcon name={p.status === 'PAID' ? 'check' : 'clock'} size={14}
                  color={p.status === 'PAID' ? p.greenDark : p.amber} />
              </View>
              <View style={sh.historyCopy}>
                <Text style={[sh.historyDate, { color: p.text }]}>{p.date}</Text>
                <Text style={[sh.historyMethod, { color: p.muted }]}>{p.method}</Text>
              </View>
              <View style={sh.historyRight}>
                <Text style={[sh.historyAmount, { color: p.navy }]}>{money(p.amount)}</Text>
                <Text style={[sh.historyStatus, p.status === 'PAID' ? sh.paidText : sh.pendingText]}>
                  {p.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {!paymentSubmitted && (
          <View style={[sh.callout, { backgroundColor: p.surface, borderColor: p.line }]}>
            <Text style={[sh.calloutTitle, { color: p.navy }]}>Submit a payment</Text>
            <Text style={[sh.calloutBody, { color: p.muted }]}>Demo flow only — no funds are transferred.</Text>
            <Btn title="Submit ₱1,100 Payment" onPress={() => setPaymentSubmitted(true)} />
          </View>
        )}
      </ScrollView>
      <NavBar role="borrower" screen={screen} onSelect={goTo} />
    </>
  );

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
    const activeLoanDelta = adminLoans.filter((l) => l.status === 'ACTIVE').length - initialAdminLoans.filter((l) => l.status === 'ACTIVE').length;
    const pendingDelta = adminApps.filter((a) => a.status === 'PENDING').length - adminApplications.filter((a) => a.status === 'PENDING').length;
    const amountDelta = adminLoans.reduce((t, l) => t + l.amount, 0) - initialAdminLoans.reduce((t, l) => t + l.amount, 0);
    const remainDelta = adminLoans.reduce((t, l) => t + l.remaining, 0) - initialAdminLoans.reduce((t, l) => t + l.remaining, 0);

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
          <View style={sh.adminHead}>
            <Text style={[sh.adminTitle, { color: p.navy }]}>Portfolio Overview</Text>
            <Text style={[sh.adminDate, { color: p.muted }]}>October 11, 2026</Text>
          </View>

          <View style={sh.statsGrid}>
            {[
              ['Borrowers', '152', 'green'],
              ['Active Loans', String(84 + activeLoanDelta), 'navy'],
              ['Pending', String(17 + pendingDelta), 'green'],
              ['Overdue', '9', 'amber'],
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
              <Text style={sh.portfolioAmt}>{money(850000 + amountDelta)}</Text>
            </View>
            <View style={sh.portfolioDivider} />
            <View style={sh.portfolioHalf}>
              <Text style={[sh.eyebrowSmall, { color: p.muted }]}>OUTSTANDING</Text>
              <Text style={sh.portfolioOutstanding}>{money(420500 + remainDelta)}</Text>
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
          <View style={sh.quickGrid}>
            {([
              ['file', 'Applications', 'admin-applications'],
              ['users', 'Borrowers', 'admin-borrowers'],
              ['wallet', 'Loans', 'admin-loans'],
              ['calendar', 'Payments', 'admin-payments'],
            ] as [IconName, string, Screen][]).map(([icon, label, dest]) => (
              <Pressable key={label} onPress={() => goTo(dest)} style={({ pressed }) => [sh.quickCard, { backgroundColor: p.surface, borderColor: p.line }, pressed && sh.cardPressed]}>
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
          <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
            {installments.map((inst, i) => (
              <View key={inst.number} style={[sh.installRow, i === installments.length - 1 && sh.installRowLast, { borderBottomColor: p.line }]}>
                <View style={[sh.installNum, { backgroundColor: p.greenPale }]}>
                  <Text style={[sh.installNumText, { color: p.greenDark }]}>{String(inst.number).padStart(2, '0')}</Text>
                </View>
                <View style={sh.installCopy}>
                  <Text style={[sh.installTitle, { color: p.text }]}>Installment {inst.number}</Text>
                  <Text style={[sh.installDate, { color: p.muted }]}>{inst.due}, 2026 · Juan Dela Cruz</Text>
                </View>
                <View style={sh.installRight}>
                  <Text style={[sh.installAmount, { color: p.navy }]}>{money(inst.amount)}</Text>
                  <Text style={[sh.installStatus, inst.status === 'PAID' ? sh.paidText : sh.pendingText]}>
                    {inst.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── Recent Payment Records ─────────────────────────────────── */}
          <View style={sh.sectionRow}>
            <Text style={[sh.sectionLabel, { color: p.navy }]}>Recent Payments</Text>
          </View>
          <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
            {[
              { borrower: 'Juan Dela Cruz', loanId: '10025', amount: 3667, date: 'October 1, 2026', status: 'PAID' },
              { borrower: 'Maria Santos', loanId: '10024', amount: 5000, date: 'October 8, 2026', status: 'PAID' },
              { borrower: 'Christian Santiago', loanId: '10025', amount: 1100, date: 'October 11, 2026', status: 'PENDING VERIFICATION' },
            ].map((rec, i, arr) => (
              <View key={rec.date + rec.borrower} style={[sh.historyRow, i === arr.length - 1 && sh.historyRowLast, { borderBottomColor: p.line }]}>
                <View style={[sh.historyDot, rec.status === 'PAID' ? sh.historyDotPaid : sh.historyDotPending, { backgroundColor: rec.status === 'PAID' ? p.greenPale : p.amberPale }]}>
                  <AppIcon name={rec.status === 'PAID' ? 'check' : 'clock'} size={14}
                    color={rec.status === 'PAID' ? p.greenDark : p.amber} />
                </View>
                <View style={sh.historyCopy}>
                  <Text style={[sh.historyDate, { color: p.text }]}>{rec.borrower}</Text>
                  <Text style={[sh.historyMethod, { color: p.muted }]}>Loan #{rec.loanId} · {rec.date}</Text>
                </View>
                <View style={sh.historyRight}>
                  <Text style={[sh.historyAmount, { color: p.navy }]}>{money(rec.amount)}</Text>
                  <Text style={[sh.historyStatus, rec.status === 'PAID' ? sh.paidText : sh.pendingText]}>
                    {rec.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>

        </ScrollView>
        <NavBar role="admin" screen={screen} onSelect={goTo} />
      </>
    );
  };

  // ── Admin Applications ────────────────────────────────────────────────────────
  const renderAdminApplications = () => {
    const pendingCount = 17 + adminApps.filter((a) => a.status === 'PENDING').length - adminApplications.filter((a) => a.status === 'PENDING').length;
    const toggleApp = (item: ApplicationRecord) =>
      setSelectedApp((prev) => (prev?.id === item.id ? null : item));

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
          <PageTitle title="Applications" subtitle="Review and process requests." />
          <View style={[sh.filterBar, { borderBottomColor: p.line }]}>
            <Text style={[sh.filterLabel, { color: p.navy }]}>ALL APPLICATIONS</Text>
            <Text style={[sh.filterCount, { color: p.greenDark }]}>{pendingCount} pending</Text>
          </View>
          {adminApps.map((item) => {
            const isOpen = selectedApp?.id === item.id;
            return (
              <View key={item.id} style={[sh.appCard, { backgroundColor: p.surface, borderColor: isOpen ? p.greenMid : p.line }]}>
                <Pressable style={sh.appCardHeader} onPress={() => toggleApp(item)}>
                  <Avatar name={item.borrower} />
                  <View style={sh.appCardCopy}>
                    <Text style={[sh.appCardName, { color: p.text }]}>#{item.id} · {item.borrower}</Text>
                    <Text style={[sh.appCardMeta, { color: p.muted }]}>{money(item.amount)} · {item.product}</Text>
                  </View>
                  <StatusBadge status={item.status} />
                  {/* Chevron shows open/closed state */}
                  <View style={{ marginLeft: 6, transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}>
                    <AppIcon name="arrow" size={15} color={p.muted} />
                  </View>
                </Pressable>

                <View style={sh.appCardActions}>
                  <Pressable onPress={() => toggleApp(item)} style={({ pressed }) => [sh.actionBtnBase, sh.actionBtnView, { borderColor: p.line }, pressed && sh.actionBtnViewPressed]}>
                    <Text style={[sh.actionBtnViewText, { color: p.navy }]}>{isOpen ? 'Close' : 'View'}</Text>
                  </Pressable>
                  {(item.status === 'PENDING' || item.status === 'UNDER REVIEW') && (<>
                    <Pressable onPress={() => decide(item, 'APPROVED')} style={({ pressed }) => [sh.actionBtnBase, sh.actionBtnApprove, pressed && sh.actionBtnApprovePressed]}>
                      <Text style={sh.actionBtnApproveText}>Approve</Text>
                    </Pressable>
                    <Pressable onPress={() => decide(item, 'REJECTED')} style={({ pressed }) => [sh.actionBtnBase, sh.actionBtnReject, pressed && sh.actionBtnRejectPressed]}>
                      <Text style={sh.actionBtnRejectText}>Reject</Text>
                    </Pressable>
                  </>)}
                </View>

                {isOpen && (
                  <View style={[sh.appCardExpanded, { borderTopColor: p.line }]}>
                    <DetailRow label="Applicant" value={item.borrower} />
                    <DetailRow label="Requested" value={money(item.amount)} />
                    <DetailRow label="Product" value={item.product} />
                    <DetailRow label="Status" value={item.status} last />
                    {item.status === 'APPROVED' && <Text style={sh.successTextSmall}>Approved.</Text>}
                    {item.status === 'REJECTED' && <Text style={sh.rejectTextSmall}>Rejected.</Text>}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
        <NavBar role="admin" screen={screen} onSelect={goTo} />
      </>
    );
  };

  // ── Admin Borrowers ───────────────────────────────────────────────────────────
  const renderAdminBorrowers = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
        <PageTitle title="Borrowers" subtitle="Manage borrower records." />
        {borrowers.map((b) => (
          <Pressable
            key={b.id}
            style={({ pressed }) => [sh.borrowerRow, { backgroundColor: p.surface, borderColor: p.line }, pressed && sh.cardPressed]}
            onPress={() => { setSelectedBorrower(b); goTo('admin-borrower-detail'); }}
          >
            <Avatar name={b.name} />
            <View style={sh.borrowerCopy}>
              <Text style={[sh.borrowerName, { color: p.text }]}>{b.name}</Text>
              <Text style={[sh.borrowerMeta, { color: p.muted }]}>{b.phone} · {b.activeLoans} active loan{b.activeLoans !== 1 ? 's' : ''}</Text>
            </View>
            <StatusBadge status={b.status} />
            <AppIcon name="arrow" size={16} color={p.muted} />
          </Pressable>
        ))}
      </ScrollView>
      <NavBar role="admin" screen={screen} onSelect={goTo} />
    </>
  );

  // ── Admin Borrower Detail ─────────────────────────────────────────────────────
  const renderAdminBorrowerDetail = () => (
    <>
      <Header bell={false} />
      <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
        <PageTitle title="Borrower Profile" subtitle={selectedBorrower.id} onBack={() => goTo('admin-borrowers')} />

        {/* Profile header */}
        <View style={[sh.profilePanel, { backgroundColor: p.surface, borderRadius: 16, paddingVertical: 24, marginBottom: 14, borderWidth: 1, borderColor: p.line }]}>
          <Avatar name={selectedBorrower.name} large />
          <Text style={[sh.profileName, { color: p.navy }]}>{selectedBorrower.name}</Text>
          <Text style={[sh.profileMeta, { color: p.muted }]}>{selectedBorrower.status} · {selectedBorrower.activeLoans} active loan{selectedBorrower.activeLoans !== 1 ? 's' : ''}</Text>
        </View>

        {/* Contact & account info */}
        <Text style={[sh.sectionLabel, { color: p.navy, marginBottom: 8 }]}>Account Information</Text>
        <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
          <DetailRow label="Full Name" value={selectedBorrower.name} />
          <DetailRow label="Phone" value={selectedBorrower.phone} />
          <DetailRow label="Borrower ID" value={selectedBorrower.id} />
          <DetailRow label="Active Loans" value={String(selectedBorrower.activeLoans)} />
          <DetailRow label="Status" value={selectedBorrower.status} last />
        </View>

        {/* Government ID section */}
        <Text style={[sh.sectionLabel, { color: p.navy, marginBottom: 8, marginTop: 4 }]}>Government ID on File</Text>
        {idType ? (
          <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
            <DetailRow label="ID Type" value={idType} />
            {idNumber ? <DetailRow label="ID Number" value={idNumber} last={!idPhotoUri} /> : null}
            {idPhotoUri ? (
              <View style={{ paddingVertical: 12 }}>
                <Text style={[sh.fieldHint, { color: p.muted, marginBottom: 8 }]}>ID Photo</Text>
                <Image source={{ uri: idPhotoUri }} style={sh.profileIdPhoto} resizeMode="cover" />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={[sh.infoBox, { backgroundColor: p.surface, borderLeftColor: p.amber }]}>
            <Text style={[sh.infoBoxBody, { color: p.muted }]}>No government ID has been uploaded yet for this borrower.</Text>
          </View>
        )}

        <Btn title="View Loan Records" onPress={() => goTo('admin-loans')} />
      </ScrollView>
      <NavBar role="admin" screen={screen} onSelect={goTo} />
    </>
  );

  // ── Admin Loans ───────────────────────────────────────────────────────────────
  const renderAdminLoans = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
        <PageTitle title="Loan Management" subtitle="Monitor active and completed loans." />
        {adminLoans.map((loan) => (
          <Pressable
            key={loan.id}
            style={({ pressed }) => [sh.loanCard, { backgroundColor: p.surface, borderColor: p.line }, pressed && sh.cardPressed]}
            onPress={() => { setSelectedLoan(loan); goTo('loan-details'); }}
          >
            <View style={sh.loanCardHead}>
              <Text style={[sh.loanCardTitle, { color: p.navy }]}>Loan #{loan.id}</Text>
              <StatusBadge status={loan.status} />
            </View>
            <Text style={[sh.loanCardBorrower, { color: p.muted }]}>{loan.borrower}</Text>
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
          </Pressable>
        ))}
      </ScrollView>
      <NavBar role="admin" screen={screen} onSelect={goTo} />
    </>
  );

  // ── Admin Loan Detail ──────────────────────────────────────────────────────────
  const renderAdminLoanDetail = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
        <PageTitle title="Loan Details" subtitle={`#${selectedLoan.id} · ${selectedLoan.borrower}`} onBack={() => goTo('admin-loans')} />
        <View style={sh.loanHero}>
          <View style={sh.loanHeroTop}>
            <Text style={sh.heroEyebrow}>LOAN AMOUNT</Text>
            <StatusBadge status={selectedLoan.status} />
          </View>
          <Text style={sh.loanHeroAmount}>{money(selectedLoan.amount)}</Text>
          <Text style={sh.loanHeroSub}>Remaining {money(selectedLoan.remaining)}</Text>
        </View>
        <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
          <DetailRow label="Borrower" value={selectedLoan.borrower} />
          <DetailRow label="Principal" value={money(selectedLoan.amount)} />
          <DetailRow label="Interest" value={money(selectedLoan.interest)} />
          <DetailRow label="Total Payable" value={money(selectedLoan.amount + selectedLoan.interest)} />
          <DetailRow label="Remaining" value={money(selectedLoan.remaining)} />
          <DetailRow label="Term" value={`${selectedLoan.term} months`} />
          <DetailRow label="Status" value={selectedLoan.status} last />
        </View>
        <Btn title="View Schedule" onPress={() => goTo('schedule')} />
        <Btn title="Payment History" onPress={() => goTo('payments')} variant="secondary" />
      </ScrollView>
      <NavBar role="admin" screen={screen} onSelect={goTo} />
    </>
  );

  // ── Profile screen ────────────────────────────────────────────────────────────
  const renderProfile = () => (
    <View style={[sh.flex, { backgroundColor: p.background }]}>
      <Header bell={false} />
      <ScrollView contentContainerStyle={[sh.page, { backgroundColor: p.background }]}>
        <PageTitle
          title="My Profile"
          subtitle="Your account details"
          onBack={() => goTo(role === 'admin' ? 'admin-dashboard' : 'dashboard')}
        />

        {/* Avatar + name */}
        <View style={[sh.profilePanel, { backgroundColor: p.surface, borderRadius: 16, paddingVertical: 24, marginBottom: 14, borderWidth: 1, borderColor: p.line }]}>
          <View style={[sh.borrowerLargeInitials, { backgroundColor: p.navy, width: 72, height: 72, borderRadius: 36 }]}>
            <Text style={[sh.borrowerLargeInitialsText, { color: p.surface, fontSize: 22, fontWeight: '800' }]}>
              {role === 'admin' ? 'AD' : initials(fullName || 'U')}
            </Text>
          </View>
          <Text style={[sh.profileName, { color: p.navy, marginTop: 12 }]}>{fullName || '—'}</Text>
          <View style={[sh.badge, { backgroundColor: role === 'admin' ? p.amberPale : p.greenPale, marginTop: 6 }]}>
            <Text style={[sh.badgeText, { color: role === 'admin' ? p.amber : p.greenDark, textTransform: 'capitalize' }]}>
              {role === 'admin' ? 'Administrator' : 'Borrower'}
            </Text>
          </View>
        </View>

        {/* Account info */}
        <Text style={[sh.sectionLabel, { color: p.navy, marginBottom: 8 }]}>Account Information</Text>
        <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
          <DetailRow label="Full Name" value={fullName || '—'} />
          <DetailRow label="Email" value={email || firebaseUser?.email || '—'} />
          <DetailRow label="Phone" value={phone || '—'} />
          <DetailRow label="Role" value={role === 'admin' ? 'Administrator' : 'Borrower'} last />
        </View>

        {/* ID info — borrowers only */}
        {role === 'borrower' && (
          <>
            <Text style={[sh.sectionLabel, { color: p.navy, marginBottom: 8, marginTop: 4 }]}>Government ID</Text>
            <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
              {idType ? (
                <>
                  <DetailRow label="ID Type" value={idType} />
                  {idNumber ? <DetailRow label="ID Number" value={idNumber} last={!idPhotoUri} /> : null}
                  {idPhotoUri ? (
                    <View style={{ paddingVertical: 12 }}>
                      <Text style={[sh.fieldHint, { color: p.muted, marginBottom: 8 }]}>ID Photo</Text>
                      <Image source={{ uri: idPhotoUri }} style={sh.profileIdPhoto} resizeMode="cover" />
                    </View>
                  ) : null}
                </>
              ) : (
                <DetailRow label="ID on file" value="Not uploaded" last />
              )}
            </View>
          </>
        )}

        {/* Registration date */}
        {firebaseUser?.createdAt && (
          <>
            <Text style={[sh.sectionLabel, { color: p.navy, marginBottom: 8, marginTop: 4 }]}>Account</Text>
            <View style={[sh.detailCard, { backgroundColor: p.surface, borderColor: p.line }]}>
              <DetailRow label="Member since" value={todayLong} last />
            </View>
          </>
        )}

        {/* Logout */}
        <View style={{ marginTop: 8 }}>
          <Btn
            title="Log Out"
            variant="danger"
            onPress={() => setShowLogout(true)}
          />
        </View>
      </ScrollView>

      {role === 'borrower' && <NavBar role="borrower" screen={screen} onSelect={goTo} />}
      {role === 'admin' && <NavBar role="admin" screen={screen} onSelect={goTo} />}
    </View>
  );

  // ── Router ────────────────────────────────────────────────────────────────────
  // ── Auth loading gate ───────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <SafeAreaView style={sh.root}>
        <LoadingOverlay visible message="Checking your session…" />
      </SafeAreaView>
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
  else content = renderAdminLoans();

  return (
    <ThemeContext.Provider value={isDark ? palettes.dark : palettes.light}>
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

// ─── Palette & StyleSheet ─────────────────────────────────────────────────────

const sh = StyleSheet.create({
  // layout
  flex: { flex: 1 },
  root: { flex: 1, backgroundColor: palette.background },
  page: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 28 },

  // brand
  brandLockup: { alignItems: 'center' },
  brandLockupCompact: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 36 },
  wordmark: { fontSize: 26, fontWeight: '800' },
  wordmarkNavy: { color: palette.navy },
  wordmarkGreen: { color: palette.green },

  // header
  header: { height: 60, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, backgroundColor: palette.surface, borderBottomWidth: 1, borderBottomColor: palette.line },
  headerBrand: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerWordmark: { fontSize: 19, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  headerIconBtnPressed: { backgroundColor: palette.greenMid },
  notifDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.green, position: 'absolute', top: 7, right: 7, borderWidth: 1.5, borderColor: palette.surface },
  profileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.navy, alignItems: 'center', justifyContent: 'center' },
  profileInitials: { color: palette.surface, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  // buttons
  btn: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 13, paddingHorizontal: 20, marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  btnSm: { minHeight: 38, borderRadius: 9, marginTop: 6 },
  btnPrimary: { backgroundColor: palette.green, shadowColor: palette.green, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnSecondary: { backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.green, shadowOpacity: 0 },
  btnGhost: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  btnDanger: { backgroundColor: palette.redPale, borderWidth: 1.5, borderColor: palette.red, shadowOpacity: 0 },
  btnPressed: { transform: [{ scale: 0.978 }], shadowOpacity: 0.08 },
  btnDisabled: { opacity: 0.42, shadowOpacity: 0 },
  btnText: { color: palette.surface, fontWeight: '700', fontSize: 15, letterSpacing: 0.15 },
  btnTextSm: { fontSize: 13 },
  btnTextSecondary: { color: palette.greenDark },
  btnTextGhost: { color: palette.navy },
  btnTextDanger: { color: palette.red },
  btnTextPressed: { color: '#C8EDD7' },

  // back button
  backBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  backBtnPressed: { backgroundColor: palette.greenMid },

  // page title
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  pageTitleCopy: { flex: 1 },
  pageTitleText: { color: palette.navy, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  pageTitleSub: { color: palette.muted, fontSize: 13, marginTop: 2 },

  // input
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { color: palette.text, fontSize: 13, fontWeight: '700', marginBottom: 4 },
  fieldHint: { color: palette.mutedLight, fontSize: 11, marginBottom: 8 },
  input: { height: 50, borderWidth: 1.5, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 11, paddingHorizontal: 14, color: palette.text, fontSize: 14 },
  inputFocused: { borderColor: palette.green },
  inputWrap: { flexDirection: 'row', alignItems: 'center', height: 50, borderWidth: 1.5, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 11, paddingHorizontal: 14 },
  inputWrapFocused: { borderColor: palette.green },
  inputInner: { flex: 1, color: palette.text, fontSize: 14, height: '100%' },
  eyeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: -6 },

  // date of birth
  dobMonthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  dobMonthCell: { width: '30%', paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: palette.line, backgroundColor: palette.surface, alignItems: 'center' },
  dobMonthCellActive: { borderColor: palette.green, backgroundColor: palette.greenPale },
  dobMonthText: { color: palette.muted, fontSize: 13, fontWeight: '600' },
  dobMonthTextActive: { color: palette.greenDark, fontWeight: '800' },
  dobDayYearRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dobDayYearField: { flex: 1, gap: 6 },
  dobDayYearLabel: { color: palette.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  dobDayYearInput: { height: 50, borderWidth: 1.5, borderColor: palette.line, borderRadius: 11, backgroundColor: palette.surface, textAlign: 'center', color: palette.text, fontSize: 18, fontWeight: '800' },
  dobDayYearSep: { flex: 2, alignItems: 'center', justifyContent: 'center', paddingTop: 18 },
  dobDayYearSepText: { color: palette.navy, fontSize: 14, fontWeight: '700', textAlign: 'center' },

  // government ID grid
  idGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  idGridCell: { width: '47%', padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: palette.line, backgroundColor: palette.surface },
  idGridCellActive: { borderColor: palette.green, backgroundColor: palette.greenPale },
  idGridLabel: { color: palette.text, fontSize: 13, fontWeight: '700' },
  idGridLabelActive: { color: palette.greenDark },
  idGridSub: { color: palette.mutedLight, fontSize: 11, marginTop: 2 },
  idGridSubActive: { color: palette.green },

  // ID photo
  idPhotoActions: { flexDirection: 'row', gap: 10 },
  idPhotoBtn: { flex: 1, height: 90, borderRadius: 13, borderWidth: 1.5, borderColor: palette.line, borderStyle: 'dashed', backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center', gap: 7 },
  idPhotoBtnPressed: { backgroundColor: palette.greenPale, borderColor: palette.green },
  idPhotoBtnText: { color: palette.muted, fontSize: 12, fontWeight: '600', textAlign: 'center' },
  idPhotoPreviewWrap: { borderRadius: 13, overflow: 'hidden', borderWidth: 1.5, borderColor: palette.greenMid },
  idPhotoPreview: { width: '100%', height: 180 },
  idPhotoRetake: { paddingVertical: 10, alignItems: 'center', backgroundColor: palette.greenPale },
  idPhotoRetakeText: { color: palette.greenDark, fontSize: 13, fontWeight: '700' },
  profileIdPhoto: { width: '100%', height: 190, borderRadius: 13, marginTop: 8, borderWidth: 1, borderColor: palette.line },

  // underage screen
  underageScreen: { flex: 1, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 40, gap: 16 },
  underageIconWrap: { width: 80, height: 80, borderRadius: 24, backgroundColor: palette.redPale, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  underageTitle: { color: palette.red, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  underageBody: { color: palette.text, fontSize: 14, lineHeight: 22, textAlign: 'center' },
  underageBold: { fontWeight: '800', color: palette.navy },
  underageLegal: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: palette.background, borderRadius: 12, padding: 14, marginTop: 4 },
  underageLegalText: { flex: 1, color: palette.muted, fontSize: 12, lineHeight: 18 },

  // detail card
  detailCard: { backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 16, marginBottom: 14, overflow: 'hidden' },
  detailRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 50, borderBottomWidth: 1, borderBottomColor: palette.line },
  detailRowLast: { borderBottomWidth: 0 },
  detailLabel: { color: palette.muted, fontSize: 13 },
  detailValue: { color: palette.text, fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' },

  // badge
  badge: { backgroundColor: palette.amberPale, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: palette.amber, fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  badgeGreen: { backgroundColor: palette.greenPale },
  badgeTextGreen: { color: palette.greenDark },
  badgeRed: { backgroundColor: palette.redPale },
  badgeTextRed: { color: palette.red },

  // avatar
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: palette.greenMid, alignItems: 'center', justifyContent: 'center' },
  avatarLarge: { width: 68, height: 68, borderRadius: 34 },
  avatarText: { color: palette.greenDark, fontSize: 12, fontWeight: '800' },
  avatarTextLarge: { fontSize: 20 },

  // navbar
  navbar: { height: 66, flexDirection: 'row', backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.line },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 2 },
  navItemPressed: { opacity: 0.7 },
  navIconWrap: { width: 32, height: 24, alignItems: 'center', justifyContent: 'center' },
  navIconWrapActive: {},
  navLabel: { color: palette.muted, fontSize: 10, fontWeight: '600', marginTop: 3 },
  navLabelActive: { color: palette.green, fontWeight: '800' },

  // splash
  splash: { flex: 1, backgroundColor: palette.surface, paddingHorizontal: 28 },
  splashTop: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  splashTagline: { color: palette.navy, fontSize: 15, fontWeight: '600', textAlign: 'center', lineHeight: 23, marginTop: 8 },
  splashBottom: { paddingBottom: 36, gap: 4 },
  splashFeatures: { gap: 10, marginBottom: 28 },
  splashFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  splashFeatureIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: palette.greenPale, alignItems: 'center', justifyContent: 'center' },
  splashFeatureLabel: { color: palette.text, fontSize: 14, fontWeight: '500' },
  splashNote: { color: palette.muted, fontSize: 13, textAlign: 'center', marginTop: 16 },
  splashNoteLink: { color: palette.greenDark, fontWeight: '700' },

  // auth
  authScroll: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 36 },
  authBrand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 36 },
  authBrandWordmark: { fontSize: 22, fontWeight: '800' },
  authTitle: { color: palette.navy, fontSize: 26, fontWeight: '800', letterSpacing: -0.4 },
  authSub: { color: palette.muted, fontSize: 14, marginTop: 6, marginBottom: 24 },
  roleToggle: { flexDirection: 'row', backgroundColor: '#EDF1EE', borderRadius: 12, padding: 4, gap: 4, marginBottom: 22 },
  roleBtn: { flex: 1, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 9 },
  roleBtnActive: { backgroundColor: palette.surface, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  roleBtnText: { color: palette.muted, fontSize: 12, fontWeight: '600' },
  roleBtnTextActive: { color: palette.navy, fontWeight: '700' },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 18, marginTop: -6 },
  forgotText: { color: palette.greenDark, fontSize: 13, fontWeight: '700' },
  errorBox: { backgroundColor: palette.redPale, borderRadius: 9, padding: 12, marginBottom: 12 },
  errorText: { color: palette.red, fontSize: 13, lineHeight: 18 },
  authSwitchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 22 },
  authSwitchText: { color: palette.muted, fontSize: 13 },
  authSwitchLink: { color: palette.greenDark, fontSize: 13, fontWeight: '700' },
  demoNote: { color: palette.mutedLight, fontSize: 11, textAlign: 'center', marginTop: 24, lineHeight: 16 },

  // ── new login screen (green hero + white card) ─────────────────────────────
  loginScroll: { flexGrow: 1, backgroundColor: palette.background },
  loginHero: { backgroundColor: palette.green, paddingHorizontal: 28, paddingTop: 56, paddingBottom: 40, gap: 8 },
  loginHeroBrand: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 24 },
  loginHeroWordmark: { fontSize: 22, fontWeight: '800', color: palette.surface },
  loginHeroTitle: { color: palette.surface, fontSize: 28, fontWeight: '800', letterSpacing: -0.4 },
  loginHeroSub: { color: 'rgba(255,255,255,0.72)', fontSize: 14 },
  loginCard: { backgroundColor: palette.surface, marginHorizontal: 20, marginTop: -20, borderRadius: 20, padding: 22, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6 },
  loginRegisterBox: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 36, gap: 10, alignItems: 'center' },
  loginRegisterLabel: { color: palette.muted, fontSize: 13 },
  loginRegisterBtn: { width: '100%', height: 52, borderRadius: 13, borderWidth: 2, borderColor: palette.green, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  loginRegisterBtnPressed: { backgroundColor: palette.greenPale },
  loginRegisterBtnText: { color: palette.greenDark, fontSize: 15, fontWeight: '700' },

  // section header
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 10 },
  sectionLabel: { color: palette.navy, fontSize: 15, fontWeight: '800' },
  sectionLink: { color: palette.greenDark, fontSize: 13, fontWeight: '700' },

  // greeting
  greeting: { marginBottom: 18 },
  greetingTitle: { color: palette.navy, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  greetingSub: { color: palette.muted, fontSize: 14, marginTop: 3 },

  // hero card
  heroCard: { backgroundColor: palette.navy, borderRadius: 18, padding: 20, marginBottom: 14 },
  heroCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEyebrow: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  heroAmount: { color: palette.surface, fontSize: 32, fontWeight: '800', marginTop: 10, letterSpacing: -0.5 },
  heroCaption: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 16 },
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroSmallLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  heroBalance: { color: palette.surface, fontSize: 20, fontWeight: '800', marginTop: 3 },
  heroIconBubble: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },

  // next payment
  nextPayCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.line, padding: 14, marginBottom: 16, gap: 12 },
  nextPayIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: palette.greenPale, alignItems: 'center', justifyContent: 'center' },
  nextPayCopy: { flex: 1 },
  nextPayAmount: { color: palette.navy, fontSize: 19, fontWeight: '800', marginTop: 2 },
  nextPayDate: { color: palette.muted, fontSize: 12, marginTop: 1 },

  // card pressed state
  cardPressed: { opacity: 0.88 },

  // action row
  actionRow: { gap: 0, marginBottom: 2 },

  // ghost row
  ghostRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 14, borderRadius: 10, marginBottom: 4 },
  ghostRowPressed: { backgroundColor: palette.greenPale },
  ghostRowText: { flex: 1, color: palette.navy, fontSize: 14, fontWeight: '600' },

  // summary card
  summaryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surface, borderRadius: 13, borderWidth: 1, borderColor: palette.line, padding: 13, gap: 11 },
  summaryIcon: { width: 38, height: 38, borderRadius: 10, backgroundColor: palette.greenPale, alignItems: 'center', justifyContent: 'center' },
  summaryCopy: { flex: 1 },
  summaryTitle: { color: palette.text, fontSize: 13, fontWeight: '700' },
  summarySub: { color: palette.muted, fontSize: 12, marginTop: 2 },

  // eyebrow small
  eyebrowSmall: { color: palette.muted, fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },

  // apply
  choiceList: { gap: 8, marginBottom: 16 },
  choiceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: palette.line, borderRadius: 12, padding: 13, backgroundColor: palette.surface },
  choiceRowActive: { borderColor: palette.green, backgroundColor: '#F2FBF5' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: palette.mutedLight, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: palette.green },
  radioDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: palette.green },
  choiceCopy: { flex: 1 },
  choiceTitle: { color: palette.text, fontSize: 14, fontWeight: '700' },
  choiceNote: { color: palette.muted, fontSize: 11, marginTop: 1 },
  amountRow: { flexDirection: 'row', alignItems: 'center', height: 54, borderWidth: 1.5, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.surface, paddingHorizontal: 14, marginBottom: 10 },
  currencySign: { color: palette.greenDark, fontSize: 20, fontWeight: '800', marginRight: 8 },
  amountInput: { flex: 1, color: palette.navy, fontSize: 22, fontWeight: '800' },
  presets: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  preset: { flex: 1, height: 34, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: palette.line, borderRadius: 8, backgroundColor: palette.surface },
  presetActive: { backgroundColor: palette.greenPale, borderColor: palette.green },
  presetText: { color: palette.muted, fontSize: 10, fontWeight: '700' },
  presetTextActive: { color: palette.greenDark },
  termRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  termChip: { flex: 1, height: 62, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: palette.line, borderRadius: 12, backgroundColor: palette.surface },
  termChipActive: { borderColor: palette.green, backgroundColor: '#F2FBF5' },
  termChipNum: { color: palette.navy, fontSize: 18, fontWeight: '800' },
  termChipNumActive: { color: palette.greenDark },
  termChipLabel: { color: palette.muted, fontSize: 10, marginTop: 1 },
  termChipLabelActive: { color: palette.greenDark },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 },
  pill: { paddingHorizontal: 13, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: palette.line, backgroundColor: palette.surface },
  pillActive: { borderColor: palette.green, backgroundColor: palette.greenPale },
  pillText: { color: palette.muted, fontSize: 12, fontWeight: '600' },
  pillTextActive: { color: palette.greenDark, fontWeight: '700' },
  estimateCard: { backgroundColor: palette.greenPale, borderRadius: 14, padding: 16, marginBottom: 14 },
  estimateLabel: { color: palette.greenDark, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  estimateAmount: { color: palette.navy, fontSize: 26, fontWeight: '800', marginTop: 6 },
  estimateNote: { color: palette.muted, fontSize: 11, marginTop: 4 },

  // status hero
  statusHero: { alignItems: 'center', backgroundColor: palette.greenPale, borderRadius: 16, padding: 24, marginBottom: 16 },
  statusIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: palette.surface, alignItems: 'center', justifyContent: 'center', marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  statusLabel: { color: palette.greenDark, fontSize: 15, fontWeight: '900', letterSpacing: 0.6 },
  statusDesc: { color: palette.text, fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 19 },

  // loan hero
  loanHero: { backgroundColor: palette.navy, borderRadius: 18, padding: 20, marginBottom: 14 },
  loanHeroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loanHeroAmount: { color: palette.surface, fontSize: 30, fontWeight: '800', marginTop: 8, letterSpacing: -0.5 },
  loanHeroSub: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 3 },
  progressTrack: { height: 7, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 5, marginTop: 18, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: '#4DC87A' },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },

  // schedule
  scheduleBanner: { backgroundColor: palette.greenPale, borderRadius: 14, padding: 16, marginBottom: 14 },
  scheduleDueDate: { color: palette.navy, fontSize: 26, fontWeight: '800', marginTop: 4 },
  scheduleDueSub: { color: palette.muted, fontSize: 13, marginTop: 3 },
  installRow: { flexDirection: 'row', alignItems: 'center', minHeight: 70, borderBottomWidth: 1, borderBottomColor: palette.line, gap: 12 },
  installRowLast: { borderBottomWidth: 0 },
  installNum: { width: 36, height: 36, borderRadius: 10, backgroundColor: palette.greenPale, alignItems: 'center', justifyContent: 'center' },
  installNumText: { color: palette.greenDark, fontSize: 11, fontWeight: '900' },
  installCopy: { flex: 1 },
  installTitle: { color: palette.text, fontSize: 13, fontWeight: '700' },
  installDate: { color: palette.muted, fontSize: 12, marginTop: 2 },
  installRight: { alignItems: 'flex-end' },
  installAmount: { color: palette.navy, fontSize: 14, fontWeight: '800' },
  installStatus: { fontSize: 10, fontWeight: '800', marginTop: 3, letterSpacing: 0.3 },
  paidText: { color: palette.greenDark },
  pendingText: { color: palette.amber },

  // callout
  callout: { backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.line, padding: 16, marginBottom: 14 },
  calloutTitle: { color: palette.navy, fontSize: 14, fontWeight: '800', marginBottom: 4 },
  calloutBody: { color: palette.muted, fontSize: 13 },

  // payment history
  successBanner: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: palette.greenPale, borderRadius: 10, padding: 12, marginBottom: 14 },
  successText: { color: palette.greenDark, fontSize: 13, fontWeight: '600', flex: 1 },
  historyRow: { flexDirection: 'row', alignItems: 'center', minHeight: 66, borderBottomWidth: 1, borderBottomColor: palette.line, gap: 12 },
  historyRowLast: { borderBottomWidth: 0 },
  historyDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  historyDotPaid: { backgroundColor: palette.greenPale },
  historyDotPending: { backgroundColor: palette.amberPale },
  historyCopy: { flex: 1 },
  historyDate: { color: palette.text, fontSize: 13, fontWeight: '700' },
  historyMethod: { color: palette.muted, fontSize: 12, marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  historyAmount: { color: palette.navy, fontSize: 14, fontWeight: '800' },
  historyStatus: { fontSize: 10, fontWeight: '700', marginTop: 3 },

  // notifications
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 70, borderBottomWidth: 1, borderBottomColor: palette.line },
  notifRowLast: { borderBottomWidth: 0 },
  notifIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: palette.greenPale, alignItems: 'center', justifyContent: 'center' },
  notifCopy: { flex: 1 },
  notifTitle: { color: palette.text, fontSize: 13, fontWeight: '700' },
  notifDetail: { color: palette.muted, fontSize: 12, marginTop: 2 },
  notifUnread: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.green },
  notifDeleteBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  notifDeleteAllBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  notifDeleteAllText: { fontSize: 12, fontWeight: '700' },

  // admin dashboard
  adminHead: { marginBottom: 18 },
  adminTitle: { color: palette.navy, fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  adminDate: { color: palette.muted, fontSize: 13, marginTop: 3 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard: { width: '47.5%', backgroundColor: palette.surface, borderRadius: 13, borderWidth: 1, borderColor: palette.line, padding: 13, overflow: 'hidden' },
  statBar: { position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, backgroundColor: palette.green },
  statBarNavy: { backgroundColor: palette.navy },
  statBarAmber: { backgroundColor: palette.amber },
  statLabel: { color: palette.muted, fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  statVal: { color: palette.navy, fontSize: 22, fontWeight: '900', marginTop: 6 },
  portfolioCard: { backgroundColor: palette.navy, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  portfolioHalf: { flex: 1 },
  portfolioDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },
  portfolioAmt: { color: palette.surface, fontSize: 19, fontWeight: '900', marginTop: 5 },
  portfolioOutstanding: { color: '#A5E1B6', fontSize: 19, fontWeight: '900', marginTop: 5 },
  adminListRow: { flexDirection: 'row', alignItems: 'center', gap: 11, minHeight: 66, borderBottomWidth: 1, borderBottomColor: palette.line },
  adminListCopy: { flex: 1 },
  adminListName: { color: palette.text, fontSize: 13, fontWeight: '700' },
  adminListMeta: { color: palette.muted, fontSize: 12, marginTop: 2 },
  quickGrid: { flexDirection: 'row', gap: 10 },
  quickCard: { flex: 1, backgroundColor: palette.surface, borderRadius: 13, borderWidth: 1, borderColor: palette.line, padding: 14, alignItems: 'center', gap: 8 },
  quickIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: palette.greenPale, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { color: palette.navy, fontSize: 11, fontWeight: '700', textAlign: 'center' },

  // admin applications
  filterBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: palette.line, marginBottom: 4 },
  filterLabel: { color: palette.navy, fontSize: 11, fontWeight: '900', letterSpacing: 0.4 },
  filterCount: { color: palette.greenDark, fontSize: 12, fontWeight: '700' },
  appCard: { backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.line, padding: 13, marginTop: 10 },
  appCardSelected: { borderColor: palette.greenMid },
  appCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  appCardCopy: { flex: 1 },
  appCardName: { color: palette.text, fontSize: 13, fontWeight: '700' },
  appCardMeta: { color: palette.muted, fontSize: 12, marginTop: 2 },
  appCardActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtnBase: { flex: 1, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  actionBtnView: { borderWidth: 1, borderColor: palette.line },
  actionBtnViewPressed: { backgroundColor: palette.background },
  actionBtnViewText: { color: palette.navy, fontSize: 12, fontWeight: '700' },
  actionBtnApprove: { backgroundColor: palette.green },
  actionBtnApprovePressed: { backgroundColor: palette.greenDark },
  actionBtnApproveText: { color: palette.surface, fontSize: 12, fontWeight: '700' },
  actionBtnReject: { backgroundColor: palette.redPale, borderWidth: 1, borderColor: palette.red },
  actionBtnRejectPressed: { backgroundColor: '#F8D7D7' },
  actionBtnRejectText: { color: palette.red, fontSize: 12, fontWeight: '700' },
  appCardExpanded: { marginTop: 10, paddingTop: 4, borderTopWidth: 1, borderTopColor: palette.line },
  successTextSmall: { color: palette.greenDark, fontSize: 12, fontWeight: '600', paddingTop: 6 },
  rejectTextSmall: { color: palette.red, fontSize: 12, fontWeight: '600', paddingTop: 6 },

  // borrowers
  borrowerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: palette.surface, borderRadius: 13, borderWidth: 1, borderColor: palette.line, padding: 13, marginBottom: 10 },
  borrowerCopy: { flex: 1 },
  borrowerName: { color: palette.text, fontSize: 14, fontWeight: '700' },
  borrowerMeta: { color: palette.muted, fontSize: 12, marginTop: 2 },

  // profile
  profilePanel: { alignItems: 'center', paddingVertical: 20, gap: 6 },
  profileName: { color: palette.navy, fontSize: 20, fontWeight: '800' },
  profileMeta: { color: palette.muted, fontSize: 13 },

  // admin loans
  loanCard: { backgroundColor: palette.surface, borderRadius: 14, borderWidth: 1, borderColor: palette.line, padding: 15, marginBottom: 12 },
  loanCardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  loanCardTitle: { color: palette.navy, fontSize: 14, fontWeight: '800' },
  loanCardBorrower: { color: palette.muted, fontSize: 12, marginBottom: 10 },
  loanCardDetails: { borderRadius: 10, borderWidth: 1, borderColor: palette.line, paddingHorizontal: 12, overflow: 'hidden', marginBottom: 6 },
  loanCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 5, paddingTop: 8 },
  loanCardLink: { color: palette.greenDark, fontSize: 13, fontWeight: '700' },

  // info box
  infoBox: { backgroundColor: palette.surface, borderLeftWidth: 3, borderLeftColor: palette.green, borderRadius: 10, padding: 14, marginBottom: 14 },
  infoBoxTitle: { color: palette.navy, fontSize: 13, fontWeight: '800', marginBottom: 5 },
  infoBoxBody: { color: palette.muted, fontSize: 13, lineHeight: 19 },

  // terms
  termsHeader: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 20, paddingVertical: 16, backgroundColor: palette.surface, borderBottomWidth: 1, borderBottomColor: palette.line },
  termsIconBg: { width: 42, height: 42, borderRadius: 12, backgroundColor: palette.greenPale, alignItems: 'center', justifyContent: 'center' },
  termsHeaderCopy: { flex: 1 },
  termsHeaderTitle: { color: palette.navy, fontSize: 17, fontWeight: '800' },
  termsHeaderSub: { color: palette.muted, fontSize: 12, marginTop: 1 },
  termsScroll: { flex: 1, backgroundColor: palette.background },
  termsBody: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  termsEffective: { color: palette.mutedLight, fontSize: 11, marginBottom: 12, marginTop: 8 },
  termsSection: { marginTop: 20 },
  termsSectionTitle: { color: palette.navy, fontSize: 13, fontWeight: '800', marginBottom: 6 },
  termsSectionBody: { color: '#3D4D56', fontSize: 13, lineHeight: 21 },
  termsEndMark: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 28, paddingVertical: 14, borderTopWidth: 1, borderTopColor: palette.line },
  termsEndMarkText: { color: palette.greenDark, fontSize: 12, fontWeight: '700' },
  termsFooter: { backgroundColor: palette.surface, borderTopWidth: 1, borderTopColor: palette.line, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 24, gap: 12 },
  termsHint: { alignItems: 'center', paddingVertical: 4 },
  termsHintText: { color: palette.mutedLight, fontSize: 12 },
  termsCheckRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: palette.green, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.surface },
  checkboxOn: { backgroundColor: palette.green, borderColor: palette.green },
  checkboxLocked: { borderColor: palette.line, backgroundColor: palette.background },
  checkboxLabel: { flex: 1, color: palette.text, fontSize: 13, fontWeight: '600', lineHeight: 19 },
  checkboxLabelLocked: { color: palette.mutedLight },

  // loading overlay
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.97)', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
  loadingCard: { alignItems: 'center', gap: 10 },
  loadingLogoWrap: { width: 80, height: 70, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  loadingTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  loadingMessage: { color: palette.muted, fontSize: 14, fontWeight: '500', marginTop: 2 },
  loadingDots: { flexDirection: 'row', gap: 7, marginTop: 20 },
  loadingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.green },

  // logout modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(10,30,45,0.55)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  modalCard: { width: '100%', backgroundColor: palette.surface, borderRadius: 20, padding: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 24, elevation: 12 },
  modalIconWrap: { width: 52, height: 52, borderRadius: 16, backgroundColor: palette.redPale, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  modalTitle: { color: palette.navy, fontSize: 19, fontWeight: '800', marginBottom: 8 },
  modalBody: { color: palette.muted, fontSize: 14, lineHeight: 21, textAlign: 'center', marginBottom: 24 },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  modalBtnCancel: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background, borderWidth: 1, borderColor: palette.line },
  modalBtnCancelPressed: { backgroundColor: palette.greenMid },
  modalBtnCancelText: { color: palette.navy, fontSize: 14, fontWeight: '700' },
  modalBtnConfirm: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.red },
  modalBtnConfirmPressed: { backgroundColor: '#A93226' },
  modalBtnConfirmText: { color: palette.surface, fontSize: 14, fontWeight: '700' },

  // divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: palette.line },
  dividerText: { color: palette.mutedLight, fontSize: 12, fontWeight: '600' },

  // google button
  googleBtn: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 13, borderWidth: 1.5, borderColor: palette.line, backgroundColor: palette.surface, marginTop: 2 },
  googleBtnPressed: { backgroundColor: '#F5F5F5', borderColor: palette.muted },
  googleBtnText: { color: palette.text, fontSize: 15, fontWeight: '600' },

  // ── Reviews ───────────────────────────────────────────────────────────────  // Borrower dashboard prompt
  reviewPromptCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  reviewPromptIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reviewPromptCopy: { flex: 1 },
  reviewPromptTitle: { fontSize: 13, fontWeight: '700' },
  reviewPromptSub: { fontSize: 12, marginTop: 2 },
  reviewSubmittedCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  reviewSubmittedText: { fontSize: 13, fontWeight: '700', flex: 1 },

  // Review entry screen
  reviewStarCard: { borderRadius: 16, borderWidth: 1, padding: 20, alignItems: 'center', gap: 12, marginBottom: 16 },
  reviewStarPrompt: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  reviewStarRow: { flexDirection: 'row', gap: 8 },
  reviewStarBtn: { padding: 4 },
  reviewStarLabel: { fontSize: 13, fontWeight: '600' },
  reviewTextarea: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 14, minHeight: 110, textAlignVertical: 'top' },

  // Admin dashboard summary card
  reviewSummaryCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 6 },
  reviewSummaryLeft: { alignItems: 'center', gap: 4 },
  reviewSummaryScore: { fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  reviewSummaryStars: { flexDirection: 'row', gap: 2 },
  reviewSummaryMid: { flex: 1 },
  reviewSummaryTotal: { fontSize: 14, fontWeight: '700' },
  reviewSummarySub: { fontSize: 12, marginTop: 2 },

  // Admin reviews screen
  reviewAggCard: { borderRadius: 16, borderWidth: 1, padding: 20, flexDirection: 'row', gap: 16, marginBottom: 16 },
  reviewAggLeft: { alignItems: 'center', gap: 6 },
  reviewAggScore: { fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  reviewAggStars: { flexDirection: 'row', gap: 2 },
  reviewAggCount: { fontSize: 12 },
  reviewAggRight: { flex: 1, gap: 5, justifyContent: 'center' },
  reviewBarRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewBarLabel: { fontSize: 11, fontWeight: '700', width: 10, textAlign: 'right' },
  reviewBarTrack: { flex: 1, height: 6, borderRadius: 4, overflow: 'hidden' },
  reviewBarFill: { height: '100%', borderRadius: 4 },
  reviewBarCount: { fontSize: 11, width: 16, textAlign: 'right' },
  reviewCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  reviewCardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  reviewCardMeta: { flex: 1 },
  reviewCardName: { fontSize: 13, fontWeight: '700' },
  reviewCardDate: { fontSize: 11, marginTop: 1 },
  reviewCardStars: { flexDirection: 'row', gap: 2 },
  reviewCardComment: { fontSize: 13, lineHeight: 20 },
  reviewEmpty: { alignItems: 'center', paddingVertical: 32 },
  reviewEmptyText: { fontSize: 14 },

  // ── Pay Now / Payment modal ────────────────────────────────────────────────
  payNowCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 14, gap: 12 },
  payNowLeft: { flex: 1 },
  payNowLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  payNowAmount: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  payNowDue: { fontSize: 12, marginTop: 2 },
  payNowActions: { alignItems: 'flex-end', gap: 8 },
  advancePayBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 9, borderWidth: 1.5 },
  advancePayText: { fontSize: 12, fontWeight: '700' },
  payModalCard: { borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 24, paddingBottom: 36, marginTop: 'auto' as any, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 12 },
  payModalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  payModalSub: { fontSize: 13, marginBottom: 20 },

  // ── Profile screen ────────────────────────────────────────────────────────
  borrowerLargeInitials: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  borrowerLargeInitialsText: { fontSize: 22, fontWeight: '800' },
  profileIdPhoto: { width: '100%', height: 190, borderRadius: 13, borderWidth: 1, borderColor: palette.line },
});




