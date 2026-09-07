import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/use-cases', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'Use Cases — XFree',
    description: 'Discover how developers, SEOs, and creators use XFree micro-tools in their workflows.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("use-cases", { language: loc })])
      ),
    },
  };
}

export default function UseCasesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="cyber-card p-8">
        <h1 className="text-3xl font-black text-white mb-6">Use Cases</h1>
        <p className="text-cyber-muted mb-4">
          XFree micro-tools are used by developers, SEO specialists, content creators, and privacy-conscious users worldwide.
        </p>
        <ul className="list-disc list-inside text-cyber-muted space-y-2">
          <li>Format and validate JSON APIs</li>
          <li>Test regex patterns in development</li>
          <li>Generate sitemaps for SEO</li>
          <li>Create and verify JWT tokens</li>
          <li>Hash passwords securely</li>
        </ul>
      </div>
    </div>
  );
}
