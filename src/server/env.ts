import { z } from "zod";
import * as dotenv from "dotenv";

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  PUBLIC_SITE_URL: z.string().url().default("https://www.xfree.in"),

  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_DEFAULT_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_THINKING_MODEL: z.string().default("gemini-2.5-pro"),
  GEMINI_BATCH_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(2048),
  GEMINI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),

  NVIDIA_API_KEY: z.string().min(1).optional(),
  NVIDIA_BASE_URL: z.string().url().default("https://integrate.api.nvidia.com/v1"),
  NVIDIA_MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().max(16_384).default(2_048),
  NVIDIA_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(45_000),

  AI_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
  AI_RATE_LIMIT_PER_DAY: z.coerce.number().int().positive().default(100),
  AI_THINKING_LIMIT_PER_DAY: z.coerce.number().int().positive().default(15),
  AI_BATCH_MAX_ITEMS: z.coerce.number().int().positive().default(20),
  AI_GLOBAL_DAILY_LIMIT: z.coerce.number().int().positive().default(5000),

  CONTACT_TO_EMAIL: z.string().email().default("contact@xfree.in"),
  CONTACT_FROM_EMAIL: z.string().email().default("noreply@xfree.in"),
  RESEND_API_KEY: z.string().optional(),

  REDIS_URL: z.string().optional(),

  TRUST_PROXY: z.coerce.number().int().nonnegative().default(1),
});

export type AppConfig = z.infer<typeof EnvSchema>;

// dotenv loads an unset value like `GEMINI_API_KEY=` as "", not undefined.
// An empty string fails z.string().min(1).optional() and must not be treated
// the same as an invalid config — drop empty-string keys here so one blank
// optional var can't fail the whole schema and reset every other var (PORT,
// PUBLIC_SITE_URL, etc.) to its default.
function stripEmptyStrings(env: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const sanitized: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(env)) {
    if (value !== "") sanitized[key] = value;
  }
  return sanitized;
}

function loadConfig(): AppConfig {
  const parsed = EnvSchema.safeParse(stripEmptyStrings(process.env));
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    // Do NOT process.exit here. On Vercel serverless, exiting at import time
    // kills the entire function (FUNCTION_INVOCATION_FAILED) for every route,
    // including /api/health and static-file fallbacks that don't need env at
    // all. Log loudly and fall through with defaults; per-endpoint code that
    // actually needs the missing values will throw when called.
    console.error(`[env] Invalid environment configuration (using defaults for missing values):\n${issues}`);
    return EnvSchema.parse({}); // safe defaults; AI endpoints will 500 individually if GEMINI_API_KEY unset
  }
  const cfg = parsed.data;
  if (cfg.NODE_ENV === "production" && !cfg.GEMINI_API_KEY) {
    // Warn but don't kill the process — health/contact/feedback and static
    // fallback don't need Gemini. AI endpoints check at request time.
    console.warn("[env] GEMINI_API_KEY is not set. AI endpoints will return 503 until it is provisioned.");
  }
  if (cfg.NODE_ENV === "production" && !cfg.NVIDIA_API_KEY) {
    console.warn("[env] NVIDIA_API_KEY is not set. NVIDIA Cloud Mode will remain unavailable.");
  }
  return cfg;
}

export const config: AppConfig = loadConfig();

export const isProduction = config.NODE_ENV === "production";
