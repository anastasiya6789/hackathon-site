import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Alert, CircularProgress } from '@mui/material';
import { RegistrationForm, type RegistrationData } from '../components/auth/RegistrationForm';
import { EmailConfirmationScreen } from '../components/auth/EmailConfirmationScreen';
import { UniqueCodeDisplay } from '../components/dashboard/UniqueCodeDisplay';
import { ITTopLogo } from '../components/ui/ITTopLogo';
import { generateUniqueCode } from '../services/codeGenerator';
import type { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

type Mode = 'register' | 'login';

export function RegisterPage() {
    const urlParams = new URLSearchParams(window.location.search);
  const initialMode = urlParams.get('mode') === 'login' ? 'login' : 'register';
  
  const [mode, setMode] = useState<Mode>(initialMode);
  const [registeredUser, setRegisteredUser] = useState<User | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [registrationBlocked, setRegistrationBlocked] = useState(false);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkRegistrationPeriod = async () => {
      try {
        const { data: config, error } = await supabase
          .from('hackathon_config')
          .select('registration_start, registration_end')
          .single();
        
        if (error) {
          setRegistrationBlocked(false);
          return;
        }
        
        if (config) {
          const now = new Date();
          const start = config.registration_start ? new Date(config.registration_start) : null;
          const end = config.registration_end ? new Date(config.registration_end) : null;
          
          if (start && end) {
            const isWithinRange = now >= start && now <= end;
            setRegistrationBlocked(!isWithinRange);
          } else {
            setRegistrationBlocked(false);
          }
        } else {
          setRegistrationBlocked(false);
        }
      } catch (err) {
        setRegistrationBlocked(false);
      } finally {
        setConfigLoading(false);
      }
    };
    
    checkRegistrationPeriod();
  }, []);

  const handleRegister = async (data: RegistrationData): Promise<User | null> => {
    setSubmitError(null);
    
    if (mode === 'register' && registrationBlocked) {
      throw new Error('Регистрация недоступна. Ждём вас на следующем хакатоне!');
    }
    
    try {
      if (mode === 'register') {
        const { data: existingEmail } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', data.email?.toLowerCase().trim())
          .maybeSingle();
        
        if (existingEmail) {
          throw new Error('Пользователь с таким email уже зарегистрирован');
        }
        
        const phoneDigits = data.phone?.replace(/\D/g, '');
        if (phoneDigits) {
          const { data: existingPhone } = await supabase
            .from('profiles')
            .select('id')
            .eq('phone', phoneDigits)
            .maybeSingle();
          
          if (existingPhone) {
            throw new Error('Пользователь с таким номером телефона уже зарегистрирован');
          }
        }
        
        let uniqueCode = generateUniqueCode();
        let attempts = 0;
        while (attempts < 10) {
          const { data: existingCode } = await supabase
            .from('profiles')
            .select('unique_code')
            .eq('unique_code', uniqueCode)
            .maybeSingle();
          
          if (!existingCode) break;
          uniqueCode = generateUniqueCode();
          attempts++;
        }
        
       
const redirectUrl = `${window.location.origin}/hackathon-site/?type=confirm-email`;        
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: (data.email || '').toLowerCase().trim(),
          password: data.password || '',
          options: {
            data: {
              full_name: data.fullName.trim(),
              phone: phoneDigits,
              unique_code: uniqueCode,
              group_name: data.groupName?.trim(),
              telegram_link: data.telegramLink?.trim(),
            },
            emailRedirectTo: redirectUrl,
          },
        });

        if (authError) {
          
          if (authError.message?.includes('User already registered')) {
            throw new Error('Пользователь с таким email уже зарегистрирован');
          }
          if (authError.message?.includes('Invalid email')) {
            throw new Error('Неверный формат email');
          }
          if (authError.message?.includes('Weak password')) {
            throw new Error('Слишком слабый пароль');
          }
          if (authError.status === 500 || authError.name === 'AuthRetryableFetchError') {
            throw new Error('Ошибка сервера. Попробуйте позже');
          }
          
          throw new Error(authError.message || 'Ошибка регистрации');
        }
        
        if (!authData.user) {
          throw new Error('Ошибка регистрации: пользователь не создан');
        }

        const isEmailConfirmed = !!authData.user.email_confirmed_at;

        return {
          id: authData.user.id,
          email: (data.email || '').toLowerCase().trim(),
          fullName: data.fullName.trim(),
          groupName: data.groupName?.trim() || '',
          phone: phoneDigits || '',
          telegramLink: data.telegramLink?.trim(),
          uniqueCode,
          role: 'user',
          createdAt: new Date().toISOString(),
          emailConfirmed: isEmailConfirmed,
        };

      } else {
        
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: (data.email || '').toLowerCase().trim(),
          password: data.password || '',
        });

        if (authError) {
          
          if (authError.message?.includes('Invalid login credentials')) {
            throw new Error('Неверный email или пароль');
          }
          if (authError.status === 500 || authError.name === 'AuthRetryableFetchError') {
            throw new Error('Ошибка сервера. Попробуйте позже');
          }
          
          throw new Error(authError.message || 'Ошибка входа');
        }
        
        if (!authData.user) {
          throw new Error('Пользователь не найден');
        }

        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .maybeSingle();

        if (profileError) {
          throw new Error('Ошибка загрузки профиля');
        }

        return {
          id: authData.user.id,
          email: authData.user.email || (data.email || '').toLowerCase().trim(),
          fullName: profile?.full_name || data.fullName,
          groupName: profile?.group_name || data.groupName || '',
          phone: profile?.phone || data.phone || '',
          telegramLink: profile?.telegram_link || data.telegramLink,
          uniqueCode: profile?.unique_code || '',
          role: profile?.role || 'user',
          avatarUrl: profile?.avatar_url,
          createdAt: profile?.created_at || new Date().toISOString(),
          emailConfirmed: !!profile?.email_confirmed_at || !!authData.user.email_confirmed_at,
        };
      }
    } catch (err: any) {
      
      if (err?.message) {
        throw err;
      }
      
      throw new Error('Произошла неизвестная ошибка. Попробуйте позже');
    }
  };

  const handleSuccess = (user: User) => {
    if (!user.emailConfirmed) {
      setRegisteredEmail(user.email);
      setShowEmailConfirmation(true);
      return;
    }
    
    setRegisteredUser(user);
    localStorage.setItem('hackathon_current_user', JSON.stringify(user));
    setTimeout(() => {
      navigate('/dashboard');
    }, 2000);
  };

  if (showEmailConfirmation) {
    return (
      <EmailConfirmationScreen 
        email={registeredEmail}
        onResend={() => {
          setSubmitError('✅ Письмо отправлено ещё раз! Проверьте почту.');
        }}
      />
    );
  }

  if (configLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (registeredUser) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh', p: 2 }}>
        <Card sx={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
          <CardContent>
            <ITTopLogo size="large" variant="color" />
            <Typography variant="h5" color="success.main" fontWeight={600} mb={2} mt={2}>
              ✓ {mode === 'login' ? 'Вход выполнен!' : 'Регистрация успешна!'}
            </Typography>
            <Typography variant="body1" mb={3}>
              Ваш уникальный код:
            </Typography>
            <UniqueCodeDisplay code={registeredUser.uniqueCode} large />
            <Typography variant="body2" color="text.secondary" mt={2}>
              Переход в личный кабинет...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 2, bgcolor: '#F8F9FA' }}>
      <Card sx={{ width: '100%', maxWidth: 520, boxShadow: '0 8px 32px rgba(149, 0, 211, 0.15)' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ mb: 2 }}>
            <ITTopLogo size="large" variant="color" />
          </Box>
          
          {submitError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSubmitError(null)}>
              {submitError}
            </Alert>
          )}
          
          {mode === 'register' && registrationBlocked && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              <Typography fontWeight={600} mb={1}>⏳ Регистрация временно недоступна</Typography>
              <Typography variant="body2">
                Ждём вас на следующем хакатоне! Следите за анонсами.
              </Typography>
            </Alert>
          )}
          
          <RegistrationForm 
            mode={mode}
            onSubmit={handleRegister} 
            onSuccess={handleSuccess}
            onModeChange={setMode}
            disabled={mode === 'register' && registrationBlocked}
          />
        </CardContent>
      </Card>
    </Box>
  );
}