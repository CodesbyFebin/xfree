import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { TOOLS } from '@/lib/data/tools';
import { buildCanonical } from '@/lib/canonical';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return TOOLS.filter((t) => t.indexable).map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const tool = TOOLS.find((t) => t.slug === slug && t.indexable);
  if (!tool) return {};
  const canonical = buildCanonical(`/tools/${slug}`, { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: `${tool.title} — XFree`,
    description: tool.shortDescription,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical(`/tools/${slug}`, { language: loc })])
      ),
    },
  };
}

export default function ToolDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const resolvedParams = params instanceof Promise ? params : Promise.resolve(params);
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="cyber-card p-8">
        <div className="text-3xl mb-4">⚡</div>
        <h1 className="text-3xl font-black text-white mb-4">Tool Detail</h1>
        <p className="text-cyber-muted">Tool detail pages coming soon.</p>
      </div>
    </div>
  );
}
