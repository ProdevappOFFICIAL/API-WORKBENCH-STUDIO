/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Purge unused styles aggressively
  purge: {
    enabled: true,
    content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
    options: {
      safelist: [],
    },
  },
};