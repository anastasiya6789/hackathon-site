import { useState, useEffect, useRef } from 'react';
import { 
  Card, CardContent, Typography, Box, Divider, Chip, Alert, 
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Tooltip, CircularProgress
} from '@mui/material';
import { CameraAlt as CameraAltIcon, Lock, Edit, Email, Group, Psychology } from '@mui/icons-material';
import { supabase } from '../../services/supabase';
import type { User } from '../../types';

interface ProfileCardProps {
  user: User;
}

export function ProfileCard({ user }: ProfileCardProps) {
  const [avatar, setAvatar] = useState<string | null>(user.avatarUrl || null);
  const [avatarStatus, setAvatarStatus] = useState<string>('');
  const [fullNameStatus, setFullNameStatus] = useState<string>('');
  const [groupNameStatus, setGroupNameStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [editNameDialog, setEditNameDialog] = useState(false);
  const [editGroupDialog, setEditGroupDialog] = useState(false);
  const [newName, setNewName] = useState(user.fullName);
  const [newGroup, setNewGroup] = useState(user.groupName);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [userTeam, setUserTeam] = useState<any>(null);
  const [userCase, setUserCase] = useState<any>(null);
  const [loadingExtra, setLoadingExtra] = useState(true);
  
  // 🔥 Проверка регистрации
  const [registrationEnd, setRegistrationEnd] = useState<string | null>(null);
  const [registrationClosed, setRegistrationClosed] = useState(false);

  // 🔥 Определяем, свой это профиль или чужой
  const currentUser = JSON.parse(localStorage.getItem('hackathon_current_user') || '{}');
  const isOwnProfile = user.id === currentUser.id;

  // 🔥 Проверяем дедлайн регистрации
  useEffect(() => {
    const fetchConfig = async () => {
      const { data } = await supabase.from('hackathon_config').select('registration_end').single();
      if (data?.registration_end) {
        setRegistrationEnd(data.registration_end);
        const now = new Date();
        const end = new Date(data.registration_end);
        setRegistrationClosed(now > end);
      }
    };
    fetchConfig();
  }, []);

  // 🔥 Определяем что на модерации и что отклонено
  const pendingItems: string[] = [];
  const rejectedItems: string[] = [];
  
  // 🔥 ЛОГИ: проверяем статусы
  console.log('🔍 [Status Check]', {
    avatarUrl: avatar,
    avatarStatus: avatarStatus,
    fullNameStatus: fullNameStatus,
    groupNameStatus: groupNameStatus
  });
  
  // 🔥 Фото добавляем в pending ТОЛЬКО если есть avatar_url
  if (avatar && avatarStatus === 'pending') {
    pendingItems.push('Фотография');
    console.log('✅ Фото добавлено в pending');
  }
  if (avatarStatus === 'rejected') rejectedItems.push('Фотография');
  
  if (fullNameStatus === 'pending') pendingItems.push('Имя');
  if (fullNameStatus === 'rejected') rejectedItems.push('Имя');
  
  if (groupNameStatus === 'pending') pendingItems.push('Группа');
  if (groupNameStatus === 'rejected') rejectedItems.push('Группа');
  
  console.log('📋 pendingItems:', pendingItems);
  console.log(' rejectedItems:', rejectedItems);

  // 🔥 Загружаем ВСЕ статусы модерации из БД
  useEffect(() => {
    const fetchProfileData = async () => {
      console.log('🔍 [fetchProfileData] Запрашиваем данные для user.id:', user.id);
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            avatar_url, 
            avatar_status, 
            group_name_status, 
            full_name_status
          `)
          .eq('id', user.id)
          .maybeSingle();
        
        if (error) {
          console.error('❌ Ошибка запроса профиля:', error);
          return;
        }
        
        console.log('✅ БД вернула:', {
          avatar_url: data?.avatar_url,
          avatar_status: data?.avatar_status,
          group_name_status: data?.group_name_status,
          full_name_status: data?.full_name_status
        });
        
        // 🔥 Сохраняем ВСЕ статусы в state
        setAvatarStatus(data?.avatar_status || '');
        setFullNameStatus(data?.full_name_status || '');
        setGroupNameStatus(data?.group_name_status || '');
        
        // Для своего профиля: показываем аватар ВСЕГДА если он есть
        if (isOwnProfile) {
          const avatarUrl = data?.avatar_url || user.avatarUrl;
          console.log('✅ Свой профиль, avatarUrl:', avatarUrl);
          setAvatar(avatarUrl || null);
        } else {
          // Для чужого профиля: показываем только если approved
          const status = data?.avatar_status;
          setAvatar(status === 'approved' ? data?.avatar_url : null);
        }
      } catch (err) {
        console.error(' Ошибка в fetchProfileData:', err);
      }
    };
    
    if (user?.id) {
      fetchProfileData();
    }
  }, [user.id, isOwnProfile]);

  useEffect(() => {
    setNewName(user.fullName);
    setNewGroup(user.groupName);
  }, [user]);

  useEffect(() => {
    const loadExtraData = async () => {
      try {
        const { data: teamData } = await supabase
          .from('teams')
          .select('id, name')
          .eq('captain_id', user.id)
          .maybeSingle();
        
        if (!teamData) {
          const { data: memberData } = await supabase
            .from('team_members')
            .select('team_id')
            .eq('user_id', user.id)
            .maybeSingle();
          
          if (memberData?.team_id) {
            const { data: joinedTeam } = await supabase
              .from('teams')
              .select('id, name')
              .eq('id', memberData.team_id)
              .maybeSingle();
            setUserTeam(joinedTeam);
          }
        } else {
          setUserTeam(teamData);
        }
        
        if (userTeam?.id) {
          const { data: assignment } = await supabase
            .from('team_case_assignments')
            .select('cases(title)')
            .eq('team_id', userTeam.id)
            .maybeSingle();
          
          if (assignment?.cases) {
            setUserCase(assignment.cases);
          }
        }
      } catch (err) {
        console.error('Ошибка загрузки доп. данных:', err);
      } finally {
        setLoadingExtra(false);
      }
    };
    
    if (user?.id) loadExtraData();
  }, [user.id, userTeam?.id]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return setError('Файл > 2MB');
    if (!file.type.startsWith('image/')) return setError('Только изображения');

    console.log('📸 [handleAvatarChange] Загрузка фото...');

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      console.log(' Public URL:', publicUrl);

      // Обновляем статус в БД
      await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, avatar_status: 'pending', avatar_note: null })
        .eq('id', user.id);
      
      console.log('✅ Фото загружено, статус pending');
      
      // Показываем сразу (для своего профиля)
      if (isOwnProfile) {
        setAvatar(publicUrl);
        setAvatarStatus('pending');
      }
      setError(null);
    } catch (err: any) {
      console.error('❌ Ошибка загрузки фото:', err);
      setError(err.message || 'Ошибка');
    }
  };

  const handleSaveName = async () => {
    if (user.nameLocked) return;
    try {
      await supabase.from('profiles').update({ 
        full_name: newName.trim(), 
        full_name_status: 'pending', 
        full_name_note: null 
      }).eq('id', user.id);
      setEditNameDialog(false);
      setFullNameStatus('pending');
      console.log('✅ Имя отправлено на модерацию');
      setError(null);
    } catch (err: any) {
      console.error('❌ Ошибка сохранения имени:', err);
      setError(err.message);
    }
  };

  // 🔥 Функция сохранения группы
  const handleSaveGroup = async () => {
    try {
      await supabase.from('profiles').update({ 
        group_name: newGroup.trim(), 
        group_name_status: 'pending', 
        group_name_note: null 
      }).eq('id', user.id);
      setEditGroupDialog(false);
      setGroupNameStatus('pending');
      console.log('✅ Группа отправлена на модерацию');
      setError(null);
    } catch (err: any) {
      console.error('❌ Ошибка сохранения группы:', err);
      setError(err.message);
    }
  };

  const registrationDate = new Date(user.createdAt).toLocaleDateString('ru-RU', { 
    day: 'numeric', month: 'long', year: 'numeric' 
  });

  // 🔥 Проверяем можно ли редактировать фото
  // Можно если: (нет фото ИЛИ фото отклонено) И регистрация не закрыта
  const canEditAvatar = isOwnProfile && !registrationClosed && 
    (!avatar || avatarStatus === 'rejected');
  
  console.log(' canEditAvatar:', canEditAvatar, {
    isOwnProfile,
    registrationClosed,
    hasAvatar: !!avatar,
    avatarStatus
  });

  // 🔥 Проверяем можно ли редактировать имя/группу
  const canEditName = isOwnProfile && !registrationClosed && fullNameStatus === 'rejected';
  const canEditGroup = isOwnProfile && !registrationClosed && groupNameStatus === 'rejected';

  return (
    <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
        
        {/* 🔥 Alert если регистрация закрыта */}
        {registrationClosed && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Регистрация завершена. Редактирование данных недоступно.
          </Alert>
        )}
        
        {/* 🔥 Alert если есть отклонения */}
        {rejectedItems.length > 0 && !registrationClosed && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight={600} mb={1}>
              Требуется исправление:
            </Typography>
            {rejectedItems.map((item, idx) => (
              <Typography key={idx} variant="body2" display="block">
                • {item}
              </Typography>
            ))}
            <Typography variant="caption" display="block" color="text.secondary" mt={1}>
              Нажмите на карандаш или иконку камеры, чтобы исправить
            </Typography>
          </Alert>
        )}

        {/* 🔹 Аватар + Имя */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box 
            onClick={canEditAvatar ? handleAvatarClick : undefined} 
            sx={{ 
              width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', 
              cursor: canEditAvatar ? 'pointer' : 'default',
              border: '3px solid #9500d3', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              bgcolor: '#F3E5F5', position: 'relative', '&:hover': { opacity: canEditAvatar ? 0.85 : 1 } 
            }}
          >
            {/* 🔥 Показываем аватар */}
            {avatar ? (
              <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <Typography variant="h3" color="#9500d3" fontWeight={700}>
                {user.fullName.charAt(0)}
              </Typography>
            )}
            
            {/* 🔥 Иконка камеры — только если можно редактировать фото */}
            {canEditAvatar && (
              <Box sx={{ 
                position: 'absolute', bottom: 2, right: 2, 
                bgcolor: '#9500d3', borderRadius: '50%', width: 22, height: 22, 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)' 
              }}>
                <CameraAltIcon sx={{ color: 'white', fontSize: 14 }} />
              </Box>
            )}
          </Box>
          
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" fontWeight={700} color="#1A1A1A">{user.fullName}</Typography>
                {user.nameLocked && <Lock fontSize="small" color="disabled" />}
                {canEditName && (
                  <IconButton size="small" onClick={() => setEditNameDialog(true)}>
                    <Edit fontSize="small" />
                  </IconButton>
                )}
              </Box>
              {/* 🔥 Группа с карандашом */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                <Chip label={user.groupName} size="small" sx={{ borderColor: '#9500d3', color: '#9500d3' }} variant="outlined" />
                {canEditGroup && (
                  <IconButton size="small" onClick={() => setEditGroupDialog(true)}>
                    <Edit fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Box>
            
            {/* 🔥 Бейдж "На модерации" — если есть pending */}
            {pendingItems.length > 0 && (
              <Tooltip 
                title={
                  <Box sx={{ 
                    color: 'white !important',
                    '& *': { color: 'white !important' },
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.25
                  }}>
                    <Typography variant="body2" fontWeight={700} sx={{ mb: 0.5, borderBottom: '1px solid rgba(255,255,255,0.4)', pb: 0.5 }}>
                      На модерации:
                    </Typography>
                    {pendingItems.map((item, idx) => (
                      <Typography key={idx} variant="caption" display="block">
                        • {item}
                      </Typography>
                    ))}
                  </Box>
                }
                placement="right"
                arrow
                componentsProps={{
                  tooltip: {
                    sx: {
                      bgcolor: 'rgba(25, 25, 25, 0.95)',
                      borderRadius: 2,
                      px: 1.5,
                      py: 1,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      maxWidth: 220,
                      color: 'white !important',
                      '& .MuiTypography-root': {
                        color: 'white !important'
                      }
                    }
                  },
                  arrow: {
                    sx: {
                      color: 'rgba(25, 25, 25, 0.95)'
                    }
                  }
                }}
              >
                <Chip 
                  label="На модерации" 
                  size="small" 
                  color="warning" 
                  sx={{ 
                    fontSize: '0.7rem', 
                    height: 22, 
                    fontWeight: 600,
                    ml: 'auto',
                    cursor: 'help'
                  }} 
                />
              </Tooltip>
            )}
            
            {/*  Бейдж "Подтверждено" — если ВСЁ approved */}
            {pendingItems.length === 0 && rejectedItems.length === 0 && (
              <Chip 
                label="✓ Подтверждено" 
                size="small" 
                sx={{ 
                  fontSize: '0.7rem', 
                  height: 22, 
                  fontWeight: 600,
                  bgcolor: '#4CAF50',
                  color: 'white',
                  ml: 'auto'
                }} 
              />
            )}
          </Box>
        </Box>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
        <Divider sx={{ my: 2 }} />

        {/* 🔹 Дополнительная информация */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Email fontSize="small" sx={{ color: 'text.secondary', mt: 0.5 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>Email</Typography>
              <Typography variant="body1" fontWeight={500}>{user.email}</Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box sx={{ width: 20, display: 'flex', justifyContent: 'center', mt: 0.5 }}>📱</Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>Телефон</Typography>
              <Typography variant="body1" fontWeight={500}>{user.phone}</Typography>
            </Box>
          </Box>
          
          {user.telegramLink && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Box sx={{ width: 20, display: 'flex', justifyContent: 'center', mt: 0.5 }}>✈️</Box>
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>Telegram</Typography>
                <Typography variant="body1">
                  <a href={user.telegramLink.startsWith('http') ? user.telegramLink : `https://t.me/${user.telegramLink.replace('@', '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#9500d3', textDecoration: 'none' }}>
                    {user.telegramLink}
                  </a>
                </Typography>
              </Box>
            </Box>
          )}
          
          {loadingExtra ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="caption" color="text.secondary">Загрузка...</Typography>
            </Box>
          ) : userTeam && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Group fontSize="small" sx={{ color: 'text.secondary', mt: 0.5 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>Команда</Typography>
                <Typography variant="body1" fontWeight={500}>{userTeam.name}</Typography>
              </Box>
            </Box>
          )}
          
          {loadingExtra ? null : userCase && (
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Psychology fontSize="small" sx={{ color: 'text.secondary', mt: 0.5 }} />
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>Кейс</Typography>
                <Typography variant="body1" fontWeight={500}>{userCase.title}</Typography>
              </Box>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
            <Box sx={{ width: 20, display: 'flex', justifyContent: 'center', mt: 0.5 }}>📅</Box>
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500}>Дата регистрации</Typography>
              <Typography variant="body1">{registrationDate}</Typography>
            </Box>
          </Box>
        </Box>
      </CardContent>

      {/* 🔹 Диалог редактирования имени */}
      <Dialog open={editNameDialog} onClose={() => setEditNameDialog(false)}>
        <DialogTitle>Изменить ФИО</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Новое ФИО" value={newName} onChange={(e) => setNewName(e.target.value)} margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditNameDialog(false)}>Отмена</Button>
          <Button onClick={handleSaveName} variant="contained">Отправить</Button>
        </DialogActions>
      </Dialog>

      {/* 🔹 Диалог редактирования группы */}
      <Dialog open={editGroupDialog} onClose={() => setEditGroupDialog(false)}>
        <DialogTitle>Изменить группу</DialogTitle>
        <DialogContent>
          <TextField autoFocus fullWidth label="Новая группа" value={newGroup} onChange={(e) => setNewGroup(e.target.value)} margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditGroupDialog(false)}>Отмена</Button>
          <Button onClick={handleSaveGroup} variant="contained">Отправить</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}