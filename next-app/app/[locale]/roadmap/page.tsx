import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/roadmap', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'Roadmap — XFree',
    description: 'XFree product roadmap: upcoming features, tools, and improvements.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("roadmap", { language: loc })])
      ),
    },
  };
}

export default function RoadmapPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="cyber-card p-8">
        <h1 className="text-3xl font-black text-white mb-6">Roadmap</h1>
        <p className="text-cyber-muted mb-4">
          XFree is constantly evolving. Here is what we are working on.
        </p>
        <ul className="list-disc list-inside text-cyber-muted space-y-2">
          <li>Expanded pillar coverage</li>
          <li>New micro-tools weekly</li>
          <li>Improved mobile experience</li>
          <li>Offline support via PWA</li>
          <li>More language localizations</li>
        </ul>
      </div>
    </div>
  );
}
