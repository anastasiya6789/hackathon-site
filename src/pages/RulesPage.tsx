import { Box, Card, CardContent, Typography, List, ListItem, ListItemIcon, ListItemText, Divider } from '@mui/material';
import { CheckCircle, Warning, Support, Block } from '@mui/icons-material';
import { ITTopLogo } from '../components/ui/ITTopLogo';
import { Link } from '@mui/material';

export function RulesPage() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 2, bgcolor: '#F8F9FA' }}>
      <Card sx={{ width: '100%', maxWidth: 700, boxShadow: '0 8px 32px rgba(149, 0, 211, 0.15)' }}>
        <CardContent sx={{ p: { xs: 2, sm: 4 } }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <ITTopLogo size="large" variant="color" />
          </Box>
          
          <Typography variant="h4" fontWeight={700} color="primary" mb={3} textAlign="center">
            📋 Правила сайта
          </Typography>
          
          <Typography variant="body1" color="text.secondary" mb={3}>
            Чтобы участие в хакатоне было комфортным для всех, пожалуйста, ознакомьтесь с правилами:
          </Typography>
          
          <List sx={{ mb: 3 }}>
            <ListItem sx={{ p: 0, mb: 2 }}>
              <ListItemIcon sx={{ minWidth: 40, color: 'success.main' }}>
                <CheckCircle />
              </ListItemIcon>
              <ListItemText 
                primary="Указывайте реальные данные" 
                secondary="При регистрации заполняйте ФИО, группу и телефон честно. Это нужно для идентификации участников и формирования команд." 
              />
            </ListItem>
            
            <ListItem sx={{ p: 0, mb: 2 }}>
              <ListItemIcon sx={{ minWidth: 40, color: 'success.main' }}>
                <CheckCircle />
              </ListItemIcon>
              <ListItemText 
                primary="Фото профиля — ваше лицо" 
                secondary="Загружайте своё реальное фото или аватар. Фотографии с неприемлемым контентом будут отклонены." 
              />
            </ListItem>
            
            <ListItem sx={{ p: 0, mb: 2 }}>
              <ListItemIcon sx={{ minWidth: 40, color: 'warning.main' }}>
                <Warning />
              </ListItemIcon>
              <ListItemText 
                primary="За нарушение — бан" 
                secondary="Администратор может заблокировать аккаунт за фейковые данные, оскорбления или спам. Восстановление — только через обращение к админу." 
              />
            </ListItem>
            
            <ListItem sx={{ p: 0, mb: 2 }}>
              <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                <Support />
              </ListItemIcon>
              <ListItemText 
                primary="Вопросы по блокировке" 
                secondary="Если ваш аккаунт заблокирован, напишите администратору в личные сообщения (см. раздел «Контакты»). Укажите причину обращения." 
              />
            </ListItem>
            
            <ListItem sx={{ p: 0 }}>
              <ListItemIcon sx={{ minWidth: 40, color: 'primary.main' }}>
                <Support />
              </ListItemIcon>
              <ListItemText 
                primary="Технические вопросы" 
                secondary="Не работает регистрация? Не приходит письмо? Ошибка на сайте? Пишите администратору — поможем разобраться!" 
              />
            </ListItem>
          </List>
          
          <Divider sx={{ my: 3 }} />
          
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" mb={1}>
              <Warning fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
              Нарушение правил может привести к блокировке без предупреждения.
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" mt={2}>
              Регистрируясь, вы соглашаетесь с этими правилами.
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}