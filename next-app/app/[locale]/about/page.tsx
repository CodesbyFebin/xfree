import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/about', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'About XFree — Free Developer, SEO & Privacy Micro-Tools',
    description: 'Learn about XFree, the ultimate free online app for developers offering privacy-first micro-tools.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("about", { language: loc })])
      ),
    },
  };
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="cyber-card p-8">
        <h1 className="text-3xl font-black text-white mb-6">About XFree</h1>
        <div className="prose prose-invert max-w-none">
          <p className="text-cyber-muted mb-4">
            XFree is the ultimate free online app for developers. We build privacy-first micro-tools that run entirely in your browser — no signup, no uploads, no tracking.
          </p>
          <p className="text-cyber-muted mb-4">
            Our mission is to make powerful developer, SEO, and privacy tools accessible to everyone, without compromising on privacy or performance.
          </p>
          <h2 className="text-xl font-bold text-white mt-8 mb-4">Open Source</h2>
          <p className="text-cyber-muted">
            XFree is open source under the MIT License. You can audit, fork, and contribute on GitHub.
          </p>
        </div>
      </div>
    </div>
  );
}
