// AgroEndure Design System — ported from the Vite web app
// Colors match the Tailwind / CSS custom properties exactly.

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    Math.round((l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${f(0)}${f(8)}${f(4)}`;
}

export const Colors = {
  background: '#FFFFFF',
  foreground: '#0F172A',

  primary: '#15803D',
  primaryForeground: '#FFFFFF',
  primaryLight: '#22C55E',
  primaryDark: '#166534',
  primaryBg: '#F0FDF4',

  secondary: '#F8FAFC',
  secondaryForeground: '#0F172A',

  accent: '#DCFCE7',
  accentForeground: '#15803D',

  muted: '#F1F5F9',
  mutedForeground: '#64748B',

  card: '#FFFFFF',
  cardForeground: '#0F172A',

  popover: '#FFFFFF',
  popoverForeground: '#0F172A',

  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#15803D',
  input: '#F8FAFC',
  ring: '#15803D',

  success: '#16A34A',
  successForeground: '#FFFFFF',

  warning: '#F59E0B',
  warningForeground: '#FFFFFF',

  error: '#EF4444',
  errorForeground: '#FFFFFF',

  voiceActive: '#22C55E',
  voiceInactive: '#94A3B8',
  voicePulse: '#15803D',

  // Aliases for status badges
  successBg: '#DCFCE7',
  errorBg: '#FEE2E2',
  warningBg: '#FEF3C7',
  disabled: '#E2E8F0',
  disabledText: '#94A3B8',

  // Gradients (React Native requires explicit stops)
  gradientPrimaryStart: hslToHex(140, 65, 35),
  gradientPrimaryEnd: hslToHex(140, 45, 45),

  gradientSecondaryStart: hslToHex(35, 40, 85),
  gradientSecondaryEnd: hslToHex(35, 30, 75),

  gradientVoiceStart: `${hslToHex(140, 80, 45)}33`,
  gradientVoiceEnd: `${hslToHex(140, 65, 35)}1A`,

  // Misc
  black: '#000000',
  white: '#FFFFFF',
  blue500: '#3B82F6',
  blue600: '#2563EB',
  purple500: '#A855F7',
  pink500: '#EC4899',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const Radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 999,
};

export const FontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
};

export const Shadows = {
  soft: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  medium: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 30,
    elevation: 6,
  },
  strong: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 40,
    elevation: 8,
  },
};
