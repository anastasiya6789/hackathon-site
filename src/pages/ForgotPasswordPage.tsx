import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { ITTopLogo } from '../components/ui/ITTopLogo';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Введите корректный email');
      return;
    }
    
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
        redirectTo: `${window.location.origin}/hackathon-site/#/reset-password`,
      });
      
      if (error) throw error;
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Не удалось отправить письмо');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 2, bgcolor: '#F8F9FA' }}>
        <Card sx={{ width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(149, 0, 211, 0.15)' }}>
          <CardContent sx={{ p: 3, textAlign: 'center' }}>
            <ITTopLogo size="large" variant="color" />
            <Typography variant="h5" color="success.main" fontWeight={600} mb={2} mt={3}>✓ Письмо отправлено!</Typography>
            <Typography variant="body2" color="text.secondary" mb={3}>
              Проверьте почту <b>{email}</b> и перейдите по ссылке.
            </Typography>
            <Button variant="outlined" onClick={() => navigate('/register?mode=login')} sx={{ textTransform: 'none' }}>Вернуться ко входу</Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 2, bgcolor: '#F8F9FA' }}>
      <Card sx={{ width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(149, 0, 211, 0.15)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}><ITTopLogo size="large" variant="color" /></Box>
          <Typography variant="h4" fontWeight={700} mb={1} color="primary" textAlign="center">Восстановление пароля</Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>Введите email, чтобы получить ссылку для сброса</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" type="email" value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} margin="normal" required placeholder="user@example.com" />
            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ mt: 2, py: 1.5, bgcolor: '#9500d3', '&:hover': { bgcolor: '#6A0096' } }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Отправить ссылку'}
            </Button>
          </Box>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button size="small" color="primary" onClick={() => navigate('/register?mode=login')} sx={{ textTransform: 'none' }}>← Назад ко входу</Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}