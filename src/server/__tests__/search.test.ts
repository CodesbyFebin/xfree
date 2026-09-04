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

describe("GET /api/v1/search (public search endpoint)", () => {
  it("returns 200 with the response shape (query, total, results)", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/search?q=json`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(typeof body.query).toBe("string");
      expect(typeof body.total).toBe("number");
      expect(Array.isArray(body.results)).toBe(true);
    });
  });

  it("returns results that match the query string", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/search?q=json&kinds=tool`);
      const body = await res.json();
      expect(body.results.length).toBeGreaterThan(0);
      for (const r of body.results) {
        expect(r.kind).toBe("tool");
        expect(r.title.toLowerCase()).toContain("json");
      }
    });
  });

  it("respects the limit parameter", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/search?limit=5`);
      const body = await res.json();
      expect(body.results.length).toBeLessThanOrEqual(5);
    });
  });

  it("clamps the limit to 50 max", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/search?limit=9999`);
      const body = await res.json();
      expect(body.results.length).toBeLessThanOrEqual(50);
    });
  });

  it("returns an empty results array for nonsense input", async () => {
    await withServer(async (port) => {
      const res = await fetch(
        `http://127.0.0.1:${port}/api/v1/search?q=${encodeURIComponent("zzzzz_unlikely_match_qqqq")}`,
      );
      const body = await res.json();
      expect(body.results).toEqual([]);
      expect(body.total).toBe(0);
    });
  });

  it("filters by kinds", async () => {
    await withServer(async (port) => {
      const toolsRes = await fetch(`http://127.0.0.1:${port}/api/v1/search?q=json&kinds=tool`);
      const toolsBody = await toolsRes.json();
      for (const r of toolsBody.results) expect(r.kind).toBe("tool");

      const pillarRes = await fetch(`http://127.0.0.1:${port}/api/v1/search?q=dev&kinds=pillar`);
      const pillarBody = await pillarRes.json();
      for (const r of pillarBody.results) expect(r.kind).toBe("pillar");
    });
  });

  it("sends cache-control headers", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/search?q=json`);
      const cc = res.headers.get("cache-control") || "";
      expect(cc).toMatch(/max-age=/);
    });
  });
});
