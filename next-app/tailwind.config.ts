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
        // Variable name kept as --font-orbitron to avoid touching every
        // call site; it now loads Space Grotesk (next-app/[locale]/layout.tsx).
        cyber: ['var(--font-orbitron)', 'sans-serif'],
      },
      colors: {
        // RGB-triplet CSS vars (see globals.css :root / [data-theme="light"])
        // so `bg-cyber-bg`, `text-cyber-glow/50`, etc. re-theme instantly
        // without touching every call site - the <alpha-value> placeholder
        // is Tailwind's own convention for keeping opacity modifiers working.
        cyber: {
          bg: 'rgb(var(--cyber-bg) / <alpha-value>)',
          surface: 'rgb(var(--cyber-surface) / <alpha-value>)',
          card: 'rgb(var(--cyber-card) / <alpha-value>)',
          border: 'rgb(var(--cyber-border) / <alpha-value>)',
          glow: 'rgb(var(--cyber-glow) / <alpha-value>)',
          cyan: 'rgb(var(--cyber-cyan) / <alpha-value>)',
          magenta: 'rgb(var(--cyber-magenta) / <alpha-value>)',
          purple: 'rgb(var(--cyber-purple) / <alpha-value>)',
          amber: 'rgb(var(--cyber-amber) / <alpha-value>)',
          red: 'rgb(var(--cyber-red) / <alpha-value>)',
          dim: 'rgb(var(--cyber-dim) / <alpha-value>)',
          text: 'rgb(var(--cyber-text) / <alpha-value>)',
          muted: 'rgb(var(--cyber-muted) / <alpha-value>)',
        },
      },
    },
  },
  plugins: [],
};

export default config;
