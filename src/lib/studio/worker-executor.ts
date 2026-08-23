import type { WorkerTask } from "./worker-types";

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = "";
  let quoted = false;

  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    if (char === '"' && quoted && csv[i + 1] === '"') { value += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[i + 1] === "\n") i += 1;
      row.push(value);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else value += char;
  }

  if (quoted) throw new Error("Unclosed quoted CSV field.");
  row.push(value);
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function jsonToCsv(input: string): string {
  const value = JSON.parse(input);
  const rows = Array.isArray(value) ? value : [value];
  if (!rows.every((row) => row && typeof row === "object" && !Array.isArray(row))) {
    throw new Error("JSON must be an object or array of objects.");
  }
  const typedRows = rows as Array<Record<string, unknown>>;
  const headers = [...new Set(typedRows.flatMap((row) => Object.keys(row)))];
  const escape = (cell: unknown) => `"${(typeof cell === "object" && cell !== null ? JSON.stringify(cell) : String(cell ?? "")).replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...typedRows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
}

export async function executeWorkerTask(task: WorkerTask, input: string, algorithm?: AlgorithmIdentifier): Promise<string> {
  if (task === "json-to-csv") return jsonToCsv(input);
  if (task === "csv-to-json") {
    const [headers, ...rows] = parseCsv(input);
    if (!headers?.length) return "[]";
    return JSON.stringify(rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))), null, 2);
  }

  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest(algorithm ?? "SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
