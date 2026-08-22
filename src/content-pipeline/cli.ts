import fs from "node:fs";
import path from "node:path";
import { ApprovalStore } from "./approval-store";
import { ToolCandidateSchema } from "./schemas";
import { fingerprintPublicationContent } from "./validate";

interface ReviewPayload {
  spec?: unknown;
  status?: string;
  wordCount?: number;
  similarityMatch?: { slug?: string; score?: number };
  metadata?: { h1?: string; title?: string };
  content?: {
    directAnswer?: string;
    technicalDetails?: string;
    instructions?: string;
    edgeCases?: string[];
    faqs?: Array<{ question?: string; answer?: string }>;
  };
}

function argument(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function requiredArgument(name: string): string {
  const value = argument(name);
  if (!value) throw new Error(`Missing required argument --${name}`);
  return value;
}

function reviewDirectory(): string {
  return path.resolve(argument("review-dir") ?? ".xfree-review-queue");
}

function approvalFile(): string {
  return path.resolve(argument("approval-file") ?? "content-approvals.json");
}

function readReview(slug: string): ReviewPayload {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error("Invalid slug");
  const file = path.join(reviewDirectory(), `${slug}.json`);
  if (!fs.existsSync(file)) throw new Error(`Pending review file not found: ${file}`);
  return JSON.parse(fs.readFileSync(file, "utf8")) as ReviewPayload;
}

function printReview(slug: string, payload: ReviewPayload): void {
  const similarity = payload.similarityMatch;
  console.log(`Slug: ${slug}`);
  console.log(`Status: ${payload.status ?? "unknown"}`);
  console.log(`Word count: ${payload.wordCount ?? "unknown"}`);
  console.log(`Closest match: ${similarity?.slug ?? "none"}${typeof similarity?.score === "number" ? ` (${(similarity.score * 100).toFixed(1)}%)` : ""}`);
  console.log(`H1: ${payload.metadata?.h1 ?? "missing"}`);
  console.log("\nAEO direct answer\n-----------------");
  console.log(payload.content?.directAnswer ?? "missing");
  console.log("\nContent structure\n-----------------");
  console.log("- Technical details");
  console.log("- Instructions");
  console.log(`- ${payload.content?.edgeCases?.length ?? 0} edge cases`);
  console.log(`- ${payload.content?.faqs?.length ?? 0} troubleshooting FAQs`);
}

function approve(slug: string, payload: ReviewPayload): void {
  const reviewer = requiredArgument("reviewer");
  const notes = requiredArgument("notes");
  const candidate = ToolCandidateSchema.parse({ ...payload.spec, content: payload.content, metadata: payload.metadata });
  const contentFingerprint = fingerprintPublicationContent(candidate);
  const reviewedSimilaritySlugs = (argument("review-similarity") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (payload.similarityMatch?.slug && typeof payload.similarityMatch.score === "number" && payload.similarityMatch.score >= 0.78) {
    if (!reviewedSimilaritySlugs.includes(payload.similarityMatch.slug)) {
      throw new Error(`High-similarity match ${payload.similarityMatch.slug} must be acknowledged with --review-similarity ${payload.similarityMatch.slug}`);
    }
  }

  const store = new ApprovalStore(approvalFile());
  store.set({
    slug,
    contentFingerprint,
    decision: "approved",
    reviewer,
    reviewedAt: new Date().toISOString(),
    notes,
    reviewedSimilaritySlugs,
  });
  store.flush();
  console.log(`Approval recorded for ${slug} at fingerprint ${contentFingerprint}`);
  console.log("Rerun the orchestrator to revalidate and publish this exact revision.");
}

function main(): void {
  const command = process.argv[2];
  if (!["review", "approve"].includes(command)) {
    throw new Error("Usage: pipeline CLI <review|approve> --slug <slug>");
  }
  const slug = requiredArgument("slug");
  const payload = readReview(slug);
  printReview(slug, payload);
  if (command === "approve") approve(slug, payload);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
