import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, CircularProgress, Alert, Button } from '@mui/material';
import { ITTopLogo } from '../components/ui/ITTopLogo';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

export function ConfirmEmailPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // 🔥 Supabase автоматически обрабатывает token из URL
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (session?.user?.email_confirmed_at) {
          setStatus('success');
          setMessage('✅ Email подтверждён! Теперь вы можете войти.');
        } else {
          setStatus('error');
          setMessage('❌ Ссылка недействительна или истекла');
        }
        
      } catch (err: any) {
        console.error('❌ Confirm error:', err);
        setStatus('error');
        setMessage('❌ Произошла ошибка при подтверждении');
      }
    };
    
    confirmEmail();
  }, []);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 2, bgcolor: '#F8F9FA' }}>
      <Card sx={{ width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(149, 0, 211, 0.15)' }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <ITTopLogo size="large" variant="color" />
          
          {status === 'loading' && (
            <>
              <CircularProgress size={48} sx={{ my: 3 }} />
              <Typography variant="body1">Проверяем ссылку...</Typography>
            </>
          )}
          
          {status === 'success' && (
            <>
              <Typography variant="h4" color="success.main" fontWeight={700} mb={2} mt={3}>
                ✓ Email подтверждён!
              </Typography>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {message}
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/login')}
                sx={{ bgcolor: '#9500d3', '&:hover': { bgcolor: '#6A0096' } }}
              >
                Войти в аккаунт
              </Button>
            </>
          )}
          
          {status === 'error' && (
            <>
              <Alert severity="error" sx={{ mb: 3 }}>{message}</Alert>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/register')}
                sx={{ textTransform: 'none' }}
              >
                Попробовать ещё раз
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}