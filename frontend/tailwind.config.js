/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lyzr: {
          'white-amber': '#F3EFEA',
          'cream': '#E3D0C2',
          'ferra': '#71514F',
          'congo': '#4A2F2D',
          'black': '#27272A',
          'light-1': '#FBF9F7',
          'light-2': '#F0E9E3',
          'light-3': '#ECE2DA',
          'light-4': '#E8DACF',
          'mid-1': '#DEC6B6',
          'mid-2': '#D2B7A8',
          'mid-3': '#C6A89A',
          'mid-4': '#BA998D',
          'mid-5': '#AE8A80',
          'dark-1': '#9E7A73',
          'dark-2': '#8E6A67',
          'dark-3': '#7F5D5A',
          'dark-4': '#5E403E',
          'dark-5': '#351D1C',
          'dark-6': '#1F1010',
        },
        accent: {
          'warm': '#EC7843',
          'cool': '#4A6FA8',
          'success': '#3D8C6C',
          'warning': '#CFA031',
          'error': '#C84658',
          'highlight': '#7A639D',
        }
      },
      fontFamily: {
        'playfair': ['"Playfair Display"', 'serif'],
        'noto': ['"Noto Sans"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
