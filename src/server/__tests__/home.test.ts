import { describe, it, expect, beforeAll } from "vitest";
import { createApp } from "../app";

let app: Awaited<ReturnType<typeof createApp>>;

beforeAll(async () => {
  app = await createApp();
});

function withServer<T>(fn: (port: number) => Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0);
    server.once("listening", () => {
      const port = (server.address() as { port: number }).port;
      fn(port)
        .then((value) => {
          server.close(() => resolve(value));
        })
        .catch((err) => {
          server.close(() => reject(err));
        });
    });
    server.once("error", reject);
  });
}

describe("GET /home (contract-compliant static landing page)", () => {
  it("returns 200 with text/html content type", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/home`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toMatch(/text\/html/);
    });
  });

  it("sends the full security header set, no COEP", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/home`);
      expect(res.headers.get("x-frame-options")).toBe("DENY");
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
      expect(res.headers.get("cross-origin-opener-policy")).toBe("same-origin");
      expect(res.headers.get("cross-origin-resource-policy")).toBe("same-origin");
      expect(res.headers.get("cross-origin-embedder-policy")).toBeNull();
      expect(res.headers.get("strict-transport-security")).toMatch(/max-age=\d+/);
      const pp = res.headers.get("permissions-policy") || "";
      expect(pp).toMatch(/camera=\(\)/);
      expect(pp).toMatch(/microphone=\(\)/);
      expect(pp).toMatch(/geolocation=\(\)/);
      const csp = res.headers.get("content-security-policy") || "";
      expect(csp).not.toMatch(/'unsafe-inline'/);
      expect(csp).toMatch(/frame-ancestors 'none'/);
    });
  });

  it("serves the static home page with the expected content and structure", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/home`);
      const body = await res.text();
      expect(body).toContain("XFree");
      expect(body).toContain("Local Mode");
      // No CDN script tags for application code
      expect(body).not.toMatch(/cdn\.tailwindcss\.com/);
      expect(body).not.toMatch(/unpkg\.com\/react/);
      // Application script is loaded externally with defer (no inline body)
      expect(body).toMatch(/<script src="\/home\/app\.js" defer/);
      // Structured data
      expect(body).toMatch(/"@type":\s*"WebSite"/);
      expect(body).toMatch(/"@type":\s*"Organization"/);
      expect(body).toMatch(/"@type":\s*"SoftwareApplication"/);
      expect(body).toMatch(/"@type":\s*"FAQPage"/);
      // Accessibility
      expect(body).toMatch(/href="#main-content" class="skip-link"/);
      expect(body).toMatch(/<main id="main-content"/);
      expect(body).toMatch(/lang="en"/);
    });
  });

  it("serves /home/manifest.json with manifest content type", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/home/manifest.json`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toMatch(/application\/json/);
      const body = await res.json();
      expect(body.name).toContain("XFree");
      expect(body.start_url).toBe("/home/");
    });
  });

  it("serves /home/robots.txt", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/home/robots.txt`);
      expect(res.status).toBe(200);
      const body = await res.text();
      expect(body).toMatch(/User-agent:/);
      expect(body).toMatch(/Sitemap:/);
    });
  });
});

describe("GET /api/v1/stats (lightweight public counts)", () => {
  it("returns tool and pillar counts from the public collections", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/stats`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(typeof body.tools).toBe("number");
      expect(typeof body.pillars).toBe("number");
      expect(body.tools).toBeGreaterThan(0);
      expect(body.pillars).toBeGreaterThan(0);
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
