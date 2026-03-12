/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-conic': 'conic-gradient(var(--tw-gradient-stops))',
      },
      colors: {
        primary: '#8B5A2B',
        secondary: '#D4A76A',
        accent: '#FF6B6B',
        cafe: {
          gold: '#D4A76A',
          brown: '#8B5A2B',
          dark: '#0a0605',
          cream: '#F5E6D0'
        },
        pastel: {
          pink: '#FFB3D1',
          'light-pink': '#FFE5F1',
          olive: '#A3B18A',
          'light-olive': '#EDF1E4',
          green: '#B3E5D1',
          purple: '#D1B3FF',
          yellow: '#FFF3B3'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif']
      }
    },
  },
  plugins: [],
}
