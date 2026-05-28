/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Frosted Light Theme Tokens (Defaults)
        background: '#F8FAFC',
        cardBg: 'rgba(255, 255, 255, 0.7)',
        borderBg: 'rgba(15, 23, 42, 0.08)',
        textPrimary: '#0F172A',
        textSecondary: '#475569',
        accent: '#4F46E5',
        success: '#16A34A',
        warning: '#D97706',
        danger: '#DC2626',

        // Legacy Dark Slate Theme Tokens (darkBackground, darkCardBg, etc.)
        darkBackground: '#0B0F19',
        darkCardBg: 'rgba(25, 32, 56, 0.6)',
        darkBorderBg: 'rgba(255, 255, 255, 0.08)',
        darkTextPrimary: '#F3F4F6',
        darkTextSecondary: '#9CA3AF',
        darkAccent: '#4F46E5',
        darkSuccess: '#10B981',
        darkWarning: '#F59E0B',
        darkDanger: '#EF4444',
      },
    },
  },
  plugins: [],
}
