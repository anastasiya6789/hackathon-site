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

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (teamsError) {
          throw teamsError;
        }
        
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('team_case_assignments')
          .select('team_id, case_id');
        
        if (assignmentsError) {
        }
        
        const { data: casesData, error: casesError } = await supabase
          .from('cases')
          .select('id, title')
          .not('published_at', 'is', null);
        
        if (casesError) {
        }
        
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select('team_id, user_id, profiles(full_name, email, group_name, avatar_url, phone, telegram_link)');
        
        if (membersError) {
        }
        
        const teamsWithDetails = teamsData?.map(team => {
          const assignment = assignmentsData?.find(a => a.team_id === team.id);
          const assignedCase = assignment 
            ? casesData?.find(c => c.id === assignment.case_id)
            : null;
          
          const members = membersData?.filter(m => m.team_id === team.id) || [];
          
          return {
            ...team,
            assigned_case: assignedCase,
            team_members: members
          };
        }) || [];
        
        
        const { data: usersData } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, telegram_link, group_name, avatar_url')
          .eq('role', 'user');
        
        setTeams(teamsWithDetails);
        setUsers(usersData || []);
        setCases(casesData || []);
        
      } catch (err: any) {
        setError('Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setError]);

  const filteredUsers = users.filter(u => {
    const q = memberSearch.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.telegram_link?.toLowerCase().includes(q)
    );
  });

  const handleOpenTeam = (team: any) => {
    setSelectedTeam(team);
    setEditTeamName(team.name);
    setAssignedCase(team.assigned_case?.id || '');
    setTeamDialogOpen(true);
  };

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

  const handleAssignCase = async () => {
    if (!selectedTeam) return;
    try {
      
      const { error: deleteError } = await supabase
        .from('team_case_assignments')
        .delete()
        .eq('team_id', selectedTeam.id);
      
      if (deleteError) {
        throw deleteError;
      }
      
      if (assignedCase) {
        const { error: insertError } = await supabase
          .from('team_case_assignments')
          .insert({ 
            team_id: selectedTeam.id, 
            case_id: assignedCase 
          });
        
        if (insertError) {
          throw insertError;
        }
      }
      
      setSuccess('✅ Кейс назначен');
      
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
      setError(err.message);
    }
  };

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
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    }
  };

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
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
    }
  };

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
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Paper sx={{ p: 2, borderRadius: 2, minWidth: 150, bgcolor: '#E3F2FD', textAlign: 'center' }}>
          <Typography variant="h4" fontWeight={700}>{teams.length}</Typography>
          <Typography variant="body2" color="text.secondary">Всего команд</Typography>
        </Paper>
      </Box>

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
              return (
                <TableRow key={team.id} hover onClick={() => handleOpenTeam(team)} sx={{ cursor: 'pointer' }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Group fontSize="small" color="action" />
                      <Typography fontWeight={500}>{team.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{team.team_members?.length || 0}</TableCell>
              
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