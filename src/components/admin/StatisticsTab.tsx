import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Chip, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Avatar, CircularProgress, Alert, InputAdornment
} from '@mui/material';
import { Search, Edit, Save, Block } from '@mui/icons-material';
import { supabase } from '../../services/supabase';

interface StatisticsTabProps {
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
}

export function StatisticsTab({ setError, setSuccess }: StatisticsTabProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({ full_name: '', group_name: '', avatar_url: '' });

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, telegram_link, group_name, avatar_url, role, banned')
          .order('created_at', { ascending: false });
        
        const { data: teams } = await supabase
          .from('team_members')
          .select('user_id');
        
        const teamUserIds = new Set(teams?.map(t => t.user_id) || []);
        const usersWithTeamStatus = profiles?.map(u => ({
          ...u,
          hasTeam: teamUserIds.has(u.id),
          telegram: u.telegram_link 
        })) || [];
        
        setUsers(usersWithTeamStatus);
      } catch (err: any) {
        setError('Не удалось загрузить статистику');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [setError]);

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.telegram_link?.toLowerCase().includes(q)
    );
  });

  const totalRegistered = users.length;
  const withoutTeam = users.filter(u => !u.hasTeam).length;
  const withTeam = totalRegistered - withoutTeam;

  const handleEditUser = (user: any) => {
    setEditingUser(user);
    setEditData({
      full_name: user.full_name || '',
      group_name: user.group_name || '',
      avatar_url: user.avatar_url || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editData.full_name,
          group_name: editData.group_name,
          avatar_url: editData.avatar_url
        })
        .eq('id', editingUser.id);
      
      if (error) throw error;
      setSuccess('✅ Данные обновлены');
      setEditDialogOpen(false);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, telegram_link, group_name, avatar_url, role, banned')
        .order('created_at', { ascending: false });
      setUsers(profiles || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleBan = async (userId: string, currentBanned: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ banned: !currentBanned })
        .eq('id', userId);
      if (error) throw error;
      setSuccess(`Пользователь ${!currentBanned ? 'забанен' : 'разбанен'}`);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, banned: !currentBanned } : u));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Paper sx={{ p: 3, borderRadius: 2, minWidth: 200, bgcolor: '#E3F2FD' }}>
          <Typography variant="h4" fontWeight={700} color="primary">{totalRegistered}</Typography>
          <Typography variant="body2" color="text.secondary">Всего зарегистрировано</Typography>
        </Paper>
        <Paper sx={{ p: 3, borderRadius: 2, minWidth: 200, bgcolor: '#E8F5E9' }}>
          <Typography variant="h4" fontWeight={700} color="success.main">{withTeam}</Typography>
          <Typography variant="body2" color="text.secondary">В командах</Typography>
        </Paper>
        <Paper sx={{ p: 3, borderRadius: 2, minWidth: 200, bgcolor: '#FFF3E0' }}>
          <Typography variant="h4" fontWeight={700} color="warning.main">{withoutTeam}</Typography>
          <Typography variant="body2" color="text.secondary">Без команды</Typography>
        </Paper>
      </Box>

      <TextField
        fullWidth
        placeholder="Поиск: имя, Telegram, email, телефон..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
        }}
      />

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Фото</strong></TableCell>
              <TableCell><strong>Имя</strong></TableCell>
              <TableCell><strong>Группа</strong></TableCell>
              <TableCell><strong>Email</strong></TableCell>
              <TableCell><strong>Telegram</strong></TableCell>
              <TableCell><strong>Статус</strong></TableCell>
              <TableCell align="right"><strong>Действия</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.id}>
                <TableCell>
                  <Avatar src={user.avatar_url} sx={{ width: 40, height: 40 }}>
                    {user.full_name?.charAt(0)}
                  </Avatar>
                </TableCell>
                <TableCell>{user.full_name || '—'}</TableCell>
                <TableCell>{user.group_name || '—'}</TableCell>
                <TableCell>{user.email || '—'}</TableCell>
                <TableCell>{user.telegram_link || '—'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                      label={user.hasTeam ? 'В команде' : 'Без команды'} 
                      size="small" 
                      color={user.hasTeam ? 'success' : 'warning'} 
                      variant="outlined" 
                    />
                    {user.banned && <Chip label="Забанен" size="small" color="error" />}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleEditUser(user)}><Edit fontSize="small" /></IconButton>
                    <IconButton 
                      size="small" 
                      color={user.banned ? 'success' : 'error'}
                      onClick={() => handleToggleBan(user.id, user.banned)}
                    >
                      <Block fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>✏️ Редактировать пользователя</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField 
              label="Имя" 
              value={editData.full_name} 
              onChange={(e) => setEditData(prev => ({ ...prev, full_name: e.target.value }))} 
              fullWidth 
            />
            <TextField 
              label="Группа" 
              value={editData.group_name} 
              onChange={(e) => setEditData(prev => ({ ...prev, group_name: e.target.value }))} 
              fullWidth 
            />
            <TextField 
              label="URL аватара" 
              value={editData.avatar_url} 
              onChange={(e) => setEditData(prev => ({ ...prev, avatar_url: e.target.value }))} 
              fullWidth 
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSaveEdit} variant="contained">💾 Сохранить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}