import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/terms', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'Terms of Service — XFree',
    description: 'XFree terms of service: usage terms, disclaimers, and legal information.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("terms", { language: loc })])
      ),
    },
  };
}

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="cyber-card p-8">
        <h1 className="text-3xl font-black text-white mb-6">Terms of Service</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-cyber-muted mb-4">
            By using XFree, you agree to these terms. XFree is provided as-is, without warranty.
          </p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">Usage</h2>
          <p className="text-cyber-muted mb-4">
            You may use XFree tools for personal and commercial purposes. Do not use them for illegal activities.
          </p>
        </div>
      </div>
    </div>
  );
}
