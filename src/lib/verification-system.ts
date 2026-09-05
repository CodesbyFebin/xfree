import { verifyToolResult } from "./execution-engine";
import { findToolBySlug } from "../data/toolsRegistry";
import type { ToolDefinition, ExecutionContext, VerificationResult } from "../types";

const STORAGE_KEY = "xfree_verifications";

export interface VerificationRecord {
  toolId: string;
  status: "verified" | "pending" | "failed";
  lastVerified: string;
  confidence: number;
  issues: string[];
}

const STALE_THRESHOLD_DAYS = 30;

function getStorage(): Record<string, VerificationRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, VerificationRecord>;
  } catch {
    return {};
  }
}

function saveStorage(records: Record<string, VerificationRecord>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export async function verifyTool(
  toolId: string,
  input: any,
  output: any,
  context?: ExecutionContext,
): Promise<VerificationRecord> {
  const tool = findToolBySlug(toolId);
  if (!tool) {
    throw new Error(`Tool not found: ${toolId}`);
  }

  const result: VerificationResult = await verifyToolResult(tool, input, output);
  const now = new Date().toISOString();

  const record: VerificationRecord = {
    toolId: tool.id,
    status: result.valid ? "verified" : "failed",
    lastVerified: now,
    confidence: result.confidence,
    issues: result.issues,
  };

  const records = getStorage();
  records[tool.id] = record;
  saveStorage(records);

  return record;
}

export function getVerificationStatus(toolId: string): VerificationRecord | null {
  const tool = findToolBySlug(toolId);
  if (!tool) return null;

  const records = getStorage();
  const stored = records[tool.id];

  if (stored) {
    return stored;
  }

  if (tool.verification) {
    return {
      toolId: tool.id,
      status: tool.verification.status,
      lastVerified: tool.verification.lastVerified,
      confidence: tool.verification.status === "verified" ? 0.9 : 0.1,
      issues: tool.verification.knownIssues ?? [],
    };
  }

  return null;
}

export function getLastVerified(toolId: string): string | null {
  const status = getVerificationStatus(toolId);
  return status?.lastVerified ?? null;
}

export function isVerificationStale(toolId: string, thresholdDays: number = STALE_THRESHOLD_DAYS): boolean {
  const status = getVerificationStatus(toolId);
  if (!status) return true;
  const last = new Date(status.lastVerified);
  const daysSince = (Date.now() - last.getTime()) / (1000 * 60 * 60 * 24);
  return daysSince > thresholdDays;
}

export class VerificationSystem {
  async verifyTool(
    toolId: string,
    input: any,
    output: any,
    context?: ExecutionContext,
  ): Promise<VerificationRecord> {
    return verifyTool(toolId, input, output, context);
  }

  getVerificationStatus(toolId: string): VerificationRecord | null {
    return getVerificationStatus(toolId);
  }

  getLastVerified(toolId: string): string | null {
    return getLastVerified(toolId);
  }

  isStale(toolId: string, thresholdDays?: number): boolean {
    return isVerificationStale(toolId, thresholdDays);
  }
}

export const verificationSystem = new VerificationSystem();
