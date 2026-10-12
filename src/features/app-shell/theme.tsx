import React from 'react';

// ─── Design tokens — light & dark ────────────────────────────────────────────

export const palettes = {
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
    green: '#238A4A',
    greenDark: '#59C77C',
    greenPale: '#0A1F12',
    greenMid: '#143421',
    // Backgrounds — dark grays, not full black
    background: '#111315',
    surface: '#1C1F22',
    // Text
    text: '#DCE4EA',
    muted: '#7A8D99',
    mutedLight: '#93A0A8',
    // Borders — subtle, not noticeable
    line: '#252B30',
    // Status colors — same hue, reduced brightness
    amber: '#C98A28',
    amberPale: '#1E1508',
    red: '#C94A4A',
    redPale: '#200B0B',
  },
} as const;

export type Palette = typeof palettes.light | typeof palettes.dark;

// ─── Theme context ────────────────────────────────────────────────────────────

export const ThemeContext = React.createContext<Palette>(palettes.light);
