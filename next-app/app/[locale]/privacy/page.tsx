import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/privacy', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'Privacy Policy — XFree',
    description: 'XFree privacy policy: how we protect your data and respect your privacy.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("privacy", { language: loc })])
      ),
    },
  };
}

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="cyber-card p-8">
        <h1 className="text-3xl font-black text-white mb-6">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-cyber-muted mb-4">
            XFree is committed to protecting your privacy. All tools run locally in your browser by default.
          </p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">Data Collection</h2>
          <p className="text-cyber-muted mb-4">
            We do not collect, store, or transmit your data. All processing happens in your browser.
          </p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">Cookies</h2>
          <p className="text-cyber-muted">
            We do not use tracking cookies. Any cookies used are strictly necessary for app functionality.
          </p>
        </div>
      </div>
    </div>
  );
}
