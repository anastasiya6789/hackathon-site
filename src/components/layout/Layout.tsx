import { ReactNode, useState, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, IconButton, Avatar, Badge, Menu, List, ListItem, ListItemText, Divider, Button } from '@mui/material';
import { Logout, Notifications, CheckCircle } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { ITTopLogo } from '../ui/ITTopLogo';
import { supabase } from '../../services/supabase';
import type { Notification } from '../../types';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem('hackathon_current_user') || 'null');
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('hackathon_current_user');
    navigate('/register');
  };

  const isDashboard = location.pathname.startsWith('/dashboard');
  const isAdmin = currentUser?.role === 'admin';
  const isAuthPage = location.pathname === '/register' || location.pathname === '/login';

  useEffect(() => {
    if (!currentUser?.id || isAuthPage) return;
    
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) {
        return;
      }
      
      if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      }
    };
    
    fetchNotifications();
    
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, isAuthPage]);

  const handleMarkRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', currentUser.id);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleString('ru-RU', { 
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="sticky" elevation={1} sx={{ background: 'linear-gradient(135deg, #9500d3, #6A0096)', display: { xs: 'none', md: 'flex' } }}>
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ITTopLogo size="small" variant="white" showCollege={true} />
            <Typography variant="h6" fontWeight={700} color="white">Hackathon</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isAuthPage && currentUser && (
              <>
                <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)} sx={{ mr: 1 }}>
                  <Badge badgeContent={unreadCount} color="error">
                    <Notifications />
                  </Badge>
                </IconButton>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: 'white', fontWeight: 500 }}>
                    {currentUser.fullName}
                  </Typography>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.2)', color: 'white', cursor: 'pointer', border: '2px solid rgba(255,255,255,0.3)' }} onClick={handleLogout}>
                    {currentUser.fullName?.charAt(0) || 'U'}
                  </Avatar>
                </Box>
              </>
            )}
            
            {!currentUser && (
              <IconButton color="inherit" onClick={() => navigate('/register')}>
                <Logout />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} sx={{ mt: 1 }}>
        <Box sx={{ px: 2, py: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" fontWeight={600}>Уведомления</Typography>
          {unreadCount > 0 && (
            <Button size="small" onClick={handleMarkAllRead}>Прочитать все</Button>
          )}
        </Box>
        <Divider />
        <List sx={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText primary="Нет уведомлений" secondary="Мы сообщим о важных событиях" sx={{ textAlign: 'center', py: 2 }} />
            </ListItem>
          ) : (
            notifications.map(n => (
              <ListItem key={n.id} alignItems="flex-start" sx={{ borderBottom: '1px solid #eee', py: 1 }}>
                <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                  <Box sx={{ mt: 0.5 }}>
                    <CheckCircle fontSize="small" color={n.isRead ? 'disabled' : 'primary'} />
                  </Box>
                  <ListItemText 
                    primary={n.title} 
                    secondary={
                      <>
                        <Typography component="span" variant="body2">{n.message}</Typography>
                        <br />
                        <Typography component="span" variant="caption" color="text.secondary">
                          {formatDate(n.createdAt)}
                        </Typography>
                      </>
                    }
                    onClick={() => !n.isRead && handleMarkRead(n.id)}
                    sx={{ cursor: 'pointer', opacity: n.isRead ? 0.6 : 1 }}
                  />
                </Box>
              </ListItem>
            ))
          )}
        </List>
      </Menu>

      <Box component="main" sx={{ flex: 1, pb: { xs: 72, md: 0 } }}>
        {children}
      </Box>
      {isDashboard && <BottomNav />}
    </Box>
  );
}