import { Box, Typography } from '@mui/material';

interface ITTopLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'color' | 'white';
  showCollege?: boolean; // 🔥 Новый проп
}

export function ITTopLogo({ 
  size = 'medium', 
  variant = 'color',
  showCollege = true // 🔥 По умолчанию показываем везде
}: ITTopLogoProps) {
  // Размеры для разных вариантов
  const sizes = {
    small: { box: 24, top: '1.2rem', col: '0.55rem' }, // 🔥 Чуть меньше для шапки
    medium: { box: 36, top: '1.8rem', col: '0.8rem' },
    large: { box: 48, top: '2.4rem', col: '1rem' },
  };

  const current = sizes[size];
  const isWhite = variant === 'white';
  
  // 🎨 Цвета
  const bgSquare = isWhite ? '#FFFFFF' : '#9500d3';
  const textSquare = isWhite ? '#9500d3' : '#FFFFFF';
  const textTop = isWhite ? '#FFFFFF' : '#1A1A1A';
  const textCollege = isWhite ? '#FFFFFF' : '#1A1A1A';
  const bracketColor = isWhite ? '#FFFFFF' : '#9500d3';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Верхний ряд: [IT] top ┐ */}
      <Box sx={{ display: 'flex', alignItems: 'center', height: current.box }}>
        
        {/* 1. Фиолетовый квадрат IT */}
        <Box
          sx={{
            width: current.box,
            height: current.box,
            bgcolor: bgSquare,
            borderRadius: '0px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Typography
            component="span"
            sx={{
              fontSize: current.box * 0.5,
              fontWeight: 700,
              color: textSquare,
              fontFamily: 'monospace',
              lineHeight: 1,
            }}
          >
            IT
          </Typography>
        </Box>

        {/* 2. Текст "top" */}
        <Typography
          component="span"
          sx={{
            fontSize: current.top,
            fontWeight: 900,
            color: textTop,
            ml: 1.5,
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}
        >
          top
        </Typography>
        
        {/* 3. Фиолетовая скобка-уголок */}
        <Box
          sx={{
            width: current.box * 0.3,
            height: current.box * 0.3,
            borderRight: `2px solid ${bracketColor}`,
            borderTop: `2px solid ${bracketColor}`,
            ml: 1,
            marginTop: '-10px',
          }}
        />
      </Box>
      
      {/* Нижний ряд: C O L L E G E */}
      {showCollege && (
        <Typography
          component="span"
          sx={{
            fontSize: current.col,
            fontWeight: 600,
            color: textCollege,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            mt: 0.2, // 🔥 Чуть ближе к логотипу
            textAlign: 'center',
            width: '100%',
          }}
        >
          college
        </Typography>
      )}
    </Box>
  );
}