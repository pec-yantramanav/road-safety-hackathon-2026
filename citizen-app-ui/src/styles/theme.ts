export const Colors = {
  light: {
    background: '#F8FAFC',
    cardBg: 'rgba(255, 255, 255, 0.7)',
    borderBg: 'rgba(15, 23, 42, 0.08)',
    textPrimary: '#0F172A',
    textSecondary: '#475569',
    accent: '#4F46E5',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
  },
  dark: {
    background: '#0B0F19',
    cardBg: 'rgba(25, 32, 56, 0.6)',
    borderBg: 'rgba(255, 255, 255, 0.08)',
    textPrimary: '#F3F4F6',
    textSecondary: '#9CA3AF',
    accent: '#4F46E5',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  }
};

export type ThemeType = 'light' | 'dark';
