import { useState, useEffect } from 'react';
import { ProfilesTab } from '../components/admin/ProfilesTab';
import { TeamsTab } from '../components/admin/TeamsTab';
import { SettingsTab } from '../components/admin/SettingsTab';
import { CasesTab } from '../components/admin/CasesTab';
import { StatisticsTab } from '../components/admin/StatisticsTab';
import { TeamsManagementTab } from '../components/admin/TeamsManagementTab';
import { 
  Box, Typography, Paper, Tabs, Tab, Alert
} from '@mui/material';
import { supabase } from '../services/supabase';
import { useNavigate } from 'react-router-dom';
import type { User, Team } from '../types';

export function AdminPage() {
  const [tab, setTab] = useState(0);
  
  const [profilesPending, setProfilesPending] = useState<any[]>([]);
  const [teamsPending, setTeamsPending] = useState<Team[]>([]);
  
  const [noteDialog, setNoteDialog] = useState<{ 
    open: boolean; 
    type: 'approve' | 'reject'; 
    id: string; 
    field: 'full_name' | 'avatar' | 'group_name' | 'all';
    value?: string;
  }>({ open: false, type: 'approve', id: '', field: 'all' });
  const [note, setNote] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const navigate = useNavigate();
  
  const [registrationStart, setRegistrationStart] = useState('');
  const [registrationEnd, setRegistrationEnd] = useState('');
  const [caseSelectionStart, setCaseSelectionStart] = useState('');
  const [configLoading, setConfigLoading] = useState(false);

  useEffect(() => {
    const fetchPending = async () => {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .or('full_name_status.eq.pending,full_name_status.eq.rejected,avatar_status.eq.pending,avatar_status.eq.rejected,group_name_status.eq.pending,group_name_status.eq.rejected');
      
      const { data: teams } = await supabase
        .from('teams')
        .select('*')
        .eq('name_status', 'pending');
      
      const profilesWithPending = profiles?.filter(p => 
        p.full_name_status === 'pending' || 
        p.avatar_status === 'pending' || 
        p.group_name_status === 'pending'
      ) || [];
      
      setProfilesPending(profilesWithPending);
      setTeamsPending(teams || []);
    };
    
    const fetchConfig = async () => {
      setConfigLoading(true);
      try {
        const { data, error } = await supabase.from('hackathon_config').select('*').single();
        if (error) {
          if (error.code === '42P01') {
            await supabase.rpc('create_hackathon_config_table');
          }
          return;
        }
        if (data) {
          setRegistrationStart(data.registration_start?.slice(0, 16) || '');
          setRegistrationEnd(data.registration_end?.slice(0, 16) || '');
          setCaseSelectionStart(data.case_selection_start?.slice(0, 16) || '');
        }
      } catch (err) {
        console.error('Ошибка:', err);
      } finally {
        setConfigLoading(false);
      }
    };
    
    fetchPending();
    fetchConfig();
  }, []);

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('hackathon_current_user') || 'null');
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/dashboard', { replace: true });
    }
  }, [navigate]);

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 2, sm: 3 } }}>
      <Typography variant="h4" fontWeight={700} color="primary" mb={2}>🛡️ Панель модерации</Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
      
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }} variant="scrollable" scrollButtons="auto">
  <Tab label={`👤 Профили (${profilesPending.length})`} />
  <Tab label={`👥 Команды (${teamsPending.length})`} />
  <Tab label="⚙️ Настройки" />
  <Tab label="📦 Кейсы" />
  <Tab label="📊 Статистика" />
  <Tab label="👥 Управление командами" />
</Tabs>

      {tab === 0 && (
        profilesPending.length 
          ? <ProfilesTab 
              profilesPending={profilesPending}
              setProfilesPending={setProfilesPending}
              setError={setError}
              setSuccess={setSuccess}
            />
          : <Typography color="text.secondary" p={2}>Нет запросов на модерацию профилей</Typography>
      )}

      {tab === 1 && (
        teamsPending.length 
          ? <TeamsTab 
              teamsPending={teamsPending}
              setTeamsPending={setTeamsPending}
              setError={setError}
              setSuccess={setSuccess}
              noteDialog={noteDialog}
              setNoteDialog={setNoteDialog}
              note={note}
              setNote={setNote}
            />
          : <Typography color="text.secondary" p={2}>Нет запросов на переименование команд</Typography>
      )}

      {tab === 2 && (
        <SettingsTab 
          registrationStart={registrationStart}
          setRegistrationStart={setRegistrationStart}
          registrationEnd={registrationEnd}
          setRegistrationEnd={setRegistrationEnd}
          caseSelectionStart={caseSelectionStart}
          setCaseSelectionStart={setCaseSelectionStart}
          configLoading={configLoading}
          setConfigLoading={setConfigLoading}
          setError={setError}
          setSuccess={setSuccess}
        />
      )}

      {tab === 3 && (
        <CasesTab 
          caseSelectionStart={caseSelectionStart}
          setError={setError}
          setSuccess={setSuccess}
        />
      )}

      {/* 🔹 Вкладка: Статистика */}
{tab === 4 && (
  <StatisticsTab setError={setError} setSuccess={setSuccess} />
)}

{/* 🔹 Вкладка: Управление командами */}
{tab === 5 && (
  <TeamsManagementTab 
    setError={setError} 
    setSuccess={setSuccess} 
  />
)}
    </Box>
  );
}