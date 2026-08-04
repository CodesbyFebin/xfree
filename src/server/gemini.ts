import { GoogleGenAI } from "@google/genai";
import { config } from "./env";

let cached: GoogleGenAI | null = null;

export class GeminiNotConfiguredError extends Error {
  readonly status = 503;
  constructor() {
    super("Gemini API is not configured on this deployment.");
    this.name = "GeminiNotConfiguredError";
  }
}

export function getGeminiClient(): GoogleGenAI {
  if (!config.GEMINI_API_KEY) {
    throw new GeminiNotConfiguredError();
  }
  if (!cached) {
    cached = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });
  }
  return cached;
}

export async function generateWithTimeout<T>(fn: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.GEMINI_REQUEST_TIMEOUT_MS);
  try {
    return await fn(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}
