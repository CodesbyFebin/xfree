import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/xfree-app', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'XFree App — Free Developer, SEO & Privacy Micro-Tools',
    description: 'The XFree app is the ultimate free online app for developers. Privacy-first micro-tools, no signup required.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("xfree-app", { language: loc })])
      ),
    },
  };
}

export default function XFreeAppPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="cyber-card p-8">
        <h1 className="text-3xl font-black text-white mb-6">XFree App</h1>
        <p className="text-cyber-muted mb-4">
          The XFree app is the ultimate free online app for developers. Access privacy-first SEO tools, JSON formatters, HTML minifiers, and crypto utilities.
        </p>
        <div className="mt-8">
          <a href="https://app.xfree.in/" className="cyber-btn cyber-btn-filled px-6 py-3 rounded-lg text-sm" rel="noopener">
            Launch XFree Studio →
          </a>
        </div>
      </div>
    </div>
  );
}
