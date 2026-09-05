import { verifyToolResult } from "./execution-engine";
import { findToolBySlug } from "../data/toolsRegistry";

export interface VerificationRecord {
  toolId: string;
  status: "verified" | "pending" | "failed";
  lastVerified: string;
  confidence: number;
  issues: string[];
}

export async function verifyTool(
  toolId: string,
  input: any,
  output: any,
  context?: any,
): Promise<VerificationRecord> {
  const tool = findToolBySlug(toolId);
  if (!tool) {
    throw new Error(`Tool not found: ${toolId}`);
  }

  const result = await verifyToolResult(tool, input, output);
  return {
    toolId: tool.id,
    status: result.valid ? "verified" : "failed",
    lastVerified: new Date().toISOString(),
    confidence: result.confidence,
    issues: result.issues,
  };
}

export function getVerificationStatus(toolId: string): VerificationRecord | null {
  const tool = findToolBySlug(toolId);
  if (!tool) return null;

  if (tool.verification) {
    return {
      toolId: tool.id,
      status: tool.verification.status as any,
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

export class VerificationSystem {
  async verifyTool(
    toolId: string,
    input: any,
    output: any,
    context?: any,
  ): Promise<VerificationRecord> {
    return verifyTool(toolId, input, output, context);
  }

  getVerificationStatus(toolId: string): VerificationRecord | null {
    return getVerificationStatus(toolId);
  }

  getLastVerified(toolId: string): string | null {
    return getLastVerified(toolId);
  }
}

export const verificationSystem = new VerificationSystem();
