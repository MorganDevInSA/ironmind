/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Backgrounds — pure dark, no blue tint */
        background:         '#080808',
        'bg-0':             '#080808',
        'bg-1':             '#0D0D0D',
        'bg-2':             '#131313',
        surface:            '#131313',
        'surface-elevated': '#1A1A1A',

        /* Borders */
        border:             '#2A2020',
        'border-hover':     '#3A2828',

        /* Text — neutral grey, no blue tint */
        foreground:         '#F0F0F0',
        'text-0':           '#F0F0F0',
        'text-1':           '#9A9A9A',
        'text-2':           '#5E5E5E',
        'text-secondary':   '#888888',
        'text-muted':       '#555555',

        /* Accents — Crimson */
        accent:             '#DC2626',
        'accent-hover':     '#B91C1C',
        'accent-2':         '#991B1B',

        /* Status */
        destructive:        '#EF4444',
        good:               '#22C55E',
        bad:                '#EF4444',
        success:            '#22C55E',
        warning:            '#F59E0B',
        warn:               '#F59E0B',

        /* Crimson scale — replaces gold */
        gold:               '#DC2626',
        'gold-light':       '#EF4444',
        'gold-dark':        '#991B1B',
        crimson:            '#DC2626',
        'crimson-light':    '#EF4444',
        'crimson-dark':     '#991B1B',

        /* Ring */
        ring:               '#DC2626',
      },

      fontFamily: {
        sans:    ['Rajdhani', 'system-ui', 'sans-serif'],
        heading: ['Rajdhani', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['Cinzel', 'serif'],
      },

      borderRadius: {
        panel: '14px',
      },

      boxShadow: {
        soft:   '0 10px 24px rgba(0, 0, 0, 0.45)',
        strong: '0 16px 40px rgba(0, 0, 0, 0.60)',
        gold:   '0 8px 32px rgba(220, 38, 38, 0.20)',
        accent: '0 8px 32px rgba(220, 38, 38, 0.20)',
        'inner-soft': 'inset 0 1px 1px rgba(255,255,255,0.04), inset 0 -2px 6px rgba(0,0,0,0.55)',
      },

      backdropBlur: {
        panel: '12px',
        modal: '16px',
      },

      animation: {
        'fade-in-up':    'fade-in-up 0.3s ease-out',
        'scale-in':      'scale-in 0.2s ease-out',
        'count-up':      'count-up 0.3s ease-out',
        'slide-in-right':'slide-in-right 0.3s ease-out',
        'pulse-ring':    'pulse-ring 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
        'gold-glint':    'gold-glint 3s ease-in-out infinite',
        'gold-glow':     'gold-glow 3s ease-in-out infinite',
        'pulse-soft':    'pulse-soft 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'shimmer':       'shimmer 2s infinite',
        'nav-shimmer':   'navShimmer 3.8s ease-in-out infinite',
      },

      keyframes: {
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'count-up': {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'pulse-ring': {
          '0%':   { boxShadow: '0 0 0 0 rgba(220,38,38,0.4)' },
          '70%':  { boxShadow: '0 0 0 10px rgba(220,38,38,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(220,38,38,0)' },
        },
        'gold-glint': {
          '0%, 100%': {
            filter: 'drop-shadow(0 0 4px rgba(220,38,38,0.9)) drop-shadow(0 0 8px rgba(239,68,68,0.5))',
          },
          '50%': {
            filter: 'drop-shadow(0 0 8px rgba(239,68,68,1)) drop-shadow(0 0 12px rgba(220,38,38,0.7))',
          },
        },
        'gold-glow': {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(220,38,38,0.2), inset 0 1px 2px rgba(239,68,68,0.2)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(220,38,38,0.4), inset 0 1px 2px rgba(239,68,68,0.4)',
          },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.72' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        navShimmer: {
          '0%':   { left: '-120%' },
          '45%':  { left: '120%' },
          '100%': { left: '120%' },
        },
      },
    },
  },
  plugins: [],
};
