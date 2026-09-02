import { describe, expect, it } from "vitest";
import { isStudioHostname, resolveEffectivePathForHost } from "../studioHost";

describe("Studio host resolution (GSC Contract v2 §2, §9)", () => {
  it("recognizes only the exact app.xfree.in hostname, case-insensitively", () => {
    expect(isStudioHostname("app.xfree.in")).toBe(true);
    expect(isStudioHostname("APP.XFREE.IN")).toBe(true);
    expect(isStudioHostname("www.xfree.in")).toBe(false);
    expect(isStudioHostname("xfree.in")).toBe(false);
    expect(isStudioHostname("staging.app.xfree.in")).toBe(false);
    expect(isStudioHostname("app.xfree.in.evil.example")).toBe(false);
  });

  it("maps app.xfree.in's root to /studio for client-side routing", () => {
    expect(resolveEffectivePathForHost("app.xfree.in", "/")).toBe("/studio");
  });

  it("leaves every other app.xfree.in path untouched", () => {
    expect(resolveEffectivePathForHost("app.xfree.in", "/studio")).toBe("/studio");
    expect(resolveEffectivePathForHost("app.xfree.in", "/tools/json-formatter")).toBe("/tools/json-formatter");
    expect(resolveEffectivePathForHost("app.xfree.in", "/about")).toBe("/about");
  });

  it("leaves www.xfree.in's root as the marketing homepage", () => {
    expect(resolveEffectivePathForHost("www.xfree.in", "/")).toBe("/");
    expect(resolveEffectivePathForHost("xfree.in", "/")).toBe("/");
  });
});

describe("Studio ?tool= deep-link query preservation (GSC Contract v2 §9)", () => {
  // StudioPage reads new URLSearchParams(window.location.search) directly,
  // independent of pathname resolution — this locks in that the query string
  // itself is never touched by the host/path remapping above.
  it("keeps the tool id intact across a resolved root path", () => {
    const url = new URL("https://app.xfree.in/?tool=json-to-csv");
    const effectivePath = resolveEffectivePathForHost(url.hostname, url.pathname);
    expect(effectivePath).toBe("/studio");
    expect(new URLSearchParams(url.search).get("tool")).toBe("json-to-csv");
  });

  it("url-encodes and decodes engine ids with special characters correctly", () => {
    const engineId = "csv to json/v2";
    const url = new URL(`https://app.xfree.in/?tool=${encodeURIComponent(engineId)}`);
    expect(new URLSearchParams(url.search).get("tool")).toBe(engineId);
  });
});
