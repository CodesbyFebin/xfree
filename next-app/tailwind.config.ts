import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
        cyber: ['var(--font-orbitron)', 'sans-serif'],
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
    },
  },
  plugins: [],
};

export default config;
