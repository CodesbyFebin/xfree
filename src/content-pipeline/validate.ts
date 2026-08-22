import { createHash } from "node:crypto";
import {
  PublicationApprovalSchema,
  ToolCandidateSchema,
  WebApplicationJsonLdSchema,
  type PublicationApproval,
  type ToolCandidate,
  type WebApplicationJsonLd,
} from "./schemas";
import { findClosestDocument, type SimilarityDocument, type SimilarityMatch } from "./similarity";

export const BANNED_CLICHES = [
  "in today's digital landscape",
  "revolutionary tool",
  "game changer",
  "look no further",
  "delve into",
  "unlock the power of",
] as const;

const UNVERIFIED_ABSOLUTE_CLAIMS = [
  "zero server latency",
  "no data logging",
  "100% client-side",
  "unlimited usage",
  "guaranteed privacy",
] as const;

export interface PublicationResult {
  status: "published" | "pending_review" | "draft";
  indexable: boolean;
  robots: "index, follow" | "noindex, nofollow";
  wordCount: number;
  errors: string[];
  candidate?: ToolCandidate;
  studioDeepLink?: string;
  jsonLd?: WebApplicationJsonLd;
  contentFingerprint?: string;
  similarityMatch?: SimilarityMatch;
  comparisonText?: string;
}

export interface PublicationContext {
  availableStudioEngineIds: ReadonlySet<string>;
  similarityCorpus?: readonly SimilarityDocument[];
  similarityThreshold?: number;
  approval?: PublicationApproval;
}

export function publicationText(candidate: ToolCandidate): string {
  return [
    candidate.content.directAnswer,
    candidate.content.technicalDetails,
    candidate.content.instructions,
    ...candidate.content.examples.flatMap((example) => [example.title, example.input, example.output, example.explanation]),
    ...candidate.content.edgeCases,
    ...candidate.content.faqs.flatMap((faq) => [faq.question, faq.answer]),
  ].join(" ");
}

export function fingerprintPublicationContent(candidate: ToolCandidate): string {
  return createHash("sha256").update(publicationText(candidate)).digest("hex");
}

function countWords(value: string): number {
  return value.trim() ? value.trim().split(/\s+/u).length : 0;
}

function buildJsonLd(candidate: ToolCandidate): WebApplicationJsonLd {
  return WebApplicationJsonLdSchema.parse({
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: candidate.name,
    url: `https://www.xfree.in/tools/${candidate.slug}`,
    applicationCategory: candidate.category,
    operatingSystem: "Any (browser)",
    description: candidate.summary,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    browserRequirements: "Requires a modern browser with JavaScript enabled",
    featureList: [
      candidate.processing.mode === "local" ? "Local Mode" : `${candidate.processing.mode} processing with disclosure`,
      ...candidate.outputFormats.map((format) => `Exports ${format}`),
    ],
    potentialAction: {
      "@type": "UseAction",
      target: `https://app.xfree.in/?tool=${encodeURIComponent(candidate.engine.id)}`,
    },
  });
}

export function validateForPublication(raw: unknown, context: PublicationContext): PublicationResult {
  const parsed = ToolCandidateSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      status: "draft",
      indexable: false,
      robots: "noindex, nofollow",
      wordCount: 0,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }

  const candidate = parsed.data;
  const text = publicationText(candidate);
  const normalized = text.toLowerCase();
  const wordCount = countWords(text);
  const contentFingerprint = fingerprintPublicationContent(candidate);
  const errors: string[] = [];

  if (candidate.engine.status !== "working" || !candidate.engine.tested) {
    errors.push("A tested, working engine is required before publication");
  }
  if (!context.availableStudioEngineIds.has(candidate.engine.id)) {
    errors.push(`Studio engine does not exist: ${candidate.engine.id}`);
  }
  if (wordCount < 450) {
    errors.push(`Body content has ${wordCount} words; editorial review requires at least 450`);
  }
  if (candidate.metadata.h1 !== candidate.name && !candidate.metadata.h1.startsWith(`${candidate.name} —`)) {
    errors.push("H1 must identify the exact tool");
  }
  if (/<h1\b|(^|\n)\s*#\s+/iu.test(text)) {
    errors.push("Body sections must not introduce another H1");
  }
  for (const phrase of [...BANNED_CLICHES, ...UNVERIFIED_ABSOLUTE_CLAIMS]) {
    if (normalized.includes(phrase)) errors.push(`Prohibited or unverified phrase: "${phrase}"`);
  }
  if (candidate.processing.mode !== "local" && normalized.includes("local mode by default")) {
    errors.push("Cloud or hybrid tools must not claim Local Mode by default");
  }

  if (errors.length > 0) {
    return { status: "draft", indexable: false, robots: "noindex, nofollow", wordCount, errors, candidate, contentFingerprint, comparisonText: text };
  }

  const similarityMatch = findClosestDocument(text, context.similarityCorpus ?? []);
  const similarityThreshold = context.similarityThreshold ?? 0.78;
  const parsedApproval = context.approval ? PublicationApprovalSchema.safeParse(context.approval) : null;
  const approvalMatches = Boolean(
    parsedApproval?.success &&
    parsedApproval.data.slug === candidate.slug &&
    parsedApproval.data.contentFingerprint === contentFingerprint &&
    (!similarityMatch || similarityMatch.score < similarityThreshold || parsedApproval.data.reviewedSimilaritySlugs.includes(similarityMatch.slug)),
  );

  if (!approvalMatches) {
    return {
      status: "pending_review",
      indexable: false,
      robots: "noindex, nofollow",
      wordCount,
      errors: similarityMatch && similarityMatch.score >= similarityThreshold
        ? [`Similarity review required: ${(similarityMatch.score * 100).toFixed(1)}% overlap with ${similarityMatch.slug}`]
        : ["Human editorial approval is required for this exact content fingerprint"],
      candidate,
      contentFingerprint,
      similarityMatch: similarityMatch ?? undefined,
      comparisonText: text,
    };
  }

  return {
    status: "published",
    indexable: true,
    robots: "index, follow",
    wordCount,
    errors: [],
    candidate,
    contentFingerprint,
    similarityMatch: similarityMatch ?? undefined,
    comparisonText: text,
    studioDeepLink: `https://app.xfree.in/?tool=${encodeURIComponent(candidate.engine.id)}`,
    jsonLd: buildJsonLd(candidate),
  };
}
