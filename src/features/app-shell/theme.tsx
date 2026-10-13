import React from 'react';

// ─── Design tokens — light & dark ────────────────────────────────────────────

export const palettes = {
  light: {
    navy: '#103B5D',
    navyDeep: '#0A2B45',
    navyCard: '#103B5D',  // same as navy in light mode
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
    // navy is used for TEXT in dark mode — keep it light/readable
    navy: '#D4DFE8',
    navyDeep: '#E8EDF2',
    // Green accent
    green: '#238A4A',
    greenDark: '#59C77C',
    greenPale: '#0A1F12',
    greenMid: '#143421',
    // Backgrounds
    background: '#111315',
    surface: '#1C1F22',
    // A dedicated dark card background for hero panels that use navy in light mode
    // (heroCard, loanHero, portfolioCard always use navyCard)
    navyCard: '#0F2233',
    // Text
    text: '#DCE4EA',
    muted: '#7A8D99',
    mutedLight: '#93A0A8',
    // Borders
    line: '#252B30',
    // Status colors
    amber: '#C98A28',
    amberPale: '#1E1508',
    red: '#C94A4A',
    redPale: '#200B0B',
  },
} as const;

export type Palette = typeof palettes.light | typeof palettes.dark;

// ─── Theme context ────────────────────────────────────────────────────────────

export const ThemeContext = React.createContext<Palette>(palettes.light);
