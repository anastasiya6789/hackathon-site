import { useState, useEffect } from 'react';
import { 
  Card, CardContent, Typography, Box, Chip, Button, Alert, 
  CircularProgress, Avatar, Divider 
} from '@mui/material';
import { Case, CasePriority } from '../../types';
import { supabase } from '../../services/supabase';
import type { User } from '../../types';


interface CasesTabProps {
  user: User;
}

export function CasesTab({ user }: CasesTabProps) {
  const [priorities, setPriorities] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [cases, setCases] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [caseSelectionOpen, setCaseSelectionOpen] = useState(false);
  const [caseSelectionStart, setCaseSelectionStart] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isCaptain, setIsCaptain] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [myAssignment, setMyAssignment] = useState<any>(null);
  

  const [prioritiesSaved, setPrioritiesSaved] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setCasesLoading(true);
      
      try {
        
        const { data: membership } = await supabase
          .from('team_members')
          .select('team_id, role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        const captain = membership?.role === 'captain';
        setIsCaptain(captain);
        if (captain) setTeamId(membership.team_id);
        
       
        if (captain && membership.team_id) {
          const { data: assignment } = await supabase
            .from('team_case_assignments')
            .select('*, cases(*)')
            .eq('team_id', membership.team_id)
            .maybeSingle();
          
          if (assignment) {
            setMyAssignment(assignment);
            setSubmitted(true);
          }
        }
        
       
        const { data: config } = await supabase
          .from('hackathon_config')
          .select('case_selection_start')
          .single();
        
        const now = new Date();
        const selectionStart = config?.case_selection_start ? new Date(config.case_selection_start) : null;
        setCaseSelectionOpen(selectionStart ? now >= selectionStart : false);
        setCaseSelectionStart(config?.case_selection_start || null);
        
      
        const { data: casesData } = await supabase
          .from('cases')
          .select('*')
          .not('published_at', 'is', null)
          .lte('published_at', now.toISOString())
          .order('created_at');
        
        setCases(casesData || []);
        
       
        if (captain && membership.team_id && !myAssignment) {
          const { data: savedPriorities } = await supabase
            .from('team_case_priorities')
            .select('case_id, priority')
            .eq('team_id', membership.team_id);
          
          const priorityMap: Record<string, number> = {};
          savedPriorities?.forEach(p => { priorityMap[p.case_id] = p.priority; });
          setPriorities(priorityMap);
          setPrioritiesSaved(Object.keys(priorityMap).length > 0);
        }
        
      } catch (err: any) {
        setError('Не удалось загрузить данные');
      } finally {
        setCasesLoading(false);
      }
    };
    
    loadData();
  }, [user.id]);

  
  const handlePriorityChange = (caseId: string, priority: number) => {
    if (!isCaptain || submitted) return;
    
    
    if (Object.keys(priorities).length >= 5 && !priorities[caseId]) {
      setError('Можно выбрать максимум 5 приоритетов');
      setTimeout(() => setError(null), 2000);
      return;
    }
    
    setPriorities(prev => {
      const newPriorities = { ...prev };
      
      
      if (newPriorities[caseId] === priority) {
        delete newPriorities[caseId];
      } else {
        
        const existingCase = Object.entries(newPriorities).find(([cid, p]) => p === priority && cid !== caseId);
        if (existingCase) {
          delete newPriorities[existingCase[0]];
        }
       
        newPriorities[caseId] = priority;
      }
      
      return newPriorities;
    });
    
    
    setPrioritiesSaved(false);
  };

  
const handleSavePriorities = async () => {
  if (!teamId) return;
  
  setSubmitting(true);
  setError(null);
  
  try {
    
    const { error: deleteError } = await supabase
      .from('team_case_priorities')
      .delete()
      .eq('team_id', teamId);
    
    if (deleteError) {
      throw deleteError;
    }
    
    
    const prioritiesArray = Object.entries(priorities).map(([caseId, priority]) => ({
      team_id: teamId,
      case_id: caseId,
      priority: Number(priority) 
    }));
    
    
    if (prioritiesArray.length > 0) {
      
      const { error: insertError } = await supabase
        .from('team_case_priorities')
        .upsert(prioritiesArray, {
          onConflict: 'team_id,case_id' 
        });
      
      if (insertError) {
        throw insertError;
      }
    }
    
    setPrioritiesSaved(true);
    setSuccess('✅ Приоритеты сохранены! Можете изменить их в любой момент до старта выбора.');
    setTimeout(() => setSuccess(null), 3000);
    
  } catch (err: any) {
    setError(err.message || 'Не удалось сохранить приоритеты');
  } finally {
    setSubmitting(false);
  }
};

