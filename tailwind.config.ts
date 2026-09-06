import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        cyber: ['Orbitron', 'sans-serif'],
      },
      colors: {
        cyber: {
          bg: '#050508',
          surface: '#0a0a10',
          card: '#0d0d14',
          border: '#1a1a2e',
          glow: '#00ff41',
          cyan: '#00f0ff',
          magenta: '#ff00aa',
          purple: '#a855f7',
          amber: '#fbbf24',
          red: '#ff3333',
          dim: '#6b7280',
          text: '#c8c8d4',
          muted: '#9ca3af',
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'pulse-neon': 'pulse-neon 2s ease-in-out infinite',
        glitch: 'glitch 0.3s infinite',
        'slide-up': 'slide-up 0.6s ease-out both',
        'fade-in': 'fade-in 0.4s ease-out both',
        marquee: 'marquee 40s linear infinite',
        'border-glow': 'border-glow 2s ease-in-out infinite',
      },
      keyframes: {
        float: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-8px)' } },
        'pulse-neon': { '0%,100%': { opacity: '1', filter: 'brightness(1)' }, '50%': { opacity: '.7', filter: 'brightness(1.3)' } },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px,2px)' },
          '40%': { transform: 'translate(-2px,-2px)' },
          '60%': { transform: 'translate(2px,2px)' },
          '80%': { transform: 'translate(2px,-2px)' },
          '100%': { transform: 'translate(0)' },
        },
        'slide-up': { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'border-glow': { '0%,100%': { borderColor: 'rgba(0,255,65,.2)' }, '50%': { borderColor: 'rgba(0,255,65,.6)' } },
      },
      backdropBlur: { xs: '2px' },
    },
  },
  plugins: [],
} satisfies Config;
