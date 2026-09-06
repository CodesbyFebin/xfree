export const jsonFormatter = async (input: { json: string }): Promise<string> => {
  try {
    const parsed = JSON.parse(input.json);
    return JSON.stringify(parsed, null, 2);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
};

export const jsonMinifier = async (input: { json: string }): Promise<string> => {
  try {
    const parsed = JSON.parse(input.json);
    return JSON.stringify(parsed);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
};

export const jsonValidator = async (input: { json: string }): Promise<{ valid: boolean; error?: string }> => {
  try {
    JSON.parse(input.json);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : 'Invalid JSON' };
  }
};

export const jsonToCsv = async (input: { json: string }): Promise<string> => {
  try {
    const data = JSON.parse(input.json);
    if (!Array.isArray(data) || data.length === 0) throw new Error("Input must be a non-empty array of objects");
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => (row[h] ?? '').toString().replace(/,/g, '')).join(','));
    return [headers.join(','), ...rows].join('\n');
  } catch (e) {
    throw new Error(`Conversion failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
  }
};

export const uuidGenerator = async (input: { count?: number; version?: 'v4' }): Promise<string | string[]> => {
  const count = input.count || 1;
  const version = input.version || 'v4';
  const generate = () => {
    if (version === 'v4') {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    throw new Error(`UUID v${version} not supported in local mode`);
  };
  return count === 1 ? generate() : Array.from({ length: count }, generate);
};

export const base64Encoder = async (input: { text: string }): Promise<string> => {
  try {
    return btoa(input.text);
  } catch {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(input.text);
    return btoa(String.fromCharCode(...bytes));
  }
};

export const base64Decoder = async (input: { text: string }): Promise<string> => {
  try {
    return atob(input.text);
  } catch {
    const bytes = Uint8Array.from(atob(input.text), c => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
};

export const urlEncoder = async (input: { text: string }): Promise<string> => {
  try {
    return encodeURIComponent(input.text);
  } catch {
    throw new Error('Encoding failed');
  }
};

export const urlDecoder = async (input: { text: string }): Promise<string> => {
  try {
    return decodeURIComponent(input.text);
  } catch {
    throw new Error('Decoding failed');
  }
};

export const htmlEntitiesEncoder = async (input: { text: string }): Promise<string> => {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.textContent = input.text;
    return div.innerHTML;
  }
  return input.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};
