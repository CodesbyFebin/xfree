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

function loadConfig(): AppConfig {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
    console.error(`\n[env] Invalid environment configuration:\n${issues}\n`);
    process.exit(1);
  }
  const cfg = parsed.data;
  if (cfg.NODE_ENV === "production" && !cfg.GEMINI_API_KEY) {
    console.error("[env] GEMINI_API_KEY is required in production.");
    process.exit(1);
  }
  return cfg;
}

export const config: AppConfig = loadConfig();

export const isProduction = config.NODE_ENV === "production";
