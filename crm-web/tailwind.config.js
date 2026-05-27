/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#070a13',
        glassBg: 'rgba(20, 26, 48, 0.4)',
        glassBorder: 'rgba(255, 255, 255, 0.05)',
        accentNeon: '#3b82f6',
        warningNeon: '#eab308',
        successNeon: '#10b981',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
