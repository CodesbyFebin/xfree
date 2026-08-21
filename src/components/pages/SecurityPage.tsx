import React from "react";
import { ShieldCheck } from "lucide-react";

export const SecurityPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Security</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Security</h1>
        <p className="text-slate-400 text-xs font-mono">Last updated: 2026-08-22</p>
      </div>

      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">Overview</h2>
          <p>
            This page describes what we actually do to protect the platform and your data. It's kept
            honest — no marketing "military-grade" language. If a claim is on this page, the code that
            backs it is in the public repository at{" "}
            <a href="https://github.com/CodesbyFebin/xfree" className="text-cyan-300 underline" target="_blank" rel="noreferrer">github.com/CodesbyFebin/xfree</a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Transport</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>HTTPS enforced. HSTS with a one-year <code>max-age</code> on every response.</li>
            <li>HTTP to HTTPS and apex to <code>www</code> are handled by our host (Vercel) via 308 redirect.</li>
            <li>TLS terminates at Vercel's edge; certificates are managed and rotated by Vercel.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Security headers</h2>
          <p>
            Sent on every response — set both by Express middleware ({" "}
            <code>src/middleware/security-headers.ts</code>) and by <code>vercel.json</code> so that
            static prerendered pages get them too:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Content-Security-Policy</strong> — allowlist restricted to <code>self</code>, Google AdSense, and Google Funding Choices (see the file for the exact directives). No <code>unsafe-eval</code>. <code>frame-ancestors 'none'</code> prevents this site from being iframed.</li>
            <li><strong>Strict-Transport-Security</strong> — <code>max-age=31536000; includeSubDomains; preload</code>.</li>
            <li><strong>X-Frame-Options: DENY</strong>, <strong>X-Content-Type-Options: nosniff</strong>.</li>
            <li><strong>Referrer-Policy: strict-origin-when-cross-origin</strong>.</li>
            <li><strong>Permissions-Policy</strong> — geolocation, microphone, camera, payment, USB, display-capture, and interest-cohort all denied.</li>
            <li><strong>COOP: same-origin</strong>, <strong>CORP: same-origin</strong>.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Local tools</h2>
          <p>
            The ten wired tools (JSON formatter, regex tester, cron generator, base64/JWT decoder, URL
            slug &amp; UTM builder, meta-tag preview, schema markup generator, robots.txt generator,
            XML sitemap generator, bulk URL extractor) execute entirely in your browser. Your input is
            never transmitted to XFree.in servers for these tools. Nothing is logged, saved, or
            associated with you.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. AI tools</h2>
          <p>
            Cloud AI features proxy your submitted input through XFree.in to the provider identified in the UI,
            currently Google Gemini or NVIDIA NIM. Every cloud feature
            page discloses this on the page itself. Server-side controls:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Task allowlist</strong> — the browser can only trigger predefined server-side prompts (regex generator, JSON repair, meta optimizer, SQL generator, search intent, code explainer, commit generator, schema generator, general). Client-supplied system instructions are rejected with HTTP 400.</li>
            <li><strong>Zod validation</strong> on every request body — input length caps, message-count caps, allowed roles, unknown fields rejected.</li>
            <li><strong>Timeouts</strong> — every Gemini call is aborted after 30 s via <code>AbortController</code>.</li>
            <li><strong>Rate limits</strong> — per-IP per-minute, per-IP per-day, per-IP-per-day for the thinking endpoint, plus a global daily cap. Enforced via an in-memory bucket keyed on a hashed IP. Exceeded requests return HTTP 429 with <code>Retry-After</code>.</li>
            <li><strong>No prompt persistence</strong> — the application does not intentionally save the body of your prompt. Hosting and infrastructure providers may process operational logs under their own policies.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">5. Contact, feedback, lead-capture</h2>
          <p>
            All three forms are Zod-validated, honeypot-protected, and rate-limited (5/hour for
            contact, 10/hour for feedback, 3/hour for lead). Delivery goes through Resend when the API
            key is configured; otherwise the payload is logged for operator review. The lead-capture
            popup requires an explicit consent checkbox before submission.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">6. Advertising (Google AdSense)</h2>
          <p>
            The site loads Google AdSense on every page for advertising. AdSense sets its own cookies
            and collects data as described in{" "}
            <a href="/privacy" className="text-cyan-300 underline">our Privacy Policy</a> and Google's
            own policies. AdSense operates in the visitor's browser — we do not receive the
            advertising-cookie contents. Consent choices, where presented, are managed through the
            controls shown in the site or browser.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">7. Secrets and configuration</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Google Gemini and NVIDIA API keys live in the Vercel environment. They are never sent to the browser and never appear in server responses.</li>
            <li>NVIDIA model IDs are discovered and validated server-side before inference; a stale manual selection falls back to another currently available model.</li>
            <li>The IndexNow key is public by protocol design — search engines verify it by fetching <code>/{"<key>"}.txt</code>.</li>
            <li>No credentials, tokens, or private keys are committed to the repository. Environment validation ({" "}
              <code>src/server/env.ts</code>) checks this at boot.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">8. Error handling</h2>
          <p>
            The server never returns stack traces, environment values, filesystem paths, or provider
            error payloads to clients. Every response includes a request ID for correlation with our
            logs if you need to report an issue.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">9. Known limitations</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>The rate limiter is in-memory. On a scaled deployment (multiple function instances) the counters don't share state between instances — Vercel serverless can spawn many instances under load. The interface is Redis-swappable but not currently backed by Redis.</li>
            <li>No first-party analytics beyond server access logs. If we add analytics later, this page and the Privacy Policy will be updated first.</li>
            <li>The AI tools' HTTP responses do not currently stream — long generations block up to 30 s before returning.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">10. Reporting a vulnerability</h2>
          <p>
            If you find a vulnerability, email{" "}
            <a href="mailto:security@xfree.in" className="text-cyan-300 underline">security@xfree.in</a>.
            Please give us reasonable time to respond before public disclosure. We don't currently run
            a paid bounty program.
          </p>
        </section>
      </div>
    </div>
  );
};
