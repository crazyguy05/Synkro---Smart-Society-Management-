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
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e40af',
          800: '#1e3a8a',
          900: '#172554',
          DEFAULT: '#2563eb',
          glow:    '#60a5fa',
        },
        teal: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0d9488',
          700: '#0f766e',
        },
        accent: {
          violet:  '#6d28d9',
          cyan:    '#06b6d4',
          teal:    '#0d9488',
          pink:    '#ec4899',
          amber:   '#b45309',
          emerald: '#059669',
          rose:    '#f43f5e',
        },
        surface: {
          page:   '#F8FAFC',
          panel:  '#ffffff',
          muted:  '#F1F5F9',
          ring:   '#E6EAF0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'card-soft':  '0 1px 2px rgba(15,23,42,.04), 0 8px 24px -12px rgba(15,23,42,.10)',
        'card-flat':  '0 1px 0 rgba(15,23,42,.02)',
        'card-lift':  '0 12px 32px -14px rgba(15,23,42,.18), 0 2px 4px rgba(15,23,42,.05)',
        'glow':       '0 0 24px rgba(37,99,235,.28)',
        'glow-teal':  '0 0 24px rgba(13,148,136,.30)',
        'brand-soft': '0 4px 12px -2px rgba(37,99,235,.40)',
      },
      backgroundImage: {
        'brand-grad':   'linear-gradient(135deg, #2563eb 0%, #06b6d4 100%)',
        'teal-grad':    'linear-gradient(135deg, #06b6d4 0%, #0d9488 100%)',
        'tile-blue':    'linear-gradient(135deg, #dbeafe, #cffafe)',
        'tile-teal':    'linear-gradient(135deg, #cffafe, #d1fae5)',
        'tile-green':   'linear-gradient(135deg, #d1fae5, #ecfeff)',
        'tile-amber':   'linear-gradient(135deg, #fef3c7, #fee2e2)',
        'tile-violet':  'linear-gradient(135deg, #ede9fe, #e0e7ff)',
        'tile-slate':   'linear-gradient(135deg, #e2e8f0, #cffafe)',
        'gradient-ring':'linear-gradient(135deg, #bfdbfe 0%, #ccfbf1 50%, #e0f2fe 100%)',
        'page-fade':    'linear-gradient(180deg, #F8FAFC 0%, #F4F7FB 100%)',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0px)' },
          '50%':     { transform: 'translateY(-10px)' },
        },
        shine: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseGlow: {
          '0%,100%': { boxShadow: '0 0 0 0 rgba(244,63,94,.45)' },
          '50%':     { boxShadow: '0 0 0 14px rgba(244,63,94,0)' },
        },
        gradient: {
          '0%,100%': { backgroundPosition: '0% 50%' },
          '50%':     { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shine: 'shine 2.4s linear infinite',
        'pulse-glow': 'pulseGlow 2.4s ease-in-out infinite',
        gradient: 'gradient 12s ease infinite',
      },
    },
  },
  plugins: [],
};
