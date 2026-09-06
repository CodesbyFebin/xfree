export const csvToJson = async (input: { csv: string }): Promise<Record<string, unknown>[]> => {
  const lines = input.csv.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  const result: Record<string, unknown>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) continue;
    const row: Record<string, unknown> = {};
    headers.forEach((h, idx) => { row[h] = values[idx]?.trim(); });
    result.push(row);
  }
  return result;
};

export const jsonToXml = async (input: { json: string }): Promise<string> => {
  try {
    const data = JSON.parse(input.json);
    const obj = Array.isArray(data) ? { root: data } : data;
    const xml = (o: Record<string, unknown>, indent = 0): string => {
      let s = '';
      for (const k in o) {
        const v = o[k];
        if (Array.isArray(v)) {
          s += ' '.repeat(indent) + `<${k}>` + '\n';
          v.forEach((item: unknown) => { s += xml(Array.isArray(item) ? { root: item } : (item as Record<string, unknown>), indent + 2); });
          s += ' '.repeat(indent) + `</${k}>` + '\n';
        } else if (v && typeof v === 'object') {
          s += ' '.repeat(indent) + `<${k}>` + '\n';
          s += xml(v as Record<string, unknown>, indent + 2);
          s += ' '.repeat(indent) + `</${k}>` + '\n';
        } else {
          s += ' '.repeat(indent) + `<${k}>${v}</${k}>` + '\n';
        }
      }
      return s;
    };
    return xml(obj);
  } catch (e) {
    throw new Error(`Invalid JSON: ${e instanceof Error ? e.message : 'Unknown'}`);
  }
};
