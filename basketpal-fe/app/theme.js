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
                backgroundColor: 'var(--chakra-colors-bg)',
            },
        },
    },
    semanticTokens: {
        colors: {
            bg: {
                default: 'carbon.800',
                _dark: 'carbon.800',
            },
            bgRaised: {
                default: 'system.bgRaised',
                _dark: 'system.bgRaised',
            },
            bgSunken: {
                default: 'system.bgSunken',
                _dark: 'system.bgSunken',
            },
            surface: {
                default: 'carbon.700',
                _dark: 'carbon.700',
            },
            surface2: {
                default: 'carbon.600',
                _dark: 'carbon.600',
            },
            line: {
                default: 'carbon.600',
                _dark: 'carbon.600',
            },
            lineStrong: {
                default: 'carbon.500',
                _dark: 'carbon.500',
            },
            fg: {
                default: 'system.fg',
                _dark: 'system.fg',
            },
            fgMuted: {
                default: 'carbon.300',
                _dark: 'carbon.300',
            },
            fgDim: {
                default: 'carbon.400',
                _dark: 'carbon.400',
            },
            fgInverse: {
                default: 'system.fgInverse',
                _dark: 'system.fgInverse',
            },
            chyronFg: {
                default: 'system.chyronFg',
                _dark: 'system.chyronFg',
            },
            live500: {
                default: 'live.500',
                _dark: 'live.500',
            },
            live400: {
                default: 'live.400',
                _dark: 'live.400',
            },
            highlight: {
                default: 'system.highlight',
                _dark: 'system.highlight',
            },
        },
    },
    colors: {
        carbon: {
          50: '#f5f6f8',
          100: '#e6e8ec',
          200: '#c9cdd6',
          300: '#a1a7b5',
          400: '#6c7384',
          500: '#474d5c',
          600: '#2e3340',
          700: '#1e222c',
          800: '#14171f',
          900: '#0b0d13',
          950: '#05070b',
        },
        live: {
          400: '#e76568',
          500: '#df3a3e',
        },
        system: {
          highlight: '#facc15',
          fg: '#f2f4f8',
          chyronFg: '#fff2d6',
          bgRaised: '#1a1e27',
          bgSunken: '#0b0d13',
          fgInverse: '#ffffff',
        },
        highlight: '#facc15',
        fg: '#f2f4f8',
        chyronFg: '#fff2d6',
        bgRaised: '#1a1e27',
        bgSunken: '#0b0d13',
        fgInverse: '#ffffff',
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
