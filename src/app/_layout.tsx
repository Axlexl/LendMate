import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

import { appColors } from '@/constants/colors';
import { createAdminAccount } from '@/services/auth';

SplashScreen.preventAutoHideAsync();

// ─── One-time admin seed ───────────────────────────────────────────────────────
// This runs once on first launch. If the account already exists Firebase will
// return auth/email-already-in-use and nothing happens. Safe to leave in.
const ADMIN_EMAIL    = 'admin@lendmate.ph';
const ADMIN_PASSWORD = 'LendMate@Admin2026';
const ADMIN_NAME     = 'LendMate Admin';

async function seedAdminAccount() {
  const result = await createAdminAccount(ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME);
  if (result.ok) {
    console.log('[LendMate] Admin account created:', ADMIN_EMAIL);
  } else if (!result.error.includes('already registered')) {
    console.warn('[LendMate] Admin seed skipped:', result.error);
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const palette = appColors;

function AnimatedBrandMark() {
  const scale = useMemo(() => new Animated.Value(0.82), []);
  const opacity = useMemo(() => new Animated.Value(0), []);
  const wordmarkOpacity = useMemo(() => new Animated.Value(0), []);
  const taglineOpacity = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    Animated.sequence([
      // Logo scales + fades in
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 70,
          friction: 8,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
      // Wordmark fades in
      Animated.timing(wordmarkOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: Platform.OS !== 'web',
      }),
      // Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [opacity, scale, taglineOpacity, wordmarkOpacity]);

  return (
    <View style={styles.brandCenter}>
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Svg width={120} height={100} viewBox="0 0 120 100">
          <Path
            d="M17 12c-6 0-10 4-10 10v43c0 16 12 27 29 27h34c7 0 13-3 18-8l17-17c3-3 3-8 0-11-3-3-8-3-11 0L79 71c-3 3-6 4-10 4H45c-5 0-8-4-8-9V23c0-7-5-11-10-11z"
            fill={palette.navy}
          />
          <Path
            d="M43 48V17c0-5 5-7 9-4l22 20 22-20c4-3 9-1 9 4v42"
            fill="none"
            stroke={palette.green}
            strokeWidth="13"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Ellipse cx="75" cy="53" rx="13" ry="5.5" fill={palette.green} />
          <Path
            d="M62 53v8c0 3 6 5 13 5s13-2 13-5v-8c0 3-6 5-13 5s-13-2-13-5z"
            fill={palette.green}
          />
          <Path
            d="M62 62v7c0 3 6 5 13 5s13-2 13-5v-7c0 3-6 5-13 5s-13-2-13-5z"
            fill={palette.green}
          />
        </Svg>
      </Animated.View>

      <Animated.Text style={[styles.wordmark, { opacity: wordmarkOpacity }]}>
        <Animated.Text style={styles.wordmarkNavy}>Lend</Animated.Text>
        <Animated.Text style={styles.wordmarkGreen}>Mate</Animated.Text>
      </Animated.Text>

      <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>
        Borrow Smart. Pay Easy. Stay on Track.
      </Animated.Text>
    </View>
  );
}

function PulsingDots() {
  const dots = useMemo(
    () => [new Animated.Value(0.3), new Animated.Value(0.3), new Animated.Value(0.3)],
    []
  );

  useEffect(() => {
    const staggered = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, {
            toValue: 1,
            duration: 340,
            useNativeDriver: Platform.OS !== 'web',
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 340,
            useNativeDriver: Platform.OS !== 'web',
          }),
        ])
      )
    );
    staggered.forEach((anim) => anim.start());
    return () => staggered.forEach((anim) => anim.stop());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.dotsRow}>
      {dots.map((dot, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
      ))}
    </View>
  );
}

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const screenOpacity = useMemo(() => new Animated.Value(0), []);
  const loadingOpacity = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    // Seed the admin account once (safe to call repeatedly — idempotent)
    seedAdminAccount();

    // Give the loading screen at least 2.2 s so the animation plays fully,
    // then fade it out and reveal the app.
    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync();

      Animated.parallel([
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 340,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: 340,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start(() => setAppReady(true));
    }, 2200);

    return () => clearTimeout(timer);
  }, [loadingOpacity, screenOpacity]);

  return (
    <View style={styles.root}>
      {/* Actual app — fades in underneath */}
      <Animated.View style={[styles.fill, { opacity: screenOpacity }]} pointerEvents={appReady ? 'auto' : 'none'}>
        <Stack screenOptions={{ headerShown: false }} />
      </Animated.View>

      {/* Loading screen — fades out on top */}
      {!appReady && (
        <Animated.View
          style={[styles.fill, styles.loadingScreen, { opacity: loadingOpacity }]}
          pointerEvents="none"
        >
          <AnimatedBrandMark />
          <PulsingDots />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: palette.white,
  },
  fill: {
    ...StyleSheet.absoluteFill,
  },
  loadingScreen: {
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 72,
  },
  brandCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  wordmark: {
    fontSize: 44,
    fontWeight: '800',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  wordmarkNavy: {
    color: palette.navy,
  },
  wordmarkGreen: {
    color: palette.green,
  },
  tagline: {
    color: '#718391',
    fontSize: 13,
    fontWeight: '500',
    marginTop: 10,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 7,
    paddingBottom: 16,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: palette.green,
  },
});
