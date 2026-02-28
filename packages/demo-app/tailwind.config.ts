import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

export default {
  content: ['./client/**/*.{html,tsx,ts}'],
  theme: {
    extend: {
      colors: {
        dgb: {
          blue: '#002352',
          light: '#0066ff',
          accent: '#00ccff',
        },
      },
    },
  },
  plugins: [typography],
} satisfies Config;
