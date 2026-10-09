/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        apple: {
          bg: '#f8fafc',
          card: '#ffffff',
          primary: '#0066cc',
          primaryHover: '#0052a3',
          dark: '#1d1d1f',
          subtext: '#86868b',
          border: '#e2e8f0',
          accent: '#0071e3',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
          indigo: '#4f46e5',
        },
      },
      fontFamily: {
        sans: [
          'SF Pro Display',
          'SF Pro Text',
          '-apple-system',
          'BlinkMacSystemFont',
          'Inter',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      boxShadow: {
        apple: '0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'apple-hover': '0 12px 30px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)',
        'apple-lg': '0 20px 40px -10px rgba(0, 0, 0, 0.1)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
