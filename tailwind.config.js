/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // LEGAKU Official Design System Tokens
        primary: {
          900: '#144D3A', // Primary CTA, important headings, FAB, active nav, balance card
          700: '#2E7D61', // Secondary accents, hover states, progress
          500: '#4CAF8A', // Illustrations, secondary accents
          100: '#E8F2EC', // Soft icon backgrounds, tag containers, selected cards
          50: '#F9FAF7',  // Page background
        },
        secondary: {
          DEFAULT: '#D6C6AC', // Warm sage accent
          sage: '#D6C6AC',
        },
        surface: '#FFFFFF',
        background: '#F9FAF7',
        border: '#E5E7EB',
        content: {
          primary: '#1F2937',
          secondary: '#6B7280',
          tertiary: '#9CA3AF',
        },
        status: {
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
        },

        // Legacy compatibility mappings aligned to official brand tokens
        forest: {
          50: '#F9FAF7',
          100: '#E8F2EC',
          200: '#D2E5DA',
          300: '#9BC7B3',
          400: '#4CAF8A',
          500: '#3D9674',
          600: '#2E7D61',
          700: '#23654E',
          800: '#144D3A', // Direct match to Primary 900
          900: '#0F3B2C',
          950: '#144D3A',
        },
        sage: {
          50: '#F9FAF7',
          100: '#E8F2EC',
          200: '#DCE7E0',
          300: '#D6C6AC', // Secondary warm sage
          400: '#B8CDBF',
          500: '#4CAF8A',
          600: '#2E7D61',
          700: '#23654E',
          800: '#144D3A',
          900: '#144D3A',
        },
        cream: {
          50: '#F9FAF7',
          100: '#F3F6F4',
          200: '#E8F2EC',
          300: '#E0DDD5',
          400: '#D6C6AC',
          500: '#BFA483',
        },
        warm: {
          white: '#FFFFFF',
          card: '#FFFFFF',
          border: '#E5E7EB',
          muted: '#6B7280',
          dark: '#1F2937',
        },
        earth: {
          gold: '#F59E0B',
          terracotta: '#EF4444',
          rust: '#EF4444',
          sand: '#D6C6AC',
        }
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 2px 10px rgba(20, 77, 58, 0.04)',
        'soft': '0 4px 20px rgba(20, 77, 58, 0.08)',
        'card': '0 4px 20px rgba(20, 77, 58, 0.08)',
        'elevated': '0 10px 30px rgba(20, 77, 58, 0.12)',
        'float': '0 16px 40px rgba(20, 77, 58, 0.16)',
      },
      borderRadius: {
        'xl': '0.875rem', // 14px
        '2xl': '1rem',    // 16px
        '3xl': '1.25rem', // 20px
        '4xl': '1.5rem',  // 24px
      }
    },
  },
  plugins: [],
}
