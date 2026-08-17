import { createTheme, type Shadows } from '@mui/material/styles';

const itTopPalette = {
  primary: {
    main: '#9500d3',        
    dark: '#6A0096',        
    light: '#B340D9',       
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#FF6B35',        
    dark: '#E55A2B',
    light: '#FF8557',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F8F9FA',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#1A1A1A',
    secondary: '#666666',
  },
  success: { main: '#2ECC71', light: '#58D68D', dark: '#27AE60' },
  warning: { main: '#F39C12', light: '#F5B041', dark: '#B7950B' },
  error: { main: '#E74C3C', light: '#EC7063', dark: '#C0392B' },
};


const customShadows: Shadows = [
  'none',
  '0 1px 2px rgba(0,0,0,0.06)',
  '0 2px 8px rgba(0,0,0,0.08)',
  '0 4px 16px rgba(0,0,0,0.1)',
  '0 2px 4px rgba(0,0,0,0.06)',
  '0 4px 8px rgba(0,0,0,0.08)',
  '0 6px 12px rgba(0,0,0,0.1)',
  '0 8px 16px rgba(0,0,0,0.12)',
  '0 10px 20px rgba(0,0,0,0.14)',
  '0 12px 24px rgba(0,0,0,0.16)',
  '0 14px 28px rgba(0,0,0,0.18)',
  '0 16px 32px rgba(0,0,0,0.2)',
  '0 18px 36px rgba(0,0,0,0.22)',
  '0 20px 40px rgba(0,0,0,0.24)',
  '0 22px 44px rgba(0,0,0,0.26)',
  '0 24px 48px rgba(0,0,0,0.28)',
  '0 26px 52px rgba(0,0,0,0.3)',
  '0 28px 56px rgba(0,0,0,0.32)',
  '0 30px 60px rgba(0,0,0,0.34)',
  '0 32px 64px rgba(0,0,0,0.36)',
  '0 34px 68px rgba(0,0,0,0.38)',
  '0 36px 72px rgba(0,0,0,0.4)',
  '0 38px 76px rgba(0,0,0,0.42)',
  '0 40px 80px rgba(0,0,0,0.44)',
  '0 42px 84px rgba(0,0,0,0.46)',
];

export const theme = createTheme({
  palette: {
    mode: 'light',
    ...itTopPalette,
  },
  typography: {
    fontFamily: '"SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    h1: { fontSize: '2rem', fontWeight: 700, lineHeight: 1.2 },
    h2: { fontSize: '1.5rem', fontWeight: 600, lineHeight: 1.3 },
    h3: { fontSize: '1.25rem', fontWeight: 600, lineHeight: 1.4 },
    body1: { fontSize: '1rem', lineHeight: 1.5, color: itTopPalette.text.primary },
    body2: { fontSize: '0.875rem', lineHeight: 1.5, color: itTopPalette.text.secondary },
    button: { fontWeight: 600, textTransform: 'none' },
  },
  shape: {
    borderRadius: 12, 
  },
  shadows: customShadows,
  components: {
    MuiButton: {
      styleOverrides: {
        root: (props: { ownerState?: { variant?: string; color?: string } }) => {
          const { ownerState } = props;
          return {
            textTransform: 'none',
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': { 
              boxShadow: '0 4px 12px rgba(149, 0, 211, 0.3)', 
              transform: 'translateY(-1px)',
            },
            '&:active': { transform: 'translateY(0)' },
            
            ...(ownerState?.variant === 'contained' && ownerState?.color === 'primary' && {
              background: `linear-gradient(135deg, ${itTopPalette.primary.main}, ${itTopPalette.primary.dark})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${itTopPalette.primary.dark}, ${itTopPalette.primary.main})`,
              },
            }),
          };
        },
        sizeLarge: { padding: '12px 24px', fontSize: '1rem' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
          border: '1px solid rgba(0, 0, 0, 0.06)',
          borderRadius: 16,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: itTopPalette.primary.main,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: itTopPalette.primary.main,
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          minHeight: 48,
        },
      },
    },
  },
});