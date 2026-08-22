import { z } from "zod";
import {
  ProcessingEvidenceSchema,
  PublicationApprovalSchema,
  ToolContentSpecSchema,
  ToolGenerationSpecSchema,
  WebApplicationJsonLdSchema,
} from "./schemas";

export const PublishedArtifactSchema = z.object({
  schemaVersion: z.literal(1),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  pillarSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sourceFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  contentFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  status: z.literal("published"),
  indexable: z.literal(true),
  robots: z.literal("index, follow"),
  metadata: z.object({
    h1: z.string().min(5).max(100),
    title: z.string().min(20).max(70),
    description: z.string().min(70).max(160),
    canonical: z.string().url(),
  }),
  content: ToolContentSpecSchema,
  processing: ProcessingEvidenceSchema,
  studioDeepLink: z.string().url(),
  jsonLd: WebApplicationJsonLdSchema,
  approval: PublicationApprovalSchema,
  spec: ToolGenerationSpecSchema,
});

export type PublishedArtifact = z.infer<typeof PublishedArtifactSchema>;
