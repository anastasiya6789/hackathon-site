import { Box, Typography } from '@mui/material';

interface ITTopLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'color' | 'white';
  showCollege?: boolean; 
}

export function ITTopLogo({ 
  size = 'medium', 
  variant = 'color',
  showCollege = true 
}: ITTopLogoProps) {
  const sizes = {
    small: { box: 24, top: '1.2rem', col: '0.55rem' }, 
    medium: { box: 36, top: '1.8rem', col: '0.8rem' },
    large: { box: 48, top: '2.4rem', col: '1rem' },
  };

  const current = sizes[size];
  const isWhite = variant === 'white';
  
  const bgSquare = isWhite ? '#FFFFFF' : '#9500d3';
  const textSquare = isWhite ? '#9500d3' : '#FFFFFF';
  const textTop = isWhite ? '#FFFFFF' : '#1A1A1A';
  const textCollege = isWhite ? '#FFFFFF' : '#1A1A1A';
  const bracketColor = isWhite ? '#FFFFFF' : '#9500d3';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', height: current.box }}>
        
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
      
      {showCollege && (
        <Typography
          component="span"
          sx={{
            fontSize: current.col,
            fontWeight: 600,
            color: textCollege,
            letterSpacing: '0.35em',
            textTransform: 'uppercase',
            mt: 0.2, 
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