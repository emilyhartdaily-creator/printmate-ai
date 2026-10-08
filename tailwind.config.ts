import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a12',
        surface: '#12121c',
        card: '#171724',
        line: '#26263a',
        brand: {
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        coral: {
          300: '#fda4af',
          400: '#fb7185',
          500: '#ff6b6b',
          600: '#e11d48',
        },
        muted: '#a1a1aa',
      },
      fontFamily: {
        display: ['var(--font-syne)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
