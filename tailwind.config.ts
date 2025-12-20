import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        primary: {
          50: '#A8E5CE',   // Green Lighter
          100: '#5EC49A',  // Green Light  
          500: '#199D67',  // Primary Green (main brand color)
          600: '#199D67',  // Same as primary for consistency
          700: '#199D67',  // Same as primary for consistency
        },
        
        // Secondary Brand Colors  
        secondary: {
          50: '#2DD4BF',   // Teal Light
          100: '#2DD4BF',  // Teal Light
          500: '#14B8A6',  // Teal (secondary brand color)
          600: '#0D9488',  // Teal Dark
          700: '#0D9488',  // Teal Dark
        },
        
        // Accent Colors
        accent: {
          50: '#BF00FF',   // Neon Purple
          100: '#A855F7',  // Brighter Purple
          500: '#BF00FF',  // Neon Purple (main)
          600: '#A855F7',  // Brighter Purple Dark
          700: '#601B9F',  // Primary Purple
          800: '#B629D4',  // Violet
        },
        
        // Warning/Energy Colors
        warning: {
          50: '#FCD34D',   // Yellow Light
          100: '#FCD34D',  // Yellow Light
          500: '#FFB701',  // Energy Yellow
          600: '#FFB701',  // Energy Yellow
        },
        
        // Energy Colors (alias for warning)
        energy: {
          50: '#FCD34D',   // Yellow Light
          100: '#FCD34D',  // Yellow Light
          500: '#FFB701',  // Energy Yellow
          600: '#FFB701',  // Energy Yellow
        },
        
        // Error/Alert Colors
        error: {
          50: '#EF4444',   // Red Light
          100: '#EF4444',  // Red Light
          500: '#D03739',  // Vibrant Red
          600: '#D03739',  // Vibrant Red
        },
        
        // Neutral Colors
        neutral: {
          0: '#000000',    // Pure Black
          50: '#F9F9F9',   // Very Light Gray
          100: '#FFFFFF',  // Pure White
          200: '#F9F9F9',  // Very Light Gray
          300: '#E5E7EB',  // Light Gray
          400: '#9CA3AF',  // Medium Gray
          500: '#6B7280',  // Light Gray
          600: '#4B5563',  // Dark Gray
          700: '#404040',  // Medium Gray
          800: '#1F1F1F',  // Dark Gray
          900: '#000000',  // Pure Black
        },
        
        // Status Colors
        status: {
          success: '#199D67',   // Primary Green
          info: '#14B8A6',      // Teal
          warning: '#FFB701',   // Energy Yellow
          error: '#D03739',     // Vibrant Red
          premium: '#BF00FF',   // Neon Purple / Premium
        },
        
        // Interactive States
        interactive: {
          hover: {
            primary: '#5EC49A',    // Green Light
            secondary: '#2DD4BF',  // Teal Light
            accent: '#A78BFA',     // Purple Light
          },
          active: {
            primary: '#199D67',    // Primary Green
            secondary: '#0D9488',  // Teal Dark
            accent: '#7C3AED',     // Button Purple
          },
        },
      },
      backgroundImage: {
        'gradient-green-energy': 'linear-gradient(135deg, #199D67, #5EC49A)',
        'gradient-clarity-flow': 'linear-gradient(135deg, #14B8A6, #2DD4BF)',
        'gradient-purple-power': 'linear-gradient(135deg, #601B9F, #8B5CF6)',
        'gradient-brand-harmony': 'linear-gradient(135deg, #199D67, #14B8A6)',
        'gradient-cosmic-journey': 'linear-gradient(135deg, #601B9F, #B629D4, #2DD4BF)',
        'gradient-dark-elevation': 'linear-gradient(180deg, #1F1F1F, #000000)',
        'gradient-primary': 'linear-gradient(135deg, #199D67, #5EC49A)',
        'gradient-secondary': 'linear-gradient(135deg, #14B8A6, #2DD4BF)',
        'gradient-accent': 'linear-gradient(135deg, #601B9F, #8B5CF6)',
        'gradient-brand': 'linear-gradient(135deg, #199D67, #14B8A6)',
        'gradient-cosmic': 'linear-gradient(135deg, #601B9F, #B629D4, #2DD4BF)',
        'gradient-energy': 'linear-gradient(135deg, #FFB701, #FCD34D)',
      },
      boxShadow: {
        'glow-primary': '0 0 20px rgba(25, 157, 103, 0.4)',
        'glow-secondary': '0 0 20px rgba(20, 184, 166, 0.4)',
        'glow-accent': '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-warning': '0 0 20px rgba(255, 183, 1, 0.4)',
        'glow-error': '0 0 20px rgba(208, 55, 57, 0.4)',
        'primary': '0 4px 12px rgba(25, 157, 103, 0.25)',
        'secondary': '0 4px 12px rgba(20, 184, 166, 0.25)',
        'accent': '0 4px 12px rgba(139, 92, 246, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      fontFamily: {
        sans: ['Poppins', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
