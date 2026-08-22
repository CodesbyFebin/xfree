import { z } from "zod";
import { ToolGenerationSpecSchema, type ToolGenerationSpec } from "./schemas";

export const PillarDatasetSchema = z.object({
  name: z.string().min(3).max(100),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().min(80).max(320),
  status: z.enum(["draft", "active"]),
  tools: z.array(ToolGenerationSpecSchema).min(1),
});

export const ToolMatrixDatasetSchema = z.object({
  schemaVersion: z.literal(1),
  datasetId: z.string().min(3),
  updatedAt: z.string().datetime(),
  pillars: z.array(PillarDatasetSchema).min(1),
});

export type ToolMatrixDataset = z.infer<typeof ToolMatrixDatasetSchema>;

export interface DatasetValidationResult {
  valid: boolean;
  toolCount: number;
  errors: string[];
  dataset?: ToolMatrixDataset;
}

export function validateReleaseDataset(raw: unknown): DatasetValidationResult {
  const parsed = ToolMatrixDatasetSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      valid: false,
      toolCount: 0,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }

  const dataset = parsed.data;
  const errors: string[] = [];
  const toolSlugs = new Set<string>();
  const engineOwners = new Map<string, string>();
  const pillarSlugs = new Set<string>();
  let toolCount = 0;

  if (dataset.pillars.length !== 30) errors.push(`Release dataset requires exactly 30 pillars; found ${dataset.pillars.length}`);

  for (const pillar of dataset.pillars) {
    if (pillarSlugs.has(pillar.slug)) errors.push(`Duplicate pillar slug: ${pillar.slug}`);
    pillarSlugs.add(pillar.slug);
    if (pillar.status !== "active") errors.push(`Pillar is not active: ${pillar.slug}`);
    if (pillar.tools.length < 50) errors.push(`Pillar ${pillar.slug} requires at least 50 tool specifications; found ${pillar.tools.length}`);

    for (const tool of pillar.tools) {
      toolCount += 1;
      if (tool.pillarSlug !== pillar.slug) errors.push(`Tool ${tool.slug} declares pillar ${tool.pillarSlug}, expected ${pillar.slug}`);
      if (tool.engine.status !== "working" || !tool.engine.tested) errors.push(`Release tool ${tool.slug} does not reference a tested, working engine`);
      if (toolSlugs.has(tool.slug)) errors.push(`Duplicate tool slug: ${tool.slug}`);
      toolSlugs.add(tool.slug);
      const existingOwner = engineOwners.get(tool.engine.id);
      if (existingOwner) errors.push(`Studio engine ${tool.engine.id} is assigned to multiple tool pages: ${existingOwner}, ${tool.slug}`);
      else engineOwners.set(tool.engine.id, tool.slug);
    }
  }

  if (toolCount < 1500) errors.push(`Release dataset requires at least 1,500 tool specifications; found ${toolCount}`);
  return { valid: errors.length === 0, toolCount, errors, dataset };
}

export function flattenToolSpecs(dataset: ToolMatrixDataset): ToolGenerationSpec[] {
  return dataset.pillars.flatMap((pillar) => pillar.tools);
}
