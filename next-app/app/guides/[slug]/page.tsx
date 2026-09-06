import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { findGuide, GUIDES } from '@/lib/data/guides';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) return { title: 'Guide Not Found | XFree' };
  return {
    title: `${guide.title} | XFree Guides`,
    description: guide.description,
  };
}

export async function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export default async function GuideDetailPage({ params }: Props) {
  const { slug } = await params;
  const guide = findGuide(slug);
  if (!guide) notFound();

  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
          <Link
            href="/guides"
            className="inline-flex items-center gap-2 text-cyber-muted hover:text-cyber-glow transition-colors text-sm font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Guides
          </Link>

          <article className="cyber-card p-8 space-y-8">
            <header className="space-y-4 border-b border-cyber-border pb-6">
              <h1 className="text-2xl sm:text-3xl font-black text-white font-mono">{guide.title}</h1>
              <p className="text-cyber-muted">{guide.intro}</p>
              <div className="flex items-center gap-4 text-xs text-cyber-dim font-mono">
                <span>Last reviewed: {guide.lastReviewed}</span>
              </div>
            </header>

            {guide.sections.map((section, i) => (
              <section key={i} className="space-y-4">
                <h2 className="text-xl font-bold text-white">{section.heading}</h2>
                {section.paragraphs?.map((p, j) => (
                  <p key={j} className="text-cyber-muted text-sm leading-relaxed">{p}</p>
                ))}
                {section.code && (
                  <pre className="p-4 rounded-lg bg-cyber-bg border border-cyber-border overflow-x-auto">
                    <code className="text-xs font-mono text-cyber-glow whitespace-pre">{section.code.body}</code>
                  </pre>
                )}
                {section.bullets && (
                  <ul className="list-disc list-inside space-y-1 text-cyber-muted text-sm">
                    {section.bullets.map((b, j) => (
                      <li key={j}>{b}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>

          <div className="text-center">
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-white transition-colors text-sm font-mono"
            >
              <ArrowLeft className="w-4 h-4" />
              More Guides
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
