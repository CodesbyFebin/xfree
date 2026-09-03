import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import { createApp } from "../app";

let app: Awaited<ReturnType<typeof createApp>>;

beforeAll(async () => {
  app = await createApp();
});

describe("GET /home (public/home.html prototype page)", () => {
  it("serves the public/home.html file with text/html content type", async () => {
    const server = app.listen(0);
    try {
      const port = (server.address() as { port: number }).port;
      const res = await fetch(`http://127.0.0.1:${port}/home`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toMatch(/text\/html/);
      const body = await res.text();
      expect(body).toContain("XFree");
      expect(body).toContain("Pillar Explorer");
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it("also serves /home/ with a trailing slash", async () => {
    const server = app.listen(0);
    try {
      const port = (server.address() as { port: number }).port;
      const res = await fetch(`http://127.0.0.1:${port}/home/`);
      // canonical-URL middleware strips trailing slashes, so this becomes /home
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toContain("Pillar Explorer");
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it("sets Cache-Control header for edge caching", async () => {
    const server = app.listen(0);
    try {
      const port = (server.address() as { port: number }).port;
      const res = await fetch(`http://127.0.0.1:${port}/home`);
      expect(res.status).toBe(200);
      const cacheControl = res.headers.get("cache-control") || "";
      expect(cacheControl).toMatch(/max-age=/);
    } finally {
      await new Promise<void>((r) => server.close(() => r()));
    }
  });

  it("the served file exists at public/home.html on disk", () => {
    const filePath = path.join(process.cwd(), "public", "home.html");
    expect(fs.existsSync(filePath)).toBe(true);
    const stats = fs.statSync(filePath);
    expect(stats.size).toBeGreaterThan(1000);
  });
});
