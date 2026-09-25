/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0f172a',      // slate-900
          card: '#1e293b',      // slate-800
          cardHover: '#334155', // slate-700
          accent: '#6366f1',    // indigo-500
          accentHover: '#4f46e5',
          success: '#10b981',   // emerald-500
          warning: '#f59e0b',   // amber-500
          danger: '#ef4444',    // rose-500
          info: '#0ea5e9',       // sky-500
        }
      }
    },
  },
  plugins: [],
}
