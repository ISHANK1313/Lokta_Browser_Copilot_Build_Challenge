/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Source Sans 3"', '"Segoe UI"', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Newsreader', 'Georgia', '"Times New Roman"', 'serif'],
        mono: ['"IBM Plex Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      colors: {
        ink: '#221A20',
        paper: '#FBF9FA',
        accent: '#4B2440',
        'accent-soft': '#EFE3EA',
      },
    },
  },
  plugins: [],
};
