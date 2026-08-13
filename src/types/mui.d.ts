// 🔥 Расширяем типы MUI для работы с sx, ownerState и кастомной темой
import '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Theme {
    status: {
      danger: string;
    };
  }
  interface ThemeOptions {
    status?: {
      danger?: string;
    };
  }
  
  // Разрешаем sx-проп для всех компонентов
  interface ComponentNameToClassKey {
    MuiButton: 'root' | 'containedPrimary' | 'sizeLarge';
    MuiCard: 'root';
    MuiTextField: 'root';
    MuiTab: 'root';
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    containedPrimary: true;
  }
}

// 🔥 Разрешаем any для ownerState в styleOverrides (временно)
declare module '@mui/material/styles/components' {
  interface ComponentsOverrides {
    MuiButton?: {
      root?: (props: { ownerState?: any }) => React.CSSProperties;
    };
  }
}