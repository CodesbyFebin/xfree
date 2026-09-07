import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/how-it-works', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'How It Works — XFree',
    description: 'Learn how XFree works: privacy-first architecture, local processing, and open source transparency.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("how-it-works", { language: loc })])
      ),
    },
  };
}

export default function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="cyber-card p-8">
        <h1 className="text-3xl font-black text-white mb-6">How It Works</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-cyber-muted mb-4">
            XFree tools run entirely in your browser using modern JavaScript and WebAssembly.
          </p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">Step 1: Choose a Tool</h2>
          <p className="text-cyber-muted mb-4">
            Browse our collection of privacy-first micro-tools organized by pillar hubs.
          </p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">Step 2: Paste Your Input</h2>
          <p className="text-cyber-muted mb-4">
            Drop your input — JSON, text, URLs, code — and get results instantly.
          </p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">Step 3: Copy and Ship</h2>
          <p className="text-cyber-muted">
            One-click copy to clipboard. Export as file. Data stays in your local session.
          </p>
        </div>
      </div>
    </div>
  );
}
