/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-dark)',
        glassBg: 'var(--panel-glass)',
        glassBorder: 'var(--border-glass)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        surface: 'var(--bg-surface)',
        accentNeon: 'var(--accent-neon)',
        warningNeon: 'var(--warning-neon)',
        successNeon: 'var(--success-neon)',
        dangerNeon: 'var(--danger-neon)',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
