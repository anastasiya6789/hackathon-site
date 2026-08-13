/**
 * Генерирует случайный уникальный код (6 символов: буквы + цифры)
 */
export function generateUniqueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Валидирует код: 6 символов, только латинские буквы (верхний регистр) и цифры
 */
export function isValidUniqueCode(code: string): boolean {
  // 🔥 Принимаем любой 6-символьный код из A-Z и 0-9
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}

/**
 * Форматирует код для отображения (добавляет пробелы для читаемости)
 */
export function formatCode(code: string): string {
  const clean = code.replace(/\s/g, '').toUpperCase();
  // YL4732 → YL4 732
  return clean.length === 6 ? `${clean.slice(0, 3)} ${clean.slice(3)}` : clean;
}