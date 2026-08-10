/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          bg: '#0B0E17',
          card: '#121829',
          cardHover: '#171F36',
          border: 'rgba(255, 255, 255, 0.08)',
          borderHover: 'rgba(139, 92, 246, 0.3)',
          primary: '#8B5CF6',
          purple: '#6366F1',
          accent: '#A855F7',
          pink: '#EC4899',
          cyan: '#06B6D4',
          emerald: '#10B981',
          rose: '#F43F5E',
          textMuted: '#94A3B8',
          textBright: '#F8FAFC'
        }
      },
      backgroundImage: {
        'cosmic-gradient': 'linear-gradient(135deg, #0B0E17 0%, #121829 50%, #1A1D36 100%)',
        'purple-gradient': 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #D946EF 100%)',
        'glow-gradient': 'radial-gradient(circle at center, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
      },
      boxShadow: {
        'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.4)',
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.4)',
        'glow-card': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
