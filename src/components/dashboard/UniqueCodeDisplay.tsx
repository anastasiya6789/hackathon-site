import { Box, Typography } from '@mui/material';
import { formatCode } from '../../services/codeGenerator';

interface UniqueCodeDisplayProps {
  code: string;
  large?: boolean;
}

export function UniqueCodeDisplay({ code, large = false }: UniqueCodeDisplayProps) {
  const formatted = formatCode(code);
  
  return (
    <Box sx={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      bgcolor: '#F3E5F5', 
      borderRadius: 2, 
      px: large ? 4 : 3, 
      py: large ? 2 : 1.5,
      border: '2px solid #9500d3',
    }}>
      <Typography 
        variant={large ? 'h3' : 'h5'} 
        fontWeight={700} 
        color="#9500d3"
        sx={{ 
          fontFamily: 'monospace', 
          letterSpacing: large ? '0.15em' : '0.1em',
          lineHeight: 1,
        }}
      >
        {formatted}
      </Typography>
    </Box>
  );
}