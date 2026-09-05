import { describe, it, expect, beforeAll } from "vitest";
import { createApp } from "../app";
import { PUBLIC_PILLARS } from "../../data/pillarRegistry";

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

describe("GET /api/v1/pillars (public pillar list)", () => {
  it("returns 200 with the response shape", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/pillars`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body.pillars)).toBe(true);
      expect(typeof body.timestamp).toBe("string");
    });
  });

  it("only returns published pillars (no draft leakage)", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/pillars`);
      const body = await res.json();
      expect(body.pillars.length).toBe(PUBLIC_PILLARS.length);
      for (const p of body.pillars) {
        expect(PUBLIC_PILLARS.find((pp) => pp.slug === p.slug)).toBeDefined();
      }
    });
  });

  it("each pillar has the required fields", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/pillars`);
      const body = await res.json();
      for (const p of body.pillars) {
        expect(p).toHaveProperty("id");
        expect(p).toHaveProperty("name");
        expect(p).toHaveProperty("slug");
        expect(p).toHaveProperty("icon");
        expect(p).toHaveProperty("description");
        expect(p).toHaveProperty("headerGroup");
        expect(p).toHaveProperty("href");
        expect(p.name).toMatch(/^XFree /);
        expect(p.href).toBe(`/${p.slug}`);
      }
    });
  });

  it("sends cache-control headers", async () => {
    await withServer(async (port) => {
      const res = await fetch(`http://127.0.0.1:${port}/api/v1/pillars`);
      const cc = res.headers.get("cache-control") || "";
      expect(cc).toMatch(/max-age=/);
    });
  });
});
