/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#5b8cff',
          glow: '#8ab4ff'
        }
      },
      boxShadow: {
        glow: '0 0 20px rgba(91,140,255,0.5)'
      }
    },
  },
  plugins: [],
};
