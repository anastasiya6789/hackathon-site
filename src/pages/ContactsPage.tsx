import { Box, Card, CardContent, Typography, Divider, Button, Link } from '@mui/material';
import { Telegram, School, Support } from '@mui/icons-material';
import { ITTopLogo } from '../components/ui/ITTopLogo';

export function ContactsPage() {
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#F8F9FA',
      p: 2 
    }}>
      <Box sx={{ maxWidth: 700, mx: 'auto' }}>
        
        {/* 🔹 Заголовок */}
        <Box sx={{ textAlign: 'center', mb: 4, pt: 3 }}>
          <ITTopLogo size="large" variant="color" />
          <Typography variant="h4" fontWeight={700} color="primary" mt={2} mb={1}>
             Контакты
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Мы всегда на связи!
          </Typography>
        </Box>

        {/*  Официальные каналы — 2 карточки по центру */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3, flexWrap: 'wrap' }}>
          {/* Telegram */}
          <Card 
            sx={{ 
              width: 280,
              textAlign: 'center', 
              p: 3,
              boxShadow: '0 4px 16px rgba(149, 0, 211, 0.1)',
              '&:hover': { boxShadow: '0 8px 24px rgba(149, 0, 211, 0.15)' }
            }}
          >
            <Telegram sx={{ fontSize: 48, color: '#0088cc', mb: 2 }} />
            <Typography variant="h6" fontWeight={600} mb={1}>
              Telegram-канал
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Новости и обновления
            </Typography>
            <Link 
              href="https://t.me/hackaton_it_top" 
              target="_blank" 
              rel="noopener"
              sx={{ 
                color: '#0088cc', 
                fontWeight: 500,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              @hackaton_it_top
            </Link>
          </Card>

          {/* ВКонтакте */}
          <Card 
            sx={{ 
              width: 280,
              textAlign: 'center', 
              p: 3,
              boxShadow: '0 4px 16px rgba(149, 0, 211, 0.1)',
              '&:hover': { boxShadow: '0 8px 24px rgba(149, 0, 211, 0.15)' }
            }}
          >
            <School sx={{ fontSize: 48, color: '#0077FF', mb: 2 }} />
            <Typography variant="h6" fontWeight={600} mb={1}>
              ВКонтакте
            </Typography>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Наше сообщество
            </Typography>
            <Link 
              href="https://vk.ru/hackaton_it_top" 
              target="_blank" 
              rel="noopener"
              sx={{ 
                color: '#0077FF', 
                fontWeight: 500,
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' }
              }}
            >
              vk.ru/hackaton_it_top
            </Link>
          </Card>
        </Box>

        {/* 🔹 Техническая поддержка — большая карточка */}
        <Card sx={{ boxShadow: '0 4px 16px rgba(149, 0, 211, 0.1)', mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Support color="primary" fontSize="large" />
              <Typography variant="h6" fontWeight={600}>
                Техническая поддержка
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" mb={2}>
              Пишите, если:
            </Typography>
            <Box sx={{ mb: 3, pl: 2 }}>
              {['Не приходит письмо подтверждения', 'Ошибка при регистрации / входе', 'Аккаунт заблокирован', 'Баг на сайте или предложение'].map((item, i) => (
                <Typography key={i} variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  • {item}
                </Typography>
              ))}
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle2" fontWeight={600} mb={2} mt={2}>
              👨‍ Администратор:
            </Typography>
            
            {/* Контакты админа — 2 карточки */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Card 
                sx={{ 
                  width: 160,
                  textAlign: 'center', 
                  p: 2,
                  bgcolor: '#f5f5f5',
                  '&:hover': { bgcolor: '#eeeeee' }
                }}
              >
                <Telegram sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" mb={0.5}>
                  Telegram
                </Typography>
                <Link 
                  href="https://t.me/anst_siya"
                  target="_blank"
                  rel="noopener"
                  sx={{ 
                    fontWeight: 600, 
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  @anst_siya
                </Link>
              </Card>

              <Card 
                sx={{ 
                  width: 160,
                  textAlign: 'center', 
                  p: 2,
                  bgcolor: '#f5f5f5',
                  '&:hover': { bgcolor: '#eeeeee' }
                }}
              >
                <School sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography variant="body2" color="text.secondary" mb={0.5}>
                  ВКонтакте
                </Typography>
                <Link 
                  href="https://vk.ru/anst_siya"
                  target="_blank"
                  rel="noopener"
                  sx={{ 
                    fontWeight: 600, 
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  vk.ru/anst_siya
                </Link>
              </Card>
            </Box>
          </CardContent>
        </Card>

        {/* 🔹 Кнопка быстрой связи — по центру */}
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Button 
            variant="contained" 
            href="https://t.me/anst_siya" 
            target="_blank"
            sx={{ 
              bgcolor: '#9500d3', 
              '&:hover': { bgcolor: '#6A0096' },
              textTransform: 'none',
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              boxShadow: '0 4px 12px rgba(149, 0, 211, 0.3)'
            }}
            startIcon={<Telegram />}
          >
            Написать админу
          </Button>
        </Box>

        {/* 🔹 Время ответа */}
        <Typography variant="body2" color="text.secondary" textAlign="center" pb={2}>
          ⏱ Обычно отвечаем в течение 24 часов
        </Typography>
      </Box>
    </Box>
  );
}