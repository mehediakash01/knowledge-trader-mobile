/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'brand-dark': '#0D3A60',
        'brand-accent': '#00C2E0',
      }
    },
  },
  plugins: [],
};
