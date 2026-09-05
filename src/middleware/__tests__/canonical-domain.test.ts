import { describe, it, expect, beforeEach } from "vitest";
import { canonicalDomainMiddleware } from "../canonical-domain";

function mockReq(host: string | undefined, path: string, url: string = path) {
  return {
    headers: { host: host ? `${host}:443` : undefined },
    path,
    url,
  } as any;
}

function mockRes() {
  const headers: Record<string, string> = {};
  return {
    redirect: (status: number, location: string) => {
      headers["redirect-status"] = String(status);
      headers["redirect-location"] = location;
    },
    headers,
    status: (_code: number) => ({ send: () => {} }),
  } as any;
}

describe("canonicalDomainMiddleware", () => {
  it("redirects apex domain to www with same path and query", () => {
    const req = mockReq("xfree.in", "/compress-pdf", "/compress-pdf?foo=bar");
    const res = mockRes();
    let nextCalled = false;
    canonicalDomainMiddleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.headers["redirect-status"]).toBe("301");
    expect(res.headers["redirect-location"]).toBe("https://www.xfree.in/compress-pdf?foo=bar");
  });

  it("redirects /studio on www to app.xfree.in", () => {
    const req = mockReq("www.xfree.in", "/studio", "/studio");
    const res = mockRes();
    let nextCalled = false;
    canonicalDomainMiddleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.headers["redirect-status"]).toBe("301");
    expect(res.headers["redirect-location"]).toBe("https://app.xfree.in/");
  });

  it("redirects /studio/foo on apex to app.xfree.in/foo", () => {
    const req = mockReq("xfree.in", "/studio/dashboard", "/studio/dashboard");
    const res = mockRes();
    let nextCalled = false;
    canonicalDomainMiddleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.headers["redirect-location"]).toBe("https://app.xfree.in/dashboard");
  });

  it("does not redirect localhost", () => {
    const req = mockReq("localhost", "/some-path");
    const res = mockRes();
    let nextCalled = false;
    canonicalDomainMiddleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(res.headers["redirect-status"]).toBeUndefined();
  });

  it("does not redirect 127.0.0.1", () => {
    const req = mockReq("127.0.0.1", "/some-path");
    const res = mockRes();
    let nextCalled = false;
    canonicalDomainMiddleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  it("passes through to next when host is www.xfree.in and path is not /studio", () => {
    const req = mockReq("www.xfree.in", "/tools/compress-pdf");
    const res = mockRes();
    let nextCalled = false;
    canonicalDomainMiddleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
    expect(res.headers["redirect-status"]).toBeUndefined();
  });

  it("passes through to next when host is app.xfree.in", () => {
    const req = mockReq("app.xfree.in", "/dashboard");
    const res = mockRes();
    let nextCalled = false;
    canonicalDomainMiddleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(true);
  });

  it("handles uppercase host header", () => {
    const req = mockReq("XFree.in", "/path");
    const res = mockRes();
    let nextCalled = false;
    canonicalDomainMiddleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.headers["redirect-location"]).toBe("https://www.xfree.in/path");
  });

  it("redirects /studio with trailing slash", () => {
    const req = mockReq("xfree.in", "/studio/", "/studio/");
    const res = mockRes();
    let nextCalled = false;
    canonicalDomainMiddleware(req, res, () => { nextCalled = true; });
    expect(nextCalled).toBe(false);
    expect(res.headers["redirect-location"]).toBe("https://app.xfree.in/");
  });
});
