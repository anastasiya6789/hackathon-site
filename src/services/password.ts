
export function validatePassword(password: string): { 
  isValid: boolean; 
  errors: string[] 
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Минимум 8 символов');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Хотя бы одна заглавная буква (A-Z)');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Хотя бы одна строчная буква (a-z)');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Хотя бы одна цифра (0-9)');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}


export async function hashPassword(password: string): Promise<string> {
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'hackathon-salt-2026'); 
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}


export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}