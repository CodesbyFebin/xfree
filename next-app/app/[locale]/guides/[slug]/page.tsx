import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { GUIDES } from '@/lib/data/guides';
import { buildCanonical } from '@/lib/canonical';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return GUIDES.map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) return {};
  const canonical = buildCanonical(`/guides/${slug}`, { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: `${guide.title} — XFree`,
    description: guide.description,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical(`/guides/${slug}`, { language: loc })])
      ),
    },
  };
}

export default function GuideDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const resolvedParams = params instanceof Promise ? params : Promise.resolve(params);
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="cyber-card p-8">
        <div className="text-3xl mb-4">📚</div>
        <h1 className="text-3xl font-black text-white mb-4">Guide Detail</h1>
        <p className="text-cyber-muted">Guide detail pages coming soon.</p>
      </div>
    </div>
  );
}
