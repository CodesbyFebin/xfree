import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { findToolBySlug, getRelatedTools, INDEXABLE_TOOL_SLUGS } from '@/lib/data/tools';
import { JsonFormatterTool } from '@/components/tools/JsonFormatterTool';
import { RegexTesterTool } from '@/components/tools/RegexTesterTool';
import { HashGeneratorTool } from '@/components/tools/HashGeneratorTool';
import { JwtDecoderTool } from '@/components/tools/JwtDecoderTool';
import { Base64Tool } from '@/components/tools/Base64Tool';
import { CronGeneratorTool } from '@/components/tools/CronGeneratorTool';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const tool = findToolBySlug(slug);

  if (!tool) {
    return {
      title: 'Tool Not Found | XFree App',
    };
  }

  const title = `${tool.title} | Free Online ${tool.categoryLabel}`;
  const description = `${tool.shortDescription} Use this free XFree tool for ${tool.tags.join(', ')}. 100% client-side, no signup required.`;

  return {
    title,
    description,
    keywords: tool.tags.map((tag) => `XFree ${tag}, ${tag} tool, free ${tag}`),
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://www.xfree.in/tools/${slug}`,
      images: [
        {
          url: '/og-image.png',
          width: 1200,
          height: 630,
          alt: `${tool.title} - XFree App`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: `https://www.xfree.in/tools/${slug}`,
    },
  };
}

export async function generateStaticParams() {
  return Array.from(INDEXABLE_TOOL_SLUGS).map((slug) => ({
    slug,
  }));
}

function ToolComponent({ toolId }: { toolId: string }) {
  switch (toolId) {
    case 'json-formatter':
      return <JsonFormatterTool />;
    case 'regex-tester':
      return <RegexTesterTool />;
    case 'hash-generator':
      return <HashGeneratorTool />;
    case 'jwt-decoder':
      return <JwtDecoderTool />;
    case 'base64-encoder':
      return <Base64Tool />;
    case 'cron-generator':
      return <CronGeneratorTool />;
    default:
      return <JsonFormatterTool />;
  }
}

export default async function ToolDetailPage({ params }: Props) {
  const { slug } = await params;
  const tool = findToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  const relatedTools = getRelatedTools(tool);

  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-6" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-sm font-mono">
              <li>
                <Link href="/" className="text-cyber-muted hover:text-cyber-glow transition-colors">
                  Home
                </Link>
              </li>
              <li className="text-cyber-dim">/</li>
              <li>
                <Link
                  href={`/categories/${tool.category}`}
                  className="text-cyber-muted hover:text-cyber-glow transition-colors"
                >
                  {tool.categoryLabel}
                </Link>
              </li>
              <li className="text-cyber-dim">/</li>
              <li className="text-cyber-glow" aria-current="page">
                {tool.title.replace('XFree ', '')}
              </li>
            </ol>
          </nav>

          {/* Tool Header */}
          <header className="mb-8">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-xl bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center neon-box-green">
                <span className="text-2xl font-mono font-bold text-cyber-glow">
                  {tool.iconName === 'Braces' ? '{ }' : tool.iconName === 'KeyRound' ? '🎫' : tool.iconName === 'Hash' ? '#' : '⚡'}
                </span>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">{tool.title}</h1>
                <p className="text-cyber-muted">{tool.shortDescription}</p>
              </div>
            </div>

            {/* Privacy Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-cyber-glow/30 bg-cyber-glow/5 text-xs font-mono text-cyber-glow neon-box-green">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-glow animate-pulse" />
              <span>LOCAL Mode · 100% Client-Side · No Data Transmitted</span>
            </div>
          </header>

          {/* Tool Content */}
          <div className="space-y-8">
            {/* Explanation */}
            <section className="cyber-card p-6">
              <h2 className="text-lg font-bold text-white mb-3 font-mono">About This Tool</h2>
              <p className="text-cyber-muted leading-relaxed">{tool.explanation}</p>
            </section>

            {/* Interactive Tool */}
            <section className="cyber-card p-6">
              <h2 className="text-lg font-bold text-white mb-4 font-mono">
                <span className="text-cyber-glow">▶</span> Execute {tool.title.replace('XFree ', '')}
              </h2>
              <ToolComponent toolId={tool.id} />
            </section>

            {/* How to Use */}
            <section className="cyber-card p-6">
              <h2 className="text-lg font-bold text-white mb-3 font-mono">How to Use</h2>
              <ol className="space-y-2">
                {tool.howToUse.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-cyber-glow/10 border border-cyber-glow/30 flex items-center justify-center text-xs font-mono text-cyber-glow flex-shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-cyber-muted">{step}</span>
                  </li>
                ))}
              </ol>
            </section>

            {/* Privacy Notice */}
            <section className="cyber-card p-6 border-cyber-cyan/30">
              <h2 className="text-lg font-bold text-white mb-3 font-mono flex items-center gap-2">
                <span className="text-cyber-cyan">🔒</span> Privacy Notice
              </h2>
              <p className="text-cyber-muted">{tool.privacyNotice}</p>
            </section>

            {/* FAQs */}
            {tool.faqs.length > 0 && (
              <section className="cyber-card p-6">
                <h2 className="text-lg font-bold text-white mb-4 font-mono">Frequently Asked Questions</h2>
                <div className="space-y-4">
                  {tool.faqs.map((faq, i) => (
                    <div key={i}>
                      <h3 className="font-semibold text-white mb-2">{faq.question}</h3>
                      <p className="text-cyber-muted text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Related Tools */}
            {relatedTools.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-white mb-4 font-mono">Related XFree Tools</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {relatedTools.map((related) => (
                    <Link
                      key={related.id}
                      href={`/tools/${related.slug}`}
                      className="cyber-card p-4 group"
                    >
                      <h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono">
                        {related.title}
                      </h3>
                      <p className="text-xs text-cyber-muted mt-1 line-clamp-2">
                        {related.shortDescription}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: tool.title,
            url: `https://www.xfree.in/tools/${slug}`,
            description: tool.shortDescription,
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Any (Browser-based)',
            isAccessibleForFree: true,
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
            featureList: tool.tags.join(', '),
            author: {
              '@type': 'Organization',
              name: 'XFree Contributors',
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: tool.faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
              },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: 'https://www.xfree.in/',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: tool.categoryLabel,
                item: `https://www.xfree.in/categories/${tool.category}`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: tool.title,
                item: `https://www.xfree.in/tools/${slug}`,
              },
            ],
          }),
        }}
      />
    </>
  );
}
