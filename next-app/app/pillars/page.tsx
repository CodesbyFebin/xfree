import { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PILLARS, AUTHORITY_PILLARS } from '@/lib/data/pillars';

export const metadata: Metadata = {
  title: 'XFree Pillar Hubs - Free Developer Tools Directory',
  description:
    'Browse all XFree pillar hubs organizing developer tools by category. Each pillar connects specialized micro-tools for developers, SEO professionals, and creators.',
  openGraph: {
    title: 'XFree Pillar Hubs - Free Developer Tools Directory',
    description:
      'Browse all XFree pillar hubs organizing developer tools by category.',
    type: 'website',
    url: 'https://www.xfree.in/pillars',
  },
  alternates: {
    canonical: 'https://www.xfree.in/pillars',
  },
};

export default function PillarsPage() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <Header />

      <main id="main-content" className="pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <header className="text-center mb-12">
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-4">
              XFree Tool Directory
            </h1>
            <p className="text-cyber-muted max-w-2xl mx-auto">
              The most comprehensive developer tool taxonomy. Each pillar connects specialized
              clusters with dedicated micro-tools. {PILLARS.length} pillars and counting.
            </p>
          </header>

          {/* Authority Pillars */}
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-6 font-mono">
              <span className="text-cyber-cyan">★</span> Authority Pillars
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {AUTHORITY_PILLARS.map((pillar) => (
                <Link
                  key={pillar.slug}
                  href={`/pillars/${pillar.slug}`}
                  className="cyber-card p-6 group border-cyber-cyan/20"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-cyber-cyan/5 border border-cyber-cyan/20 flex items-center justify-center neon-box-cyan">
                      <span className="text-xl">{pillar.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white group-hover:text-cyber-cyan transition-colors font-mono mb-1">
                        {pillar.name}
                      </h3>
                      <p className="text-sm text-cyber-muted line-clamp-2">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Regular Pillars */}
          <section>
            <h2 className="text-xl font-bold text-white mb-6 font-mono">
              <span className="text-cyber-glow">$</span> Tool Pillars
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {PILLARS.map((pillar) => (
                <Link
                  key={pillar.slug}
                  href={`/pillars/${pillar.slug}`}
                  className="cyber-card p-4 group"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg bg-cyber-glow/5 border border-cyber-glow/20 flex items-center justify-center text-base flex-shrink-0"
                      aria-hidden="true"
                    >
                      {pillar.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-mono text-cyber-glow">
                          #{pillar.num}
                        </span>
                        <span className="text-[9px] text-cyber-dim font-mono">
                          pillar
                        </span>
                      </div>
                      <h3 className="text-xs font-semibold text-white leading-tight truncate font-mono group-hover:text-cyber-glow transition-colors">
                        {pillar.name}
                      </h3>
                      <p className="text-[10px] text-cyber-muted mt-0.5 line-clamp-2">
                        {pillar.description}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
}
