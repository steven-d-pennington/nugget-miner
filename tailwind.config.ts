import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}', './src/features/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        accent: 'var(--accent)',
        danger: 'var(--danger)',
        success: 'var(--success)',
      },
      borderRadius: {
        nugget: 'var(--radius)',
      },
    },
  },
  plugins: [],
};

export default config;
