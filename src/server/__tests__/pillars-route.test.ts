import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import http from "http";
import path from "path";
import fs from "fs";

function buildApp(): express.Express {
  const app = express();
  const pillarsHtmlPath = path.join(process.cwd(), "public", "pillars.html");
  const CSP = ["default-src 'self'"];
  app.get(["/pillars", "/pillars/"], (_req, res) => {
    if (!fs.existsSync(pillarsHtmlPath)) {
      return res.status(404).send("pillars.html not found");
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
    res.setHeader("Content-Security-Policy", CSP.join("; "));
    res.setHeader("X-Robots-Tag", "index, follow");
    res.status(200).sendFile(pillarsHtmlPath);
  });
  return app;
}

describe("GET /pillars", () => {
  let server: http.Server;
  let baseUrl: string;

  beforeAll(async () => {
    const app = buildApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, "127.0.0.1", () => resolve());
    });
    const addr = server.address();
    if (typeof addr === "object" && addr) {
      baseUrl = `http://127.0.0.1:${addr.port}`;
    } else {
      throw new Error("server did not bind to a port");
    }
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it("returns 200 with HTML for /pillars", async () => {
    const res = await fetch(`${baseUrl}/pillars`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    const text = await res.text();
    expect(text).toContain("XFree");
    expect(text).toContain("Pillar Directory");
  });

  it("returns 200 with HTML for /pillars/ (trailing slash)", async () => {
    const res = await fetch(`${baseUrl}/pillars/`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("Pillar Directory");
  });

  it("sets indexable robots directive and a Content-Security-Policy header", async () => {
    const res = await fetch(`${baseUrl}/pillars`);
    expect(res.headers.get("x-robots-tag")).toBe("index, follow");
    expect(res.headers.get("content-security-policy")).toBeTruthy();
  });

  it("declares the canonical URL to www.xfree.in/pillars", async () => {
    const res = await fetch(`${baseUrl}/pillars`);
    const text = await res.text();
    expect(text).toContain('rel="canonical" href="https://www.xfree.in/pillars"');
  });

  it("renders the 60-pillar taxonomy in served HTML", async () => {
    const res = await fetch(`${baseUrl}/pillars`);
    const text = await res.text();
    // Spot check pillars from different menu groups
    expect(text).toContain("XFree Developer Tools");
    expect(text).toContain("XFree SEO Tools");
    expect(text).toContain("XFree AI Tools");
    expect(text).toContain("XFree Security Tools");
  });

  it("uses the cyberpunk theme tokens", async () => {
    const res = await fetch(`${baseUrl}/pillars`);
    const text = await res.text();
    expect(text).toContain("cdn.tailwindcss.com");
    expect(text).toContain("cyber-glow");
  });
});
