import { useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { ThemeContext, type Palette } from './theme';

// ─── Palette & StyleSheet ─────────────────────────────────────────────────────

export function createStyles(palette: Palette) {
  return StyleSheet.create({
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
  profileBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: palette.navyCard, alignItems: 'center', justifyContent: 'center' },
  profileInitials: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },

  // buttons
  btn: { minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 13, paddingHorizontal: 20, marginTop: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  btnSm: { minHeight: 38, borderRadius: 9, marginTop: 6 },
  btnPrimary: { backgroundColor: palette.green, shadowColor: palette.green, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnSecondary: { backgroundColor: palette.surface, borderWidth: 1.5, borderColor: palette.green, shadowOpacity: 0 },
  btnGhost: { backgroundColor: 'transparent', shadowOpacity: 0, elevation: 0 },
  btnDanger: { backgroundColor: palette.redPale, borderWidth: 1.5, borderColor: palette.red, shadowOpacity: 0 },
  btnPressed: { transform: [{ scale: 0.978 }], shadowOpacity: 0.08 },
  btnDisabled: { opacity: 0.42, shadowOpacity: 0 },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, letterSpacing: 0.15 },
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
  heroCard: { backgroundColor: palette.navyCard, borderRadius: 18, padding: 20, marginBottom: 14 },
  heroCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEyebrow: { color: 'rgba(255,255,255,0.55)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  heroAmount: { color: '#FFFFFF', fontSize: 32, fontWeight: '800', marginTop: 10, letterSpacing: -0.5 },
  heroCaption: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 3 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 16 },
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroSmallLabel: { color: 'rgba(255,255,255,0.55)', fontSize: 11 },
  heroBalance: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginTop: 3 },
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
  loanHero: { backgroundColor: palette.navyCard, borderRadius: 18, padding: 20, marginBottom: 14 },
  loanHeroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loanheroAmount: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', marginTop: 8, letterSpacing: -0.5 },
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
  portfolioCard: { backgroundColor: palette.navyCard, borderRadius: 16, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  portfolioHalf: { flex: 1 },
  portfolioDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 16 },
  portfolioAmt: { color: '#FFFFFF', fontSize: 19, fontWeight: '900', marginTop: 5 },
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
  loadingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(255,255,255,0.97)', alignItems: 'center', justifyContent: 'center', zIndex: 999 },
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
  });
}

export function useAppStyles() {
  const palette = useContext(ThemeContext);
  return useMemo(() => createStyles(palette), [palette]);
}




