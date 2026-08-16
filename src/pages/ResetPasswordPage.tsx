import { useState, type ChangeEvent, type FormEvent, useEffect } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { ITTopLogo } from '../components/ui/ITTopLogo';
import { supabase } from '../services/supabase';
import { validatePassword } from '../services/password';
import { useNavigate } from 'react-router-dom';

export function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Проверяем, что пользователь пришёл по ссылке восстановления
    const hash = window.location.hash;
    if (!hash.includes('access_token') && !hash.includes('type=recovery')) {
      setError('Ссылка недействительна или истекла');
    }
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError('Пароли не совпадают'); return; }
    const { isValid, errors } = validatePassword(password);
    if (!isValid) { setError(errors[0] || 'Пароль слишком слабый'); return; }

    setLoading(true);
    try {
      // Supabase автоматически использует токен из URL для смены пароля
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/register?mode=login'), 2000);
    } catch (err: any) {
      setError(err.message || 'Не удалось сменить пароль');
    } finally {
      setLoading(false);
    }
  };

  const reqs = [
    { test: (p: string) => p.length >= 8, text: 'Минимум 8 символов' },
    { test: (p: string) => /[A-Z]/.test(p), text: 'Заглавная буква' },
    { test: (p: string) => /[a-z]/.test(p), text: 'Строчная буква' },
    { test: (p: string) => /[0-9]/.test(p), text: 'Цифра' },
  ];

  if (success) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 2, bgcolor: '#F8F9FA' }}>
        <Card sx={{ width: '100%', maxWidth: 480, textAlign: 'center', p: 3 }}>
          <ITTopLogo size="large" variant="color" />
          <Typography variant="h5" color="success.main" fontWeight={600} mb={2} mt={3}>✓ Пароль изменён!</Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>Перенаправляем на вход...</Typography>
          <CircularProgress size={24} />
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 2, bgcolor: '#F8F9FA' }}>
      <Card sx={{ width: '100%', maxWidth: 480, boxShadow: '0 8px 32px rgba(149, 0, 211, 0.15)' }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 2 }}><ITTopLogo size="large" variant="color" /></Box>
          <Typography variant="h4" fontWeight={700} mb={1} color="primary" textAlign="center">Новый пароль</Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Новый пароль" type={showPassword ? 'text' : 'password'} value={password} onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)} margin="normal" required placeholder="••••••••"
              InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small" tabIndex={-1}>{showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> }} />
            <TextField fullWidth label="Повторите пароль" type={showConfirm ? 'text' : 'password'} value={confirmPassword} onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)} margin="normal" required placeholder="••••••••"
              InputProps={{ endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small" tabIndex={-1}>{showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}</IconButton></InputAdornment> }} />
            {password && !error && (
              <Box sx={{ mt: 0.5, pl: 1, mb: 1 }}>
                {reqs.map((r, i) => (
                  <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {r.test(password) ? <Visibility fontSize="small" sx={{ color: 'success.main' }} /> : <VisibilityOff fontSize="small" sx={{ color: 'text.disabled' }} />}
                    <Typography variant="caption" color={r.test(password) ? 'success.main' : 'text.secondary'}>{r.text}</Typography>
                  </Box>
                ))}
              </Box>
            )}
            <Button type="submit" variant="contained" size="large" fullWidth disabled={loading || !password || !confirmPassword} sx={{ mt: 1, py: 1.5, bgcolor: '#9500d3', '&:hover': { bgcolor: '#6A0096' } }}>
              {loading ? <CircularProgress size={24} color="inherit" /> : 'Сменить пароль'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}