/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: { base: '#0B0B0F', elevated: '#14141B', sunken: '#070709' },
        ink: {
          primary: '#F5F5F7',
          secondary: '#A1A1AA',
          tertiary: '#6B6B76',
          inverse: '#0B0B0F',
        },
        accent: {
          DEFAULT: '#6366F1',
          hover: '#7C7FF5',
          press: '#5457D6',
        },
        line: {
          subtle: 'rgba(255,255,255,0.08)',
          strong: 'rgba(255,255,255,0.16)',
        },
        glass: 'rgba(20,20,27,0.55)',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(2.5rem, 6vw, 3.5rem)', { lineHeight: '1.07', letterSpacing: '-0.02em', fontWeight: '600' }],
        h1: ['clamp(2rem, 4vw, 2.5rem)', { lineHeight: '1.15', letterSpacing: '-0.015em', fontWeight: '600' }],
        h2: ['1.875rem', { lineHeight: '1.27', fontWeight: '600' }],
        h3: ['1.375rem', { lineHeight: '1.36', fontWeight: '600' }],
        body: ['1rem', { lineHeight: '1.625' }],
        sm: ['0.875rem', { lineHeight: '1.57' }],
        xs: ['0.75rem', { lineHeight: '1.5', fontWeight: '500' }],
      },
      borderRadius: {
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(0,0,0,0.4)',
        md: '0 8px 24px rgba(0,0,0,0.45)',
        lg: '0 24px 60px rgba(0,0,0,0.55)',
        glow: '0 0 0 1px rgba(99,102,241,0.4), 0 8px 32px rgba(99,102,241,0.25)',
      },
      maxWidth: {
        content: '1200px',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.4s infinite',
      },
    },
  },
  plugins: [],
};
