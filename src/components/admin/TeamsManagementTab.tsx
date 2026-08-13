import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Chip, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Avatar, CircularProgress, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, List, ListItem, ListItemAvatar, ListItemText
} from '@mui/material';
import { Search, Edit, Save, Delete, PersonAdd, PersonRemove, Group, Warning } from '@mui/icons-material';
import { supabase } from '../../services/supabase';

interface TeamsManagementTabProps {
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
}

export function TeamsManagementTab({ setError, setSuccess }: TeamsManagementTabProps) {
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [addMemberDialog, setAddMemberDialog] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [editTeamName, setEditTeamName] = useState('');
  const [assignedCase, setAssignedCase] = useState<string>('');

  // 🔹 Загрузка всех данных
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        console.log(' Начинаем загрузку данных...');
        
        // 1. Загружаем команды
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('created_at', { ascending: false });
        
        console.log('📦 Команды:', teamsData);
        if (teamsError) {
          console.error('❌ Ошибка загрузки команд:', teamsError);
          throw teamsError;
        }
        
        // 2. Загружаем назначения кейсов
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('team_case_assignments')
          .select('team_id, case_id');
        
        console.log(' Назначения кейсов:', assignmentsData);
        if (assignmentsError) {
          console.error('❌ Ошибка загрузки назначений:', assignmentsError);
        }
        
        // 3. Загружаем все кейсы
        const { data: casesData, error: casesError } = await supabase
          .from('cases')
          .select('id, title')
          .not('published_at', 'is', null);
        
        console.log('📦 Кейсы:', casesData);
        if (casesError) {
          console.error(' Ошибка загрузки кейсов:', casesError);
        }
        
        // 4. Загружаем участников команд
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select('team_id, user_id, profiles(full_name, email, group_name, avatar_url, phone, telegram_link)');
        
        console.log('📦 Участники команд:', membersData);
        if (membersError) {
          console.error('❌ Ошибка загрузки участников:', membersError);
        }
        
        // 5. Собираем всё вместе
        const teamsWithDetails = teamsData?.map(team => {
          // Находим назначение кейса для этой команды
          const assignment = assignmentsData?.find(a => a.team_id === team.id);
          const assignedCase = assignment 
            ? casesData?.find(c => c.id === assignment.case_id)
            : null;
          
          // Находим участников этой команды
          const members = membersData?.filter(m => m.team_id === team.id) || [];
          
          return {
            ...team,
            assigned_case: assignedCase,
            team_members: members
          };
        }) || [];
        
        console.log('✅ Итоговые команды с данными:', teamsWithDetails);
        
        // 6. Загружаем пользователей для поиска
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, telegram_link, group_name, avatar_url')
          .eq('role', 'user');
        
        setTeams(teamsWithDetails);
        setUsers(usersData || []);
        setCases(casesData || []);
        
      } catch (err: any) {
        console.error(' Общая ошибка:', err);
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setError]);

  // 🔹 Фильтрация пользователей для поиска
  const filteredUsers = users.filter(u => {
    const q = memberSearch.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.telegram_link?.toLowerCase().includes(q)
    );
  });

  // 🔹 Открытие диалога команды
  const handleOpenTeam = (team: any) => {
    console.log('🔓 Открытие команды:', team);
    setSelectedTeam(team);
    setEditTeamName(team.name);
    setAssignedCase(team.assigned_case?.id || '');
    setTeamDialogOpen(true);
  };

  //  Сохранение названия команды
  const handleSaveTeamName = async () => {
    if (!selectedTeam || !editTeamName.trim()) return;
    try {
      const { error } = await supabase
        .from('teams')
        .update({ name: editTeamName.trim() })
        .eq('id', selectedTeam.id);
      if (error) throw error;
      setSuccess('✅ Название обновлено');
      setTeams(prev => prev.map(t => t.id === selectedTeam.id ? { ...t, name: editTeamName.trim() } : t));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 🔹 Назначение кейса (через team_case_assignments)
  const handleAssignCase = async () => {
    if (!selectedTeam) return;
    try {
      console.log('📝 Назначение кейса:', { 
        teamId: selectedTeam.id, 
        caseId: assignedCase 
      });
      
      // 1. Удаляем старое назначение
      const { error: deleteError } = await supabase
        .from('team_case_assignments')
        .delete()
        .eq('team_id', selectedTeam.id);
      
      if (deleteError) {
        console.error('❌ Ошибка удаления старого назначения:', deleteError);
        throw deleteError;
      }
      
      // 2. Если выбран кейс — создаем новую запись
      if (assignedCase) {
        const { error: insertError } = await supabase
          .from('team_case_assignments')
          .insert({ 
            team_id: selectedTeam.id, 
            case_id: assignedCase 
          });
        
        if (insertError) {
          console.error('❌ Ошибка создания назначения:', insertError);
          throw insertError;
        }
      }
      
      setSuccess('✅ Кейс назначен');
      
      // 🔥 Обновляем локальный стейт
      const assignedCaseData = cases.find(c => c.id === assignedCase);
      setTeams(prev => prev.map(t => {
        if (t.id === selectedTeam.id) {
          return {
            ...t,
            assigned_case: assignedCase ? assignedCaseData : null
          };
        }
        return t;
      }));
      
    } catch (err: any) {
      console.error('❌ Ошибка назначения кейса:', err);
      setError(err.message);
    }
  };

  // 🔹 Добавить участника
  const handleAddMember = async (userId: string) => {
    if (!selectedTeam) return;
    try {
      const { error } = await supabase
        .from('team_members')
        .insert({ team_id: selectedTeam.id, user_id: userId, role: 'member' });
      if (error) throw error;
      setSuccess('✅ Участник добавлен');
      setAddMemberDialog(false);
      setMemberSearch('');
      // Перезагружаем страницу для обновления данных
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 🔹 Удалить участника
  const handleRemoveMember = async (userId: string) => {
    if (!selectedTeam) return;
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', selectedTeam.id)
        .eq('user_id', userId);
      if (error) throw error;
      setSuccess('✅ Участник удалён');
      // Перезагружаем страницу для обновления данных
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 🔹 Удалить команду
  const handleDeleteTeam = async (teamId: string) => {
    if (!confirm('Удалить команду? Все участники останутся без команды.')) return;
    try {
      const { error } = await supabase.from('teams').delete().eq('id', teamId);
      if (error) throw error;
      setSuccess('✅ Команда удалена');
      setTeams(prev => prev.filter(t => t.id !== teamId));
      setTeamDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 🔹 Забанить команду (всех участников)
  const handleBanTeam = async (teamId: string) => {
    if (!confirm('Забанить всех участников команды?')) return;
    try {
      const team = teams.find(t => t.id === teamId);
      const userIds = team?.team_members?.map(m => m.user_id) || [];
      
      for (const userId of userIds) {
        await supabase.from('profiles').update({ banned: true }).eq('id', userId);
      }
      setSuccess('✅ Участники команды забанены');
      setTeams(prev => prev.filter(t => t.id !== teamId));
      setTeamDialogOpen(false);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* 🔹 Статистика */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Paper sx={{ p: 2, borderRadius: 2, minWidth: 150, bgcolor: '#E3F2FD', textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700}>{teams.length}</Typography>
          <Typography variant="body2" color="text.secondary">Всего команд</Typography>
        </Paper>
      </Box>

      {/* 🔹 Список команд */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>Название</strong></TableCell>
              <TableCell><strong>Участников</strong></TableCell>
              <TableCell><strong>Кейс</strong></TableCell>
              <TableCell align="right"><strong>Действия</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map(team => {
              console.log('🔍 Рендер команды:', {
                id: team.id,
                name: team.name,
                assigned_case: team.assigned_case,
                members_count: team.team_members?.length
              });
              
              return (
                <TableRow key={team.id} hover onClick={() => handleOpenTeam(team)} sx={{ cursor: 'pointer' }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Group fontSize="small" color="action" />
                      <Typography fontWeight={500}>{team.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{team.team_members?.length || 0}</TableCell>
                  <TableCell>
                    {team.assigned_case 
                      ? <Chip label={team.assigned_case.title || 'Без названия'} size="small" color="success" variant="outlined" />
                      : <Chip label="—" size="small" variant="outlined" />
                    }
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenTeam(team); }}>
                      <Edit fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 🔹 Диалог управления командой */}
      <Dialog open={teamDialogOpen} onClose={() => setTeamDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography>👥 {selectedTeam?.name}</Typography>
            <Box>
              <IconButton color="error" size="small" onClick={() => handleBanTeam(selectedTeam?.id)}>
                <Warning fontSize="small" />
              </IconButton>
              <IconButton color="error" size="small" onClick={() => handleDeleteTeam(selectedTeam?.id)}>
                <Delete fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            
            {/* 🔸 Название команды */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField 
                label="Название команды" 
                value={editTeamName} 
                onChange={(e) => setEditTeamName(e.target.value)} 
                size="small"
              />
              <Button size="small" variant="contained" onClick={handleSaveTeamName} startIcon={<Save />}>
                Сохранить
              </Button>
            </Box>

            {/* 🔸 Назначение кейса */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>Кейс</InputLabel>
                <Select 
                  value={assignedCase} 
                  label="Кейс"
                  onChange={(e) => setAssignedCase(e.target.value)}
                >
                  <MenuItem value="">Не назначен</MenuItem>
                  {cases.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.title || 'Без названия'}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button size="small" variant="contained" onClick={handleAssignCase}>
                Назначить
              </Button>
            </Box>

            {/*  Участники */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography fontWeight={600}>Участники ({selectedTeam?.team_members?.length || 0})</Typography>
                <Button size="small" variant="outlined" startIcon={<PersonAdd />} onClick={() => setAddMemberDialog(true)}>
                  Добавить
                </Button>
              </Box>
              <List dense>
                {selectedTeam?.team_members?.map((member: any) => (
                  <ListItem key={member.user_id} secondaryAction={
                    <IconButton size="small" color="error" onClick={() => handleRemoveMember(member.user_id)}>
                      <PersonRemove fontSize="small" />
                    </IconButton>
                  }>
                    <ListItemAvatar>
                      <Avatar src={member.profiles?.avatar_url} sx={{ width: 32, height: 32 }}>
                        {member.profiles?.full_name?.charAt(0)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={member.profiles?.full_name} 
                      secondary={`${member.profiles?.group_name || ''} • ${member.profiles?.email || ''}`} 
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeamDialogOpen(false)}>Закрыть</Button>
        </DialogActions>
      </Dialog>

      {/* 🔹 Диалог добавления участника */}
      <Dialog open={addMemberDialog} onClose={() => setAddMemberDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>🔍 Добавить участника</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            placeholder="Поиск: имя, Telegram, email, телефон..."
            value={memberSearch}
            onChange={(e) => setMemberSearch(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search /></InputAdornment>
            }}
          />
          <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
            {filteredUsers.map(user => (
              <Box 
                key={user.id} 
                sx={{ 
                  display: 'flex', alignItems: 'center', gap: 2, p: 1, 
                  borderRadius: 1, '&:hover': { bgcolor: 'action.hover' },
                  cursor: 'pointer'
                }}
                onClick={() => handleAddMember(user.id)}
              >
                <Avatar src={user.avatar_url} sx={{ width: 40, height: 40 }}>
                  {user.full_name?.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography fontWeight={500}>{user.full_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {user.group_name} • {user.email}
                  </Typography>
                </Box>
                <Chip label="Добавить" size="small" color="primary" variant="outlined" />
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddMemberDialog(false)}>Отмена</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}