import { extendTheme } from '@chakra-ui/react';

const customTheme = {
    components: {
        Heading: {
            baseStyle: {
                fontFamily: 'monte-stella, sans-serif',
            }
        },
    },
    styles: {
        global: {
            'html, body': {
                backgroundColor: '#060e1a',
            },
        },
    },
    colors: {
        red: {
          50: '#ffe6e6',
          100: '#f9bbbd',
          200: '#ef9093',
          300: '#e76568',
          400: '#df3a3e',
          500: '#c52124',
          600: '#9a181b',
          700: '#6f1013',
          800: '#44070a',
          900: '#1d0001',
        },
    },
};

export const theme = extendTheme(customTheme)

export default theme; 