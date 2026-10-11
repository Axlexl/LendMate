import React, { useEffect, useRef, useState } from 'react';
import {
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
  | 'splash' | 'login' | 'register' | 'terms'
  | 'dashboard' | 'apply' | 'application-status' | 'loan-details'
  | 'schedule' | 'payments' | 'notifications'
  | 'admin-dashboard' | 'admin-applications' | 'admin-borrowers'
  | 'admin-borrower-detail' | 'admin-loans';

type IconName =
  | 'bell' | 'home' | 'file' | 'users' | 'wallet'
  | 'calendar' | 'arrow' | 'check' | 'clock' | 'back' | 'shield';

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

// ─── Design tokens ────────────────────────────────────────────────────────────

const palette = {
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
};

// ─── Shared components ────────────────────────────────────────────────────────

function AppIcon({ name, size = 20, color = palette.navy }: {
  name: IconName; size?: number; color?: string;
}) {
  const s = { stroke: color, strokeWidth: 1.75, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
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
    </Svg>
  );
}

function BrandMark({ size = 'full' }: { size?: 'full' | 'compact' }) {
  const compact = size === 'compact';
  return (
    <View style={[sh.brandLockup, compact && sh.brandLockupCompact]}>
      <Svg width={compact ? 38 : 96} height={compact ? 34 : 80} viewBox="0 0 120 100">
        <Path d="M17 12c-6 0-10 4-10 10v43c0 16 12 27 29 27h34c7 0 13-3 18-8l17-17c3-3 3-8 0-11-3-3-8-3-11 0L79 71c-3 3-6 4-10 4H45c-5 0-8-4-8-9V23c0-7-5-11-10-11z" fill={palette.navy} />
        <Path d="M43 48V17c0-5 5-7 9-4l22 20 22-20c4-3 9-1 9 4v42" fill="none" stroke={palette.green} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        <Ellipse cx="75" cy="53" rx="13" ry="5.5" fill={palette.green} />
        <Path d="M62 53v8c0 3 6 5 13 5s13-2 13-5v-8c0 3-6 5-13 5s-13-2-13-5z" fill={palette.green} />
        <Path d="M62 62v7c0 3 6 5 13 5s13-2 13-5v-7c0 3-6 5-13 5s-13-2-13-5z" fill={palette.green} />
      </Svg>
      {!compact && (
        <Text style={sh.wordmark}>
          <Text style={sh.wordmarkNavy}>Lend</Text>
          <Text style={sh.wordmarkGreen}>Mate</Text>
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
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        sh.btn,
        size === 'sm' && sh.btnSm,
        variant === 'primary' && sh.btnPrimary,
        variant === 'secondary' && sh.btnSecondary,
        variant === 'ghost' && sh.btnGhost,
        variant === 'danger' && sh.btnDanger,
        disabled && sh.btnDisabled,
        pressed && !disabled && sh.btnPressed,
      ]}
    >
      {({ pressed }) => (
        <Text style={[
          sh.btnText,
          size === 'sm' && sh.btnTextSm,
          variant === 'secondary' && sh.btnTextSecondary,
          variant === 'ghost' && sh.btnTextGhost,
          variant === 'danger' && sh.btnTextDanger,
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
  return (
    <View style={sh.pageTitleRow}>
      {onBack && (
        <Pressable
          accessibilityLabel="Go back"
          onPress={onBack}
          style={({ pressed }) => [sh.backBtn, pressed && sh.backBtnPressed]}
        >
          <AppIcon name="back" size={20} color={palette.navy} />
        </Pressable>
      )}
      <View style={sh.pageTitleCopy}>
        <Text style={sh.pageTitleText}>{title}</Text>
        {subtitle && <Text style={sh.pageTitleSub}>{subtitle}</Text>}
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
  const [focused, setFocused] = useState(false);
  return (
    <View style={sh.fieldWrap}>
      <Text style={sh.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? label}
        placeholderTextColor={palette.mutedLight}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[sh.input, focused && sh.inputFocused]}
      />
    </View>
  );
}

function DetailRow({ label, value, last = false }: {
  label: string; value: string; last?: boolean;
}) {
  return (
    <View style={[sh.detailRow, last && sh.detailRowLast]}>
      <Text style={sh.detailLabel}>{label}</Text>
      <Text style={sh.detailValue}>{value}</Text>
    </View>
  );
}

function StatusBadge({ status }: { status: string }) {
  const isGreen = ['ACTIVE', 'APPROVED', 'PAID'].includes(status);
  const isRed = status === 'REJECTED';
  return (
    <View style={[sh.badge, isGreen && sh.badgeGreen, isRed && sh.badgeRed]}>
      <Text style={[sh.badgeText, isGreen && sh.badgeTextGreen, isRed && sh.badgeTextRed]}>
        {status}
      </Text>
    </View>
  );
}

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <View style={[sh.avatar, large && sh.avatarLarge]}>
      <Text style={[sh.avatarText, large && sh.avatarTextLarge]}>{initials(name)}</Text>
    </View>
  );
}

function NavBar({ role, screen, onSelect }: {
  role: Role; screen: Screen; onSelect: (s: Screen) => void;
}) {
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
    <View style={sh.navbar}>
      {items.map((item) => {
        const active = item.screen === screen ||
          (screen === 'application-status' && item.screen === 'dashboard');
        return (
          <Pressable
            key={item.label}
            onPress={() => onSelect(item.screen)}
            style={({ pressed }) => [sh.navItem, pressed && sh.navItemPressed]}
          >
            <View style={[sh.navIconWrap, active && sh.navIconWrapActive]}>
              <AppIcon name={item.icon} size={18} color={active ? palette.green : palette.muted} />
            </View>
            <Text style={[sh.navLabel, active && sh.navLabelActive]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Loading overlay ──────────────────────────────────────────────────────────

function LoadingOverlay({ visible, message = 'Setting up your account…' }: {
  visible: boolean; message?: string;
}) {
  const dot1 = useRef(new (require('react-native').Animated.Value)(0.3)).current;
  const dot2 = useRef(new (require('react-native').Animated.Value)(0.3)).current;
  const dot3 = useRef(new (require('react-native').Animated.Value)(0.3)).current;

  useEffect(() => {
    if (!visible) return;
    const Animated = require('react-native').Animated;
    const anims = [dot1, dot2, dot3].map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 140),
          Animated.timing(dot, { toValue: 1, duration: 320, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 320, useNativeDriver: true }),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [visible, dot1, dot2, dot3]);

  if (!visible) return null;
  const { Animated } = require('react-native');

  return (
    <View style={sh.loadingOverlay}>
      <View style={sh.loadingCard}>
        <View style={sh.loadingLogoWrap}>
          <Svg width={52} height={44} viewBox="0 0 120 100">
            <Path d="M17 12c-6 0-10 4-10 10v43c0 16 12 27 29 27h34c7 0 13-3 18-8l17-17c3-3 3-8 0-11-3-3-8-3-11 0L79 71c-3 3-6 4-10 4H45c-5 0-8-4-8-9V23c0-7-5-11-10-11z" fill={palette.navy} />
            <Path d="M43 48V17c0-5 5-7 9-4l22 20 22-20c4-3 9-1 9 4v42" fill="none" stroke={palette.green} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
            <Ellipse cx="75" cy="53" rx="13" ry="5.5" fill={palette.green} />
            <Path d="M62 53v8c0 3 6 5 13 5s13-2 13-5v-8c0 3-6 5-13 5s-13-2-13-5z" fill={palette.green} />
            <Path d="M62 62v7c0 3 6 5 13 5s13-2 13-5v-7c0 3-6 5-13 5s-13-2-13-5z" fill={palette.green} />
          </Svg>
        </View>
        <Text style={sh.loadingTitle}>
          <Text style={sh.wordmarkNavy}>Lend</Text>
          <Text style={sh.wordmarkGreen}>Mate</Text>
        </Text>
        <Text style={sh.loadingMessage}>{message}</Text>
        <View style={sh.loadingDots}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[sh.loadingDot, { opacity: dot }]} />
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Logout confirmation modal ────────────────────────────────────────────────

function LogoutModal({ visible, onConfirm, onCancel }: {
  visible: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <Pressable style={sh.modalBackdrop} onPress={onCancel}>
        <Pressable style={sh.modalCard} onPress={() => {}}>
          <View style={sh.modalIconWrap}>
            <AppIcon name="back" size={22} color={palette.navy} />
          </View>
          <Text style={sh.modalTitle}>Log Out</Text>
          <Text style={sh.modalBody}>
            Are you sure you want to log out of your LendMate account?
          </Text>
          <View style={sh.modalActions}>
            <Pressable
              style={({ pressed }) => [sh.modalBtnCancel, pressed && sh.modalBtnCancelPressed]}
              onPress={onCancel}
            >
              <Text style={sh.modalBtnCancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [sh.modalBtnConfirm, pressed && sh.modalBtnConfirmPressed]}
              onPress={onConfirm}
            >
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
    <View style={sh.flex}>
      {/* Header */}
      <View style={sh.termsHeader}>
        <View style={sh.termsIconBg}>
          <AppIcon name="shield" size={22} color={palette.green} />
        </View>
        <View style={sh.termsHeaderCopy}>
          <Text style={sh.termsHeaderTitle}>Terms &amp; Conditions</Text>
          <Text style={sh.termsHeaderSub}>Read all sections before continuing.</Text>
        </View>
      </View>

      {/* Body */}
      <ScrollView
        ref={scrollRef}
        style={sh.termsScroll}
        contentContainerStyle={sh.termsBody}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator
      >
        <Text style={sh.termsEffective}>Effective October 11, 2026</Text>
        {sections.map(([heading, body]) => (
          <View key={heading} style={sh.termsSection}>
            <Text style={sh.termsSectionTitle}>{heading}</Text>
            <Text style={sh.termsSectionBody}>{body}</Text>
          </View>
        ))}
        <View style={sh.termsEndMark}>
          <AppIcon name="check" size={16} color={palette.greenDark} />
          <Text style={sh.termsEndMarkText}>End of Terms &amp; Conditions</Text>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={sh.termsFooter}>
        {!reachedBottom && (
          <View style={sh.termsHint}>
            <Text style={sh.termsHintText}>Scroll down to read all terms ↓</Text>
          </View>
        )}

        <Pressable
          style={sh.termsCheckRow}
          onPress={() => reachedBottom && setChecked((v) => !v)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
        >
          <View style={[sh.checkbox, checked && sh.checkboxOn, !reachedBottom && sh.checkboxLocked]}>
            {checked && <AppIcon name="check" size={12} color={palette.surface} />}
          </View>
          <Text style={[sh.checkboxLabel, !reachedBottom && sh.checkboxLabelLocked]}>
            I have read and agree to the Terms &amp; Conditions
          </Text>
        </Pressable>

        <Btn title="I Agree & Continue" onPress={onAgree} disabled={!ready} />
      </View>
    </View>
  );
}

// ─── Main app ─────────────────────────────────────────────────────────────────

export default function LendMateApp() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [role, setRole] = useState<Role>('borrower');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [authLoading, setAuthLoading] = useState(true); // waiting for Firebase auth state
  const [firebaseUser, setFirebaseUser] = useState<UserProfile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  // ── Google Sign-In hook ──────────────────────────────────────────────────────
  const { request: googleRequest, response: googleResponse, promptAsync: googlePrompt } = useGoogleSignIn();

  // ── Persistent auth state ────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthChange(async (user) => {
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
  const [loanProduct, setLoanProduct] = useState('Personal Loan');
  const [loanAmount, setLoanAmount] = useState('10000');
  const [loanTerm, setLoanTerm] = useState(3);
  const [loanPurpose, setLoanPurpose] = useState('Emergency');
  const [application, setApplication] = useState(initialApplication);
  const [applicationDecision, setApplicationDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [selectedBorrower, setSelectedBorrower] = useState(borrowers[0]);
  const [adminApps, setAdminApps] = useState(adminApplications);
  const [adminLoans, setAdminLoans] = useState(initialAdminLoans);
  const [selectedApp, setSelectedApp] = useState<ApplicationRecord>(adminApplications[0]);
  const [selectedLoan, setSelectedLoan] = useState<AdminLoanRecord>(initialAdminLoans[0]);

  const goTo = (target: Screen) => { setFormError(''); setScreen(target); };

  const signIn = async () => {
    if (!email.includes('@') || password.length < 6) {
      setFormError('Enter a valid email and a password of at least 6 characters.');
      return;
    }
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
      setFormError(result.error);
    }
  };

  const register = async () => {
    if (!fullName.trim() || !email.includes('@') || phone.trim().length < 7 ||
      password.length < 6 || password !== confirmPassword) {
      setFormError('Complete every field. Passwords must match and have at least 6 characters.');
      return;
    }
    setFormLoading(true);
    const result = await registerWithEmail(fullName, email, phone, password);
    setFormLoading(false);
    if (result.ok) {
      setFirebaseUser(result.profile);
      setFullName(result.profile.fullName);
      setRole('borrower');
      setTermsAccepted(false);
      setFormError('');
      goTo('terms');
    } else {
      setFormError(result.error);
    }
  };

  const handleLogout = async () => {
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
    <View style={sh.header}>
      <Pressable style={sh.headerBrand} onPress={() => goTo('splash')}>
        <BrandMark size="compact" />
        <Text style={sh.headerWordmark}>
          <Text style={sh.wordmarkNavy}>Lend</Text>
          <Text style={sh.wordmarkGreen}>Mate</Text>
        </Text>
      </Pressable>
      <View style={sh.headerRight}>
        {bell && (
          <Pressable
            style={({ pressed }) => [sh.headerIconBtn, pressed && sh.headerIconBtnPressed]}
            onPress={() => goTo('notifications')}
            accessibilityLabel="Notifications"
          >
            <AppIcon name="bell" size={19} color={palette.navy} />
            <View style={sh.notifDot} />
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [sh.profileBtn, pressed && { opacity: 0.8 }]}
          onPress={() => setShowLogout(true)}
          accessibilityLabel="Account"
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
    <View style={sh.splash}>
      <View style={sh.splashTop}>
        <BrandMark size="full" />
        <Text style={sh.splashTagline}>Borrow Smart. Pay Easy. Stay on Track.</Text>
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
                <AppIcon name={icon as IconName} size={14} color={palette.green} />
              </View>
              <Text style={sh.splashFeatureLabel}>{label}</Text>
            </View>
          ))}
        </View>
        <Btn title="Get Started" onPress={() => goTo('login')} />
        <Text style={sh.splashNote}>Already have an account?{' '}
          <Text style={sh.splashNoteLink} onPress={() => goTo('login')}>Sign in</Text>
        </Text>
      </View>
    </View>
  );

  // ── Login ───────────────────────────────────────────────────────────────────
  const renderLogin = () => (
    <KeyboardAvoidingView style={sh.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={sh.authScroll} keyboardShouldPersistTaps="handled">
        <Pressable style={sh.authBrand} onPress={() => goTo('splash')}>
          <BrandMark size="compact" />
          <Text style={sh.authBrandWordmark}>
            <Text style={sh.wordmarkNavy}>Lend</Text>
            <Text style={sh.wordmarkGreen}>Mate</Text>
          </Text>
        </Pressable>

        <Text style={sh.authTitle}>Welcome back</Text>
        <Text style={sh.authSub}>Sign in to continue to your account.</Text>

        <View style={sh.roleToggle}>
          {(['borrower', 'admin'] as Role[]).map((r) => (
            <Pressable key={r} onPress={() => setRole(r)} style={[sh.roleBtn, role === r && sh.roleBtnActive]}>
              <Text style={[sh.roleBtnText, role === r && sh.roleBtnTextActive]}>
                {r === 'borrower' ? 'Borrower' : 'Lender / Admin'}
              </Text>
            </Pressable>
          ))}
        </View>

        <InputField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <InputField label="Password" value={password} onChangeText={setPassword} placeholder="Enter your password" secureTextEntry />

        <Pressable style={sh.forgotRow} onPress={() => setFormError('Password recovery will be available when authentication is connected.')}>
          <Text style={sh.forgotText}>Forgot Password?</Text>
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

        <View style={sh.authSwitchRow}>
          <Text style={sh.authSwitchText}>Don't have an account?</Text>
          <Pressable onPress={() => { setRole('borrower'); setFormError(''); goTo('register'); }}>
            <Text style={sh.authSwitchLink}>Register</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  // ── Register ────────────────────────────────────────────────────────────────
  const renderRegister = () => (
    <KeyboardAvoidingView style={sh.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={sh.authScroll} keyboardShouldPersistTaps="handled">
        <PageTitle title="Create Account" subtitle="Fill in your details to get started." onBack={() => goTo('login')} />
        <InputField label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Your full name" autoCapitalize="words" />
        <InputField label="Email" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" />
        <InputField label="Phone Number" value={phone} onChangeText={setPhone} placeholder="09XXXXXXXXX" keyboardType="phone-pad" />
        <InputField label="Password" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry />
        <InputField label="Confirm Password" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repeat your password" secureTextEntry />

        {formError ? <View style={sh.errorBox}><Text style={sh.errorText}>{formError}</Text></View> : null}

        <Btn title={formLoading ? 'Creating account…' : 'Create Account'} onPress={register} disabled={formLoading} />

        <View style={sh.authSwitchRow}>
          <Text style={sh.authSwitchText}>Already have an account?</Text>
          <Pressable onPress={() => goTo('login')}><Text style={sh.authSwitchLink}>Sign In</Text></Pressable>
        </View>
        <Text style={sh.demoNote}>Registration is local — account verification needs the planned auth service.</Text>
      </ScrollView>
    </KeyboardAvoidingView>
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

  // ── Borrower Dashboard ───────────────────────────────────────────────────────
  const renderDashboard = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={sh.page} showsVerticalScrollIndicator={false}>
        <View style={sh.greeting}>
          <Text style={sh.greetingTitle}>Good morning, {fullName.split(' ')[0]} 👋</Text>
          <Text style={sh.greetingSub}>Here's your loan at a glance.</Text>
        </View>

        {/* Hero card */}
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
              <AppIcon name="wallet" size={20} color={palette.greenPale} />
            </View>
          </View>
        </View>

        {/* Next payment */}
        <Pressable style={({ pressed }) => [sh.nextPayCard, pressed && sh.cardPressed]} onPress={() => goTo('schedule')}>
          <View style={sh.nextPayIcon}>
            <AppIcon name="calendar" size={18} color={palette.green} />
          </View>
          <View style={sh.nextPayCopy}>
            <Text style={sh.eyebrowSmall}>NEXT PAYMENT DUE</Text>
            <Text style={sh.nextPayAmount}>{money(1100)}</Text>
            <Text style={sh.nextPayDate}>October 15, 2026</Text>
          </View>
          <AppIcon name="arrow" size={17} color={palette.muted} />
        </Pressable>

        {/* Actions */}
        <View style={sh.actionRow}>
          <Btn title="Apply for Loan" onPress={() => goTo('apply')} />
          <Btn title="View Loan" onPress={() => goTo('loan-details')} variant="secondary" />
        </View>

        <Pressable style={({ pressed }) => [sh.ghostRow, pressed && sh.ghostRowPressed]} onPress={() => goTo('payments')}>
          <AppIcon name="file" size={16} color={palette.navy} />
          <Text style={sh.ghostRowText}>Payment History</Text>
          <AppIcon name="arrow" size={15} color={palette.muted} />
        </Pressable>

        {/* Application summary */}
        <View style={sh.sectionRow}>
          <Text style={sh.sectionLabel}>Application</Text>
          <Pressable onPress={() => goTo('application-status')}><Text style={sh.sectionLink}>View</Text></Pressable>
        </View>
        <Pressable style={({ pressed }) => [sh.summaryCard, pressed && sh.cardPressed]} onPress={() => goTo('application-status')}>
          <View style={sh.summaryIcon}><AppIcon name="file" size={17} color={palette.green} /></View>
          <View style={sh.summaryCopy}>
            <Text style={sh.summaryTitle}>Application #{application.id}</Text>
            <Text style={sh.summarySub}>Submitted {application.id === '10025' ? 'October 2, 2026' : todayLong}</Text>
          </View>
          <StatusBadge status={applicationDecision ?? application.status} />
        </Pressable>
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
        <ScrollView contentContainerStyle={sh.page} keyboardShouldPersistTaps="handled">
          <PageTitle title="Apply for a Loan" subtitle="Choose product, amount, and term." onBack={() => goTo('dashboard')} />

          <Text style={sh.fieldLabel}>Loan Product</Text>
          <View style={sh.choiceList}>
            {[['Personal Loan', 'Flexible use'], ['Business Loan', 'Grow your business'], ['Education Loan', 'School expenses']].map(([p, note]) => (
              <Pressable key={p} onPress={() => setLoanProduct(p)} style={[sh.choiceRow, loanProduct === p && sh.choiceRowActive]}>
                <View style={[sh.radio, loanProduct === p && sh.radioActive]}>
                  {loanProduct === p && <View style={sh.radioDot} />}
                </View>
                <View style={sh.choiceCopy}>
                  <Text style={sh.choiceTitle}>{p}</Text>
                  <Text style={sh.choiceNote}>{note}</Text>
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
              placeholderTextColor={palette.mutedLight}
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

          <View style={sh.estimateCard}>
            <Text style={sh.estimateLabel}>ESTIMATED MONTHLY PAYMENT</Text>
            <Text style={sh.estimateAmount}>{money(monthlyEst)}</Text>
            <Text style={sh.estimateNote}>Illustration only. Final terms set after review.</Text>
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
      <ScrollView contentContainerStyle={sh.page}>
        <PageTitle title="Application Status" subtitle="Track your application progress." onBack={() => goTo('dashboard')} />

        <View style={sh.statusHero}>
          <View style={sh.statusIcon}>
            <AppIcon name={applicationDecision === 'APPROVED' ? 'check' : 'clock'} size={24} color={palette.green} />
          </View>
          <Text style={sh.statusLabel}>{applicationDecision ?? application.status}</Text>
          <Text style={sh.statusDesc}>
            {applicationDecision === 'APPROVED' ? 'Your application has been approved.' :
              applicationDecision === 'REJECTED' ? 'Please contact the lending team for next steps.' :
                'Our team is currently reviewing your application.'}
          </Text>
        </View>

        <View style={sh.detailCard}>
          <DetailRow label="Application #" value={application.id} />
          <DetailRow label="Loan product" value={application.product} />
          <DetailRow label="Amount" value={money(application.amount)} />
          <DetailRow label="Submitted" value={application.id === '10025' ? 'October 2, 2026' : 'October 11, 2026'} />
          <DetailRow label="Status" value={applicationDecision ?? application.status} last />
        </View>

        <View style={sh.infoBox}>
          <Text style={sh.infoBoxTitle}>What happens next?</Text>
          <Text style={sh.infoBoxBody}>You'll be notified when your status changes. Keep your profile and supporting documents up to date.</Text>
        </View>

        {applicationDecision === 'APPROVED' && <Btn title="View Approved Loan" onPress={() => goTo('loan-details')} />}
      </ScrollView>
      <NavBar role="borrower" screen={screen} onSelect={goTo} />
    </>
  );

  // ── Loan Details ─────────────────────────────────────────────────────────────
  const renderLoanDetails = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={sh.page}>
        <PageTitle title="Loan Details" subtitle="Personal Loan · #10025" onBack={() => goTo('dashboard')} />

        <View style={sh.loanHero}>
          <View style={sh.loanHeroTop}>
            <Text style={sh.heroEyebrow}>LOAN AMOUNT</Text>
            <StatusBadge status="ACTIVE" />
          </View>
          <Text style={sh.loanHeroAmount}>{money(10000)}</Text>
          <Text style={sh.loanHeroSub}>Remaining balance {money(7500)}</Text>
          <View style={sh.progressTrack}>
            <View style={[sh.progressFill, { width: '32%' }]} />
          </View>
          <View style={sh.progressLabels}>
            <Text style={sh.progressLabel}>32% paid</Text>
            <Text style={sh.progressLabel}>Released Oct 1, 2026</Text>
          </View>
        </View>

        <View style={sh.detailCard}>
          <DetailRow label="Principal" value={money(10000)} />
          <DetailRow label="Interest (10%)" value={money(1000)} />
          <DetailRow label="Total Payable" value={money(11000)} />
          <DetailRow label="Remaining" value={money(7500)} />
          <DetailRow label="Term" value="3 Months" />
          <DetailRow label="Status" value="ACTIVE" last />
        </View>

        <Btn title="View Payment Schedule" onPress={() => goTo('schedule')} />
        <Btn title="Payment History" onPress={() => goTo('payments')} variant="secondary" />
      </ScrollView>
      <NavBar role="borrower" screen={screen} onSelect={goTo} />
    </>
  );

  // ── Schedule ─────────────────────────────────────────────────────────────────
  const renderSchedule = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={sh.page}>
        <PageTitle title="Payment Schedule" subtitle="Loan #10025 · 3 installments" onBack={() => goTo('loan-details')} />

        <View style={sh.scheduleBanner}>
          <Text style={sh.eyebrowSmall}>NEXT DUE</Text>
          <Text style={sh.scheduleDueDate}>October 15</Text>
          <Text style={sh.scheduleDueSub}>Upcoming installment · {money(1100)} due</Text>
        </View>

        <View style={sh.detailCard}>
          {installments.map((item, i) => (
            <View key={item.number} style={[sh.installRow, i === installments.length - 1 && sh.installRowLast]}>
              <View style={sh.installNum}>
                <Text style={sh.installNumText}>{String(item.number).padStart(2, '0')}</Text>
              </View>
              <View style={sh.installCopy}>
                <Text style={sh.installTitle}>Installment {item.number}</Text>
                <Text style={sh.installDate}>{item.due}, 2026</Text>
              </View>
              <View style={sh.installRight}>
                <Text style={sh.installAmount}>{money(item.amount)}</Text>
                <Text style={[sh.installStatus, item.status === 'PAID' ? sh.paidText : sh.pendingText]}>
                  {item.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={sh.callout}>
          <Text style={sh.calloutTitle}>Record a payment</Text>
          <Text style={sh.calloutBody}>Submit a payment reference for lender verification.</Text>
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
      <ScrollView contentContainerStyle={sh.page}>
        <PageTitle title="Payment History" subtitle="Your submitted and completed payments." onBack={() => goTo('dashboard')} />

        {paymentSubmitted && (
          <View style={sh.successBanner}>
            <AppIcon name="check" size={16} color={palette.greenDark} />
            <Text style={sh.successText}>Payment submitted for lender verification.</Text>
          </View>
        )}

        <View style={sh.detailCard}>
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
                  color={p.status === 'PAID' ? palette.greenDark : palette.amber} />
              </View>
              <View style={sh.historyCopy}>
                <Text style={sh.historyDate}>{p.date}</Text>
                <Text style={sh.historyMethod}>{p.method}</Text>
              </View>
              <View style={sh.historyRight}>
                <Text style={sh.historyAmount}>{money(p.amount)}</Text>
                <Text style={[sh.historyStatus, p.status === 'PAID' ? sh.paidText : sh.pendingText]}>
                  {p.status}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {!paymentSubmitted && (
          <View style={sh.callout}>
            <Text style={sh.calloutTitle}>Submit a payment</Text>
            <Text style={sh.calloutBody}>Demo flow only — no funds are transferred.</Text>
            <Btn title="Submit ₱1,100 Payment" onPress={() => setPaymentSubmitted(true)} />
          </View>
        )}
      </ScrollView>
      <NavBar role="borrower" screen={screen} onSelect={goTo} />
    </>
  );

  // ── Notifications ────────────────────────────────────────────────────────────
  const renderNotifications = () => (
    <>
      <Header bell={false} />
      <ScrollView contentContainerStyle={sh.page}>
        <PageTitle title="Notifications" subtitle="Important updates about your account." onBack={() => goTo(role === 'admin' ? 'admin-dashboard' : 'dashboard')} />
        {[
          { title: 'Payment reminder', detail: '₱1,100 due October 15, 2026', icon: 'calendar' as const },
          { title: 'Application under review', detail: `Application #${application.id} is being reviewed.`, icon: 'file' as const },
          { title: 'Payment received', detail: 'Your October 1 payment was recorded.', icon: 'check' as const },
        ].map((item, i, arr) => (
          <View key={item.title} style={[sh.notifRow, i === arr.length - 1 && sh.notifRowLast]}>
            <View style={sh.notifIcon}>
              <AppIcon name={item.icon} size={17} color={palette.green} />
            </View>
            <View style={sh.notifCopy}>
              <Text style={sh.notifTitle}>{item.title}</Text>
              <Text style={sh.notifDetail}>{item.detail}</Text>
            </View>
            <View style={sh.notifUnread} />
          </View>
        ))}
      </ScrollView>
      {role === 'borrower' && <NavBar role="borrower" screen={screen} onSelect={goTo} />}
    </>
  );

  // ── Admin Dashboard ───────────────────────────────────────────────────────────
  const renderAdminDashboard = () => {
    const activeLoanDelta = adminLoans.filter((l) => l.status === 'ACTIVE').length - initialAdminLoans.filter((l) => l.status === 'ACTIVE').length;
    const pendingDelta = adminApps.filter((a) => a.status === 'PENDING').length - adminApplications.filter((a) => a.status === 'PENDING').length;
    const amountDelta = adminLoans.reduce((t, l) => t + l.amount, 0) - initialAdminLoans.reduce((t, l) => t + l.amount, 0);
    const remainDelta = adminLoans.reduce((t, l) => t + l.remaining, 0) - initialAdminLoans.reduce((t, l) => t + l.remaining, 0);

    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={sh.page}>
          <View style={sh.adminHead}>
            <Text style={sh.adminTitle}>Portfolio Overview</Text>
            <Text style={sh.adminDate}>October 11, 2026</Text>
          </View>

          <View style={sh.statsGrid}>
            {[
              ['Borrowers', '152', 'green'],
              ['Active Loans', String(84 + activeLoanDelta), 'navy'],
              ['Pending', String(17 + pendingDelta), 'green'],
              ['Overdue', '9', 'amber'],
            ].map(([label, val, accent]) => (
              <View key={label} style={sh.statCard}>
                <View style={[sh.statBar, accent === 'navy' && sh.statBarNavy, accent === 'amber' && sh.statBarAmber]} />
                <Text style={sh.statLabel}>{label}</Text>
                <Text style={sh.statVal}>{val}</Text>
              </View>
            ))}
          </View>

          <View style={sh.portfolioCard}>
            <View style={sh.portfolioHalf}>
              <Text style={sh.eyebrowSmall}>TOTAL RELEASED</Text>
              <Text style={sh.portfolioAmt}>{money(850000 + amountDelta)}</Text>
            </View>
            <View style={sh.portfolioDivider} />
            <View style={sh.portfolioHalf}>
              <Text style={sh.eyebrowSmall}>OUTSTANDING</Text>
              <Text style={sh.portfolioOutstanding}>{money(420500 + remainDelta)}</Text>
            </View>
          </View>

          <View style={sh.sectionRow}>
            <Text style={sh.sectionLabel}>Needs Review</Text>
            <Pressable onPress={() => goTo('admin-applications')}><Text style={sh.sectionLink}>See all</Text></Pressable>
          </View>
          {adminApps.filter((a) => a.status === 'PENDING' || a.status === 'UNDER REVIEW').slice(0, 2).map((item) => (
            <Pressable
              key={item.id}
              style={({ pressed }) => [sh.adminListRow, pressed && sh.cardPressed]}
              onPress={() => { setSelectedApp(item); goTo('admin-applications'); }}
            >
              <Avatar name={item.borrower} />
              <View style={sh.adminListCopy}>
                <Text style={sh.adminListName}>#{item.id} · {item.borrower}</Text>
                <Text style={sh.adminListMeta}>{money(item.amount)} · {item.product}</Text>
              </View>
              <StatusBadge status={item.status} />
            </Pressable>
          ))}

          <View style={sh.sectionRow}>
            <Text style={sh.sectionLabel}>Quick Access</Text>
          </View>
          <View style={sh.quickGrid}>
            {([
              ['file', 'Applications', 'admin-applications'],
              ['users', 'Borrowers', 'admin-borrowers'],
              ['wallet', 'Loans', 'admin-loans'],
            ] as [IconName, string, Screen][]).map(([icon, label, dest]) => (
              <Pressable key={label} onPress={() => goTo(dest)} style={({ pressed }) => [sh.quickCard, pressed && sh.cardPressed]}>
                <View style={sh.quickIcon}><AppIcon name={icon} size={19} color={palette.green} /></View>
                <Text style={sh.quickLabel}>{label}</Text>
              </Pressable>
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
    return (
      <>
        <Header />
        <ScrollView contentContainerStyle={sh.page}>
          <PageTitle title="Applications" subtitle="Review and process requests." />
          <View style={sh.filterBar}>
            <Text style={sh.filterLabel}>ALL APPLICATIONS</Text>
            <Text style={sh.filterCount}>{pendingCount} pending</Text>
          </View>
          {adminApps.map((item) => (
            <View key={item.id} style={[sh.appCard, selectedApp.id === item.id && sh.appCardSelected]}>
              <Pressable style={sh.appCardHeader} onPress={() => setSelectedApp(item)}>
                <Avatar name={item.borrower} />
                <View style={sh.appCardCopy}>
                  <Text style={sh.appCardName}>#{item.id} · {item.borrower}</Text>
                  <Text style={sh.appCardMeta}>{money(item.amount)} · {item.product}</Text>
                </View>
                <StatusBadge status={item.status} />
              </Pressable>
              <View style={sh.appCardActions}>
                <Pressable onPress={() => setSelectedApp(item)} style={({ pressed }) => [sh.actionBtnBase, sh.actionBtnView, pressed && sh.actionBtnViewPressed]}>
                  <Text style={sh.actionBtnViewText}>View</Text>
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
              {selectedApp.id === item.id && (
                <View style={sh.appCardExpanded}>
                  <DetailRow label="Applicant" value={item.borrower} />
                  <DetailRow label="Requested" value={money(item.amount)} />
                  <DetailRow label="Product" value={item.product} />
                  <DetailRow label="Status" value={selectedApp.status} last />
                  {selectedApp.status === 'APPROVED' && <Text style={sh.successTextSmall}>Approved in local demo.</Text>}
                  {selectedApp.status === 'REJECTED' && <Text style={sh.rejectTextSmall}>Rejected in local demo.</Text>}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
        <NavBar role="admin" screen={screen} onSelect={goTo} />
      </>
    );
  };

  // ── Admin Borrowers ───────────────────────────────────────────────────────────
  const renderAdminBorrowers = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={sh.page}>
        <PageTitle title="Borrowers" subtitle="Manage borrower records." />
        {borrowers.map((b) => (
          <Pressable
            key={b.id}
            style={({ pressed }) => [sh.borrowerRow, pressed && sh.cardPressed]}
            onPress={() => { setSelectedBorrower(b); goTo('admin-borrower-detail'); }}
          >
            <Avatar name={b.name} />
            <View style={sh.borrowerCopy}>
              <Text style={sh.borrowerName}>{b.name}</Text>
              <Text style={sh.borrowerMeta}>{b.phone} · {b.activeLoans} active loan{b.activeLoans !== 1 ? 's' : ''}</Text>
            </View>
            <StatusBadge status={b.status} />
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
      <ScrollView contentContainerStyle={sh.page}>
        <PageTitle title="Borrower Profile" subtitle={selectedBorrower.id} onBack={() => goTo('admin-borrowers')} />
        <View style={sh.profilePanel}>
          <Avatar name={selectedBorrower.name} large />
          <Text style={sh.profileName}>{selectedBorrower.name}</Text>
          <Text style={sh.profileMeta}>{selectedBorrower.status} · {selectedBorrower.activeLoans} active loan{selectedBorrower.activeLoans !== 1 ? 's' : ''}</Text>
        </View>
        <View style={sh.detailCard}>
          <DetailRow label="Phone" value={selectedBorrower.phone} />
          <DetailRow label="Borrower ID" value={selectedBorrower.id} />
          <DetailRow label="Active Loans" value={String(selectedBorrower.activeLoans)} last />
        </View>
        <Btn title="View Loan Records" onPress={() => goTo('admin-loans')} />
      </ScrollView>
      <NavBar role="admin" screen={screen} onSelect={goTo} />
    </>
  );

  // ── Admin Loans ───────────────────────────────────────────────────────────────
  const renderAdminLoans = () => (
    <>
      <Header />
      <ScrollView contentContainerStyle={sh.page}>
        <PageTitle title="Loan Management" subtitle="Monitor active and completed loans." />
        {adminLoans.map((loan) => (
          <Pressable key={loan.id} style={({ pressed }) => [sh.loanCard, pressed && sh.cardPressed]} onPress={() => { setSelectedLoan(loan); goTo('loan-details'); }}>
            <View style={sh.loanCardHead}>
              <Text style={sh.loanCardTitle}>Loan #{loan.id}</Text>
              <StatusBadge status={loan.status} />
            </View>
            <Text style={sh.loanCardBorrower}>{loan.borrower}</Text>
            <View style={sh.loanCardDetails}>
              <DetailRow label="Amount" value={money(loan.amount)} />
              <DetailRow label="Interest" value={`10% · ${money(loan.interest)}`} />
              <DetailRow label="Term" value={`${loan.term} months`} />
              <DetailRow label="Remaining" value={money(loan.remaining)} last />
            </View>
            <View style={sh.loanCardFooter}>
              <Text style={sh.loanCardLink}>View full details</Text>
              <AppIcon name="arrow" size={14} color={palette.green} />
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
      <ScrollView contentContainerStyle={sh.page}>
        <PageTitle title="Loan Details" subtitle={`#${selectedLoan.id} · ${selectedLoan.borrower}`} onBack={() => goTo('admin-loans')} />
        <View style={sh.loanHero}>
          <View style={sh.loanHeroTop}>
            <Text style={sh.heroEyebrow}>LOAN AMOUNT</Text>
            <StatusBadge status={selectedLoan.status} />
          </View>
          <Text style={sh.loanHeroAmount}>{money(selectedLoan.amount)}</Text>
          <Text style={sh.loanHeroSub}>Remaining {money(selectedLoan.remaining)}</Text>
        </View>
        <View style={sh.detailCard}>
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
      {role === 'borrower' && <NavBar role="borrower" screen="loan-details" onSelect={goTo} />}
    </>
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
  else if (screen === 'terms') content = renderTerms();
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
  else content = renderAdminLoans();

  return (
    <SafeAreaView style={sh.root}>
      {content}
      <LoadingOverlay visible={transitioning} message="Welcome to LendMate…" />
      <LogoutModal
        visible={showLogout}
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </SafeAreaView>
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
  brandLockupCompact: { flexDirection: 'row', alignItems: 'center', gap: 6 },
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
  fieldLabel: { color: palette.text, fontSize: 13, fontWeight: '700', marginBottom: 7 },
  input: { height: 50, borderWidth: 1.5, borderColor: palette.line, backgroundColor: palette.surface, borderRadius: 11, paddingHorizontal: 14, color: palette.text, fontSize: 14 },
  inputFocused: { borderColor: palette.green },

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
});
