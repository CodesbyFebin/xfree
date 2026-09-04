/**
 * JSON formatter — pure utility used by the home-page demo.
 * Mirrors the logic inlined in public/home/app.js so it can be unit-tested
 * from Node without a DOM. The public/home/app.js copy is the runtime one;
 * the test file imports this module to verify behavior.
 */

export interface FormatResult {
  ok: boolean;
  value?: string;
  error?: string;
}

export function formatJson(input: string): FormatResult {
  if (typeof input !== "string") {
    return { ok: false, error: "Input must be a string" };
  }
  try {
    const value = JSON.stringify(JSON.parse(input), null, 2);
    return { ok: true, value };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid JSON";
    return { ok: false, error: message };
  }
}
