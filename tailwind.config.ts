import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#0a0b10',
        panel:   '#0f1117',
        panel2:  '#151820',
        border:  '#1e2235',
        border2: '#252a3a',
        accent:  '#3b82f6',
        accentH: '#60a5fa',
        green:   '#22c55e',
        red:     '#ef4444',
        gold:    '#f59e0b',
        purple:  '#a855f7',
        muted:   '#6b7280',
        text:    '#e5e7eb',
        textDim: '#9ca3af',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        ticker: 'ticker 30s linear infinite',
      },
      keyframes: {
        ticker: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
