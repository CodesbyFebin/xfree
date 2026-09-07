import { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Link } from '@/i18n/navigation';
import { buildAlternates } from '@/lib/canonical';
import type { Locale } from '@/i18n/routing';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    title: 'Roadmap | XFree',
    description: 'Public roadmap for XFree micro-tools - see what is coming next.',
    alternates: buildAlternates('/roadmap', locale),
  };
}

// Verified against lib/data/tools.ts before listing anything here - this
// list previously included "Color Palette Generator" and "SQL Query
// Formatter" as not-yet-built, when color-palette and sql-formatter are
// both already real, published tools with the same functionality.
const upcomingFeatures = [
  { status: 'planned', title: 'PDF to JPG Converter', description: 'Convert PDF pages to images', pillar: 'Media Tools' },
  { status: 'research', title: 'API Documentation Generator', description: 'Generate OpenAPI docs from endpoints', pillar: 'API Tools' },
  { status: 'research', title: 'Webhook Tester', description: 'Test and debug webhooks locally', pillar: 'Developer Tools' },
];

const inDevelopment = [
  { title: 'Batch JSON Processor', description: 'Process multiple JSON files at once', pillar: 'Developer Tools' },
  { title: 'HTML Entity Encoder', description: 'Encode/decode HTML entities', pillar: 'Encoding Tools' },
];

export default function RoadmapPage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">
          <header className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono">Public Roadmap</h1>
            <p className="text-cyber-muted max-w-2xl mx-auto">
              See what tools and features we are working on.
            </p>
          </header>

          <div className="cyber-card p-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500" />
              In Development
            </h2>
            <div className="space-y-4">
              {inDevelopment.map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-cyber-bg border border-cyber-border">
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="text-cyber-muted text-sm mt-1">{item.description}</p>
                    <span className="inline-block mt-2 text-xs font-mono px-2 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {item.pillar}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cyber-card p-8 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              Planned
            </h2>
            <div className="space-y-4">
              {upcomingFeatures.map((item, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-cyber-bg border border-cyber-border">
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="text-cyber-muted text-sm mt-1">{item.description}</p>
                    <span className="inline-block mt-2 text-xs font-mono px-2 py-1 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {item.pillar}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="cyber-card p-8 space-y-4 border-cyber-glow/30 text-center">
            <h2 className="text-xl font-bold text-white">Have a suggestion?</h2>
            <p className="text-cyber-muted text-sm">
              We welcome feedback on what tools would be most useful.{' '}
              <Link href="/contact" className="text-cyber-glow hover:underline">Contact us</Link> with your suggestions, or browse the{' '}
              <Link href="/pillars" className="text-cyber-glow hover:underline">full tool directory</Link> to see what&apos;s already shipped.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
