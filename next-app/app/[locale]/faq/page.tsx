import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/faq', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'FAQ — XFree',
    description: 'Frequently asked questions about XFree micro-tools, privacy, and usage.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("faq", { language: loc })])
      ),
    },
  };
}

export default function FaqPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="cyber-card p-8">
        <h1 className="text-3xl font-black text-white mb-6">Frequently Asked Questions</h1>
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Is XFree really free?</h2>
            <p className="text-cyber-muted">Yes, XFree is completely free with no signup required.</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Is my data safe?</h2>
            <p className="text-cyber-muted">All tools run locally in your browser. Your data never leaves your device.</p>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white mb-2">Do I need to install anything?</h2>
            <p className="text-cyber-muted">No installation needed. XFree works entirely in your browser.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
