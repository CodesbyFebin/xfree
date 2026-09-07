import { Metadata } from 'next';
import { Link } from '@/i18n/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TOOLS } from '@/lib/data/tools';
import { buildAlternates } from '@/lib/canonical';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Use Cases | XFree',
    description: 'See how developers, SEO professionals, and creators use XFree tools.',
    alternates: buildAlternates('/use-cases', locale),
  };
}

// Tool names verified against lib/data/tools.ts TOOLS.title - this
// replaced two fabricated names ("Schema Markup Generator", "Text
// Cleaner") that matched no real tool in the catalog.
const useCases = [
  {
    icon: '👨‍💻',
    title: 'For Developers',
    description: 'Format JSON, test regex patterns, encode URLs, generate UUIDs, and debug APIs.',
    tools: ['JSON Formatter', 'Regex Tester', 'Base64 Encoder', 'UUID v4 Generator'],
  },
  {
    icon: '📈',
    title: 'For SEO Professionals',
    description: 'Generate sitemaps, create meta tags, build UTM links, and build robots.txt files.',
    tools: ['XML Sitemap Generator', 'Meta Tag Generator', 'UTM Builder', 'robots.txt Generator'],
  },
  {
    icon: '✍️',
    title: 'For Content Creators',
    description: 'Write in Markdown, count words, convert case, and diff text for publishing.',
    tools: ['Word Counter', 'Case Converter', 'Markdown Editor'],
  },
  {
    icon: '🔒',
    title: 'For Security',
    description: 'Generate secure passwords, hash data, and decode JWTs.',
    tools: ['Password Generator', 'Hash Generator', 'JWT Decoder'],
  },
];

export default function UseCasesPage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">
          <header className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono">Use Cases</h1>
            <p className="text-cyber-muted max-w-2xl mx-auto">
              See how different professionals use XFree tools in their daily work.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {useCases.map((useCase, i) => (
              <div key={i} className="cyber-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{useCase.icon}</span>
                  <h2 className="text-xl font-bold text-white">{useCase.title}</h2>
                </div>
                <p className="text-cyber-muted text-sm">{useCase.description}</p>
                <div className="flex flex-wrap gap-2">
                  {useCase.tools.map((tool) => (
                    <span
                      key={tool}
                      className="text-xs font-mono px-2 py-1 rounded bg-cyber-surface border border-cyber-border text-cyber-muted"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="cyber-card p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-white">Ready to get started?</h2>
            <p className="text-cyber-muted text-sm">
              Browse our {TOOLS.length}+ free tools and find what you need.
            </p>
            <Link
              href="/pillars"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyber-glow text-cyber-bg font-bold text-sm hover:bg-cyber-glow/90 transition-colors"
            >
              Browse All Tools
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
