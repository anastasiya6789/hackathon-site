import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';


export function validateRussianPhone(phone: string): { 
  isValid: boolean; 
  formatted: string | null;
  error?: string;
} {
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  if (!cleaned) {
    return { isValid: false, formatted: null, error: 'Введите номер телефона' };
  }
  
  let normalized = cleaned;
  
 
  if (normalized.startsWith('8') && normalized.length === 11) {
    normalized = '+7' + normalized.slice(1);
  } else if (normalized.startsWith('7') && normalized.length === 11) {
    normalized = '+' + normalized;
  }
  
 
  if (!isValidPhoneNumber(normalized, 'RU')) {
    return { 
      isValid: false, 
      formatted: null, 
      error: 'Неверный формат номера. Пример: +7 (999) 123-45-67' 
    };
  }
  
  const phoneNumber = parsePhoneNumber(normalized, 'RU');
  
  if (phoneNumber.country !== 'RU') {
    return { 
      isValid: false, 
      formatted: null, 
      error: 'Номер должен быть российским (+7)' 
    };
  }
  
  return {
    isValid: true,
    formatted: phoneNumber.formatInternational(), // "+7 (999) 123-45-67"
  };
}


export function formatPhoneInput(value: string): string {
  // Удаляем всё кроме цифр
  const digits = value.replace(/\D/g, '');
  

  if (!digits) return '';
  

  let phone = digits;
  if (phone.startsWith('7')) {
    phone = phone.slice(1);
  } else if (phone.startsWith('8')) {
    phone = phone.slice(1);
  }
  
  
  phone = phone.slice(0, 10);
  
  // Форматируем
  let result = '+7';
  
  if (phone.length > 0) {
    result += ' (' + phone.slice(0, 3);
  }
  if (phone.length >= 3) {
    result += ') ' + phone.slice(3, 6);
  }
  if (phone.length >= 6) {
    result += '-' + phone.slice(6, 8);
  }
  if (phone.length >= 8) {
    result += '-' + phone.slice(8, 10);
  }
  
  return result;
}


export function validateTelegramLink(link: string): { isValid: boolean; formatted: string | null } {
  if (!link || link.trim() === '') {
    return { isValid: true, formatted: null }; 
  }
  
  const cleaned = link.trim();
  
  if (cleaned.startsWith('https://t.me/') || cleaned.startsWith('http://t.me/')) {
    return { isValid: true, formatted: cleaned };
  }
  
  if (!cleaned.startsWith('@') && !cleaned.includes('/')) {
    return { isValid: true, formatted: `https://t.me/${cleaned}` };
  }
  
  if (cleaned.startsWith('@')) {
    return { isValid: true, formatted: `https://t.me/${cleaned.slice(1)}` };
  }
  
  return { isValid: false, formatted: null };
}