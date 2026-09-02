import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

export const CacheEntrySchema = z.object({
  slug: z.string().min(1),
  contentFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  sourceFingerprint: z.string().regex(/^[a-f0-9]{64}$/).optional(),
  text: z.string(),
  status: z.enum(["draft", "pending_review", "published"]),
  wordCount: z.number().int().nonnegative(),
  updatedAt: z.string().datetime(),
  errors: z.array(z.string()).default([]),
});

export type CacheEntry = z.infer<typeof CacheEntrySchema>;

export interface CacheProvider {
  get(slug: string): CacheEntry | undefined;
  entries(): CacheEntry[];
  set(entry: CacheEntry): void;
  flush(): void;
}

const CacheFileSchema = z.object({
  version: z.literal(1),
  entries: z.array(CacheEntrySchema),
});

export class JsonCacheProvider implements CacheProvider {
  private readonly records = new Map<string, CacheEntry>();

  constructor(private readonly filePath: string) {
    if (!fs.existsSync(filePath)) return;
    const parsed = CacheFileSchema.safeParse(JSON.parse(fs.readFileSync(filePath, "utf8")));
    if (!parsed.success) throw new Error(`Invalid XFree build cache: ${parsed.error.message}`);
    for (const entry of parsed.data.entries) this.records.set(entry.slug, entry);
  }

  get(slug: string): CacheEntry | undefined {
    return this.records.get(slug);
  }

  entries(): CacheEntry[] {
    return [...this.records.values()];
  }

  set(entry: CacheEntry): void {
    this.records.set(entry.slug, CacheEntrySchema.parse(entry));
  }

  flush(): void {
    const directory = path.dirname(this.filePath);
    fs.mkdirSync(directory, { recursive: true });
    const temporaryPath = `${this.filePath}.tmp`;
    const payload = JSON.stringify({ version: 1, entries: this.entries() }, null, 2);
    fs.writeFileSync(temporaryPath, payload, { encoding: "utf8", mode: 0o600 });
    fs.renameSync(temporaryPath, this.filePath);
  }
}
