import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { GUIDES } from '@/lib/data/guides';

export const metadata: Metadata = {
  title: 'Guides | XFree',
  description: 'In-depth guides on developer tools, SEO, and best practices.',
};

export default function GuideIndexPage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-4xl mx-auto py-10 px-4 space-y-10">
          <header className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl font-black text-white font-mono">Guides</h1>
            <p className="text-cyber-muted max-w-2xl mx-auto">
              In-depth articles on developer tools, SEO best practices, and how things work under the hood.
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="cyber-card p-6 group"
              >
                <h2 className="text-lg font-bold text-white group-hover:text-cyber-glow transition-colors mb-2">
                  {guide.title}
                </h2>
                <p className="text-cyber-muted text-sm mb-4 line-clamp-2">
                  {guide.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-cyber-dim font-mono">
                    Last reviewed: {guide.lastReviewed}
                  </span>
                  <span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    Read →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
