import { useState, useEffect } from 'react';
import {
  Card, CardContent, Typography, Box, Button, TextField, Alert,
  Avatar, Chip, Divider, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { PersonAdd, LinkOff, ContentCopy, Edit, Delete, Check, Close } from '@mui/icons-material';
import { supabase } from '../../services/supabase';
import type { User } from '../../types';
import { isValidUniqueCode } from '../../services/codeGenerator';

interface TeamTabProps {
  user: User;
}

const HACKATHON_CONFIG = {
  renameDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
  maxTeamSize: 5,
};

export function TeamTab({ user }: TeamTabProps) {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [team, setTeam] = useState<any>(null);
  const [renameDialog, setRenameDialog] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [incomingInvites, setIncomingInvites] = useState<any[]>([]);
  const [captainInfo, setCaptainInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [registrationEnd, setRegistrationEnd] = useState<string | null>(null);
  const [registrationClosed, setRegistrationClosed] = useState(false);

  // 🔥 Вычисляем isCaptain из team.captain_id
  const isCaptain = team?.captain_id === user.id;

  useEffect(() => {
    loadData();
  }, [user.id]);

  useEffect(() => {
    if (registrationEnd) {
      const now = new Date();
      const end = new Date(registrationEnd);
      setRegistrationClosed(now > end);
    }
  }, [registrationEnd]);

  // 🔥 Вспомогательная функция: проверяет и удаляет пустую команду из БД
  const checkAndDeleteEmptyTeam = async (teamId: string) => {
    console.log('\n========== 🔍 checkAndDeleteEmptyTeam ==========');
    console.log('📋 Team ID:', teamId);
    
    // 1. Проверяем участников в team_members
    console.log('\n1️ ЗАПРОС УЧАСТНИКОВ:');
    console.log('SQL: SELECT id, role, user_id FROM team_members WHERE team_id =', teamId);
    
    const { data: membersData, error: membersError } = await supabase
      .from('team_members')
      .select('id, role, user_id')
      .eq('team_id', teamId);
    
    if (membersError) {
      console.error('❌ Ошибка загрузки участников:', membersError);
      return false;
    }
    
    console.log('✅ РЕЗУЛЬТАТ team_members:', membersData);
    console.log('📊 Всего записей:', membersData?.length || 0);
    
    //  ФИЛЬТРУЕМ: оставляем только НЕ капитанов
    const activeMembers = membersData?.filter(m => m.role !== 'captain') || [];
    console.log('👥 Активные участники (не капитаны):', activeMembers);
    console.log('📊 Количество активных участников:', activeMembers.length);
    
    // 2. Проверяем ВСЕ приглашения
    console.log('\n2️⃣ ЗАПРОС ПРИГЛАШЕНИЙ:');
    console.log('SQL: SELECT id, status, invited_user_id FROM team_invitations WHERE team_id =', teamId);
    
    const { data: allInvites, error: invitesError } = await supabase
      .from('team_invitations')
      .select('id, status, invited_user_id')
      .eq('team_id', teamId);
    
    if (invitesError) {
      console.error('❌ Ошибка загрузки приглашений:', invitesError);
      return false;
    }
    
    console.log('✅ РЕЗУЛЬТАТ team_invitations:', allInvites);
    console.log('📊 Всего приглашений:', allInvites?.length || 0);
    
    // Считаем по статусам
    const pendingInvites = allInvites?.filter(inv => inv.status === 'pending') || [];
    const acceptedInvites = allInvites?.filter(inv => inv.status === 'accepted') || [];
    const declinedInvites = allInvites?.filter(inv => inv.status === 'declined') || [];
    
    console.log('\n СТАТИСТИКА ПО СТАТУСАМ:');
    console.log('⏳ Pending:', pendingInvites.length, pendingInvites);
    console.log('✅ Accepted:', acceptedInvites.length, acceptedInvites);
    console.log('❌ Declined:', declinedInvites.length, declinedInvites);
    
    // 🔥 КОМАНДА НЕ ПУСТАЯ ТОЛЬКО ЕСЛИ:
    // 1. Есть активные участники (не капитаны) ИЛИ
    // 2. Есть pending приглашения
    if (activeMembers.length > 0) {
      console.log('❌ КОМАНДА НЕ ПУСТАЯ - есть', activeMembers.length, 'активных участников');
      console.log('========== ✅ checkAndDeleteEmptyTeam завершена ==========\n');
      return false;
    }
    
    if (pendingInvites.length > 0) {
      console.log('ℹ️ КОМАНДА НЕ ПУСТАЯ - есть', pendingInvites.length, 'pending приглашений');
      console.log('========== ✅ checkAndDeleteEmptyTeam завершена ==========\n');
      return false;
    }
    
    // 🔥 КОМАНДА ПУСТАЯ — удаляем
    console.log('\n3️⃣ УДАЛЕНИЕ КОМАНДЫ:');
    console.log('SQL: DELETE FROM teams WHERE id =', teamId, 'RETURNING id');
    
    const { data: deleteData, error: deleteErr } = await supabase
      .from('teams')
      .delete()
      .eq('id', teamId)
      .select('id');
    
    if (deleteErr) {
      console.error('❌ Ошибка удаления:', deleteErr);
      return false;
    }
    
    console.log('✅ РЕЗУЛЬТАТ УДАЛЕНИЯ:', deleteData);
    
    if (deleteData && deleteData.length > 0) {
      console.log('✅ КОМАНДА УДАЛЕНА:', deleteData[0].id);
      console.log('========== ✅ checkAndDeleteEmptyTeam завершена ==========\n');
      return true;
    }
    
    console.error('❌ Команда не удалена');
    console.log('========== ✅ checkAndDeleteEmptyTeam завершена ==========\n');
    return false;
  };

  // 🔥 Новая функция: меняет статус всех pending приглашений на declined
  const markInvitesAsDeclined = async (teamId: string) => {
    if (!teamId) return;
    
    console.log('\n🔄 [markInvitesAsDeclined] Меняем статус pending приглашений на declined...');
    console.log('SQL: UPDATE team_invitations SET status = declined WHERE team_id =', teamId, 'AND status = pending');
    
    const { data: updated, error } = await supabase
      .from('team_invitations')
      .update({ status: 'declined' })
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .select('id, invited_user_id');
    
    if (error) {
      console.error('❌ [markInvitesAsDeclined] Ошибка обновления статуса:', error);
      return;
    }
    
    console.log('✅ [markInvitesAsDeclined] Обновлено приглашений:', updated?.length || 0);
    
    if (updated && updated.length > 0) {
      // Уведомляем пользователей
      for (const invite of updated) {
        console.log(' [markInvitesAsDeclined] Отправка уведомления пользователю:', invite.invited_user_id);
        await supabase.from('notifications').insert({
          user_id: invite.invited_user_id,
          type: 'team_invite_expired',
          title: 'Приглашение истекло',
          message: 'Срок принятия приглашения в команду истёк. Вы можете принять участие в следующем хакатоне!',
          created_at: new Date().toISOString()
        });
      }
      
      // Обновляем стейт
      setPendingInvites([]);
      
      // 🔥 ПРОВЕРКА: не стала ли команда пустой
      console.log('🔍 [markInvitesAsDeclined] Проверяю, не стала ли команда пустой...');
      const wasDeleted = await checkAndDeleteEmptyTeam(teamId);
      
      if (wasDeleted) {
        console.log('✅ [markInvitesAsDeclined] Команда удалена, очищаю стейт...');
        setTeam(null);
        setMembers([]);
        setPendingInvites([]);
      }
    }
  };

  const loadData = async () => {
  if (!user?.id) {
    console.log('⏳ user.id ещё не загружен');
    setLoading(false);
    return;
  }
  
  setLoading(true);
  console.log('🔄 Загрузка данных команды для user.id:', user.id);
  
  // 🔥 Загружаем конфиг регистрации
  let configRegistrationEnd = null;
  try {
    console.log('📋 Загрузка конфига регистрации:');
    console.log('SQL: SELECT registration_end FROM hackathon_config');
    const { data: config } = await supabase
      .from('hackathon_config')
      .select('registration_end')
      .single();
    
    if (config?.registration_end) {
      setRegistrationEnd(config.registration_end);
      configRegistrationEnd = config.registration_end;  // ✅ Сохраняем в переменную
      console.log('✅ registration_end:', config.registration_end);
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки конфига:', err);
  }
  
  // 🔥 Загружаем актуальные данные профиля текущего пользователя
  try {
    console.log('📋 Загрузка профиля пользователя:');
    console.log('SQL: SELECT avatar_url, avatar_status FROM profiles WHERE id =', user.id);
    const { data: profileData } = await supabase
      .from('profiles')
      .select('avatar_url, avatar_status')
      .eq('id', user.id)
      .single();
    
    if (profileData) {
      console.log('✅ Профиль:', profileData);
      // 🔥 Обновляем user объект актуальными данными
      user.avatarUrl = profileData.avatar_url;
      user.avatarStatus = profileData.avatar_status;
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки профиля:', err);
  }
  
  // 🔥 Сначала загружаем команду
  const teamData = await fetchTeamData();
  
  // 🔥 Потом загружаем входящие приглашения
  await fetchIncomingInvites();
  
  // 🔥 ЕСЛИ РЕГИСТРАЦИЯ ЗАКРЫТА — меняем pending на declined ПЕРЕД проверкой
  if (teamData && configRegistrationEnd) {
    const now = new Date();
    const end = new Date(configRegistrationEnd);
    const isRegistrationClosed = now > end;
    
    console.log('🕐 Текущее время:', now);
    console.log('📅 Конец регистрации:', end);
    console.log('🔒 registrationClosed (синхронно):', isRegistrationClosed);
    
    if (isRegistrationClosed) {
      console.log('🔄 Регистрация закрыта, меняю pending → declined...');
      await markInvitesAsDeclined(teamData.id);
    }
  }
  
  // 🔥 И ТОЛЬКО ПОСЛЕ этого проверяем пустоту команды (если капитан)
  if (teamData && teamData.captain_id === user.id) {
    console.log('\n🔍 [loadData] ПРОВЕРКА ПУСТОТЫ КОМАНДЫ ПОСЛЕ ЗАГРУЗКИ ВСЕХ ДАННЫХ...');
    console.log(' teamData.id:', teamData.id);
    console.log(' teamData.captain_id:', teamData.captain_id);
    console.log(' user.id:', user.id);
    console.log('📋 isCaptain:', teamData.captain_id === user.id);
    
    const wasDeleted = await checkAndDeleteEmptyTeam(teamData.id);
    if (wasDeleted) {
      console.log('✅ [loadData] Команда удалена, очищаю стейт...');
      setTeam(null);
      setMembers([]);
      setPendingInvites([]);
    } else {
      console.log('ℹ️ [loadData] Команда НЕ удалена');
    }
  }
  
  setLoading(false);
  console.log('✅ Данные загружены');
  
  // 🔥 Обновляем стейт registrationClosed для UI
  if (configRegistrationEnd) {
    const now = new Date();
    const end = new Date(configRegistrationEnd);
    setRegistrationClosed(now > end);
  }
};

  const fetchTeamData = async () => {
    if (!user?.id) return null;
    
    console.log('🔍 Поиск команды для пользователя:', user.id);
    
    // 🔥 Убрали фильтр is_deleted — такого поля нет в БД
    console.log('SQL: SELECT * FROM teams WHERE captain_id =', user.id);
    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('captain_id', user.id)
      .maybeSingle();
    
    if (teamData) {
      console.log('✅ Найдена команда как капитан:', teamData.id);
      setTeam(teamData);
      setNewTeamName(teamData.name);
      await fetchMembersAndInvites(teamData.id);
      return teamData; // 🔥 Возвращаем данные
    }
    
    console.log('SQL: SELECT team_id FROM team_members WHERE user_id =', user.id);
    const { data: membership } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (membership?.team_id) {
      console.log('✅ Найдено членство в команде:', membership.team_id);
      console.log('SQL: SELECT * FROM teams WHERE id =', membership.team_id);
      const { data: joinedTeam } = await supabase
        .from('teams')
        .select('*')
        .eq('id', membership.team_id)
        .maybeSingle();
      
      if (joinedTeam) {
        setTeam(joinedTeam);
        setNewTeamName(joinedTeam.name);
        await fetchMembersAndInvites(joinedTeam.id);
        return joinedTeam; // 🔥 Возвращаем данные
      }
    } else {
      console.log('❌ Команда не найдена');
    }
    
    return null;
  };

  const fetchMembersAndInvites = async (teamId: string) => {
    await Promise.all([
      fetchMembers(teamId),
      fetchPendingInvites(teamId)
    ]);
  };

  const fetchMembers = async (teamId: string) => {
    console.log('🔍 Загрузка участников команды:', teamId);
    console.log('SQL: SELECT id, role, user_id, profiles.* FROM team_members WHERE team_id =', teamId);
    
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        id, role, user_id,
        profiles:profiles (
          id, full_name, group_name, unique_code, avatar_url, avatar_status, phone
        )
      `)
      .eq('team_id', teamId);
    
    if (error) {
      console.error('❌ Ошибка загрузки участников:', error);
      setMembers([]);
      setCaptainInfo(null);
      return;
    }
    
    console.log('✅ Участники:', data);
    
    const captain = data?.find(m => m.role === 'captain');
    const membersList = data?.filter(m => m.role === 'member') || [];
    
    setMembers(membersList.map(m => ({
      id: m.id,
      role: m.role,
      userId: m.user_id,
      fullName: m.profiles?.full_name,
      groupName: m.profiles?.group_name,
      uniqueCode: m.profiles?.unique_code,
      avatarUrl: m.profiles?.avatar_status === 'approved' ? m.profiles?.avatar_url : null,
      avatarStatus: m.profiles?.avatar_status,
      phone: m.profiles?.phone,
    })));
    
    if (captain && captain.user_id !== user.id) {
      setCaptainInfo({
        id: captain.user_id,
        fullName: captain.profiles?.full_name,
        groupName: captain.profiles?.group_name,
        phone: captain.profiles?.phone,
        avatarUrl: captain.profiles?.avatar_status === 'approved' ? captain.profiles?.avatar_url : null,
        avatarStatus: captain.profiles?.avatar_status,
      });
    } else if (captain?.user_id === user.id) {
      setCaptainInfo(null);
    }
  };

  const fetchPendingInvites = async (teamId: string) => {
    console.log(' Загрузка pending invites для команды:', teamId);
    console.log('SQL: SELECT id, invited_user_id, invited_by, status, profiles.* FROM team_invitations WHERE team_id =', teamId, 'AND status = pending');
    
    const { data, error } = await supabase
      .from('team_invitations')
      .select(`
        id, invited_user_id, invited_by, status,
        profiles:profiles!team_invitations_invited_user_id_fkey (
          full_name, avatar_url, avatar_status, phone
        )
      `)
      .eq('team_id', teamId)
      .eq('status', 'pending');
    
    if (error) {
      console.error('❌ Ошибка загрузки приглашений:', error);
      setPendingInvites([]);
      return;
    }
    
    console.log('✅ Pending invites:', data);
    
    setPendingInvites(data?.map(inv => ({
      id: inv.id,
      invited_user_id: inv.invited_user_id,
      invited_by: inv.invited_by,
      invitedName: inv.profiles?.full_name || 'Неизвестно',
      invitedAvatar: inv.profiles?.avatar_status === 'approved' ? inv.profiles?.avatar_url : null,
      invitedPhone: inv.profiles?.phone,
    })) || []);
  };

  const fetchIncomingInvites = async () => {
    console.log('🔍 Загрузка входящих приглашений для пользователя:', user.id);
    console.log('SQL: SELECT * FROM team_invitations WHERE invited_user_id =', user.id, 'AND status = pending');
    
    const { data, error } = await supabase
      .from('team_invitations')
      .select('*')
      .eq('invited_user_id', user.id)
      .eq('status', 'pending');
    
    if (error || !data?.length) {
      setIncomingInvites([]);
      return;
    }
    
    const teamIds = data.map(d => d.team_id);
    console.log('SQL: SELECT id, name, captain_id FROM teams WHERE id IN', teamIds);
    const { data: teams } = await supabase.from('teams').select('id, name, captain_id').in('id', teamIds);
    
    const captainIds = teams?.map(t => t.captain_id) || [];
    console.log('SQL: SELECT id, full_name FROM profiles WHERE id IN', captainIds);
    const { data: captains } = await supabase.from('profiles').select('id, full_name').in('id', captainIds);
    
    const details = data.map(inv => {
      const team = teams?.find(t => t.id === inv.team_id);
      const captain = captains?.find(c => c.id === team?.captain_id);
      return {
        ...inv,
        teamName: team?.name || 'Команда',
        captainName: captain?.full_name || 'Капитан',
      };
    });
    
    setIncomingInvites(details);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(user.uniqueCode.replace(/\s/g, ''));
    setSuccess('Код скопирован!');
    setTimeout(() => setSuccess(null), 2000);
  };

  const handleInvite = async () => {
    setError(null);
    setSuccess(null);
    
    // 🔥 Проверка: регистрация закрыта?
    if (registrationClosed) {
      return setError('❌ Регистрация закрыта. Приглашения больше недоступны.');
    }
    
    const code = inviteCode.replace(/\s/g, '').toUpperCase();
    if (!isValidUniqueCode(code)) return setError('Код должен содержать 6 символов (A-Z, 0-9)');
    if (code === user.uniqueCode.replace(/\s/g, '')) return setError('Нельзя пригласить самого себя');
    
    console.log('SQL: SELECT * FROM profiles WHERE unique_code =', code);
    const { data: targetUser } = await supabase.from('profiles').select('*').eq('unique_code', code).maybeSingle();
    if (!targetUser) return setError('Пользователь с таким кодом не найден');
    
    let currentTeamId = team?.id;
    let currentTeamName = team?.name;
    
    if (!currentTeamId) {
      console.log('📋 Создание новой команды:');
      console.log('SQL: INSERT INTO teams (name, captain_id, rename_deadline) VALUES (...)');
      const { data: newTeam, error: teamErr } = await supabase
        .from('teams')
        .insert({ name: `Команда #${Math.floor(Math.random() * 900) + 100}`, captain_id: user.id, rename_deadline: HACKATHON_CONFIG.renameDeadline })
        .select()
        .single();
      
      if (teamErr) return setError('Ошибка создания команды');
      
      console.log('SQL: INSERT INTO team_members (team_id, user_id, role) VALUES (...)');
      await supabase.from('team_members').insert({ team_id: newTeam.id, user_id: user.id, role: 'captain' });
      
      currentTeamId = newTeam.id;
      currentTeamName = newTeam.name;
      setTeam(newTeam);
      setNewTeamName(newTeam.name);
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('SQL: SELECT id FROM team_members WHERE team_id =', currentTeamId, 'AND user_id =', targetUser.id);
    const { data: existingMember } = await supabase
      .from('team_members')
      .select('id')
      .eq('team_id', currentTeamId)
      .eq('user_id', targetUser.id)
      .maybeSingle();
    
    if (existingMember) return setError('Этот пользователь уже в вашей команде');
    
    console.log('SQL: SELECT id, status FROM team_invitations WHERE team_id =', currentTeamId, 'AND invited_user_id =', targetUser.id);
    const { data: existingInvite } = await supabase
      .from('team_invitations')
      .select('id, status')
      .eq('team_id', currentTeamId)
      .eq('invited_user_id', targetUser.id)
      .maybeSingle();
    
    if (existingInvite) {
      if (existingInvite.status === 'pending') {
        return setError('Приглашение уже отправлено и ожидает ответа');
      }
      
      console.log('SQL: UPDATE team_invitations SET status = pending WHERE id =', existingInvite.id);
      const { error: updateErr } = await supabase
        .from('team_invitations')
        .update({ status: 'pending', created_at: new Date().toISOString() })
        .eq('id', existingInvite.id);
      
      if (updateErr) return setError('Ошибка обновления приглашения: ' + updateErr.message);
    } else {
      console.log('SQL: INSERT INTO team_invitations (team_id, invited_user_id, invited_by, status) VALUES (...)');
      const { data: insertData, error: insertErr } = await supabase
        .from('team_invitations')
        .insert({
          team_id: currentTeamId, invited_user_id: targetUser.id, invited_by: user.id, status: 'pending'
        })
        .select()
        .single();
      
      if (insertErr) return setError('Ошибка отправки: ' + insertErr.message);
      
      console.log('✅ Приглашение создано в БД:', insertData);
    }
    
    console.log('SQL: INSERT INTO notifications (...)');
    await supabase.from('notifications').insert({
      user_id: targetUser.id, type: 'team_invite',
      title: 'Вас приглашают в команду',
      message: `${user.fullName} приглашает вас в команду "${currentTeamName}"`,
      created_at: new Date().toISOString()
    });
    
    //  Перезагружаем все данные команды
    await fetchMembersAndInvites(currentTeamId);
    
    setSuccess(`✅ Приглашение отправлено ${targetUser.full_name}`);
    setInviteCode('');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleAcceptInvite = async (invitationId: string) => {
    try {
      const invitation = incomingInvites.find(inv => inv.id === invitationId);
      if (!invitation) return;
      
      // 🔥 Проверка: регистрация закрыта?
      if (registrationClosed) {
        return setError('❌ Регистрация закрыта. Принятие приглашений недоступно.');
      }
      
      console.log('SQL: INSERT INTO team_members (team_id, user_id, role) VALUES (...)');
      const { error: memberErr } = await supabase.from('team_members').insert({
        team_id: invitation.team_id, user_id: user.id, role: 'member'
      });
      if (memberErr) throw new Error('Не удалось вступить в команду');
      
      console.log('SQL: UPDATE team_invitations SET status = accepted WHERE id =', invitationId);
      await supabase.from('team_invitations').update({ status: 'accepted' }).eq('id', invitationId);
      
      console.log('SQL: INSERT INTO notifications (...)');
      await supabase.from('notifications').insert({
        user_id: invitation.invited_by, type: 'team_invite_accepted',
        title: 'Участник принял приглашение',
        message: `${user.fullName} присоединился к вашей команде`,
        created_at: new Date().toISOString()
      });
      
      setIncomingInvites(prev => prev.filter(i => i.id !== invitationId));
      
      console.log('SQL: SELECT * FROM teams WHERE id =', invitation.team_id);
      const { data: joinedTeam } = await supabase.from('teams').select('*').eq('id', invitation.team_id).maybeSingle();
      if (joinedTeam) {
        setTeam(joinedTeam);
        setNewTeamName(joinedTeam.name);
        await fetchMembersAndInvites(joinedTeam.id);
      }
      
      setSuccess('✅ Вы присоединились к команде!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeclineInvite = async (invitationId: string) => {
    try {
      console.log('\n==========  handleDeclineInvite ==========');
      console.log('📋 invitationId:', invitationId);
      
      const invitation = incomingInvites.find(inv => inv.id === invitationId);
      console.log('🔍 Найдено приглашение:', invitation);
      
      if (!invitation) {
        console.error('❌ Приглашение не найдено в incomingInvites');
        return;
      }
      
      console.log('🔄 Меняем статус на declined...');
      console.log('SQL: UPDATE team_invitations SET status = declined WHERE id =', invitationId);
      
      const { error: updateErr } = await supabase
        .from('team_invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId);
      
      if (updateErr) {
        console.error('❌ Ошибка обновления статуса:', updateErr);
        throw updateErr;
      }
      
      console.log('✅ Статус успешно изменён на declined');
      
      // Уведомление капитану
      console.log('📤 Отправка уведомления капитану:', invitation.invited_by);
      console.log('SQL: INSERT INTO notifications (...)');
      
      await supabase.from('notifications').insert({
        user_id: invitation.invited_by,
        type: 'team_invite_declined',
        title: 'Участник отклонил приглашение',
        message: `${user.fullName} отклонил приглашение в команду`,
        created_at: new Date().toISOString()
      });
      
      console.log('✅ Уведомление отправлено');
      
      // Удаляем из стейта
      setIncomingInvites(prev => prev.filter(i => i.id !== invitationId));
      console.log('✅ Приглашение удалено из incomingInvites');
      
      setSuccess('Приглашение отклонено');
      setTimeout(() => setSuccess(null), 2000);
      
      console.log('\n========== ✅ handleDeclineInvite завершена ==========\n');
      
    } catch (err: any) {
      console.error('❌ Ошибка в handleDeclineInvite:', err);
      setError(err.message);
    }
  };

  const handleRemoveMember = async (memberId: string, isPending: boolean, invitedUserId?: string) => {
    try {
      console.log('🗑️ Удаление:', { memberId, isPending, invitedUserId });
      
      if (isPending) {
        // 🔥 Удаление ожидающего приглашения — меняем статус на declined
        console.log('🔄 Меняем статус приглашения на declined...');
        console.log('SQL: UPDATE team_invitations SET status = declined WHERE id =', memberId);
        const { error: updateErr } = await supabase
          .from('team_invitations')
          .update({ status: 'declined' })
          .eq('id', memberId);
        
        if (updateErr) {
          console.error('❌ Ошибка обновления статуса:', updateErr);
          throw updateErr;
        }
        console.log('✅ Статус приглашения изменён на declined');
        
        if (invitedUserId) {
          console.log('📤 Отправка уведомления об отмене:', invitedUserId);
          
          const teamName = team?.name || 'команды';
          
          console.log('SQL: INSERT INTO notifications (...)');
          const { data: notifData, error: notifErr } = await supabase
            .from('notifications')
            .insert({
              user_id: invitedUserId,
              type: 'team_invite_cancelled',
              title: 'Приглашение отменено',
              message: `Капитан отменил приглашение в команду "${teamName}"`,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (notifErr) {
            console.error('❌ Ошибка отправки уведомления:', notifErr);
          } else {
            console.log('✅ Уведомление об отмене создано:', notifData);
          }
        }
        
        // 🔥 Проверяем и удаляем пустую команду
        console.log('🔍 [handleRemoveMember] Проверяю, не стала ли команда пустой...');
        if (team?.id && isCaptain) {
          console.log('🔍 [handleRemoveMember] team.id:', team.id, 'isCaptain:', isCaptain);
          const wasDeleted = await checkAndDeleteEmptyTeam(team.id);
          console.log('[handleRemoveMember] wasDeleted:', wasDeleted);
          
          if (wasDeleted) {
            console.log('✅ [handleRemoveMember] Команда удалена, очищаю стейт...');
            setTeam(null);
            setMembers([]);
            setPendingInvites([]);
            setSuccess('Команда удалена (пустая)');
            setTimeout(() => setSuccess(null), 2000);
            return;
          }
        }
        
        if (team?.id) {
          console.log('🔄 Обновление списка приглашений...');
          await fetchPendingInvites(team.id);
        }
        
        setSuccess('Приглашение отменено');
      } else {
        // 🔥 Удаление участника из команды
        console.log('📤 Удаление участника из команды...');
        
        const memberToRemove = members.find(m => m.id === memberId);
        console.log('👤 Удаляемый участник:', memberToRemove);
        
        console.log('SQL: DELETE FROM team_members WHERE id =', memberId);
        const { error: deleteErr } = await supabase
          .from('team_members')
          .delete()
          .eq('id', memberId);
        
        if (deleteErr) {
          console.error('❌ Ошибка удаления участника:', deleteErr);
          throw deleteErr;
        }
        console.log('✅ Участник удалён из команды');
        
        if (memberToRemove?.userId) {
          console.log('📤 Отправка уведомления пользователю:', memberToRemove.userId);
          
          const teamName = team?.name || 'команды';
          
          console.log('SQL: INSERT INTO notifications (...)');
          const { data: notifData, error: notifErr } = await supabase
            .from('notifications')
            .insert({
              user_id: memberToRemove.userId,
              type: 'team_member_removed',
              title: 'Вас исключили из команды',
              message: `Капитан исключил вас из команды "${teamName}"`,
              created_at: new Date().toISOString()
            })
            .select()
            .single();
          
          if (notifErr) {
            console.error('❌ Ошибка отправки уведомления:', notifErr);
          } else {
            console.log('✅ Уведомление об исключении создано:', notifData);
          }
        }
        
        // 🔥 Проверяем и удаляем пустую команду
        console.log(' [handleRemoveMember] Проверяю, не стала ли команда пустой после удаления участника...');
        if (team?.id && isCaptain) {
          console.log('🔍 [handleRemoveMember] team.id:', team.id, 'isCaptain:', isCaptain);
          const wasDeleted = await checkAndDeleteEmptyTeam(team.id);
          console.log('[handleRemoveMember] wasDeleted:', wasDeleted);
          
          if (wasDeleted) {
            console.log('✅ [handleRemoveMember] Команда удалена, очищаю стейт...');
            setTeam(null);
            setMembers([]);
            setPendingInvites([]);
            setSuccess('Команда удалена (пустая)');
            setTimeout(() => setSuccess(null), 2000);
            return;
          }
        }
        
        if (team?.id) {
          console.log(' Обновление списка участников...');
          await fetchMembers(team.id);
        }
        
        setSuccess('Участник удалён из команды');
      }
      
      setTimeout(() => setSuccess(null), 2000);
    } catch (err: any) {
      console.error('❌ Ошибка в handleRemoveMember:', err);
      setError('Ошибка: ' + err.message);
    }
  };

  // 🔥 В handleLeaveTeam - проверяем после выхода участника (не капитана)
  const handleLeaveTeam = async () => {
    if (!team) return;
    
    console.log('🚪 Выход из команды:', team.id, 'пользователь:', user.id);
    
    console.log('SQL: DELETE FROM team_members WHERE team_id =', team.id, 'AND user_id =', user.id);
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', team.id)
      .eq('user_id', user.id);
    
    if (error) {
      console.error('❌ Ошибка при выходе:', error);
      return setError('Ошибка при выходе: ' + error.message);
    }
    
    console.log('✅ Успешно покинул команду');
    
    if (!isCaptain && team?.captain_id) {
      console.log(' Отправка уведомления капитану:', team.captain_id);
      
      console.log('SQL: INSERT INTO notifications (...)');
      const { error: notifErr } = await supabase.from('notifications').insert({
        user_id: team.captain_id,
        type: 'team_member_left',
        title: 'Участник покинул команду',
        message: `${user.fullName} покинул команду "${team.name}"`,
        created_at: new Date().toISOString()
      });
      
      if (notifErr) {
        console.error('❌ Ошибка отправки уведомления капитану:', notifErr);
      } else {
        console.log('✅ Уведомление капитану отправлено');
      }
    }
    
    // 🔥 Если это НЕ капитан уходит — проверяем, не стала ли команда пустой
    if (!isCaptain && team?.id) {
      console.log(' [handleLeaveTeam] Проверяю, не стала ли команда пустой после моего выхода...');
      const wasDeleted = await checkAndDeleteEmptyTeam(team.id);
      
      if (wasDeleted) {
        console.log('✅ [handleLeaveTeam] Команда удалена после моего выхода');
      }
    }
    
    // 🔥 Если это капитан уходит — удаляем команду
    if (isCaptain && team?.id) {
      console.log('️ Капитан покинул команду, удаляем...');
      console.log('SQL: DELETE FROM teams WHERE id =', team.id);
      await supabase.from('teams').delete().eq('id', team.id);
    }
    
    setTeam(null);
    setMembers([]);
    setPendingInvites([]);
    setCaptainInfo(null);
    
    setSuccess('Вы покинули команду');
    setTimeout(() => setSuccess(null), 2000);
    
    setTimeout(() => {
      loadData();
    }, 500);
  };

  const handleRenameTeam = async () => {
    if (!team || !newTeamName.trim()) return;
    
    // 🔥 Проверка: регистрация закрыта?
    if (registrationClosed) {
      return setError('Переименование недоступно — регистрация завершена');
    }
    
    console.log('SQL: UPDATE teams SET pending_rename =', newTeamName.trim(), 'name_status = pending WHERE id =', team.id);
    const { error } = await supabase.from('teams').update({ 
      pending_rename: newTeamName.trim(), 
      name_status: 'pending' 
    }).eq('id', team.id);
    
    if (error) return setError('Ошибка');
    
    setTeam({ ...team, pending_rename: newTeamName.trim(), name_status: 'pending' });
    setRenameDialog(false);
    setSuccess('✏️ Запрос отправлен');
    setTimeout(() => setSuccess(null), 2000);
  };

  // 🔥 Переименование доступно ТОЛЬКО до конца регистрации
  const canRename = isCaptain && team && !registrationClosed;
  const deadlinePassed = team && new Date() > new Date(team.rename_deadline || HACKATHON_CONFIG.renameDeadline);
  const totalCount = members.length + (isCaptain ? 1 : captainInfo ? 1 : 0) + pendingInvites.length;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Card sx={{ background: 'linear-gradient(135deg, #9500d3, #6A0096)', mb: 3, boxShadow: '0 8px 24px rgba(149, 0, 211, 0.3)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="body2" sx={{ color: '#FFFFFF !important', opacity: 0.95, mb: 2, fontWeight: 500 }}>
            Твой код для приглашения в команду:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ bgcolor: 'white', borderRadius: 5, px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 2, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxWidth: 380 }}>
              <Typography variant="h5" fontWeight={700} sx={{ color: '#000000 !important', letterSpacing: '0.1em', fontFamily: 'monospace', flex: 1 }}>
                {user.uniqueCode || '—'}
              </Typography>
              <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(0,0,0,0.1)', mx: 1 }} />
              <IconButton size="small" onClick={handleCopyCode} sx={{ bgcolor: 'rgba(149, 0, 211, 0.1)', color: '#9500d3' }}>
                <ContentCopy fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* 🔥 Alert: Регистрация закрыта */}
      {registrationClosed && (
        <Alert severity="warning" sx={{ borderRadius: 2 }}>
          <Typography fontWeight={600}>⏳ Регистрация завершена</Typography>
          <Typography variant="body2">
            Состав команд зафиксирован. Приглашения и изменения состава больше недоступны.
          </Typography>
        </Alert>
      )}

      {!team && incomingInvites.length > 0 && (
        <Card sx={{ borderRadius: 2, border: '2px solid #9500d3' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="h6" fontWeight={600} color="#9500d3" mb={2}> Приглашения в команду:</Typography>
            {incomingInvites.map(inv => (
              <Box key={inv.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, p: 2, borderRadius: 2, bgcolor: 'rgba(149, 0, 211, 0.05)', mb: 1.5, border: '1px solid #9500d3' }}>
                <Typography variant="body1" fontWeight={600}>{inv.captainName} приглашает вас в команду "{inv.teamName}"</Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                  <Button variant="outlined" color="error" size="small" startIcon={<Close />} onClick={() => handleDeclineInvite(inv.id)}>Отклонить</Button>
                  <Button variant="contained" color="success" size="small" startIcon={<Check />} onClick={() => handleAcceptInvite(inv.id)} sx={{ bgcolor: '#4CAF50', '&:hover': { bgcolor: '#45a049' } }}>Принять</Button>
                </Box>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}

      {team ? (
        <Card sx={{ borderRadius: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h6" fontWeight={600} color="#9500d3">
                  {team.name_status === 'pending' && team.pending_rename ? `${team.name} (ожидает: ${team.pending_rename})` : team.name}
                </Typography>
                {/*  Показываем карандаш ТОЛЬКО если можно переименовать */}
                {canRename && <IconButton size="small" onClick={() => setRenameDialog(true)} sx={{ color: '#9500d3' }}><Edit fontSize="small" /></IconButton>}
                {team.name_status === 'pending' && <Chip label="На модерации" size="small" color="warning" sx={{ ml: 1 }} />}
              </Box>
              <Chip label={isCaptain ? 'Капитан' : 'Участник'} color={isCaptain ? 'primary' : 'default'} size="small" />
            </Box>
            
            <Typography variant="caption" color="text.secondary" display="block" mb={2}>
              Состав: {totalCount}/{HACKATHON_CONFIG.maxTeamSize} участников
            </Typography>
            
            {(isCaptain || captainInfo) && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(149, 0, 211, 0.08)', mb: 2 }}>
                <Avatar 
                  src={isCaptain 
                    ? (user.avatarStatus === 'approved' ? user.avatarUrl : undefined) 
                    : (captainInfo?.avatarStatus === 'approved' ? captainInfo?.avatarUrl : undefined)
                  }
                  sx={{ bgcolor: '#9500d3', width: 40, height: 40 }}
                >
                  {isCaptain ? (user.fullName?.charAt(0) || 'U') : (captainInfo?.fullName?.charAt(0) || 'C')}
                </Avatar>
                
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                      {isCaptain ? user.fullName : captainInfo?.fullName}
                    </Typography>
                    <Chip label="Капитан" size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#9500d3', color: 'white' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {isCaptain ? user.groupName : captainInfo?.groupName} • {isCaptain ? user.phone : captainInfo?.phone}
                  </Typography>
                </Box>
              </Box>
            )}
            
            {members.length > 0 && (
              <>
                <Typography variant="subtitle2" fontWeight={500} mb={1} color="success.dark">
                  ✅ Участники команды:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
                  {members.map((member) => (
                    <Box key={member.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.08)' }}>
                      <Avatar 
                        src={member.avatarStatus === 'approved' ? member.avatarUrl : undefined}
                        sx={{ bgcolor: '#4CAF50', width: 40, height: 40 }}
                      >
                        {member.fullName?.charAt(0) || 'U'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={500}>{member.fullName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.groupName} • {member.phone}
                        </Typography>
                      </Box>
                      <Chip label="Принят" size="small" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', mr: 1 }} />
                      {isCaptain && !registrationClosed && (
                        <IconButton size="small" color="error" onClick={() => handleRemoveMember(member.id, false)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Box>
              </>
            )}
            
            {/* 🔥 Показываем pending invites ТОЛЬКО если регистрация открыта */}
            {pendingInvites.length > 0 && !registrationClosed && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={500} mb={1} color="warning.dark">
                  ⏳ Ожидают подтверждения ({pendingInvites.length}):
                </Typography>
                {pendingInvites.map(inv => (
                  <Box key={inv.id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1, borderRadius: 2, bgcolor: 'rgba(255, 152, 0, 0.08)', border: '1px dashed #FF9800', mb: 1 }}>
                    <Avatar 
                      src={inv.invitedAvatar}
                      sx={{ bgcolor: '#FF9800', width: 36, height: 36 }}
                    >
                      {inv.invitedName?.charAt(0) || 'U'}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>{inv.invitedName}</Typography>
                      <Typography variant="caption" color="text.secondary">{inv.invitedPhone}</Typography>
                    </Box>
                    <Chip label="Ожидает" size="small" variant="outlined" color="warning" sx={{ height: 20, fontSize: '0.7rem', mr: 1 }} />
                    {isCaptain && (
                      <IconButton size="small" color="error" onClick={() => handleRemoveMember(inv.id, true, inv.invited_user_id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                ))}
              </>
            )}
            
            {/* 🔥 Блок приглашения только если регистрация открыта */}
            {!registrationClosed && totalCount < HACKATHON_CONFIG.maxTeamSize && isCaptain && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" fontWeight={500} mb={1} color="#9500d3">
                  Пригласить участника:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    placeholder="Код участника (например, YL4732)"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    sx={{ flex: 1 }}
                    inputProps={{ maxLength: 7, style: { textTransform: 'uppercase', letterSpacing: '0.1em' } }}
                  />
                  <Button variant="contained" size="small" onClick={handleInvite} startIcon={<PersonAdd />} sx={{ bgcolor: '#9500d3', '&:hover': { bgcolor: '#6A0096' } }}>
                    Пригласить
                  </Button>
                </Box>
              </>
            )}
            
            {!isCaptain && (
              <Button variant="outlined" color="error" size="small" onClick={handleLeaveTeam} startIcon={<LinkOff />} sx={{ mt: 2 }}>
                Покинуть команду
              </Button>
            )}
          </CardContent>
        </Card>
      ) : incomingInvites.length === 0 && (
        <Card sx={{ borderRadius: 2, textAlign: 'center', p: 3 }}>
          <Typography variant="body1" mb={2} fontWeight={500}>У вас пока нет команды.</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {registrationClosed 
              ? 'Регистрация завершена. Следите за анонсами следующего хакатона!' 
              : 'Скопируйте код выше или создайте свою команду.'}
          </Typography>
          {!registrationClosed && (
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
              <TextField size="small" placeholder="Код участника" value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} sx={{ maxWidth: 240 }} inputProps={{ maxLength: 7, style: { textTransform: 'uppercase' } }} />
              <Button variant="contained" size="small" onClick={handleInvite} startIcon={<PersonAdd />} sx={{ bgcolor: '#9500d3' }}>Создать команду</Button>
            </Box>
          )}
        </Card>
      )}

      <Dialog open={renameDialog} onClose={() => setRenameDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Переименовать команду</DialogTitle>
        <DialogContent><TextField autoFocus fullWidth label="Новое название" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} margin="dense" /></DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog(false)}>Отмена</Button>
          <Button onClick={handleRenameTeam} variant="contained" disabled={!newTeamName.trim() || deadlinePassed}>Сохранить</Button>
        </DialogActions>
      </Dialog>

      {error && <Alert severity="error" sx={{ borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ borderRadius: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
    </Box>
  );
}