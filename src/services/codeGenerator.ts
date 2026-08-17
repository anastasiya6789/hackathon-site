
export function generateUniqueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}


export function isValidUniqueCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/.test(code.toUpperCase());
}


export function formatCode(code: string): string {
  const clean = code.replace(/\s/g, '').toUpperCase();
  // YL4732 → YL4 732
  return clean.length === 6 ? `${clean.slice(0, 3)} ${clean.slice(3)}` : clean;
}