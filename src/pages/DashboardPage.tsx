import { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Card, CardContent, Typography, Alert, Button } from '@mui/material';
import { ProfileCard } from '../components/dashboard/ProfileCard';
import { TeamTab } from '../components/dashboard/TeamTab';
import { CasesTab } from '../components/dashboard/CasesTab';
import { User } from '../types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

interface DashboardPageProps {
  tab?: 'profile' | 'team' | 'cases';
}

export function DashboardPage({ tab = 'profile' }: DashboardPageProps) {
  const [currentTab, setCurrentTab] = useState(tab);
  const [user, setUser] = useState<User | null>(null);
  const [banned, setBanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndBan = async () => {
      try {
        // Проверка авторизации
        const currentUser = JSON.parse(localStorage.getItem('hackathon_current_user') || 'null');
        if (!currentUser) {
          navigate('/register');
          return;
        }
        
        // Проверка на бан в базе
        const { data: profile } = await supabase
          .from('profiles')
          .select('banned')
          .eq('id', currentUser.id)
          .maybeSingle();
        
        if (profile?.banned) {
          setBanned(true);
        } else {
          setUser(currentUser);
          setCurrentTab(tab);
        }
      } catch (err) {
        console.error('Ошибка проверки:', err);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthAndBan();
  }, [tab, navigate]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
    setCurrentTab(newValue as 'profile' | 'team' | 'cases');
    navigate(`/dashboard/${newValue}`);
  };

  // 🔥 Если загружается
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Typography>Загрузка...</Typography>
      </Box>
    );
  }

  // 🔥 Если забанен
  if (banned) {
    return (
      <Box sx={{ maxWidth: 500, mx: 'auto', p: 4, textAlign: 'center' }}>
        <Card sx={{ p: 4, borderRadius: 3, border: '3px solid #f44336' }}>
          <Typography variant="h3" mb={2}>🚫</Typography>
          <Typography variant="h5" fontWeight={700} color="error" mb={2}>
            Ваш аккаунт заблокирован
          </Typography>
          <Typography color="text.secondary" mb={3}>
            Для разблокировки или уточнения причин обратитесь к администратору хакатона.
          </Typography>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => supabase.auth.signOut().then(() => navigate('/'))}
          >
            Выйти из аккаунта
          </Button>
        </Card>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <Typography>Загрузка...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      {/* Вкладки (десктоп) */}
      <Card sx={{ mb: 3, display: { xs: 'none', md: 'block' } }}>
        <Tabs 
          value={currentTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ 
            '& .MuiTab-root': { fontWeight: 500 },
            '& .Mui-selected': { color: 'primary.main', fontWeight: 600 },
          }}
        >
          <Tab label="👤 Профиль" value="profile" />
          <Tab label="👥 Команда" value="team" />
          <Tab label="🎯 Кейсы" value="cases" />
        </Tabs>
      </Card>

      {/* Контент вкладок */}
      {currentTab === 'profile' && <ProfileCard user={user} />}
      {currentTab === 'team' && <TeamTab user={user} />}
      {currentTab === 'cases' && <CasesTab user={user} />}
    </Box>
  );
}