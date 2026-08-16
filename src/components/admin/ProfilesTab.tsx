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
  // 🔹 Обработка модерации одного поля
const handleFieldModeration = async (userId: string, field: 'full_name' | 'avatar' | 'group_name', approved: boolean, customValue?: string) => {
  console.log(`🔍 Начата модерация: field=${field}, approved=${approved}, userId=${userId}`);
  
  try {
    const updates: any = {};
    
    if (field === 'full_name') {
      updates.full_name_status = approved ? 'approved' : 'rejected';
      if (approved && customValue) {
        updates.full_name = customValue;
      }
      updates.name_locked = true;
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

    // 🔥 Обновляем профиль
    console.log(`📝 Обновляем профиль ${userId}:`, updates);
    const { data: profileData, error: dbError } = await supabase.from('profiles').update(updates).eq('id', userId);
    
    if (dbError) {
      console.error('❌ Ошибка обновления профиля:', dbError);
      throw dbError;
    }
    
    console.log('✅ Профиль обновлён:', profileData);

    // 🔥 Формируем текст уведомления
    const fieldLabels: Record<string, string> = { full_name: 'имя', avatar: 'фото', group_name: 'группа' };
const fieldLabelsNominative: Record<string, string> = { full_name: 'Имя', avatar: 'Фото', group_name: 'Группа' };
const fieldLabelsDative: Record<string, string> = { full_name: 'имя', avatar: 'фото', group_name: 'группу' };
    
    const fieldName = fieldLabels[field];
    const fieldNameNom = fieldLabelsNominative[field];
    const fieldNameDat = fieldLabelsDative[field];
    
    // 🔥 Создаём уведомление
    const notificationData = {
      user_id: userId,
      type: approved 
  ? `moderation_${field === 'full_name' ? 'name' : field}` 
  : `moderation_${field === 'full_name' ? 'name' : field}_rejected`,
      title: approved ? `${fieldNameNom} одобрено` : `${fieldNameNom} отклонено`,
      message: approved 
        ? `Ваше ${fieldName} успешно подтверждено.`
        : `${fieldNameNom} отклонено администратором. Причина: ${note}. Вы можете изменить ${fieldNameDat} до конца регистрации.`,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    
    console.log('📩 Создаём уведомление:', notificationData);
    
    const { data: notifData, error: notifError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select();  // 🔥 Добавляем .select() чтобы увидеть созданную запись
    
    if (notifError) {
      console.error('❌ Ошибка создания уведомления:', notifError);
      setError(`Не удалось создать уведомление: ${notifError.message}`);
    } else {
      console.log('✅ Уведомление создано:', notifData);
    }

    setSuccess(`✅ ${fieldName} ${approved ? 'одобрено' : 'отклонено'}`);
    setTimeout(() => setSuccess(null), 2000);
    
    // 🔥 Обновляем список pending-профилей
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
    console.error('❌ Ошибка модерации:', err);
    setError(err.message || 'Ошибка при модерации');
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
      
      // 🔥 Уведомление о подтверждении всех данных
      try {
        await supabase.from('notifications').insert({
          user_id: userId,
          type: 'moderation_all_approved',
          title: 'Все данные подтверждены',
          message: 'Администратор подтвердил все ваши данные. Теперь они видны другим участникам.',
          created_at: new Date().toISOString(),
          is_read: false,
        });
      } catch (err) {
        console.warn('⚠️ Не удалось создать уведомление:', err);
      }
      
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
      console.error('❌ Ошибка подтверждения всех данных:', err);
      setError(err.message);
    }
  };

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