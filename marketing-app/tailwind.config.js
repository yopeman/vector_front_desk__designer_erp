/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00CED1',
          50: '#E6F9FA',
          100: '#CCF4F5',
          200: '#99E9EB',
          300: '#66DEE0',
          400: '#33D3D6',
          500: '#00CED1',
          600: '#00A8A7',
          700: '#00827D',
          800: '#005C53',
          900: '#003629',
        }
      }
    },
  },
  plugins: [],
}

