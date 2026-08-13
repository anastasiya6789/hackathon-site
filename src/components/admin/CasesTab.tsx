import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Chip, Button, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, 
  CircularProgress
} from '@mui/material';
import { CloudUpload, Schedule, PlayArrow, Edit, Delete } from '@mui/icons-material';
import { supabase } from '../../services/supabase';

interface CasesTabProps {
  caseSelectionStart: string;
  setError: (error: string | null) => void;
  setSuccess: (success: string | null) => void;
}

export function CasesTab({ caseSelectionStart, setError, setSuccess }: CasesTabProps) {
  
  // 🔹 Локальные state
  const [cases, setCases] = useState<any[]>([]);
  const [casesLoading, setCasesLoading] = useState(true);
  const [casePublishTime, setCasePublishTime] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // 🔥 slots теперь string, чтобы можно было стирать
  const [newCase, setNewCase] = useState({ 
    title: '', description: '', difficulty: 'medium' as 'easy' | 'medium' | 'hard', slots: '1', file: null as File | null 
  });
  const [editingCase, setEditingCase] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState({ title: '', description: '', difficulty: 'medium' as 'easy' | 'medium' | 'hard', slots: '1', file: null as File | null });

  // 🔹 Загрузка кейсов
  useEffect(() => {
    const fetchCases = async () => {
      setCasesLoading(true);
      try {
        const { data } = await supabase
          .from('cases')
          .select('*')
          .order('created_at', { ascending: false });
        setCases(data || []);
      } catch (err: any) {
        console.error(' Ошибка загрузки кейсов:', err);
        setError('Не удалось загрузить кейсы');
      } finally {
        setCasesLoading(false);
      }
    };
    fetchCases();
  }, [setError]);

  // 🔹 Скачивание файла
  const downloadFileViaBlob = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('❌ Ошибка скачивания:', err);
      setError('Не удалось скачать файл');
    }
  };

  // 🔹 Создание кейса
  const handleCreateCase = async () => {
    if (!newCase.title) return setError('Введите название кейса');
    setUploading(true);
    try {
      let fileUrl = null, fileName = null, fileType = null;
      if (newCase.file) {
        const fileExt = newCase.file.name.split('.').pop();
        const path = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('case-files').upload(path, newCase.file);
        if (uploadError) throw uploadError;
        const { data: { signedUrl }, error: urlError } = await supabase.storage.from('case-files').createSignedUrl(path, 60 * 60 * 24 * 365);
        if (urlError || !signedUrl) throw new Error('Не удалось получить ссылку на файл');
        fileUrl = signedUrl;
        fileName = newCase.file.name;
        fileType = fileExt;
      }
      // 🔥 Парсим slots при отправке в БД
      const { error } = await supabase.from('cases').insert({
        title: newCase.title, description: newCase.description, difficulty: newCase.difficulty,
        slots_total: parseInt(newCase.slots) || 1, slots_available: parseInt(newCase.slots) || 1,
        file_url: fileUrl, file_name: fileName, file_type: fileType
      });
      if (error) throw error;
      setNewCase({ title: '', description: '', difficulty: 'medium', slots: '1', file: null });
      setSuccess('Кейс создан');
      const { data } = await supabase.from('cases').select('*').order('created_at', { ascending: false });
      setCases(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // 🔹 Публикация кейсов
  const handlePublishCases = async (immediate: boolean) => {
    setPublishing(true);
    try {
      const publishTime = immediate ? new Date().toISOString() : casePublishTime;
      if (!publishTime) { setError('Укажите дату публикации'); return; }
      const { error } = await supabase.from('cases').update({ published_at: publishTime }).is('published_at', null);
      if (error) throw error;
      setSuccess(`Кейсы будут опубликованы ${immediate ? 'сейчас' : new Date(publishTime).toLocaleString('ru-RU')}`);
      setTimeout(() => setSuccess(null), 3000);
      const { data } = await supabase.from('cases').select('*').order('created_at', { ascending: false });
      setCases(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  // 🔹 Удаление кейса
  const handleDeleteCase = async (caseId: string) => {
    if (!confirm('Удалить этот кейс?')) return;
    try {
      const { data: caseData } = await supabase.from('cases').select('file_url').eq('id', caseId).single();
      if (caseData?.file_url) {
        const fileName = caseData.file_url.split('/').pop();
        if (fileName) await supabase.storage.from('case-files').remove([fileName]);
      }
      const { error } = await supabase.from('cases').delete().eq('id', caseId);
      if (error) throw error;
      setSuccess('Кейс удалён');
      const { data } = await supabase.from('cases').select('*').order('created_at', { ascending: false });
      setCases(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  // 🔹 Редактирование
  const handleEditCase = (caseItem: any) => {
    setEditingCase(caseItem);
    // 🔥 Преобразуем number в string для editData
    setEditData({ 
      title: caseItem.title, 
      description: caseItem.description || '', 
      difficulty: caseItem.difficulty || 'medium', 
      slots: String(caseItem.slots_total || 1), 
      file: null 
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCase || !editData.title) { setError('Введите название кейса'); return; }
    setUploading(true);
    try {
      let fileUrl = editingCase.file_url, fileName = editingCase.file_name, fileType = editingCase.file_type;
      if (editData.file) {
        if (editingCase.file_url) {
          const oldFileName = editingCase.file_url.split('/').pop();
          if (oldFileName) await supabase.storage.from('case-files').remove([oldFileName]);
        }
        const fileExt = editData.file.name.split('.').pop();
        const path = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('case-files').upload(path, editData.file);
        if (uploadError) throw uploadError;
        const { data: { signedUrl }, error: urlError } = await supabase.storage.from('case-files').createSignedUrl(path, 60 * 60 * 24 * 365);
        if (urlError || !signedUrl) throw new Error('Не удалось получить ссылку на файл');
        fileUrl = signedUrl; fileName = editData.file.name; fileType = fileExt;
      }
      // 🔥 Парсим slots при отправке в БД
      const { error } = await supabase.from('cases').update({
        title: editData.title, description: editData.description, difficulty: editData.difficulty,
        slots_total: parseInt(editData.slots) || 1, slots_available: parseInt(editData.slots) || 1,
        file_url: fileUrl, file_name: fileName, file_type: fileType
      }).eq('id', editingCase.id);
      if (error) throw error;
      setSuccess('✅ Кейс обновлён');
      setTimeout(() => setSuccess(null), 3000);
      const { data } = await supabase.from('cases').select('*').order('created_at', { ascending: false });
      setCases(data || []);
      setEditDialogOpen(false); setEditingCase(null);
    } catch (err: any) {
      setError(err.message || 'Не удалось обновить кейс');
    } finally {
      setUploading(false);
    }
  };

  const renderCaseForm = () => (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
<Typography variant="h6" fontWeight={600} mb={2}>➕ Добавить кейс</Typography>      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField placeholder="Название кейса *" value={newCase.title} onChange={(e) => setNewCase(prev => ({ ...prev, title: e.target.value }))} required />
        <TextField placeholder="Описание" multiline rows={3} value={newCase.description} onChange={(e) => setNewCase(prev => ({ ...prev, description: e.target.value }))} />
        <FormControl fullWidth>
          <InputLabel>Сложность</InputLabel>
          <Select value={newCase.difficulty} label="Сложность" onChange={(e) => setNewCase(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}>
            <MenuItem value="easy">🟢 Лёгкий</MenuItem><MenuItem value="medium">🟡 Средний</MenuItem><MenuItem value="hard">🔴 Сложный</MenuItem>
          </Select>
        </FormControl>
        {/* 🔥 Теперь slots — string, onChange просто сохраняет значение */}
        <TextField 
          type="number" 
          placeholder="Количество мест *" 
          value={newCase.slots} 
          onChange={(e) => setNewCase(prev => ({ ...prev, slots: e.target.value }))} 
          InputProps={{ inputProps: { min: 1 }}} 
          required 
        />
        <Button variant="outlined" component="label" startIcon={<CloudUpload />} sx={{ justifyContent: 'flex-start' }}>
          Загрузить файл (необязательно)
          <input type="file" hidden accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg" onChange={(e) => setNewCase(prev => ({ ...prev, file: e.target.files?.[0] || null }))} />
        </Button>
        {newCase.file && <Typography variant="caption" color="text.secondary">{newCase.file.name} ({Math.round(newCase.file.size / 1024)} KB)</Typography>}
        <Button variant="contained" onClick={handleCreateCase} disabled={uploading || !newCase.title} sx={{ alignSelf: 'flex-start' }}>
          {uploading ? <CircularProgress size={20} /> : 'Создать кейс'}
        </Button>
      </Box>
    </Paper>
  );

  const renderCasesList = () => (
    <Paper sx={{ p: 3, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" fontWeight={600}>📦 Кейсы ({cases.length})</Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Дата публикации" type="datetime-local" value={casePublishTime} onChange={(e) => setCasePublishTime(e.target.value)} sx={{ maxWidth: 220 }} />
          <Button variant="outlined" size="small" startIcon={<Schedule />} onClick={() => handlePublishCases(false)} disabled={publishing || !caseSelectionStart}>По расписанию</Button>
          <Button variant="contained" size="small" startIcon={<PlayArrow />} onClick={() => handlePublishCases(true)} disabled={publishing}>{publishing ? <CircularProgress size={20} /> : 'Опубликовать сейчас'}</Button>
        </Box>
      </Box>
      {casesLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box> : cases.length === 0 ? <Typography color="text.secondary" textAlign="center" py={3}>Кейсы ещё не созданы</Typography> : (
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow><TableCell><strong>Название</strong></TableCell><TableCell><strong>Сложность</strong></TableCell><TableCell><strong>Места</strong></TableCell><TableCell><strong>Файл</strong></TableCell><TableCell><strong>Статус</strong></TableCell><TableCell align="right"><strong>Действия</strong></TableCell></TableRow></TableHead>
            <TableBody>
              {cases.map(caseItem => (
                <TableRow key={caseItem.id}>
                  <TableCell><Box><Typography fontWeight={500}>{caseItem.title}</Typography>{caseItem.description && <Typography variant="caption" color="text.secondary" display="block">{caseItem.description.slice(0, 50)}{caseItem.description.length > 50 ? '...' : ''}</Typography>}</Box></TableCell>
                  <TableCell><Chip label={caseItem.difficulty === 'easy' ? 'Лёгкий' : caseItem.difficulty === 'medium' ? 'Средний' : 'Сложный'} size="small" color={caseItem.difficulty === 'easy' ? 'success' : caseItem.difficulty === 'medium' ? 'warning' : 'error'} variant="outlined" /></TableCell>
                  <TableCell><Chip label={`${caseItem.slots_available}/${caseItem.slots_total}`} size="small" color={caseItem.slots_available > 0 ? 'success' : 'error'} variant={caseItem.slots_available > 0 ? 'outlined' : 'filled'} /></TableCell>
                  <TableCell>{caseItem.file_name && caseItem.file_url ? <Button size="small" variant="text" onClick={(e) => { e.stopPropagation(); downloadFileViaBlob(caseItem.file_url, caseItem.file_name); }} sx={{ p: 0.5, minWidth: 'auto', textTransform: 'none', color: '#9500d3', '&:hover': { bgcolor: 'rgba(149, 0, 211, 0.08)' } }}>{caseItem.file_name.slice(0, 20)}{caseItem.file_name.length > 20 ? '...' : ''}</Button> : '—'}</TableCell>
                  <TableCell><Chip label={caseItem.published_at ? 'Опубликован' : 'Черновик'} size="small" color={caseItem.published_at ? 'success' : 'default'} variant="outlined" /></TableCell>
                  <TableCell align="right"><Box sx={{ display: 'flex' }}><IconButton size="small" color="primary" onClick={() => handleEditCase(caseItem)}><Edit fontSize="small" /></IconButton><IconButton size="small" color="error" onClick={() => handleDeleteCase(caseItem.id)}><Delete fontSize="small" /></IconButton></Box></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {renderCaseForm()}
      {renderCasesList()}
      
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>✏️ Редактировать кейс</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Название кейса *" value={editData.title} onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))} fullWidth required />
            <TextField label="Описание" value={editData.description} onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))} fullWidth multiline rows={3} />
            <FormControl fullWidth>
              <InputLabel>Сложность</InputLabel>
              <Select value={editData.difficulty} label="Сложность" onChange={(e) => setEditData(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}>
                <MenuItem value="easy">🟢 Лёгкий</MenuItem><MenuItem value="medium">🟡 Средний</MenuItem><MenuItem value="hard">🔴 Сложный</MenuItem>
              </Select>
            </FormControl>
            {/* 🔥 Теперь slots — string, onChange просто сохраняет значение */}
            <TextField 
              label="Количество мест *"
              type="number"
              value={editData.slots}
              onChange={(e) => setEditData(prev => ({ ...prev, slots: e.target.value }))}
              fullWidth
              InputProps={{ inputProps: { min: 1 }}}
              required
            />
            <Button variant="outlined" component="label" startIcon={<CloudUpload />} sx={{ justifyContent: 'flex-start' }}>
              {editData.file ? '📁 ' + editData.file.name : '📁 Загрузить новый файл (необязательно)'}
              <input type="file" hidden accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp,.bmp,.svg" onChange={(e) => setEditData(prev => ({ ...prev, file: e.target.files?.[0] || null }))} />
            </Button>
            {editingCase?.file_name && !editData.file && <Typography variant="caption" color="text.secondary">📎 Текущий файл: {editingCase.file_name}</Typography>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
          <Button onClick={handleSaveEdit} variant="contained" disabled={uploading || !editData.title}>{uploading ? <CircularProgress size={20} /> : '💾 Сохранить'}</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}