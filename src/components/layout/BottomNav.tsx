import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { Person, Groups, Task } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Определяем текущую вкладку
  const getCurrentValue = () => {
    if (location.pathname.includes('/profile')) return 'profile';
    if (location.pathname.includes('/team')) return 'team';
    if (location.pathname.includes('/cases')) return 'cases';
    return 'profile'; // default
  };

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    navigate(`/dashboard/${newValue}`);
  };

  return (
    <Paper 
      sx={{ 
        position: 'fixed', 
        bottom: 0, 
        left: 0, 
        right: 0, 
        zIndex: 100,
        display: { xs: 'block', md: 'none' }, // только на мобильных
        borderTop: '1px solid rgba(0,0,0,0.06)',
      }}
      elevation={3}
    >
      <BottomNavigation 
        value={getCurrentValue()} 
        onChange={handleChange}
        showLabels
        sx={{ 
          '& .MuiBottomNavigationAction-label': { 
            fontSize: '0.75rem',
            fontWeight: 500,
          },
        }}
      >
        <BottomNavigationAction 
          label="Профиль" 
          value="profile" 
          icon={<Person />} 
        />
        <BottomNavigationAction 
          label="Команда" 
          value="team" 
          icon={<Groups />} 
        />
        <BottomNavigationAction 
          label="Кейсы" 
          value="cases" 
          icon={<Task />} 
        />
      </BottomNavigation>
    </Paper>
  );
}