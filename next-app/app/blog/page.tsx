import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GUIDES } from '@/lib/data/guides';

export const metadata: Metadata = {
  title: 'Blog - XFree Developer & SEO Tools',
  description: 'Long-form articles and guides on developer tools, SEO, and productivity.',
};

export default function BlogPage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-3xl mx-auto py-10 px-4 space-y-8 text-cyber-muted">
          <header className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/30 text-xs font-semibold text-cyber-cyan">
              <BookOpen className="w-4 h-4" />
              <span>Blog</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-mono">Blog</h1>
            <p className="text-cyber-muted text-sm">
              Long-form articles will land here at their own URLs. Our current published writing lives
              under <Link href="/guides" className="text-cyber-cyan underline">Guides</Link> —
              each guide has its own permanent route, canonical, and structured data.
            </p>
          </header>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-white">Published guides</h2>
            <ul className="space-y-2 text-sm">
              {GUIDES.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/guides/${g.slug}`}
                    className="inline-flex items-center gap-2 text-cyber-cyan hover:text-cyber-glow transition-colors"
                  >
                    {g.title}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-xs text-cyber-dim italic">
            Articles will appear here once each has its own permanent URL and unique metadata.
          </p>
        </div>
      </main>

      <Footer />
    </>
  );
}
