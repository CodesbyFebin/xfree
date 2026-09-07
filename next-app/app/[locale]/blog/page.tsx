import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/blog', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'Blog — XFree',
    description: 'Latest news, updates, and articles from the XFree team.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("blog", { language: loc })])
      ),
    },
  };
}

export default function BlogPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="cyber-card p-8">
        <h1 className="text-3xl font-black text-white mb-6">Blog</h1>
        <p className="text-cyber-muted mb-4">
          Latest news, updates, and articles from the XFree team.
        </p>
        <p className="text-cyber-muted">
          Coming soon — stay tuned for updates on new tools, features, and developer tips.
        </p>
      </div>
    </div>
  );
}
