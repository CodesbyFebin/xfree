import type { Request, Response, NextFunction } from "express";
import { isProduction } from "../server/env";

// CSP for AdSense + the opt-in local WebGPU brain.
//
// WebLLM is NOT loaded during normal tool use. When a user explicitly enables
// WebGPU Brain, Studio imports a pinned WebLLM ESM build from jsDelivr and the
// runtime downloads its model weights/libraries from the official MLC/Hugging
// Face locations. `wasm-unsafe-eval` permits WebAssembly compilation without
// granting JavaScript `unsafe-eval`.
//
// Google recommends a nonce-based strict CSP for AdSense; we're on an allowlist
// for now. See https://support.google.com/adsense/answer/16283098.
const CSP_DIRECTIVES = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://cdn.jsdelivr.net https://pagead2.googlesyndication.com https://adservice.google.com https://tpc.googlesyndication.com https://www.googletagservices.com https://fundingchoicesmessages.google.com",
  "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://pagead2.googlesyndication.com https://adservice.google.com https://tpc.googlesyndication.com https://www.googletagservices.com https://fundingchoicesmessages.google.com",
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https: https://*.googlesyndication.com https://*.doubleclick.net https://*.google.com",
  "font-src 'self' data:",
  "connect-src 'self' https://cdn.jsdelivr.net https://huggingface.co https://*.huggingface.co https://*.hf.co https://*.xethub.hf.co https://raw.githubusercontent.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://ad.doubleclick.net https://adservice.google.com https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google https://csi.gstatic.com https://fundingchoicesmessages.google.com",
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
