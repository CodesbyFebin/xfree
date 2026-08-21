import React from "react";
import { ShieldCheck } from "lucide-react";

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Local-first privacy</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Privacy Policy</h1>
        <p className="text-slate-400 text-xs font-mono">Last updated: 22 August 2026</p>
      </header>

      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-7 text-slate-300 text-sm leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">Summary</h2>
          <p>
            XFree.in provides browser-based developer and SEO utilities. Published Local Mode tools process the
            working content you enter inside your browser. XFree also uses services needed to operate the site,
            respond to messages, prevent abuse, and display advertising. This policy explains those separate
            data flows so you can make an informed choice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">1. Local Mode tools</h2>
          <p>
            Local Mode is the default for published formatters, validators, converters, generators, and similar
            utilities. Tool input and generated output are processed by JavaScript in your browser and are not
            intentionally sent to XFree.in or an AI provider.
          </p>
          <p>
            Favorites, recent activity, and saved workspace preferences may be stored in your browser using
            local storage. You can remove this information through XFree controls where available or by clearing
            site data in your browser.
          </p>
          <p>
            Local processing does not mean the entire website is offline or connection-free. Your browser still
            requests the website, static assets, and any advertising or consent resources described below.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">2. Optional Cloud AI Mode</h2>
          <p>
            A feature marked Cloud AI or AI-powered may send the content you deliberately submit to XFree.in's
            server and then to the provider identified in that feature, currently Google Gemini or NVIDIA NIM.
            NVIDIA Studio requests use only a model currently reported as available to the configured NVIDIA
            account. Cloud processing
            is not used merely because you open a Local Mode tool.
          </p>
          <p>
            Before using Cloud AI, remove passwords, access tokens, private keys, confidential business data,
            health information, financial information, and other sensitive personal data. Provider processing is
            also governed by the provider's applicable terms and privacy policy.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">3. Service and security information</h2>
          <p>
            Hosting and server infrastructure may process ordinary request information such as IP address,
            requested path, timestamp, browser or user-agent information, response status, and diagnostic data.
            XFree may also use request counters or pseudonymous identifiers to rate-limit endpoints, investigate
            errors, and protect the service from abuse.
          </p>
          <p>
            We do not use the text entered into Local Mode tools as server-side analytics data because that text
            is not submitted to those endpoints.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">4. Contact and feedback</h2>
          <p>
            If you submit a contact, feedback, or similar form, XFree processes the information you choose to
            provide, such as your email address, message, tool identifier, and page path. This information is used
            to respond, troubleshoot, and improve the service. Delivery infrastructure may include Resend when
            configured.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">5. Google AdSense and cookies</h2>
          <p>
            XFree.in uses Google AdSense. Google and participating advertising partners may use cookies or similar
            technologies to deliver ads, measure performance, limit repetition, prevent fraud, and personalize ads
            where permitted. Information processed by advertising services may include IP address, device and
            browser information, referring page, pages viewed, and advertising interactions.
          </p>
          <p>
            You can manage Google advertising preferences at{" "}
            <a href="https://adssettings.google.com/" className="text-cyan-300 underline" target="_blank" rel="noopener noreferrer">
              Google Ads Settings
            </a>{" "}
            and learn how Google uses information from partner sites at{" "}
            <a href="https://policies.google.com/technologies/partner-sites" className="text-cyan-300 underline" target="_blank" rel="noopener noreferrer">
              Google's partner-sites policy
            </a>.
          </p>
          <p>
            Where consent is legally required, advertising behavior and available choices must follow the consent
            interface presented to you. You can also restrict cookies through your browser settings.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">6. Retention</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Local Mode tool input and output are not retained by XFree because they are not submitted.</li>
            <li>Browser-local workspace data remains until you clear it.</li>
            <li>Operational logs are retained only as reasonably needed for security, diagnostics, and abuse prevention.</li>
            <li>Contact and feedback records may be retained while the request is active and for reasonable support history.</li>
            <li>Advertising-cookie retention is controlled by Google and participating providers.</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">7. Data sharing</h2>
          <p>
            XFree does not sell the content entered into Local Mode tools. Information may be handled by service
            providers acting on the site's behalf, including hosting, message delivery, AI processing when you
            choose Cloud AI (including Google and NVIDIA), and advertising providers. Information may also be disclosed when legally required
            or necessary to protect users and the service.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">8. Your choices and rights</h2>
          <p>
            Depending on your location, you may have rights to request access, correction, deletion, restriction,
            or objection regarding personal data XFree controls. You may also withdraw consent where processing
            relies on consent. Requests can be sent using the contact details below. XFree may need enough
            information to verify and fulfill a request.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">9. Children</h2>
          <p>
            XFree.in is a general technical-utility service and is not directed to children under 13 or the
            applicable minimum age in their jurisdiction. Contact us if you believe a child has submitted personal
            information through a form or Cloud AI feature.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">10. Changes</h2>
          <p>
            This policy may be updated as XFree adds tools, providers, or processing modes. The effective date at
            the top identifies the latest published version. Material changes will be communicated through an
            appropriate site notice.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-white">11. Operator and contact</h2>
          <p>
            Operator: <strong>Febin Francis</strong><br />
            Location and jurisdiction: <strong>Kerala, India</strong><br />
            Privacy contact: <a href="mailto:privacy@xfree.in" className="text-cyan-300 underline">privacy@xfree.in</a><br />
            General contact: <a href="/contact" className="text-cyan-300 underline">XFree contact form</a>
          </p>
        </section>
      </div>
    </div>
  );
};
