export const sha256Hash = async (input: { text: string }): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const md5Hash = async (input: { text: string }): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(input.text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// CodeQL (js/loop-bound-injection) flagged the loop below iterating
// `input.length` times with no upper bound - a caller could request e.g.
// 500,000,000 to force a large allocation and a long-running loop server-
// side. No legitimate use of a "random string" tool needs more than a few
// thousand characters.
const MAX_RANDOM_STRING_LENGTH = 10_000;

export const randomString = async (input: { length?: number; charset?: 'alphanumeric' | 'hex' | 'base64' }): Promise<string> => {
  const length = Math.min(Math.max(1, input.length || 16), MAX_RANDOM_STRING_LENGTH);
  const charset = input.charset || 'alphanumeric';
  const chars = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    hex: '0123456789abcdef',
    base64: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  };
  const source = chars[charset];
  let result = '';
  const randomValues = new Uint32Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += source[randomValues[i] % source.length];
  }
  return result;
};

export const passwordStrength = async (input: { password: string }): Promise<{ score: 0 | 1 | 2 | 3 | 4; feedback: string[] }> => {
  const pwd = input.password;
  let score = 0;
  const feedback: string[] = [];
  if (pwd.length >= 8) score++; else feedback.push("Password should be at least 8 characters");
  if (pwd.length >= 12) score++;
  if (/[a-z]/.test(pwd)) score++; else feedback.push("Add lowercase letters");
  if (/[A-Z]/.test(pwd)) score++; else feedback.push("Add uppercase letters");
  if (/[0-9]/.test(pwd)) score++; else feedback.push("Add numbers");
  if (/[^a-zA-Z0-9]/.test(pwd)) score++; else feedback.push("Add special characters");
  score = Math.min(score, 4);
  const labels = ["Very Weak", "Weak", "Medium", "Strong", "Very Strong"];
  return { score: score as 0|1|2|3|4, feedback };
};

export const randomNumber = async (input: { min: number; max: number }): Promise<number> => {
  const min = Math.ceil(input.min);
  const max = Math.floor(input.max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export const randomColor = async (input: { format?: 'hex' | 'rgb' }): Promise<string> => {
  const hex = () => '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
  const rgb = () => `rgb(${Math.floor(Math.random()*256)}, ${Math.floor(Math.random()*256)}, ${Math.floor(Math.random()*256)})`;
  return input.format === 'rgb' ? rgb() : hex();
};
