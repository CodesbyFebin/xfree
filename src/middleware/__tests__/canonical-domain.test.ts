import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";
import { canonicalDomainMiddleware } from "../canonical-domain";

function mockReqRes(host: string, path: string, originalUrl?: string) {
  const req = {
    headers: { host: host.toLowerCase() },
    path,
    originalUrl: originalUrl ?? path,
    secure: host.startsWith("https") ? true : false,
  } as unknown as Request;
  const headers: Record<string, string> = {};
  let status = 0;
  const res = {
    setHeader: (k: string, v: string) => { headers[k] = v; return res; },
    getHeader: (k: string) => headers[k],
    redirect: (code: number, target: string) => { status = code; return res; },
    status: (code: number) => { status = code; return res; },
    headers,
    get statusCode() { return status; },
  } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next, headers };
}

describe("canonicalDomainMiddleware", () => {
  it("redirects apex xfree.in to www.xfree.in (308)", () => {
    const { req, res, next } = mockReqRes("xfree.in", "/tools/json-formatter");
    canonicalDomainMiddleware(req, res, next);
    expect((res as any).statusCode).toBe(308);
  });

  it("redirects /studio to app.xfree.in/ on www and app hosts", () => {
    const { req: r1, res: s1, next: n1 } = mockReqRes("www.xfree.in", "/studio");
    canonicalDomainMiddleware(r1, s1, n1);
    expect((s1 as any).statusCode).toBe(308);

    const { req: r2, res: s2, next: n2 } = mockReqRes("app.xfree.in", "/studio/");
    canonicalDomainMiddleware(r2, s2, n2);
    expect((s2 as any).statusCode).toBe(308);
  });

  it("redirects studio.xfree.in to app.xfree.in/", () => {
    const { req, res, next } = mockReqRes("studio.xfree.in", "/anything");
    canonicalDomainMiddleware(req, res, next);
    expect((res as any).statusCode).toBe(308);
  });

  it("sets X-Robots-Tag on /_app-shell without redirecting", () => {
    const { req, res, next, headers } = mockReqRes("www.xfree.in", "/_app-shell");
    canonicalDomainMiddleware(req, res, next);
    expect(headers["X-Robots-Tag"]).toBe("noindex, nofollow");
    expect(next).toHaveBeenCalled();
  });

  it("passes through normal www.xfree.in tool pages", () => {
    const { req, res, next } = mockReqRes("www.xfree.in", "/tools/json-formatter");
    canonicalDomainMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
