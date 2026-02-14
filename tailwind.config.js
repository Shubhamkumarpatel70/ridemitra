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
          DEFAULT: '#000000',
          light: '#1a1a1a',
        },
        secondary: '#F5F5F5',
        accent: {
          DEFAULT: '#00D4AA',
          hover: '#00B894',
        },
        'accent-secondary': '#FF6B35',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
        'text-primary': '#000000',
        'text-secondary': '#6B7280',
        'text-light': '#FFFFFF',
        border: '#E5E7EB',
        surface: '#FFFFFF',
        'surface-dark': '#1F2937',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'button': '12px',
      },
    },
  },
  plugins: [],
}

