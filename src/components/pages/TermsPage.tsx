import React from "react";
import { FileText } from "lucide-react";

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-300">
          <FileText className="w-4 h-4" />
          <span>Terms of Service</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Terms of Service</h1>
        <p className="text-slate-400 text-xs font-mono">Last updated: 2026-08-22</p>
      </div>

      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Acceptance</h2>
          <p>
            By using XFree.in (the "Service") you agree to these Terms. If you don't agree, don't use
            the Service. We may update these Terms; the "Last updated" date reflects the current version
            and continued use after an update means you accept the change.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. What the Service is (and isn't)</h2>
          <p>
            XFree.in is a collection of free browser-based developer, SEO, and single-purpose AI tools.
            Each tool page discloses whether processing is local (input stays in your browser) or
            cloud-powered (input is sent to our server and forwarded to the provider named in the interface,
            currently Google Gemini or NVIDIA). See the{" "}
            <a href="/privacy" className="text-cyan-300 underline">Privacy Policy</a> for full data handling.
          </p>
          <p>
            The Service is provided <strong>as-is</strong> and <strong>as-available</strong>. We don't
            guarantee uptime, correctness, or fitness for any particular purpose. The AI tool outputs
            in particular are experimental and can be wrong; verify anything you'd rely on.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Acceptable use</h2>
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use the Service for anything illegal in your jurisdiction or ours.</li>
            <li>Attempt to overload, probe, or bypass the rate limits, security controls, or abuse protections.</li>
            <li>Scrape, mirror, or systematically extract the tool implementations or content beyond normal use by search-engine crawlers respecting <code>robots.txt</code>.</li>
            <li>Submit content that infringes third-party rights, contains malware, or targets other users of the Service.</li>
            <li>Use AI tools to generate content that violates the selected provider's usage policies.</li>
          </ul>
          <p>
            We reserve the right to block IPs, revoke access, or refuse service to anyone abusing the
            platform. Rate-limit responses (HTTP 429) come with a <code>Retry-After</code> header — don't
            bypass them by rotating IPs.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. AI tools — what to expect</h2>
          <p>
            AI-powered tools proxy your input to the provider selected or identified in the interface and return the model's output. Model
            outputs are generated probabilistically and may be inaccurate, out of date, biased,
            offensive, or unsafe. You are responsible for reviewing AI output before you use, publish,
            or act on it.
          </p>
          <p>
            Nothing produced by the AI tools constitutes professional advice — legal, medical,
            financial, engineering, or otherwise. Don't paste confidential, regulated, or personal data
            (health, financial, biometric, credentials, third-party PII) into AI tools.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">5. Advertising</h2>
          <p>
            XFree.in displays advertisements via Google AdSense. Ads and their cookies are handled per
            the disclosures in our <a href="/privacy" className="text-cyan-300 underline">Privacy Policy</a>{" "}
            and Google's own terms. Ad clicks or impressions do not create any relationship between you
            and the advertiser.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">6. Intellectual property</h2>
          <p>
            The XFree.in brand, site design, and original written content (guide articles, hand-authored
            explanations) belong to the operator listed below. The names "Google Gemini", "NVIDIA", and any third-party
            marks are the property of their respective owners.
          </p>
          <p>
            You keep all rights to the content you paste into the tools. We claim no ownership over your
            inputs or your outputs.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">7. Availability, changes, and suspension</h2>
          <p>
            We may change, suspend, or discontinue any tool or the entire Service at any time without
            notice. We're a small operation and downtime happens. There is no SLA.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">8. Limitation of liability</h2>
          <p>
            To the maximum extent permitted by law, the operator is not liable for any indirect,
            incidental, consequential, or special damages arising from your use of the Service —
            including lost data, lost profits, or reliance on AI outputs. Direct liability is capped at
            the amount you paid to use the Service (which is zero).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">9. Governing law</h2>
          <p>
            These Terms are governed by the laws of India. Subject to applicable consumer-protection
            law, disputes relating to the Service will be subject to the courts located in Kerala, India.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">10. Operator and contact</h2>
          <p>
            Operator: <strong>Febin Francis</strong><br />
            Location and jurisdiction: <strong>Kerala, India</strong><br />
            Contact:{" "}
            <a href="mailto:support@xfree.in" className="text-cyan-300 underline">support@xfree.in</a>{" "}
            or via the <a href="/contact" className="text-cyan-300 underline">contact form</a>.
          </p>
        </section>
      </div>
    </div>
  );
};
