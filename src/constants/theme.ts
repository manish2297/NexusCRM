/**
 * Premium design system colors and layout constants for the CRM app.
 */

// @ts-ignore
import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F8FAFC',
    backgroundElement: 'rgba(255, 255, 255, 0.75)',
    backgroundSelected: '#E2E8F0',
    textSecondary: '#64748B',
    border: 'rgba(15, 23, 42, 0.08)',
    primary: '#4FACFE',
    secondary: '#8B5CF6',
    accent: '#00F2FE',
    cardBg: 'rgba(255, 255, 255, 0.7)',
    
    // Status colors
    statusNew: '#3B82F6',       // Blue
    statusContacted: '#F59E0B', // Amber
    statusProposal: '#8B5CF6',  // Violet
    statusWon: '#10B981',       // Emerald
    statusLost: '#EF4444',      // Red
  },
  dark: {
    text: '#F8FAFC',
    background: '#07090E', // Extra deep space black-blue
    backgroundElement: 'rgba(30, 41, 59, 0.55)', // Semi-transparent glass card base
    backgroundSelected: 'rgba(255, 255, 255, 0.12)',
    textSecondary: '#94A3B8', // Sleek slate gray
    border: 'rgba(255, 255, 255, 0.09)', // Subtle glassmorphic highlight border
    primary: '#4FACFE', // Neon blue start
    secondary: '#8B5CF6', // Royal violet
    accent: '#00F2FE', // Neon cyan
    cardBg: 'rgba(15, 23, 42, 0.65)', // Sleek dark card back
    
    // Status colors
    statusNew: '#60A5FA',       // Bright Sky Blue
    statusContacted: '#FBBF24', // Electric Gold/Amber
    statusProposal: '#A78BFA',  // Neon Purple
    statusWon: '#34D399',       // Glowing Emerald
    statusLost: '#F87171',      // Vivid Crimson
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
