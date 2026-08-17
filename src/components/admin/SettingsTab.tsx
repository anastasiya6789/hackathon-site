import { useState } from 'react';
import { 
  Box, Typography, Paper, TextField, Button, CircularProgress, Alert 
} from '@mui/material';
import { Check } from '@mui/icons-material';
import { supabase } from '../../services/supabase';

interface SettingsTabProps {
  registrationStart: string;
  setRegistrationStart: React.Dispatch<React.SetStateAction<string>>;
  registrationEnd: string;
  setRegistrationEnd: React.Dispatch<React.SetStateAction<string>>;
  caseSelectionStart: string;
  setCaseSelectionStart: React.Dispatch<React.SetStateAction<string>>;
  configLoading: boolean;
  setConfigLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
}

export function SettingsTab({ 
  registrationStart, setRegistrationStart,
  registrationEnd, setRegistrationEnd,
  caseSelectionStart, setCaseSelectionStart,
  configLoading, setConfigLoading,
  setError, setSuccess
}: SettingsTabProps) {

  const handleSaveConfig = async () => {
    setConfigLoading(true);
    try {
      
      
      let { error } = await supabase.from('hackathon_config').update({
        registration_start: registrationStart || null,
        registration_end: registrationEnd || null,
        case_selection_start: caseSelectionStart || null
      }).eq('id', 1);
      
      if (error || true) {
        const { error: insertError } = await supabase.from('hackathon_config').upsert({
          id: 1,
          registration_start: registrationStart || null,
          registration_end: registrationEnd || null,
          case_selection_start: caseSelectionStart || null
        }, { onConflict: 'id' });
        
        if (insertError) throw insertError;
      }
      
      setSuccess('✅ Настройки сохранены в базу данных');
      setTimeout(() => setSuccess(null), 3000);
      
      const { data } = await supabase.from('hackathon_config').select('*').single();
      if (data) {
        setRegistrationStart(data.registration_start?.slice(0, 16) || '');
        setRegistrationEnd(data.registration_end?.slice(0, 16) || '');
        setCaseSelectionStart(data.case_selection_start?.slice(0, 16) || '');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConfigLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, borderRadius: 2 }}>
      <Typography variant="h5" fontWeight={700} mb={4}>🗓️ Настройки хакатона</Typography>
      
      {configLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, maxWidth: 600 }}>
          
          <Box sx={{ 
            p: 3, 
            borderRadius: 2, 
            bgcolor: '#F8F9FA',
            border: '1px solid rgba(0,0,0,0.08)'
          }}>
            <Typography variant="h6" fontWeight={600} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              📝 Регистрация пользователей
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              <TextField 
                placeholder="Начало"
                type="datetime-local" 
                value={registrationStart} 
                onChange={(e) => setRegistrationStart(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
              <TextField 
                placeholder="Конец"
                type="datetime-local" 
                value={registrationEnd} 
                onChange={(e) => setRegistrationEnd(e.target.value)}
                size="small"
                sx={{ flex: 1 }}
              />
            </Box>
            
            <Typography variant="caption" color="text.secondary">
              🔒 Вне этого диапазона новые пользователи не смогут зарегистрироваться
            </Typography>
          </Box>
          
          <Box sx={{ 
            p: 3, 
            borderRadius: 2, 
            bgcolor: '#E8F5E9',
            border: '1px solid rgba(76, 175, 80, 0.3)'
          }}>
            <Typography variant="h6" fontWeight={600} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🎯 Старт выбора кейсов
            </Typography>
            
            <TextField 
              placeholder="Дата и время начала"
              type="datetime-local" 
              value={caseSelectionStart} 
              onChange={(e) => setCaseSelectionStart(e.target.value)}
              size="small"
              sx={{ mb: 1.5, maxWidth: 280 }}
            />
            
            <Typography variant="body2" mb={2}>
              ⚡ В это время у капитанов появится кнопка "Отправить выбор". Все ранее сохранённые приоритеты будут использованы.
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="outlined" 
                size="small" 
                startIcon={<Check />}
                onClick={handleSaveConfig}
                disabled={configLoading}
              >
                Сохранить
              </Button>
            </Box>
          </Box>
          
          <Button 
            variant="contained" 
            size="large" 
            onClick={handleSaveConfig} 
            disabled={configLoading}
            sx={{ 
              alignSelf: 'flex-start', 
              mt: 2,
              bgcolor: '#9500d3',
              '&:hover': { bgcolor: '#6A0096' },
              px: 4,
              py: 1.5
            }}
          >
            {configLoading ? <CircularProgress size={24} /> : '💾 Сохранить настройки'}
          </Button>
        </Box>
      )}
    </Paper>
  );
}