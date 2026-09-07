import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/security', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'Security — XFree',
    description: 'XFree security practices: content security policy, privacy-first architecture, and open source transparency.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("security", { language: loc })])
      ),
    },
  };
}

export default function SecurityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="cyber-card p-8">
        <h1 className="text-3xl font-black text-white mb-6">Security</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-cyber-muted mb-4">
            XFree is built with security and privacy as core principles.
          </p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">Content Security Policy</h2>
          <p className="text-cyber-muted mb-4">
            We enforce a strict Content Security Policy (CSP) to prevent XSS and other attacks.
          </p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">Client-Side Execution</h2>
          <p className="text-cyber-muted">
            All tools run locally in your browser. No data is sent to our servers unless explicitly stated.
          </p>
        </div>
      </div>
    </div>
  );
}
