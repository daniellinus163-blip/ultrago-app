/**
 * UltraGo — gold & white brand (high contrast, everything readable on light surfaces).
 */
export const colors = {
  /** Brand gold */
  primary: '#D4A017',
  primaryMid: '#C99700',
  primaryBright: '#FFD60A',
  primaryDark: '#9A7209',

  /** Page backgrounds */
  background: '#FFFFFF',
  backgroundMid: '#FFFBEB',
  surface: '#FFFFFF',
  surfaceElevated: '#FFF9E6',
  secondary: '#FEF3C7',

  /** Cards & inputs on gold screens */
  card: '#FFFFFF',
  cardElevated: '#FFFBEB',
  inputBg: '#FFFFFF',
  chip: '#FEF9C3',

  /** Typography — dark on light for visibility */
  text: '#1C1917',
  textMuted: '#57534E',
  textSubtle: '#78716C',
  textOnPrimary: '#1C1917',
  textOnGold: '#422006',

  /** Borders */
  border: 'rgba(180, 134, 11, 0.5)',
  borderSubtle: 'rgba(28, 25, 23, 0.14)',
  glass: 'rgba(255, 255, 255, 0.94)',

  /** Navigation chrome */
  tabBar: '#FFFFFF',
  header: '#FFD60A',
  headerText: '#1C1917',
  tabInactive: '#78716C',

  accentOrange: '#B45309',
  accentAmber: '#D97706',
  glow: 'rgba(255, 214, 10, 0.4)',

  error: '#DC2626',
  success: '#15803D',
  overlay: 'rgba(255, 251, 235, 0.96)',

  /** Soft gold fills (highlights, selected rows) */
  goldTint: 'rgba(255, 214, 10, 0.22)',
  goldTintStrong: 'rgba(255, 214, 10, 0.38)',
} as const;

export const gradients = {
  screenGold: ['#FFD60A', '#FACC15', '#EAB308'] as const,
  authSpin: ['#FFFBEB', '#FEF3C7', '#FFD60A', '#FEF3C7', '#FFFBEB'] as const,
  authWash: ['rgba(255,251,235,0.15)', 'rgba(255,255,255,0.85)', 'rgba(255,255,255,0.97)'] as const,
  ctaGold: ['#FFD60A', '#FACC15', '#EAB308'] as const,
  sheet: ['#FFFFFF', '#FFFBEB'] as const,
  chip: ['#FEF9C3', '#FDE68A'] as const,
  rideTypeActive: ['rgba(251,192,45,0.95)', 'rgba(196,144,0,0.92)'] as const,
} as const;

export type ColorName = keyof typeof colors;
