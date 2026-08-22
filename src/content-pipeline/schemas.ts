import { z } from "zod";

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use a lowercase hyphenated slug");

export const ProcessingEvidenceSchema = z.object({
  mode: z.enum(["local", "cloud", "hybrid"]),
  implementation: z.enum(["browser-js", "web-worker", "wasm", "server-api"]),
  workingInputSentToServer: z.boolean(),
  providers: z.array(z.string().min(1)).default([]),
  verifiedAt: z.string().date(),
  limitations: z.array(z.string().min(10)).min(1),
}).superRefine((value, ctx) => {
  if (value.mode === "local" && value.workingInputSentToServer) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["workingInputSentToServer"], message: "Local Mode cannot send working input to a server" });
  }
  if (value.mode === "cloud" && !value.workingInputSentToServer) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["workingInputSentToServer"], message: "Cloud Mode must disclose server submission" });
  }
  if (value.workingInputSentToServer && value.providers.length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["providers"], message: "Name every processor that receives working input" });
  }
});

export const ToolContentSpecSchema = z.object({
  directAnswer: z.string().min(120).max(600),
  technicalDetails: z.string().min(300),
  instructions: z.string().min(300),
  examples: z.array(z.object({
    title: z.string().min(5),
    input: z.string().min(1),
    output: z.string().min(1),
    explanation: z.string().min(40),
  })).min(1),
  edgeCases: z.array(z.string().min(20)).min(2),
  faqs: z.array(z.object({
    question: z.string().min(10),
    answer: z.string().min(30),
  })).min(3).max(8),
});

export const ToolCandidateSchema = z.object({
  name: z.string().min(3).max(80),
  slug,
  category: slug,
  pillarSlug: slug,
  summary: z.string().min(40).max(240),
  engine: z.object({
    id: slug,
    status: z.enum(["working", "draft", "missing"]),
    tested: z.boolean(),
  }),
  inputParameters: z.array(z.string().min(1)).min(1),
  outputFormats: z.array(z.string().min(1)).min(1),
  useCases: z.array(z.string().min(10)).min(2),
  searchIntents: z.array(z.string().min(8).max(120)).min(3).max(8).optional(),
  processing: ProcessingEvidenceSchema,
  content: ToolContentSpecSchema,
  metadata: z.object({
    title: z.string().min(20).max(70),
    description: z.string().min(70).max(160),
    h1: z.string().min(5).max(100),
  }),
});

export const ToolGenerationSpecSchema = ToolCandidateSchema.omit({
  content: true,
  metadata: true,
});

export const GeneratedEditorialSchema = ToolCandidateSchema.pick({
  content: true,
  metadata: true,
});

export const WebApplicationJsonLdSchema = z.object({
  "@context": z.literal("https://schema.org"),
  "@type": z.enum(["WebApplication", "SoftwareApplication"]),
  name: z.string().min(3),
  url: z.string().url(),
  applicationCategory: z.string().min(1),
  operatingSystem: z.literal("Any (browser)"),
  description: z.string().min(40),
  offers: z.object({
    "@type": z.literal("Offer"),
    price: z.literal("0"),
    priceCurrency: z.literal("USD"),
  }),
  browserRequirements: z.string().min(10),
  featureList: z.array(z.string().min(5)).min(1),
  potentialAction: z.object({
    "@type": z.literal("UseAction"),
    target: z.string().url(),
  }),
});

export type ToolCandidate = z.infer<typeof ToolCandidateSchema>;
export type ToolGenerationSpec = z.infer<typeof ToolGenerationSpecSchema>;
export type GeneratedEditorial = z.infer<typeof GeneratedEditorialSchema>;
export type WebApplicationJsonLd = z.infer<typeof WebApplicationJsonLdSchema>;

export const PublicationApprovalSchema = z.object({
  slug,
  contentFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  decision: z.literal("approved"),
  reviewer: z.string().min(3),
  reviewedAt: z.string().datetime(),
  notes: z.string().min(20),
  reviewedSimilaritySlugs: z.array(slug).default([]),
});

export type PublicationApproval = z.infer<typeof PublicationApprovalSchema>;

export const ApprovalLedgerSchema = z.object({
  version: z.literal(1),
  approvals: z.array(PublicationApprovalSchema),
});

export type ApprovalLedger = z.infer<typeof ApprovalLedgerSchema>;
