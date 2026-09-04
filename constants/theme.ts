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
  background: hslToHex(0, 0, 100),
  foreground: hslToHex(140, 10, 15),

  primary: hslToHex(140, 65, 35),
  primaryForeground: hslToHex(0, 0, 100),
  primaryLight: hslToHex(140, 45, 45),
  primaryDark: hslToHex(140, 85, 25),

  secondary: hslToHex(35, 40, 85),
  secondaryForeground: hslToHex(140, 10, 15),

  accent: hslToHex(140, 35, 90),
  accentForeground: hslToHex(140, 10, 15),

  muted: hslToHex(140, 15, 95),
  mutedForeground: hslToHex(140, 10, 45),

  card: hslToHex(0, 0, 100),
  cardForeground: hslToHex(140, 10, 15),

  popover: hslToHex(0, 0, 100),
  popoverForeground: hslToHex(140, 10, 15),

  border: hslToHex(140, 20, 85),
  input: hslToHex(140, 20, 95),
  ring: hslToHex(140, 65, 35),

  success: hslToHex(142, 76, 36),
  successForeground: hslToHex(0, 0, 100),

  warning: hslToHex(48, 96, 53),
  warningForeground: hslToHex(0, 0, 100),

  error: hslToHex(0, 84, 60),
  errorForeground: hslToHex(0, 0, 100),

  voiceActive: hslToHex(140, 80, 45),
  voiceInactive: hslToHex(140, 20, 70),
  voicePulse: hslToHex(140, 65, 35),

  // Aliases for status badges
  successBg: `${hslToHex(142, 76, 36)}20`,
  errorBg: `${hslToHex(0, 84, 60)}15`,
  warningBg: `${hslToHex(48, 96, 53)}18`,
  primaryBg: `${hslToHex(140, 65, 35)}15`,

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
