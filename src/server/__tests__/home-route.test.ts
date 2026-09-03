import { describe, it, expect, beforeAll, afterAll } from "vitest";
import express from "express";
import http from "http";
import path from "path";
import fs from "fs";

function buildApp(): express.Express {
  const app = express();
  const homeHtmlPath = path.join(process.cwd(), "public", "home.html");
  const HOME_CSP_DIRECTIVES = ["default-src 'self'"];
  app.get(["/home", "/home/"], (_req, res) => {
    if (!fs.existsSync(homeHtmlPath)) {
      return res.status(404).send("home.html not found");
    }
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=3600");
    res.setHeader("Content-Security-Policy", HOME_CSP_DIRECTIVES.join("; "));
    res.setHeader("X-Robots-Tag", "index, follow");
    res.status(200).sendFile(homeHtmlPath);
  });
  return app;
}

describe("GET /home", () => {
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

  it("returns 200 with HTML for /home", async () => {
    const res = await fetch(`${baseUrl}/home`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toMatch(/text\/html/);
    const text = await res.text();
    expect(text).toContain("XFree");
    expect(text).toContain("Privacy Micro-Tools App");
  });

  it("returns 200 with HTML for /home/ (trailing slash)", async () => {
    const res = await fetch(`${baseUrl}/home/`);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("XFree");
  });

  it("sets indexable robots directive and a Content-Security-Policy header", async () => {
    const res = await fetch(`${baseUrl}/home`);
    expect(res.headers.get("x-robots-tag")).toBe("index, follow");
    expect(res.headers.get("content-security-policy")).toBeTruthy();
  });

  it("references the Tailwind play CDN in served HTML", async () => {
    const res = await fetch(`${baseUrl}/home`);
    const text = await res.text();
    expect(text).toContain("cdn.tailwindcss.com");
  });
});
