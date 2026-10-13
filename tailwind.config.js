/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        factory: {
          dark: '#12151b',
          panel: '#1b202a',
          border: '#2c3547',
          accent: '#00d2ff',
          warning: '#f59e0b',
          danger: '#ef4444',
          success: '#10b981',
        }
      }
    },
  },
  plugins: [],
}
