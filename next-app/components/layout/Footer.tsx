import Link from 'next/link';
import { TOOLS } from '@/lib/data/tools';

const FOOTER_TOOLS = TOOLS.slice(0, 6);

export function Footer() {
  return (
    <footer className="border-t border-cyber-border bg-cyber-surface py-14 px-4" role="contentinfo">
      <div className="max-w-7xl mx-auto">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_3fr]">
          <section aria-labelledby="footer-brand">
            <Link href="/" className="inline-flex items-center gap-3" aria-label="XFree homepage">
              <div className="w-10 h-10 rounded-xl border border-cyber-glow/50 flex items-center justify-center bg-cyber-glow/5 neon-box-green">
                <span className="text-sm font-black text-cyber-glow font-cyber">X</span>
              </div>
              <span id="footer-brand" className="text-xl font-bold text-white">
                XFree<span className="text-cyber-glow">.in</span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-cyber-muted">
              XFree provides privacy-first browser tools for developers, technical teams and creators.
              Local Mode is used by default for supported operations, with no signup required.
            </p>

            <Link
              href="https://app.xfree.in/"
              className="mt-6 cyber-btn cyber-btn-filled text-sm px-5 py-3 rounded inline-flex items-center gap-2"
              rel="noopener"
            >
              <span>Open XFree Studio</span>
              <span aria-hidden="true">→</span>
            </Link>

            <p className="mt-4 text-xs leading-5 text-cyber-dim font-mono">
              {TOOLS.length} published tools and {10} approved discovery hubs are currently available.
            </p>
          </section>

          <nav aria-label="XFree footer navigation" className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 xl:grid-cols-6">
            <section aria-labelledby="footer-categories">
              <h2 id="footer-categories" className="text-sm font-semibold text-cyber-glow font-mono">
                // Categories
              </h2>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/categories/dev-tools" className="text-sm text-cyber-muted transition-colors hover:text-white">
                    XFree Developer Tools
                  </Link>
                </li>
                <li>
                  <Link href="/categories/seo-tools" className="text-sm text-cyber-muted transition-colors hover:text-white">
                    XFree SEO Tools
                  </Link>
                </li>
                <li>
                  <Link href="/categories/ai-tools" className="text-sm text-cyber-muted transition-colors hover:text-white">
                    XFree AI Tools
                  </Link>
                </li>
                <li>
                  <Link href="/categories/security-tools" className="text-sm text-cyber-muted transition-colors hover:text-white">
                    XFree Security Tools
                  </Link>
                </li>
              </ul>
            </section>

            <section aria-labelledby="footer-popular">
              <h2 id="footer-popular" className="text-sm font-semibold text-cyber-cyan font-mono">
                // Popular
              </h2>
              <ul className="mt-4 space-y-2.5">
                {FOOTER_TOOLS.map((tool) => (
                  <li key={tool.id}>
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="text-sm text-cyber-muted transition-colors hover:text-white"
                    >
                      XFree {tool.title.replace('XFree ', '')}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="footer-pillars">
              <h2 id="footer-pillars" className="text-sm font-semibold text-cyber-magenta font-mono">
                // Tool Hubs
              </h2>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/pillars/json-data-tools" className="text-sm text-cyber-muted transition-colors hover:text-white">
                    XFree JSON & Data Tools
                  </Link>
                </li>
                <li>
                  <Link href="/pillars/seo-tools" className="text-sm text-cyber-muted transition-colors hover:text-white">
                    XFree SEO Tools
                  </Link>
                </li>
                <li>
                  <Link href="/pillars/security-tools" className="text-sm text-cyber-muted transition-colors hover:text-white">
                    XFree Security Tools
                  </Link>
                </li>
              </ul>
            </section>

            <section aria-labelledby="footer-resources">
              <h2 id="footer-resources" className="text-sm font-semibold text-cyber-amber font-mono">
                // Resources
              </h2>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/pillars" className="text-sm text-cyber-muted transition-colors hover:text-white">
                    XFree Pillar Hubs
                  </Link>
                </li>
                <li>
                  <Link href="/sitemap.xml" className="text-sm text-cyber-muted transition-colors hover:text-white">
                    XML Sitemap
                  </Link>
                </li>
                <li>
                  <Link href="/robots.txt" className="text-sm text-cyber-muted transition-colors hover:text-white">
                    robots.txt
                  </Link>
                </li>
              </ul>
            </section>

            <section aria-labelledby="footer-legal">
              <h2 id="footer-legal" className="text-sm font-semibold text-white font-mono">
                // Company
              </h2>
              <ul className="mt-4 space-y-2.5">
                <li>
                  <Link href="/about" className="text-sm text-cyber-muted transition-colors hover:text-white">
                    About XFree
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-sm text-cyber-muted transition-colors hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="text-sm text-cyber-muted transition-colors hover:text-white">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </section>
          </nav>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-cyber-glow/30 to-transparent my-6" />

        <div className="flex flex-col gap-4 border-t border-cyber-border pt-6 text-xs text-cyber-dim sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono">
            © {new Date().getFullYear()} XFree. Open-source software released under the MIT License.
          </p>
          <p className="font-mono">
            Marketing: <a href="https://www.xfree.in/" className="text-cyber-muted hover:text-white">www.xfree.in</a> · Application:{' '}
            <a href="https://app.xfree.in/" className="text-cyber-muted hover:text-white" rel="noopener">
              app.xfree.in
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
