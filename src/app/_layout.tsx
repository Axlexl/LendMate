import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

SplashScreen.preventAutoHideAsync();

const palette = {
  navy: '#103B5D',
  green: '#15934B',
  white: '#FFFFFF',
};

function AnimatedBrandMark() {
  const scale = useRef(new Animated.Value(0.82)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const wordmarkOpacity = useRef(new Animated.Value(0)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo scales + fades in
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          tension: 70,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
      // Wordmark fades in
      Animated.timing(wordmarkOpacity, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
      // Tagline fades in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
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
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const staggered = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, {
            toValue: 1,
            duration: 340,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 340,
            useNativeDriver: true,
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
  const screenOpacity = useRef(new Animated.Value(0)).current;
  const loadingOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Give the loading screen at least 2.2 s so the animation plays fully,
    // then fade it out and reveal the app.
    const timer = setTimeout(async () => {
      await SplashScreen.hideAsync();

      Animated.parallel([
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 340,
          useNativeDriver: true,
        }),
        Animated.timing(screenOpacity, {
          toValue: 1,
          duration: 340,
          useNativeDriver: true,
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
    ...StyleSheet.absoluteFillObject,
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
