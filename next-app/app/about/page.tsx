import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'About XFree - Free Developer & SEO Tools Platform',
  description: 'Learn about XFree.in - a privacy-first platform of free browser-based developer, SEO, and AI micro-tools. No registration, no paywalls.',
};

export default function AboutPage() {
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
              XFree.in delivers a small, curated set of single-purpose micro-tools that execute 100% locally in browser memory. No registration required, no hidden paywalls, and zero latency.
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
                  <h3 className="font-semibold text-white mb-1">No Ads</h3>
                  <p className="text-sm">Clean, focused interfaces without invasive advertising or dark patterns.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
