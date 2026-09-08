import { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { buildAlternates } from '@/lib/canonical';
import { getSignals } from '@/lib/signals/fetchSignals';
import { SIGNAL_CATEGORIES } from '@/lib/signals/sources';
import { SignalCard } from '@/components/signals/SignalCard';
import type { Locale } from '@/i18n/routing';

export const revalidate = 3600;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'XFree Signals — Open Web & Developer Intelligence | XFree',
    description: 'Curated developer, AI, and open-web news from Chrome, GitHub, Cloudflare, Hugging Face, OpenAI, Vercel, MDN, and more — categorized and cross-linked to XFree tools.',
    alternates: buildAlternates('/updates', locale),
  };
}

export default async function UpdatesPage() {
  const signals = await getSignals(60);

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text antialiased">
      <Header />
      <main id="main-content" className="pt-28 pb-20 px-4 max-w-5xl mx-auto">
        <div className="mb-4">
          <span className="text-xs font-mono uppercase tracking-widest text-cyber-glow">XFree Signals</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-cyber-text mb-4">Open Web &amp; Developer Intelligence</h1>
        <p className="text-cyber-muted max-w-2xl mb-4">
          Curated headlines from Chrome for Developers, GitHub, Cloudflare, Google Developers, web.dev, MDN,
          Hugging Face, OpenAI, Vercel, and Stack Overflow — categorized against XFree&apos;s pillars, with
          original XFree tool cross-links. We link to the original source for every item; we don&apos;t
          republish articles.
        </p>

        <nav className="flex flex-wrap gap-2 mb-10" aria-label="Signal categories">
          <span className="text-xs font-mono px-3 py-1.5 rounded border border-cyber-glow bg-cyber-glow/10 text-cyber-glow">All</span>
          {SIGNAL_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/updates/${cat.id}`}
              className="text-xs font-mono px-3 py-1.5 rounded border border-cyber-border text-cyber-muted hover:text-cyber-glow hover:border-cyber-glow/50"
            >
              {cat.label}
            </Link>
          ))}
        </nav>

        {signals.length === 0 ? (
          <p className="text-cyber-muted font-mono text-sm">
            No signals available right now — source feeds may be temporarily unreachable. Check back shortly.
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {signals.map((item) => (
              <SignalCard key={item.url} item={item} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
