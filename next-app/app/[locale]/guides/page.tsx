import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { GUIDES } from '@/lib/data/guides';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/guides', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'Guides & Tutorials — XFree',
    description: 'Step-by-step guides and tutorials for using XFree tools effectively.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("guides", { language: loc })])
      ),
    },
  };
}

export default function GuidesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-white mb-4">Guides &amp; Tutorials</h1>
        <p className="text-cyber-muted max-w-2xl mx-auto">
          Learn how to get the most out of XFree with our comprehensive guides.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {GUIDES.map((guide) => (
          <a
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="cyber-card p-5 block hover:border-cyber-magenta/50 transition-colors"
          >
            <h3 className="text-sm font-semibold text-white mb-2">{guide.title}</h3>
            <p className="text-xs text-cyber-muted line-clamp-2">{guide.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
