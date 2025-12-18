/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#7C3AED', // A vibrant purple for main elements
        'primary-dark': '#6D28D9',
        'secondary': '#3B82F6', // A bright blue for buttons and highlights
        'secondary-dark': '#2563EB',
        'background': '#F9FAFB', // Light gray for page backgrounds
        'sidebar': '#FFFFFF', // White for the sidebars
        'text-primary': '#1F2937', // Dark gray for primary text
        'text-secondary': '#6B7280', // Medium gray for secondary text
        'accent-cyan': '#22D3EE',
        'accent-green': '#34D399',
        'accent-orange': '#FBBF24',
        'accent-red': '#F87171',
        'light-gray': '#f3f4f6',
        'medium-gray': '#d1d5db',
        'sweet-pink': '#ff85a2',
        'sweet-purple': '#c968ff',
        'sweet-yellow': '#ffd166',
        'sweet-blue': '#6dcff6',
      },
      keyframes: {
        jelly: {
          '0%, 100%': { transform: 'scale(1, 1)' },
          '25%': { transform: 'scale(0.9, 1.1)' },
          '50%': { transform: 'scale(1.1, 0.9)' },
          '75%': { transform: 'scale(0.95, 1.05)' },
        },
        jelly: {
          '0%, 100%': { transform: 'scale(1, 1)' },
          '30%': { transform: 'scale(1.06, 0.94)' },
          '45%': { transform: 'scale(0.96, 1.04)' },
          '60%': { transform: 'scale(1.03, 0.97)' },
          '75%': { transform: 'scale(0.99, 1.01)' },
        },
        cottonCandy: {
          '0%': { opacity: '0', filter: 'blur(6px)' },
          '50%': { opacity: '0.7', filter: 'blur(3px)' },
          '100%': { opacity: '1', filter: 'blur(0px)' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        sway: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        drip: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-15px)' },
        },
        spinSlow: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        pulseGentle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        }
      },
      animation: {
        jelly: 'jelly 0.8s ease-in-out',
        'jelly-loop': 'jelly 0.8s ease-in-out infinite',
        jelly: 'jelly 2.2s ease-in-out infinite',
        cottonCandy: 'cottonCandy 1.8s ease-out',
        orbit: 'orbit 4s linear infinite',
        float: 'float 6s ease-in-out infinite',
        sway: 'sway 8s ease-in-out infinite',
        drip: 'drip 5s linear infinite',
        bounce: 'bounce 3s ease-in-out infinite',
        spinSlow: 'spinSlow 20s linear infinite',
        pulseGentle: 'pulseGentle 4s ease-in-out infinite',
      },
    },
  },
  plugins: [
    require('tailwindcss-animation-delay'),
  ],
}