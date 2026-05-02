// Design tokens from design.md - centralized design system
export const COLORS = {
  primary: '#00BFA5',
  primaryDark: '#009688',
  primaryLight: '#E0F7FA',
  secondary: '#1E3A8A',
  secondaryLight: '#3B5CC6',
  accent: '#FF6700',
  accentLight: '#FFF3E0',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  overlay: 'rgba(0, 0, 0, 0.5)',
  shadow: 'rgba(30, 58, 138, 0.08)',
  cardShadow: 'rgba(30, 58, 138, 0.12)',
};

export const FONTS = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  // Fallbacks for before fonts load
  systemRegular: 'System',
  systemBold: 'System',
};

export const SIZES = {
  // Spacing
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,

  // Border Radius
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusXl: 24,
  radiusFull: 999,

  // Font Sizes
  caption: 12,
  body: 14,
  bodyLg: 16,
  subtitle: 18,
  title: 22,
  heading: 28,
  hero: 34,

  // Icon sizes
  iconSm: 20,
  iconMd: 24,
  iconLg: 28,

  // Misc
  headerHeight: 100,
  tabBarHeight: 70,
  inputHeight: 52,
  buttonHeight: 52,
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.cardShadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 8,
  },
};
