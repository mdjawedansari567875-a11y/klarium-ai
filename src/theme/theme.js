// KLARIUM AI — Premium Dark Theme
// Single source of truth for colors, spacing, typography.
// Keep every screen pulling from here so the "premium" look stays consistent.

export const colors = {
  background: '#0B0B14',      // near-black base
  backgroundAlt: '#12121F',   // card / surface background
  surface: '#171728',
  surfaceElevated: '#1E1E33',

  gold: '#D4AF37',            // primary premium accent
  goldSoft: '#E8C766',
  gradientStart: '#7B5CFA',   // violet
  gradientEnd: '#3E7BFA',     // blue

  textPrimary: '#F5F5FA',
  textSecondary: '#A6A6C1',
  textMuted: '#6E6E8A',

  success: '#3ECF8E',
  danger: '#FF5C7A',
  border: 'rgba(255,255,255,0.08)',
  overlay: 'rgba(0,0,0,0.55)',
};

export const gradients = {
  primary: [colors.gradientStart, colors.gradientEnd],
  gold: ['#F4E5B2', colors.gold],
  card: ['#1B1B2E', '#14141F'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radius = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
};

export const typography = {
  displayHeavy: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: colors.textPrimary,
  },
  h1: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
};

export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};
