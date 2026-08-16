import { Box, Card, CardContent, Typography, Button, Alert } from '@mui/material';
import { ITTopLogo } from '../ui/ITTopLogo';
import { supabase } from '../../services/supabase';
import { useNavigate } from 'react-router-dom';

interface EmailConfirmationScreenProps {
  email: string;
  onResend?: () => void;
}

export function EmailConfirmationScreen({ email, onResend }: EmailConfirmationScreenProps) {
  const navigate = useNavigate();
  
  const handleResend = async () => {
    try {
      // 🔥 ВОЗВРАЩАЕМ ПРАВИЛЬНЫЙ REDIRECT: с хешем для HashRouter
const redirectUrl = `${window.location.origin}/hackathon-site/?type=confirm-email`;      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase().trim(),
        options: {
          redirectTo: redirectUrl,
        },
      });
      
      if (error) throw error;
      
      if (onResend) onResend();
      
    } catch (err: any) {
      console.error('❌ Resend error:', err);
      alert('Не удалось отправить письмо. Попробуйте позже.');
    }
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 2, bgcolor: '#F8F9FA' }}>
      <Card sx={{ width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(149, 0, 211, 0.15)' }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <ITTopLogo size="large" variant="color" />
          
          <Typography variant="h4" fontWeight={700} color="primary" mb={2} mt={3}>
            ✉️ Подтвердите email
          </Typography>
          
          <Typography variant="body1" color="text.secondary" mb={3}>
            Мы отправили ссылку для подтверждения на:<br/>
            <Typography component="span" fontWeight={600} color="text.primary">
              {email}
            </Typography>
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
            <Typography variant="body2">
              🔹 Проверьте папку "Спам", если письмо не пришло<br/>
              🔹 Ссылка действительна 24 часа<br/>
              🔹 После подтверждения вы сможете войти в аккаунт
            </Typography>
          </Alert>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Button 
              variant="contained" 
              onClick={handleResend}
              sx={{ bgcolor: '#9500d3', '&:hover': { bgcolor: '#6A0096' } }}
            >
              Отправить письмо ещё раз
            </Button>
            
            <Button 
              variant="outlined" 
              onClick={() => navigate('/login')}
              sx={{ textTransform: 'none' }}
            >
              Вернуться ко входу
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}