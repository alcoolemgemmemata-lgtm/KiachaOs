module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        cyan: {
          300: '#06b6d4',
          400: '#06d6f3',
          900: '#164e63',
        },
      },
      fontFamily: {
        mono: ['monospace'],
      },
    },
  },
  plugins: [],
}
