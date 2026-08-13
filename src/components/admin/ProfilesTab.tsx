import { useState } from 'react';
import { 
  Box, Typography, Paper, IconButton, Avatar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button
} from '@mui/material';
import { Check, Close } from '@mui/icons-material';
import { supabase } from '../../services/supabase';

interface ProfilesTabProps {
  profilesPending: any[];
  setProfilesPending: React.Dispatch<React.SetStateAction<any[]>>;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
}

export function ProfilesTab({ profilesPending, setProfilesPending, setError, setSuccess }: ProfilesTabProps) {
  const [note, setNote] = useState('');
  const [noteDialog, setNoteDialog] = useState<{ 
    open: boolean; 
    type: 'approve' | 'reject'; 
    id: string; 
    field: 'full_name' | 'avatar' | 'group_name' | 'all';
  }>({ open: false, type: 'approve', id: '', field: 'all' });

  // 🔹 Обработка модерации одного поля
  const handleFieldModeration = async (userId: string, field: 'full_name' | 'avatar' | 'group_name', approved: boolean, customValue?: string) => {
    try {
      const updates: any = {};
      
      if (field === 'full_name') {
        updates.full_name_status = approved ? 'approved' : 'rejected';
        if (approved) {
          updates.full_name = customValue || updates.full_name;
          updates.name_locked = true;
        }
      } else if (field === 'avatar') {
        updates.avatar_status = approved ? 'approved' : 'rejected';
        if (approved && customValue) {
          updates.avatar_url = customValue;
        }
      } else if (field === 'group_name') {
        updates.group_name_status = approved ? 'approved' : 'rejected';
        if (approved && customValue) {
          updates.group_name = customValue;
        }
      }
      
      if (note) updates[`${field}_note`] = note;

      const { error: dbError } = await supabase.from('profiles').update(updates).eq('id', userId);
      if (dbError) throw dbError;

      const fieldLabels: any = { full_name: 'имя', avatar: 'фото', group_name: 'группа' };
      const fieldLabelsNominative: any = { full_name: 'Имя', avatar: 'Фото', group_name: 'Группа' };
      const fieldLabelsDative: any = { full_name: 'имя', avatar: 'фото', group_name: 'группу' };
      
      if (approved) {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: `moderation_${field}`,
          title: `${fieldLabelsNominative[field]} одобр${field === 'group_name' ? 'ена' : 'ено'}`,
          message: `Ваш${field === 'group_name' ? 'а' : 'е'} ${fieldLabels[field]} успешно подтвержден${field === 'group_name' ? 'а' : 'о'}.`,
          created_at: new Date().toISOString()
        });
      } else {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: `moderation_${field}_rejected`,
          title: `${fieldLabelsNominative[field]} отклонен${field === 'group_name' ? 'а' : 'о'}`,
          message: `${fieldLabelsNominative[field]} отклонен${field === 'group_name' ? 'а' : 'о'} администратором. Причина: ${note}. Вы можете изменить ${fieldLabelsDative[field]} до конца регистрации.`,
          created_at: new Date().toISOString()
        });
      }

      setSuccess(`✅ ${fieldLabels[field]} ${approved ? 'одобр' + (field === 'group_name' ? 'ена' : 'ено') : 'отклон' + (field === 'group_name' ? 'ена' : 'ено')}`);
      setTimeout(() => setSuccess(null), 2000);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .or('full_name_status.eq.pending,full_name_status.eq.rejected,avatar_status.eq.pending,avatar_status.eq.rejected,group_name_status.eq.pending,group_name_status.eq.rejected');
      
      const profilesWithPending = profiles?.filter(p => 
        p.full_name_status === 'pending' || 
        p.avatar_status === 'pending' || 
        p.group_name_status === 'pending'
      ) || [];
      setProfilesPending(profilesWithPending);
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 🔹 Обработка "Подтвердить всё" для профиля
  const handleApproveAll = async (userId: string) => {
    try {
      const { error } = await supabase.from('profiles').update({
        full_name_status: 'approved',
        avatar_status: 'approved',
        group_name_status: 'approved',
        name_locked: true
      }).eq('id', userId);
      
      if (error) throw error;
      
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'moderation_all_approved',
        title: 'Все данные подтверждены',
        message: 'Администратор подтвердил все ваши данные. Теперь они видны другим участникам.',
        created_at: new Date().toISOString()
      });
      
      setSuccess('✅ Все данные пользователя подтверждены');
      setTimeout(() => setSuccess(null), 2000);
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .or('full_name_status.eq.pending,full_name_status.eq.rejected,avatar_status.eq.pending,avatar_status.eq.rejected,group_name_status.eq.pending,group_name_status.eq.rejected');
      
      const profilesWithPending = profiles?.filter(p => 
        p.full_name_status === 'pending' || 
        p.avatar_status === 'pending' || 
        p.group_name_status === 'pending'
      ) || [];
      setProfilesPending(profilesWithPending);
      
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 🔹 Рендер таблицы профилей
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {profilesPending.map(profile => (
        <Paper key={profile.id} sx={{ p: 2, borderRadius: 2, bgcolor: '#fff' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            
            {/* 🔥 Левая колонка: Аватар + Имя */}
            <Box sx={{ minWidth: 200, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar 
                src={profile.avatar_url} 
                sx={{ width: 60, height: 60, bgcolor: '#9500d3' }}
              >
                {profile.full_name?.charAt(0)}
              </Avatar>
              <Box>
                <Typography fontWeight={700} fontSize="1.1rem">{profile.full_name}</Typography>
                <Typography variant="caption" color="text.secondary">{profile.email}</Typography>
              </Box>
            </Box>
            
            {/* 🔥 Центральная колонка: Запрошенные данные */}
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
              
              {/* Имя */}
              {profile.full_name_status === 'pending' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#FFF3E0', borderRadius: 1 }}>
                  <Typography variant="caption" fontWeight={600} sx={{ minWidth: 60 }}>Имя:</Typography>
                  <Typography variant="body2" sx={{ flex: 1 }}>{profile.full_name}</Typography>
                  <IconButton size="small" color="success" onClick={() => handleFieldModeration(profile.id, 'full_name', true)}>
                    <Check fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setNoteDialog({ open: true, type: 'reject', id: profile.id, field: 'full_name' })}>
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              )}
              
              {/* Группа */}
              {profile.group_name_status === 'pending' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#FFF3E0', borderRadius: 1 }}>
                  <Typography variant="caption" fontWeight={600} sx={{ minWidth: 60 }}>Группа:</Typography>
                  <Typography variant="body2" sx={{ flex: 1 }}>{profile.group_name}</Typography>
                  <IconButton size="small" color="success" onClick={() => handleFieldModeration(profile.id, 'group_name', true)}>
                    <Check fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setNoteDialog({ open: true, type: 'reject', id: profile.id, field: 'group_name' })}>
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              )}
              
              {/* Фото */}
              {profile.avatar_status === 'pending' && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#FFF3E0', borderRadius: 1 }}>
                  <Typography variant="caption" fontWeight={600} sx={{ minWidth: 60 }}>Фото:</Typography>
                  <Avatar src={profile.avatar_url} sx={{ width: 40, height: 40 }} />
                  <IconButton size="small" color="success" onClick={() => handleFieldModeration(profile.id, 'avatar', true)}>
                    <Check fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => setNoteDialog({ open: true, type: 'reject', id: profile.id, field: 'avatar' })}>
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </Box>
            
            {/* 🔥 Правая колонка: Кнопка "Всё ок" */}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <IconButton 
                size="large" 
                color="success" 
                onClick={() => handleApproveAll(profile.id)}
                sx={{ bgcolor: '#E8F5E9', '&:hover': { bgcolor: '#C8E6C9' } }}
              >
                <Check sx={{ fontSize: 32 }} />
              </IconButton>
              <Typography variant="caption" color="text.secondary">Все данные</Typography>
            </Box>
            
          </Box>
        </Paper>
      ))}
      {/* 🔹 Диалог отклонения для профилей */}
<Dialog 
  open={noteDialog.open && noteDialog.field !== 'all'} 
  onClose={() => setNoteDialog({ ...noteDialog, open: false })} 
  maxWidth="sm" 
  fullWidth
>
  <DialogTitle>❌ Отклонить {noteDialog.field === 'full_name' ? 'имя' : noteDialog.field === 'avatar' ? 'фото' : 'группу'}</DialogTitle>
  <DialogContent>
    <TextField 
      autoFocus fullWidth label="Причина отклонения *" value={note} 
      onChange={(e) => setNote(e.target.value)} margin="dense" multiline rows={4}
      required error={!note} helperText={!note ? 'Укажите причину' : 'Комментарий отправится пользователю'}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => { setNoteDialog({ ...noteDialog, open: false }); setNote(''); }}>Отмена</Button>
    <Button 
      onClick={async () => {
        if (!note.trim()) { setError('Укажите причину'); return; }
        await handleFieldModeration(noteDialog.id, noteDialog.field, false);
        setNoteDialog({ ...noteDialog, open: false }); setNote('');
      }} 
      variant="contained" color="error" disabled={!note.trim()}
    >
      Отклонить
    </Button>
  </DialogActions>
</Dialog>
    </Box>
  );
}