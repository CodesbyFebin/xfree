import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { BLOG_POSTS } from '@/lib/data/blogPosts';
import { buildCanonical } from '@/lib/canonical';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = BLOG_POSTS.find((p) => p.slug === slug);
  if (!post) return {};
  const canonical = buildCanonical(`/blog/${slug}`, { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: `${post.title} — XFree`,
    description: post.description,
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical(`/blog/${slug}`, { language: loc })])
      ),
    },
  };
}

export default function BlogPostPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const resolvedParams = params instanceof Promise ? params : Promise.resolve(params);
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="cyber-card p-8">
        <div className="text-3xl mb-4">📝</div>
        <h1 className="text-3xl font-black text-white mb-4">Blog Post</h1>
        <p className="text-cyber-muted">Blog post content coming soon.</p>
      </div>
    </div>
  );
}
