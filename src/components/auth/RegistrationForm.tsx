import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { validateRussianPhone, formatPhoneInput } from '../../services/validation';
import { validatePassword } from '../../services/password';
import type { User } from '../../types';

export interface RegistrationData {
  fullName: string;
  groupName: string;
  phone: string;
  email: string;
  telegramLink?: string;
  password: string;
}

interface RegistrationFormProps {
  mode?: 'register' | 'login';
  onSubmit: (data: RegistrationData) => Promise<User | null>;
  onSuccess?: (user: User) => void;
  onModeChange?: (mode: 'register' | 'login') => void;
  disabled?: boolean;
}

export function RegistrationForm({ 
  mode = 'register', 
  onSubmit, 
  onSuccess,
  onModeChange,
  disabled = false
}: RegistrationFormProps) {
  const [formData, setFormData] = useState<RegistrationData>({
    fullName: '',
    groupName: '',
    phone: '',
    email: '',
    telegramLink: '',
    password: '',
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showTelegramHint, setShowTelegramHint] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateField = (name: keyof RegistrationData, value: string): string | null => {
    switch (name) {
      case 'fullName':
        if (mode === 'login') return null;
        if (value.trim().length < 3) return 'Введите ФИО (минимум 3 символа)';
        return null;
      case 'groupName':
        if (mode === 'login') return null;
        return value.trim() ? null : 'Укажите вашу группу';
      case 'phone':
        if (mode === 'login') return null;
        if (!value || value.replace(/\D/g, '').length < 10) {
          return 'Введите корректный номер телефона';
        }
        const { isValid: phoneValid, error } = validateRussianPhone(value);
        return phoneValid ? null : error || 'Неверный формат телефона';
      case 'email':
        if (!value) return 'Введите email';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Неверный формат email';
        return null;
      case 'telegramLink':
        if (!value) return null;
        const cleaned = value.trim();
        if (!cleaned.match(/^(https?:\/\/)?(t\.me\/|@)?[\w_]{3,}$/)) {
          return 'Пример: @username или https://t.me/username';
        }
        return null;
      case 'password':
        if (!value) return 'Введите пароль';
        if (mode === 'register') {
          const { isValid: pwdValid } = validatePassword(value);
          return pwdValid ? null : 'Пароль не соответствует требованиям';
        }
        return null;
      default:
        return null;
    }
  };

  const handleChange = (field: keyof RegistrationData) => (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = e.target.value;
    
    if (field === 'phone') {
      const digits = newValue.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, phone: digits }));
    } else {
      setFormData(prev => ({ ...prev, [field]: newValue }));
    }
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: keyof RegistrationData) => () => {
    if (field === 'phone' && formData.phone) {
      const digits = formData.phone.replace(/\D/g, '');
      const formatted = formatPhoneInput(digits);
      setFormData(prev => ({ ...prev, phone: formatted }));
    }
    
    const error = validateField(field, formData[field]);
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (disabled) return;
    
    setSubmitError(null);
    
    const submitData = { ...formData };
    if (submitData.phone && mode === 'register') {
      const digits = submitData.phone.replace(/\D/g, '');
      submitData.phone = formatPhoneInput(digits);
    }
    
    const fieldsToValidate: (keyof RegistrationData)[] = 
      mode === 'register' 
        ? ['fullName', 'groupName', 'phone', 'email', 'password', 'telegramLink'] 
        : ['email', 'password'];
    
    const newErrors: Partial<Record<keyof RegistrationData, string>> = {};
    fieldsToValidate.forEach(key => {
      if (submitData[key] !== undefined) {
        const error = validateField(key, submitData[key]);
        if (error) newErrors[key] = error;
      }
    });
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setLoading(true);
    try {
      const result = await onSubmit(submitData);
      if (result && onSuccess) {
        onSuccess(result);
      }
    } catch (err: any) {
      // 🔥 Показываем понятное сообщение об ошибке
      const message = err?.message || 'Произошла ошибка';
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  };

  const passwordRequirements = [
    { test: (p: string) => p.length >= 8, text: 'Минимум 8 символов' },
    { test: (p: string) => /[A-Z]/.test(p), text: 'Заглавная буква (A-Z)' },
    { test: (p: string) => /[a-z]/.test(p), text: 'Строчная буква (a-z)' },
    { test: (p: string) => /[0-9]/.test(p), text: 'Цифра (0-9)' },
  ];

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 480, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <ToggleButtonGroup
          value={mode}
          exclusive
          onChange={(_, newMode) => {
            if (newMode && onModeChange) onModeChange(newMode);
          }}
          sx={{ 
            bgcolor: '#F3E5F5', 
            borderRadius: 2,
            '& .MuiToggleButton-root': {
              border: 'none',
              borderRadius: 2,
              px: 2.5,
              fontSize: '0.85rem',
              '&.Mui-selected': {
                bgcolor: '#9500d3',
                color: 'white',
                '&:hover': { bgcolor: '#6A0096' },
              },
            },
          }}
        >
          <ToggleButton value="register">Регистрация</ToggleButton>
          <ToggleButton value="login">Вход</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      
      <Typography variant="h4" fontWeight={700} mb={1} color="primary" sx={{ textAlign: 'center' }}>
        {mode === 'register' ? 'Регистрация' : 'Вход в аккаунт'}
      </Typography>
      
      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
          {submitError}
        </Alert>
      )}
      
      {mode === 'register' && (
        <>
          <TextField
            fullWidth
            label="ФИО"
            value={formData.fullName}
            onChange={handleChange('fullName')}
            onBlur={handleBlur('fullName')}
            error={!!errors.fullName}
            helperText={errors.fullName}
            margin="normal"
            required
            autoComplete="name"
            placeholder="Иванов Иван Иванович"
            disabled={disabled}
          />
          
          <TextField
            fullWidth
            label="Группа"
            value={formData.groupName}
            onChange={handleChange('groupName')}
            onBlur={handleBlur('groupName')}
            error={!!errors.groupName}
            helperText={errors.groupName}
            margin="normal"
            required
            placeholder="ИТ-201"
            disabled={disabled}
          />
          
          <TextField
            fullWidth
            label="Телефон"
            value={formData.phone}
            onChange={handleChange('phone')}
            onBlur={handleBlur('phone')}
            error={!!errors.phone}
            helperText={errors.phone || 'Формат: +7 (999) 123-45-67'}
            margin="normal"
            required
            placeholder="+7 (___) ___-__-__"
            InputProps={{ inputProps: { inputMode: 'tel', maxLength: 18 } }}
            disabled={disabled}
          />
        </>
      )}
      
      <TextField
        fullWidth
        label="Email"
        type="email"
        value={formData.email}
        onChange={handleChange('email')}
        onBlur={handleBlur('email')}
        error={!!errors.email}
        helperText={errors.email}
        margin="normal"
        required
        placeholder="user@example.com"
        autoComplete="email"
        disabled={disabled}
      />
      
      <TextField
        fullWidth
        label="Пароль"
        type={showPassword ? 'text' : 'password'}
        value={formData.password}
        onChange={handleChange('password')}
        onBlur={handleBlur('password')}
        error={!!errors.password}
        helperText={errors.password}
        margin="normal"
        required
        placeholder="••••••••"
        disabled={disabled}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={() => setShowPassword(!showPassword)}
                edge="end"
                size="small"
                tabIndex={-1}
              >
                {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      
      {mode === 'register' && formData.password && !errors.password && (
        <Box sx={{ mt: 0.5, pl: 1 }}>
          {passwordRequirements.map((req, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {req.test(formData.password || '') ? (
                <Visibility fontSize="small" sx={{ color: 'success.main' }} />
              ) : (
                <VisibilityOff fontSize="small" sx={{ color: 'text.disabled' }} />
              )}
              <Typography variant="caption" color={req.test(formData.password || '') ? 'success.main' : 'text.secondary'}>
                {req.text}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
      
      {mode === 'register' && (
        <TextField
          fullWidth
          label="Telegram"
          value={formData.telegramLink}
          onChange={handleChange('telegramLink')}
          onBlur={handleBlur('telegramLink')}
          error={!!errors.telegramLink}
          helperText={errors.telegramLink || (showTelegramHint ? 'Необязательно. Пример: @username' : '')}
          margin="normal"
          placeholder="@username"
          onFocus={() => setShowTelegramHint(true)}
          onBlur={() => setShowTelegramHint(false)}
          disabled={disabled}
          InputProps={{
            startAdornment: (
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                <Typography variant="body2" color="text.secondary">t.me/</Typography>
              </Box>
            ),
          }}
        />
      )}
      
      <Button
        type="submit"
        variant="contained"
        size="large"
        fullWidth
        disabled={loading || disabled}
        sx={{ mt: 2, py: 1.5, fontSize: '1.05rem', bgcolor: '#9500d3', '&:hover': { bgcolor: '#6A0096' } }}
      >
        {loading ? <CircularProgress size={24} color="inherit" /> : (mode === 'register' ? 'Зарегистрироваться' : 'Войти')}
      </Button>
      
      {mode === 'register' && (
        <Typography variant="caption" color="text.secondary" display="block" mt={2} sx={{ textAlign: 'center' }}>
          Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
        </Typography>
      )}
    </Box>
  );
}