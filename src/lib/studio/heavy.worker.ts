/// <reference lib="webworker" />
import type { WorkerRequest, WorkerResponse } from "./worker-types";

const scope = self as unknown as DedicatedWorkerGlobalScope;

function parseCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], value = "", quoted = false;
  for (let i = 0; i < csv.length; i += 1) {
    const char = csv[i];
    if (char === '"' && quoted && csv[i + 1] === '"') { value += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { row.push(value); value = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && csv[i + 1] === "\n") i += 1;
      row.push(value); if (row.some(Boolean)) rows.push(row); row = []; value = "";
    } else value += char;
  }
  row.push(value); if (row.some(Boolean)) rows.push(row);
  return rows;
}

function jsonToCsv(input: string): string {
  const value = JSON.parse(input);
  const rows = Array.isArray(value) ? value : [value];
  if (!rows.every((row) => row && typeof row === "object" && !Array.isArray(row))) throw new Error("JSON must be an object or array of objects.");
  const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const escape = (cell: unknown) => `"${(typeof cell === "object" && cell !== null ? JSON.stringify(cell) : String(cell ?? "")).replace(/"/g, '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((row) => headers.map((key) => escape(row[key])).join(","))].join("\n");
}

async function execute(request: WorkerRequest): Promise<string> {
  if (request.task === "json-to-csv") return jsonToCsv(request.payload.input);
  if (request.task === "csv-to-json") {
    const [headers, ...rows] = parseCsv(request.payload.input);
    if (!headers?.length) return "[]";
    return JSON.stringify(rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))), null, 2);
  }
  const bytes = new TextEncoder().encode(request.payload.input);
  const digest = await crypto.subtle.digest(request.payload.algorithm ?? "SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

scope.onmessage = async ({ data }: MessageEvent<WorkerRequest>) => {
  const response: WorkerResponse = { id: data.id };
  try { response.result = await execute(data); }
  catch (error) { response.error = error instanceof Error ? error.message : "Worker operation failed"; }
  scope.postMessage(response);
};
