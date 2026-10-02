/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f5f9',
          100: '#e1ecf4',
          200: '#c3d9e9',
          300: '#9bc0d9',
          400: '#6ca1c6',
          500: '#4d85ac',
          600: '#3c6a8f',
          700: '#325674',
          800: '#2b4861',
          900: '#253d52',
          950: '#0b1623',
        },
        navy: {
          800: '#1b2a4e',
          900: '#111a30',
        }
      },
      animation: {
        'shimmer': 'shimmer 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
      },
      keyframes: {
        shimmer: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: .5 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
