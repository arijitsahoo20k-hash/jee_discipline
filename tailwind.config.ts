import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#060A0F',
          secondary: '#0C1219',
          tertiary: '#111A24',
          card: '#0F1922',
          hover: '#141F2C',
        },
        border: {
          DEFAULT: '#1A2535',
          active: '#243548',
        },
        text: {
          primary: '#E2EAF4',
          secondary: '#7A8FA6',
          muted: '#3D5068',
        },
        accent: {
          red: '#FF3333',
          amber: '#F59E0B',
          green: '#10B981',
          blue: '#3B82F6',
          purple: '#8B5CF6',
          cyan: '#06B6D4',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideInDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
}

export default config
