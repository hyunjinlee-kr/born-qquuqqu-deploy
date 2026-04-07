/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        acc: '#2EC27E',
        'acc-light': '#E8F8F0',
        'acc-mid': '#A8E6C8',
        'acc-dark': '#1A9E5E',
        bg: '#F4FAF6',
        card: '#FFFFFF',
        txt: '#1A2E24',
        txt2: '#4A6358',
        muted: '#8AAA96',
        border: '#DDE3E5',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Noto Sans KR"', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
      },
      boxShadow: {
        card: '0 2px 16px rgba(46,194,126,.10)',
        'card-selected': '0 0 0 2px #2EC27E',
      },
    },
  },
  plugins: [],
}
