import { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Button
} from '@mui/material';
import { Check, Close, Group } from '@mui/icons-material';
import { supabase } from '../../services/supabase';
import type { Team } from '../../types';

interface TeamsTabProps {
  teamsPending: Team[];
  setTeamsPending: React.Dispatch<React.SetStateAction<Team[]>>;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
  noteDialog: { open: boolean; type: 'approve' | 'reject'; id: string; field: string };
  setNoteDialog: React.Dispatch<React.SetStateAction<{ open: boolean; type: 'approve' | 'reject'; id: string; field: string }>>;
  note: string;
  setNote: React.Dispatch<React.SetStateAction<string>>;
}

export function TeamsTab({ teamsPending, setTeamsPending, setError, setSuccess, noteDialog, setNoteDialog, note, setNote }: TeamsTabProps) {
  
  const handleTeamModeration = async (teamId: string, approved: boolean, customName?: string) => {
    try {
      const team = teamsPending.find(t => t.id === teamId);
      if (!team) return;
      
      const updates: any = {
        name_status: approved ? 'approved' : 'rejected',
        pending_rename: null
      };
      
      if (approved) {
        if (team.pending_rename) {
          updates.name = customName || team.pending_rename;
        }
      }
      
      if (note) updates.name_note = note;

      const { error: dbError } = await supabase.from('teams').update(updates).eq('id', teamId);
      if (dbError) throw dbError;

      if (approved) {
        await supabase.from('notifications').insert({
          user_id: team.captain_id,
          type: 'team_rename_approved',
          title: 'Название команды одобрено',
          message: 'Ваше название команды успешно подтверждено.',
          created_at: new Date().toISOString()
        });
      } else {
        await supabase.from('notifications').insert({
          user_id: team.captain_id,
          type: 'team_rename_rejected',
          title: 'Название команды отклонено',
          message: `Название команды отклонено администратором. Причина: ${note}. Вы можете изменить название команды до конца регистрации.`,
          created_at: new Date().toISOString()
        });
      }

      setSuccess(`✅ Название команды ${approved ? 'одобрено' : 'отклонено'}`);
      setTimeout(() => setSuccess(null), 2000);
      
      const { data: teams } = await supabase.from('teams').select('*').eq('name_status', 'pending');
      setTeamsPending(teams || []);
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <>
      <TableContainer component={Paper} sx={{ borderRadius: 2, mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: '#F8F9FA' }}>
              <TableCell><strong>Команда</strong></TableCell>
              <TableCell><strong>Новое название</strong></TableCell>
              <TableCell align="right"><strong>Действия</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teamsPending.map(team => (
              <TableRow key={team.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Group fontSize="small" color="action" />
                    <Typography fontWeight={600}>{team.name}</Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>{team.pending_rename}</Typography>
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton 
                      size="small" 
                      color="success" 
                      onClick={() => handleTeamModeration(team.id, true)}
                    >
                      <Check fontSize="small" />
                    </IconButton>
                    
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={() => setNoteDialog({ 
                        open: true, 
                        type: 'reject', 
                        id: team.id, 
                        field: 'team' 
                      })}
                    >
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={noteDialog.open && noteDialog.field === 'team'} onClose={() => setNoteDialog({ ...noteDialog, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>❌ Отклонить название команды</DialogTitle>
        <DialogContent>
          <TextField 
            autoFocus
            fullWidth 
            label="Причина отклонения *"
            value={note} 
            onChange={(e) => setNote(e.target.value)} 
            margin="dense" 
            multiline 
            rows={4}
            required
            error={!note}
            helperText={!note ? 'Укажите причину отклонения' : 'Этот комментарий будет отправлен капитану команды'}
            placeholder="Например: Название содержит недопустимые символы..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setNoteDialog({ ...noteDialog, open: false });
            setNote('');
          }}>Отмена</Button>
          <Button 
            onClick={async () => {
              if (!note.trim()) {
                setError('Укажите причину отклонения');
                return;
              }
              
              await handleTeamModeration(noteDialog.id, false);
              
              setNoteDialog({ ...noteDialog, open: false });
              setNote('');
            }} 
            variant="contained" 
            color="error"
            disabled={!note.trim()}
          >
            Отклонить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}