const getSignedUrl = async (fileUrl: string) => {
  try {
   
    const urlParts = fileUrl.split('/storage/v1/object/public/case-files/');
    if (urlParts.length < 2) return fileUrl;
    
    const filePath = urlParts[1];
    
    
    const { data: { signedUrl }, error } = await supabase.storage
      .from('case-files')
      .createSignedUrl(filePath, 60 * 60); 
    
    if (error || !signedUrl) {
      return fileUrl;
    }
    
    return signedUrl;
  } catch (err) {
    return fileUrl;
  }
};

const renderFileLink = (fileUrl: string | null | undefined, fileName: string | null | undefined) => {
  if (!fileUrl || !fileName) {
    return null;
  }
  
  return (
    <Button 
      variant="outlined" 
      size="small" 
      onClick={() => downloadFileViaBlob(fileUrl, fileName)} 
      startIcon={<span>⬇️</span>}
      sx={{ mt: 2 }}
    >
      Скачать: {fileName}
    </Button>
  );
};

const downloadFileViaBlob = async (fileUrl: string, fileName: string) => {
  try {
    let downloadUrl = fileUrl;
    if (!fileUrl.includes('token=')) {
      downloadUrl = await getSignedUrl(fileUrl);
    }
    
    
    const response = await fetch(downloadUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const blob = await response.blob();
    
  
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName; // 🔥 Теперь download работает!
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  
    window.URL.revokeObjectURL(blobUrl);
    
  } catch (err) {
    setError('Не удалось скачать файл');
  }
};

 
  const handleSubmit = async () => {
 
  if (submitting || submitted) {
    return;
  }
  
  if (!isCaptain || !teamId) {
    setError('Только капитан может отправить выбор');
    return;
  }
    
    if (!caseSelectionOpen) {
      setError('Выбор ещё не открыт');
      return;
    }
    
    if (Object.keys(priorities).length === 0) {
      setError('Расставьте хотя бы один приоритет');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      
      await handleSavePriorities();
      
    
      const sortedPriorities = Object.entries(priorities)
        .sort((a, b) => a[1] - b[1])
        .map(([caseId]) => caseId);
      
      let assigned = false;
      let assignedCaseId: string | null = null;
      
      
      for (const caseId of sortedPriorities) {
        const { data: caseData, error: fetchError } = await supabase
          .from('cases')
          .select('slots_available, slots_total, published_at')
          .eq('id', caseId)
          .single();
        
       
        if (fetchError || !caseData || !caseData.published_at || caseData.slots_available <= 0) {
          continue;
        }
        
        const { error: updateError } = await supabase
          .from('cases')
          .update({ slots_available: caseData.slots_available - 1 })
          .eq('id', caseId)
          .eq('slots_available', caseData.slots_available);
        
        if (!updateError) {
          

const { data: assignment, error: assignError } = await supabase
  .from('team_case_assignments')
  .insert({ team_id: teamId, case_id: caseId })
  .select()
  .single();

if (assignError) {
  
  if (assignError.code === '42501') {
    throw new Error('Нет прав для назначения кейса. Проверьте RLS политики.');
  }
  continue; 
}

assigned = true;
assignedCaseId = caseId;
break;
        }
      }
      
      
      if (!assigned) {
        
        const { data: availableCases } = await supabase
          .from('cases')
          .select('id, slots_available, published_at')
          .not('published_at', 'is', null)
          .gt('slots_available', 0)
          .order('created_at'); 
        
        for (const caseItem of availableCases || []) {
          
          if (sortedPriorities.includes(caseItem.id)) continue;
          
          const { error: updateError } = await supabase
            .from('cases')
            .update({ slots_available: caseItem.slots_available - 1 })
            .eq('id', caseItem.id)
            .eq('slots_available', caseItem.slots_available);
          
          if (!updateError) {
            const { error: assignError } = await supabase
              .from('team_case_assignments')
              .insert({ team_id: teamId, case_id: caseItem.id });
            
            if (!assignError) {
              assigned = true;
              assignedCaseId = caseItem.id;
              break;
            }
          }
        }
      }
      
      if (!assigned) {
        setError('❌ К сожалению, все кейсы уже заняты другими командами');
        return;
      }
      
   
      setSubmitted(true);
      setSuccess('🎉 Ваш выбор отправлен! Кейс назначен.');
      
    
      const { data: newAssignment } = await supabase
        .from('team_case_assignments')
        .select('*, cases(*)')
        .eq('team_id', teamId)
        .maybeSingle();
      
      if (newAssignment) setMyAssignment(newAssignment);
      
    } catch (err: any) {
      setError(err.message || 'Произошла ошибка при отправке');
    } finally {
      setSubmitting(false);
    }
  };

  
  if (casesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

 
  if (submitted && myAssignment) {
    const assignedCase = myAssignment.cases;
    return (
      <Card sx={{ borderRadius: 2, border: '2px solid #4CAF50' }}>
        <CardContent sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h4" mb={2}>🎉</Typography>
          <Typography variant="h5" fontWeight={600} color="success.main" mb={2}>
            Ваш кейс назначен!
          </Typography>
          <Card variant="outlined" sx={{ mb: 3, bgcolor: 'rgba(76, 175, 80, 0.05)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600}>{assignedCase?.title}</Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                {assignedCase?.description}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={assignedCase?.difficulty === 'easy' ? 'Лёгкий' : assignedCase?.difficulty === 'medium' ? 'Средний' : 'Сложный'} 
                  size="small" 
                  color={assignedCase?.difficulty === 'easy' ? 'success' : assignedCase?.difficulty === 'medium' ? 'warning' : 'error'}
                />
                <Chip label={`Мест: ${assignedCase?.slots_available}/${assignedCase?.slots_total}`} size="small" variant="outlined" />
              </Box>
              {assignedCase?.file_url && (
  <>
    <Divider sx={{ my: 2 }} />
    {renderFileLink(assignedCase.file_url, assignedCase.file_name)}
  </>
)}
            </CardContent>
          </Card>
          <Chip label="Ожидай инструкций от организатора" color="primary" variant="outlined" />
        </CardContent>
      </Card>
    );
  }

  
  if (!cases.length) {
    return (
      <Card sx={{ borderRadius: 2, textAlign: 'center', p: 4 }}>
        <Typography variant="h4" mb={2}>🔜</Typography>
        <Typography variant="h6" mb={2}>Кейсы скоро появятся</Typography>
        <Typography color="text.secondary" mb={3}>
          Организатор опубликует кейсы в ближайшее время.<br />
          Следите за обновлениями!
        </Typography>
        <Chip label="Ожидайте публикации" variant="outlined" />
      </Card>
    );
  }

 
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}
      
      {isCaptain && !caseSelectionOpen && cases.length > 0 && !submitted && (
        <Alert severity="info" sx={{ borderRadius: 2, mt: 2 }}>
          <Typography fontWeight={600}>⏳ Кейсы опубликованы, ожидайте старта выбора</Typography>
          <Typography variant="body2">
            🔹 Расставьте приоритеты (1-5) и нажмите «Сохранить»<br/>
            🔹 Кнопка «Отправить выбор» появится{' '}
            {caseSelectionStart && new Date(caseSelectionStart).toLocaleString('ru-RU')}<br/>
            🔹 Кто первый нажал — того и кейс! ⚡
          </Typography>
        </Alert>
      )}
      
      {isCaptain && caseSelectionOpen && !submitted && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography fontWeight={600} mb={0.5}>🎯 Как работает выбор:</Typography>
          <Typography variant="body2">
            1️⃣ Расставьте приоритеты (1 = самый желаемый, максимум 5 кейсов)<br/>
            2️⃣ Нажмите «Сохранить приоритеты» (можно менять до отправки)<br/>
            3️⃣ Нажмите «🚀 Отправить выбор»
          </Typography>
        </Alert>
      )}
      
      {!isCaptain && (
        <Alert severity="info" sx={{ borderRadius: 2 }}>
          <Typography fontWeight={600}>👤 Вы участник команды</Typography>
          <Typography variant="body2">
            Приоритеты кейсов может устанавливать только <strong>капитан</strong> вашей команды.<br/>
            Попросите капитана выбрать приоритеты и отправить выбор.
          </Typography>
        </Alert>
      )}
      
      {cases.map(caseItem => {
        const isFull = caseItem.slots_available <= 0;
        const isPublished = !!caseItem.published_at;
        const myPriority = priorities[caseItem.id];
        
        if (!isPublished) return null;
        
        return (
          <Card 
            key={caseItem.id} 
            sx={{ 
              borderRadius: 2, 
              border: '1px solid rgba(0,0,0,0.08)',
              ...(myPriority && { borderColor: '#9500d3', borderWidth: 2 }),
              ...(isFull && { opacity: 0.7 })
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1, gap: 1 }}>
                <Typography variant="h6" fontWeight={600}>{caseItem.title}</Typography>
                <Chip 
                  label={isFull ? 'Занят' : `${caseItem.slots_available} мест`}
                  color={isFull ? 'error' : 'success'}
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" color="text.secondary" mb={2}>
                {caseItem.description}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                <Chip 
                  label={caseItem.difficulty === 'easy' ? '🟢 Лёгкий' : caseItem.difficulty === 'medium' ? '🟡 Средний' : '🔴 Сложный'} 
                  size="small" 
                  variant="outlined"
                />
      {caseItem.file_url && caseItem.file_name && (
  <Chip 
    icon={<span>📎</span>}
    label={caseItem.file_name}
    size="small"
    onClick={(e) => {
  e.stopPropagation();
  if (caseItem.file_url && caseItem.file_name) {
    downloadFileViaBlob(caseItem.file_url, caseItem.file_name); // 🔥 Вызываем blob-функцию
  }
}}
    clickable
    sx={{ cursor: 'pointer', maxWidth: '200px' }}
  />
)}
              </Box>
              
              {isCaptain && !submitted && !isFull && (
                <>
                  <Divider sx={{ my: 1.5 }} />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="caption" fontWeight={500}>Приоритет:</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {[1, 2, 3, 4, 5].map(num => (
                        <Button
                          key={num}
                          size="small"
                          variant={myPriority === num ? 'contained' : 'outlined'}
                          onClick={() => handlePriorityChange(caseItem.id, num)}
                          disabled={Object.keys(priorities).length >= 5 && !priorities[caseItem.id]}
                          sx={{ 
                            minWidth: 32, 
                            p: 0.5, 
                            fontSize: '0.75rem',
                            ...(myPriority === num && { bgcolor: '#9500d3', '&:hover': { bgcolor: '#6A0096' } }),
                            ...(Object.keys(priorities).length >= 5 && !priorities[caseItem.id] && { opacity: 0.5 })
                          }}
                        >
                          {num}
                        </Button>
                      ))}
                    </Box>
                    {myPriority && (
                      <Button 
                        size="small" 
                        color="error" 
                        variant="text"
                        onClick={() => handlePriorityChange(caseItem.id, myPriority)}
                        sx={{ ml: 1 }}
                      >
                        ✕
                      </Button>
                    )}
                  </Box>
                </>
              )}
              
              {!isCaptain && (
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  🔐 Приоритеты устанавливает капитан команды
                </Typography>
              )}
              
              {isFull && (
                <Typography variant="caption" color="error" display="block" mt={1}>
                  ⚠️ Места в этом кейсе закончились
                </Typography>
              )}
            </CardContent>
          </Card>
        );
      })}

      {isCaptain && !submitted && Object.keys(priorities).length > 0 && (
        <Box sx={{ display: 'flex', gap: 2, mt: 2, flexWrap: 'wrap' }}>
          
          <Button
            variant="outlined"
            size="large"
            onClick={handleSavePriorities}
            disabled={submitting || prioritiesSaved}
            sx={{ 
              bgcolor: prioritiesSaved ? '#E8F5E9' : 'transparent',
              borderColor: prioritiesSaved ? '#4CAF50' : '#9500d3',
              color: prioritiesSaved ? '#4CAF50' : '#9500d3',
              '&:hover': { 
                bgcolor: prioritiesSaved ? '#C8E6C9' : 'rgba(149, 0, 211, 0.08)' 
              },
              px: 3,
              py: 1.5
            }}
          >
            {prioritiesSaved ? '✅ Сохранено' : '💾 Сохранить приоритеты'}
          </Button>
          
          {caseSelectionOpen && (
            <Button
              variant="contained"
              size="large"
              onClick={handleSubmit}
              disabled={submitting}
              sx={{ 
                bgcolor: '#4CAF50', 
                '&:hover': { bgcolor: '#45a049' },
                px: 4,
                py: 1.5
              }}
            >
              {submitting ? <CircularProgress size={24} /> : '🚀 Отправить выбор'}
            </Button>
          )}
        </Box>
      )}
      
      {isCaptain && !submitted && Object.keys(priorities).length === 0 && (
        <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 2 }}>
          👆 Расставьте приоритеты (1-5) хотя бы одному кейсу, чтобы сохранить выбор
        </Typography>
      )}
      
      {isCaptain && !submitted && Object.keys(priorities).length === 5 && (
        <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
          ✅ Вы выбрали максимум 5 приоритетов
        </Typography>
      )}
      
    </Box>
  );
}