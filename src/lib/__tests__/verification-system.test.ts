import { describe, it, expect, beforeEach, vi } from "vitest";

const store: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] ?? null),
  setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
  removeItem: vi.fn((key: string) => { delete store[key]; }),
  clear: vi.fn(() => { Object.keys(store).forEach((k) => delete store[k]); }),
};

(globalThis as any).localStorage = localStorageMock;

import {
  verifyTool,
  getVerificationStatus,
  getLastVerified,
  isVerificationStale,
  VerificationSystem,
  verificationSystem,
} from "../verification-system";

const STORAGE_KEY = "xfree_verifications";

describe("VerificationSystem — verifyTool", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.clearAllMocks();
  });

  it("throws for a non-existent tool", async () => {
    await expect(verifyTool("nonexistent-tool", "input", "output")).rejects.toThrow(
      "Tool not found",
    );
  });

  it("stores a verification record after verifyTool", async () => {
    await verifyTool("json-formatter", '{"a":1}', { valid: true });
    const record = getVerificationStatus("json-formatter");
    expect(record).not.toBeNull();
    expect(record!.status).toBe("verified");
    expect(record!.lastVerified).toBeTruthy();
    expect(record!.confidence).toBeGreaterThan(0);
    expect(record!.issues).toBeDefined();
  });

  it("updates the record on re-verification", async () => {
    await verifyTool("json-formatter", '{"a":1}', { valid: true });
    const first = getVerificationStatus("json-formatter");
    const firstTime = first!.lastVerified;

    await new Promise((r) => setTimeout(r, 10));
    await verifyTool("json-formatter", '{"b":2}', { valid: true });
    const second = getVerificationStatus("json-formatter");

    expect(second!.lastVerified).not.toBe(firstTime);
  });
});

describe("VerificationSystem — getVerificationStatus", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.clearAllMocks();
  });

  it("returns null for unknown tool", () => {
    expect(getVerificationStatus("unknown-tool")).toBeNull();
  });

  it("returns stored record when available", async () => {
    await verifyTool("regex-tester", "pattern", { result: "match" });
    const status = getVerificationStatus("regex-tester");
    expect(status).not.toBeNull();
    expect(status!.toolId).toBeTruthy();
  });
});

describe("VerificationSystem — getLastVerified", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.clearAllMocks();
  });

  it("returns null for unverified tool", () => {
    expect(getLastVerified("unknown-tool")).toBeNull();
  });

  it("returns timestamp after verification", async () => {
    await verifyTool("json-formatter", "input", { valid: true });
    const ts = getLastVerified("json-formatter");
    expect(ts).not.toBeNull();
    expect(() => new Date(ts!)).not.toThrow();
  });
});

describe("VerificationSystem — isVerificationStale", () => {
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    vi.clearAllMocks();
  });

  it("returns true for unverified tool", () => {
    expect(isVerificationStale("unknown-tool")).toBe(true);
  });

  it("returns false for recently verified tool", async () => {
    await verifyTool("json-formatter", "input", { valid: true });
    expect(isVerificationStale("json-formatter")).toBe(false);
  });

  it("returns true when verification is older than threshold", async () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 60);
    store[STORAGE_KEY] = JSON.stringify({
      "json-formatter": {
        toolId: "json-formatter",
        status: "verified",
        lastVerified: oldDate.toISOString(),
        confidence: 0.9,
        issues: [],
      },
    });

    expect(isVerificationStale("json-formatter", 30)).toBe(true);
  });
});

describe("VerificationSystem — singleton instance", () => {
  it("exports a singleton instance", () => {
    expect(verificationSystem).toBeInstanceOf(VerificationSystem);
  });

  it("instance delegates to static functions", async () => {
    const record = await verificationSystem.verifyTool("json-formatter", "input", { valid: true });
    expect(record.status).toBe("verified");
    expect(verificationSystem.getLastVerified("json-formatter")).not.toBeNull();
  });
});
