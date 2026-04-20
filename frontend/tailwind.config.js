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
          50:  '#eef4ff',
          100: '#dce8ff',
          200: '#b8d0ff',
          300: '#8eb2ff',
          400: '#6b95ff',
          500: '#5b8cff',
          600: '#3f6ee0',
          700: '#2f56b8',
          800: '#24438f',
          900: '#1a3270',
          DEFAULT: '#5b8cff',
          glow: '#8ab4ff',
        },
        accent: {
          violet: '#8b5cf6',
          cyan:   '#06b6d4',
          pink:   '#ec4899',
          amber:  '#f59e0b',
          emerald:'#10b981',
          rose:   '#f43f5e',
        },
        surface: {
          light: '#ffffff',
          muted: '#f3f4f6',
          dark:  '#0b0f1a',
          card:  '#0f1422',
          ring:  '#1b2236',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'ui-sans-serif', 'sans-serif'],
      },
      boxShadow: {
        glow:    '0 0 24px rgba(91,140,255,0.45)',
        'glow-lg':'0 0 48px rgba(91,140,255,0.55)',
        'glow-violet':'0 0 32px rgba(139,92,246,0.45)',
        'card-lift': '0 10px 30px -10px rgba(0,0,0,0.35)',
      },
      backgroundImage: {
        'grid-faint':
          'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
        'aurora':
          'radial-gradient(60% 60% at 20% 20%, rgba(91,140,255,0.35) 0%, transparent 60%), radial-gradient(50% 50% at 80% 30%, rgba(139,92,246,0.30) 0%, transparent 60%), radial-gradient(60% 60% at 50% 100%, rgba(6,182,212,0.25) 0%, transparent 60%)',
      },
      backgroundSize: {
        'grid-40': '40px 40px',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-10px)' },
        },
        floatSlow: {
          '0%,100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%':     { transform: 'translateY(-16px) rotate(2deg)' },
        },
        shine: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(91,140,255,0.45)' },
          '50%':     { boxShadow: '0 0 0 16px rgba(91,140,255,0)' },
        },
        gradient: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%':     { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'floatSlow 9s ease-in-out infinite',
        shine: 'shine 3s linear infinite',
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
        gradient: 'gradient 12s ease infinite',
      },
    },
  },
  plugins: [],
};
