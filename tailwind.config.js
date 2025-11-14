/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./constants/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        '14': 'repeat(14, minmax(0, 1fr))',
      },
      colors: {
        brand: {
          primary: '#8b5cf6',    // purple-500
          secondary: '#ec4899',  // pink-500
        },
        base: {
          200: '#e5e7eb',  // gray-200
          300: '#d1d5db',  // gray-300
          600: '#4b5563',  // gray-600
          700: '#374151',  // gray-700
          800: '#1f2937',  // gray-800
          900: '#111827',  // gray-900
        },
      },
    },
  },
  plugins: [],
}
