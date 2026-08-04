import React from "react";
import { ShieldCheck } from "lucide-react";

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Privacy Policy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Privacy Policy</h1>
        <p className="text-slate-400 text-xs font-mono">Last updated: 2026-08-03</p>
      </div>

      <div className="p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">Summary</h2>
          <p>
            XFree.in is a free browser-based platform of developer, SEO, and single-purpose AI micro-tools. This
            page explains what data we handle and how, split by which part of the site you interact with.
          </p>
          <p className="text-slate-400">
            <strong>TODO before shipping to production:</strong> replace the "Operator" contact block below with
            your real legal entity name, jurisdiction, and reachable email. This template ships without that so
            we don't fabricate identity information.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Local tools (JSON, regex, base64/JWT, cron, sitemap, robots.txt, meta-tag, schema, URL/UTM)</h2>
          <p>
            These tools process your input entirely in your browser. The input string never leaves your device
            and is not transmitted to XFree.in's servers. Nothing is logged, saved, or associated with you when
            you use these tools.
          </p>
          <p>
            Some tools store your input, output, or preferences in your browser's local storage so favorites and
            recent items persist across visits. This data lives in your browser and can be cleared via your
            browser's site-data controls at any time.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. AI tools (regex generator, JSON repair, meta optimizer, SQL, code explainer, commit generator, schema, search intent)</h2>
          <p>
            Every tool page marked as AI-powered explicitly says so. When you submit input to one of these
            tools, the input is sent to XFree.in's server, which forwards it to Google Gemini for processing and
            returns the model output to you.
          </p>
          <p>
            We do not persist AI prompt bodies by default. We do log request metadata for abuse protection
            (timestamp, endpoint, response status, latency, a truncated hash of your IP address for rate
            limiting). We do not attempt to identify you and do not join this metadata to your prompt content.
          </p>
          <p>
            Google Gemini's use of your input is governed by Google's own terms and privacy policy. Do not paste
            secrets, personally identifying information, or regulated data (health, financial, biometric) into
            AI tools.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Contact, feedback, and lead-capture forms</h2>
          <p>
            When you submit a contact form, feedback widget, or lead-capture popup, the information you provide
            (your email if you gave one, your message, and the page path) is transmitted to our server and
            emailed to us via Resend or logged for review. We use this only to answer your message.
          </p>
          <p>
            The lead-capture popup requires an explicit consent checkbox before submission. You may unsubscribe
            from any follow-up email at any time.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. Advertising: Google AdSense</h2>
          <p>
            XFree.in displays advertisements served by Google AdSense. Google and its partners use cookies and
            similar technologies to serve ads, measure their performance, and personalize content where allowed
            by law.
          </p>
          <p>
            AdSense may collect and process information including your IP address, browser type, device
            information, referring pages, pages viewed, and interaction data. Google may use this to serve ads
            based on your prior visits to this and other websites.
          </p>
          <p>
            You can opt out of personalized advertising at{" "}
            <a href="https://www.google.com/settings/ads" className="text-cyan-300 underline" target="_blank" rel="noreferrer">
              google.com/settings/ads
            </a>{" "}
            or via the industry opt-out at{" "}
            <a href="https://youradchoices.com/" className="text-cyan-300 underline" target="_blank" rel="noreferrer">
              youradchoices.com
            </a>.
            You can also disable third-party cookies in your browser to limit ad personalization.
          </p>
          <p>
            For visitors in the European Economic Area, the United Kingdom, and Switzerland, we operate a
            Google-certified Consent Management Platform (CMP) that asks for your consent choices before
            personalized ads are served. Choices can be revisited via the CMP link in the site footer.
          </p>
          <p>
            Third-party vendors — including Google — may also use cookies to serve ads based on user visits to
            this and other sites. A list of Google's ad-technology providers is available at{" "}
            <a href="https://policies.google.com/technologies/partner-sites" className="text-cyan-300 underline" target="_blank" rel="noreferrer">
              policies.google.com/technologies/partner-sites
            </a>.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">5. Cookies and local storage</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Essential</strong>: browser local storage for favorites, recents, and workspace state. Not shared with anyone.</li>
            <li><strong>Rate-limit protection</strong>: a hashed IP-based counter to prevent AI-endpoint abuse. Not joined to content.</li>
            <li><strong>Advertising</strong>: Google AdSense and its partners set cookies used to deliver, measure, and personalize ads. See section 4.</li>
            <li><strong>Analytics</strong>: we do not currently run any first-party analytics beyond server access logs. This section will be updated if that changes.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">6. Data retention</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Local-tool input: never leaves your browser; not retained by us at all.</li>
            <li>AI-tool metadata (rate-limit hashes, response timings): retained for up to 30 days for abuse investigation, then discarded.</li>
            <li>Contact and lead-capture messages: retained until we reply and for up to 24 months for support-history purposes, then discarded.</li>
            <li>AdSense-related cookies: retention governed by Google's policies.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">7. Children</h2>
          <p>
            XFree.in is not directed to children under 13 (or the equivalent minimum age in your jurisdiction).
            We do not knowingly collect data from children. If you believe a child has submitted a form or
            interacted with the AI tools, contact us and we will delete the associated data.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">8. Your rights</h2>
          <p>
            Depending on where you live (EEA/UK GDPR, California CCPA/CPRA, and others), you may have the right
            to access, correct, or delete personal data we hold about you, to object to certain processing, and
            to withdraw consent for advertising personalization at any time. To exercise any of these rights,
            contact us at the address in the Operator section below.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">9. Changes to this policy</h2>
          <p>
            We may update this policy as the platform evolves. Substantive changes will be announced on the
            homepage or via the site's footer. The "Last updated" date at the top always reflects the current
            version.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">10. Operator and contact</h2>
          <p className="text-amber-300 bg-amber-950/30 border border-amber-800 rounded-xl p-4">
            <strong>TODO — placeholder identity, do not ship as-is.</strong> Replace with your actual legal
            entity name, registered address or jurisdiction, and a working support email at an @xfree.in
            address. AdSense reviewers verify that contact information is real and reachable.
          </p>
          <p>
            Operator: <strong>[Your legal entity or trading name]</strong><br />
            Jurisdiction: <strong>[e.g. Kerala, India]</strong><br />
            Contact: <a href="mailto:privacy@xfree.in" className="text-cyan-300 underline">privacy@xfree.in</a>{" "}
            or via the <a href="/contact" className="text-cyan-300 underline">contact form</a>.
          </p>
        </section>
      </div>
    </div>
  );
};
