import React from "react";
import { Download, Smartphone, Monitor, ShieldCheck, Zap, ArrowRight } from "lucide-react";

interface Props {
  onGoHome: () => void;
  onOpenTools: () => void;
}

export const XFreeAppPage: React.FC<Props> = ({ onGoHome: _onGoHome, onOpenTools }) => (
  <article className="max-w-3xl mx-auto py-10 px-4 space-y-10 text-slate-200">
    <header className="space-y-4">
      <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">XFree App</h1>
      <p className="text-slate-300 text-base leading-relaxed">
        XFree is a free browser-based platform. There's no download from an app store — the "app" is a
        Progressive Web App you can install straight from your browser. Once installed, XFree opens in
        its own window with your saved tools one click away.
      </p>
      <button
        onClick={onOpenTools}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-colors"
      >
        Open the tools directory
        <ArrowRight className="w-4 h-4" />
      </button>
    </header>

    <section className="space-y-4">
      <h2 className="text-xl font-bold text-white">What "installing" XFree actually does</h2>
      <p className="text-sm leading-relaxed">
        A PWA install adds an icon to your device (dock on macOS, taskbar on Windows, home screen on
        Android/iOS) that opens XFree in a standalone window without browser chrome. It's the same site
        — no separate binary, no permissions beyond what a normal browser tab already has, no background
        processes. You can uninstall it any time and lose nothing; your saved tools are in your browser
        profile.
      </p>
    </section>

    <section className="grid gap-4 md:grid-cols-3">
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
        <Monitor className="w-5 h-5 text-cyan-400" />
        <h3 className="font-bold text-white text-sm">Desktop (Chrome, Edge, Brave)</h3>
        <p className="text-xs text-slate-300">
          Look for the install icon in the address bar (a small monitor with a down arrow), or open the
          browser menu → "Install XFree." Safari on macOS: File → Add to Dock.
        </p>
      </div>
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
        <Smartphone className="w-5 h-5 text-cyan-400" />
        <h3 className="font-bold text-white text-sm">Android (Chrome, Firefox)</h3>
        <p className="text-xs text-slate-300">
          Chrome shows an "Install" prompt after a few seconds of use, or tap the browser menu and pick
          "Install app." Firefox: menu → "Install."
        </p>
      </div>
      <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
        <Smartphone className="w-5 h-5 text-cyan-400" />
        <h3 className="font-bold text-white text-sm">iOS / iPadOS (Safari)</h3>
        <p className="text-xs text-slate-300">
          Tap the Share button, then "Add to Home Screen." iOS PWAs run in a standalone window with the
          full XFree toolset available offline where the tool works locally.
        </p>
      </div>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-bold text-white">What's included</h2>
      <ul className="grid gap-3 md:grid-cols-2 text-sm">
        <li className="flex items-start gap-2"><Zap className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" /><span>Every published XFree tool: regex tester, JSON formatter, JWT decoder, cron generator, sitemap generator, meta-tag preview, schema-markup generator, robots.txt generator, URL/UTM builder, base64 encoder.</span></li>
        <li className="flex items-start gap-2"><ShieldCheck className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" /><span>Local tools run entirely in your browser — no network round-trip, no server processing.</span></li>
        <li className="flex items-start gap-2"><Zap className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" /><span>AI tools proxy through xfree.in to Google Gemini. Each AI tool discloses this on its page.</span></li>
        <li className="flex items-start gap-2"><Download className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" /><span>Under 200 KB gzipped for the initial page. Tools load on demand.</span></li>
      </ul>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-bold text-white">Privacy</h2>
      <p className="text-sm leading-relaxed">
        Local tools do not send your input anywhere. AI tools send your input to xfree.in and forward it
        to Google Gemini for processing; we do not persist the prompt body by default. Rate-limit metadata
        uses a hashed IP that is never joined with content. See the <a href="/privacy" className="text-cyan-300 underline">privacy page</a> for the full breakdown.
      </p>
    </section>

    <section className="space-y-4">
      <h2 className="text-xl font-bold text-white">FAQ</h2>
      <dl className="space-y-4 text-sm">
        <div>
          <dt className="font-bold text-white">Is there an iOS or Android native app?</dt>
          <dd className="text-slate-300 mt-1">No. XFree is a Progressive Web App — installed straight from Safari or Chrome, no app store. This is deliberate: you get the same version instantly and there's nothing to review before an update ships.</dd>
        </div>
        <div>
          <dt className="font-bold text-white">Does it work offline?</dt>
          <dd className="text-slate-300 mt-1">Local tools work offline once the tool page has loaded once. AI tools need a connection because they proxy to Google Gemini.</dd>
        </div>
        <div>
          <dt className="font-bold text-white">How do I uninstall?</dt>
          <dd className="text-slate-300 mt-1">Same as any PWA — right-click the app icon and pick "Uninstall" (desktop), or long-press the home-screen icon and pick "Remove" (mobile). Nothing lingers.</dd>
        </div>
        <div>
          <dt className="font-bold text-white">Are you the same XFree that runs at xfree.com?</dt>
          <dd className="text-slate-300 mt-1">No. XFree is the free browser-based tools platform at <strong>xfree.in</strong>. Other sites at similar-looking domains are unrelated.</dd>
        </div>
      </dl>
    </section>
  </article>
);
