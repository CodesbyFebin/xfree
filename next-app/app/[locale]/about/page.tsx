import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/navigation';
import { buildAlternates } from '@/lib/canonical';
import type { Locale } from '@/i18n/routing';
import { TOOLS } from '@/lib/data/tools';
import { PILLARS } from '@/lib/data/pillars';
import { GUIDES } from '@/lib/data/guides';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'About XFree - Free Developer & SEO Tools Platform',
    description: 'Learn about XFree.in - a privacy-first platform of free browser-based developer, SEO, and AI micro-tools. No registration, no paywalls.',
    alternates: buildAlternates('/about', locale),
  };
}

const ABOUT_FAQS = [
  {
    q: 'Who is XFree for?',
    a: 'Developers debugging JSON or regex, SEO practitioners building sitemaps and meta tags, and anyone who needs a quick encode, hash, or format done without installing anything or sending data to a server they don\'t control.',
  },
  {
    q: 'Are the tool pages ad-free?',
    a: `Yes. None of the ${TOOLS.filter((t) => t.indexable).length} tool pages carry advertising. The homepage carries a small number of ad placements to help cover hosting costs for the free tools - tool execution itself is always ad-free.`,
  },
  {
    q: 'Does XFree ever add features that require an account?',
    a: 'The core tool catalog stays account-free by design. A separate product, XFree Studio (app.xfree.in), offers an optional workspace for people who want to save and organize their work - using it is optional and the free tools never require it.',
  },
  {
    q: 'How is XFree funded?',
    a: 'Through minimal, clearly-labeled advertising on the homepage and guide pages, not through selling user data - there is none to sell, since tool processing happens in your browser and is never transmitted.',
  },
];

export default function AboutPage() {
  const indexableCount = TOOLS.filter((t) => t.indexable).length;

  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono">
              About XFree.in
            </h1>
            <p className="text-cyber-muted text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
              A small, focused platform of free browser-based developer, SEO, and AI micro-tools.
            </p>
          </div>

          <div className="space-y-6 text-cyber-muted text-sm sm:text-base leading-relaxed cyber-card p-8">
            <h2 className="text-2xl font-bold text-white">Our Mission</h2>
            <p>
              We created XFree.in because existing online converter and formatting sites are slow, cluttered with invasive ads, and upload sensitive user code to unknown backend servers.
            </p>
            <p>
              XFree.in delivers a curated catalog of {indexableCount} single-purpose micro-tools, organized into {PILLARS.length} topic pillars, that execute 100% locally in browser memory wherever the operation allows it. No registration required, no hidden paywalls, and zero latency.
            </p>
            <p>
              The catalog is intentionally uneven in depth: some tools (JSON formatting, regex testing, hashing, encoding) are mature and heavily used; others are newer and still growing. Where a tool isn&apos;t built yet, it&apos;s tracked honestly on the <Link href="/roadmap" className="text-cyber-glow hover:underline">public roadmap</Link> rather than listed as available.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-cyber-border">
              <div className="p-4 rounded-xl bg-cyber-bg border border-cyber-border space-y-1">
                <h4 className="font-bold text-emerald-400">100% Free</h4>
                <p className="text-xs text-cyber-muted">No trial limits or paywalls.</p>
              </div>
              <div className="p-4 rounded-xl bg-cyber-bg border border-cyber-border space-y-1">
                <h4 className="font-bold text-cyan-400">Privacy First</h4>
                <p className="text-xs text-cyber-muted">Local browser JS sandbox.</p>
              </div>
              <div className="p-4 rounded-xl bg-cyber-bg border border-cyber-border space-y-1">
                <h4 className="font-bold text-purple-400">Instant Speed</h4>
                <p className="text-xs text-cyber-muted">Zero network upload wait.</p>
              </div>
            </div>
          </div>

          <div className="cyber-card p-8 space-y-6">
            <h2 className="text-2xl font-bold text-white">Core Principles</h2>
            <div className="space-y-4 text-cyber-muted">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-cyber-glow/10 border border-cyber-glow/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">⚡</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Zero Latency</h3>
                  <p className="text-sm">All tools run instantly in your browser. No server round-trips, no loading spinners.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🔒</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Complete Privacy</h3>
                  <p className="text-sm">Your data never leaves your browser. No logs, no analytics on your input, no data collection.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">✕</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Ad-Free Tools</h3>
                  <p className="text-sm">Every tool page is free of advertising. The homepage carries a small number of placements to help fund hosting.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="cyber-card p-8 space-y-4">
            <h2 className="text-2xl font-bold text-white">Frequently Asked Questions</h2>
            <div className="space-y-2">
              {ABOUT_FAQS.map((faq, i) => (
                <details key={i} className="border-b border-cyber-border last:border-0 py-3" open={i === 0}>
                  <summary className="font-semibold text-white text-sm cursor-pointer">{faq.q}</summary>
                  <p className="text-sm text-cyber-muted mt-2 leading-relaxed">{faq.a}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="cyber-card p-8 space-y-4 text-center">
            <h2 className="text-xl font-bold text-white">Go Deeper</h2>
            <p className="text-sm text-cyber-muted">
              Read the <Link href="/how-it-works" className="text-cyber-glow hover:underline">technical breakdown</Link> of how local processing works, browse the <Link href="/guides" className="text-cyber-glow hover:underline">{GUIDES.length} developer guides</Link>, or jump straight into the <Link href="/pillars" className="text-cyber-glow hover:underline">full tool directory</Link>.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
