import type { Request, Response, NextFunction } from "express";
import { isProduction } from "../server/env";

// CSP for AdSense. Google recommends a nonce-based strict CSP; we're on an
// allowlist for now. Ship this in Report-Only first, watch for violations,
// then enforce. See https://support.google.com/adsense/answer/16283098.
// The allowlist below is the minimum documented set for Auto Ads + Funding
// Choices; expect to expand it based on real CSP-report data before/after
// a certified CMP is deployed for EEA/UK visitors.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://adservice.google.com https://tpc.googlesyndication.com https://www.googletagservices.com https://fundingchoicesmessages.google.com",
  "script-src-elem 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://adservice.google.com https://tpc.googlesyndication.com https://www.googletagservices.com https://fundingchoicesmessages.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com",
  "font-src 'self' data:",
  // localhost/127.0.0.1 (any port) is allowlisted for XFree Studio's
  // optional Ollama fallback (public/studio/index.html's
  // tryOllamaFallback()), which fetches a model the *visitor* runs on
  // their own machine - never XFree's server, so this can only ever be
  // called client-side. Without this, every such request was silently
  // CSP-blocked (browser console: "Refused to connect... violates the
  // document's Content-Security-Policy"), so the feature never worked
  // regardless of whether the visitor actually had Ollama running. This
  // only ever grants the page a path back to a port on the visitor's own
  // loopback interface, not a new third-party origin - it doesn't cover a
  // custom LAN/remote Ollama host, which remains blocked (the Ollama URL
  // setting is a plain text field with no way to reflect an arbitrary
  // visitor-chosen host into a static response header).
  "connect-src 'self' http://localhost:* http://127.0.0.1:* https://localhost:* https://127.0.0.1:* https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://ad.doubleclick.net https://adservice.google.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://csi.gstatic.com https://fundingchoicesmessages.google.com",
  "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://fundingchoicesmessages.google.com",
  "upgrade-insecure-requests",
];

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction) {
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), display-capture=(), interest-cohort=()",
  );
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
  res.setHeader("Content-Security-Policy", CSP_DIRECTIVES.join("; "));
  next();
}
