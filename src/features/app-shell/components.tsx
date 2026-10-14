import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, NativeScrollEvent, NativeSyntheticEvent, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Ellipse, Path } from 'react-native-svg';

import { initials, type IconName, type Role, type Screen } from './model';
import { useAppStyles } from './styles';
import { ThemeContext } from './theme';

// ─── Shared components ────────────────────────────────────────────────────────

export function AppIcon({ name, size = 20, color }: {
  name: IconName; size?: number; color?: string;
}) {
  const theme = React.useContext(ThemeContext);
  const resolvedColor = color ?? theme.navy;
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
      {name === 'camera' && (<>
        <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" {...s} />
        <Circle cx="12" cy="13" r="4" {...s} />
      </>)}
      {name === 'upload' && (<>
        <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" {...s} />
      </>)}
    </Svg>
  );
}

export function BrandMark({ size = 'full', light = false }: { size?: 'full' | 'compact'; light?: boolean }) {
  const p = useContext(ThemeContext);
  const sh = useAppStyles();
  const compact = size === 'compact';
  const navyColor = light ? '#FFFFFF' : p.navy;
  const greenColor = light ? '#A5E1B6' : p.green;
  return (
    <View style={compact ? sh.brandLockupCompact : sh.brandLockup}>
      <Svg width={compact ? 36 : 110} height={compact ? 32 : 92} viewBox="0 0 120 100">
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

export function Btn({
  title, onPress, disabled = false, variant = 'primary', size = 'md',
}: {
  title: string; onPress: () => void; disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
}) {
  const p = useContext(ThemeContext);
  const sh = useAppStyles();
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

export function PageTitle({ title, subtitle, onBack }: {
  title: string; subtitle?: string; onBack?: () => void;
}) {
  const p = useContext(ThemeContext);
  const sh = useAppStyles();
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

export function InputField({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize = 'sentences',
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numeric';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}) {
  const p = useContext(ThemeContext);
  const sh = useAppStyles();
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

export function DetailRow({ label, value, last = false }: {
  label: string; value: string; last?: boolean;
}) {
  const p = useContext(ThemeContext);
  const sh = useAppStyles();
  return (
    <View style={[sh.detailRow, last && sh.detailRowLast, { borderBottomColor: p.line }]}>
      <Text style={[sh.detailLabel, { color: p.muted }]}>{label}</Text>
      <Text style={[sh.detailValue, { color: p.text }]}>{value}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const p = useContext(ThemeContext);
  const sh = useAppStyles();
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

export function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  const p = useContext(ThemeContext);
  const sh = useAppStyles();
  return (
    <View style={[sh.avatar, large && sh.avatarLarge, { backgroundColor: p.greenMid }]}>
      <Text style={[sh.avatarText, large && sh.avatarTextLarge, { color: p.greenDark }]}>{initials(name)}</Text>
    </View>
  );
}

export function LoadingOverlay({ visible, message = 'Setting up your account…' }: {
  visible: boolean; message?: string;
}) {
  const p = useContext(ThemeContext);
  const sh = useAppStyles();
  const dot1 = useMemo(() => new Animated.Value(0.3), []);
  const dot2 = useMemo(() => new Animated.Value(0.3), []);
  const dot3 = useMemo(() => new Animated.Value(0.3), []);
  useEffect(() => {
    if (!visible) return;
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

export function LogoutModal({ visible, onConfirm, onCancel }: {
  visible: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  const p = useContext(ThemeContext);
  const sh = useAppStyles();
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

export function TermsScreen({ onAgree }: { role: Role; onAgree: () => void }) {
  const p = useContext(ThemeContext);
  const sh = useAppStyles();
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

export function NavBar({ role, screen, onSelect }: {
  role: Role; screen: Screen; onSelect: (s: Screen) => void;
}) {
  const p = useContext(ThemeContext);
  const sh = useAppStyles();
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
