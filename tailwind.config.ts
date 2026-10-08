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
        // "Decent" light theme: warm paper background, ink text,
        // trustworthy blue brand, warm orange accent.
        paper: '#FAF9F6',
        ink: '#1C1917',
        surface: '#FFFFFF',
        card: '#FFFFFF',
        line: '#E9E2D6',
        brand: {
          100: '#DBEAFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2E6BFF',
          600: '#1D55D6',
          700: '#1A45AC',
        },
        coral: {
          100: '#FFEDD5',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
        },
        muted: '#78716C',
      },
      fontFamily: {
        display: ['var(--font-syne)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 25, 23, 0.05), 0 8px 24px -12px rgba(28, 25, 23, 0.12)',
        pop: '0 12px 32px -12px rgba(29, 85, 214, 0.35)',
      },
    },
  },
  plugins: [],
};

export default config;
