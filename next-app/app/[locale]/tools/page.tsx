import { Metadata } from 'next';
import { LOCALES, LOCALE_METADATA, type Locale } from '@/lib/i18n';
import { TOOLS, CATEGORIES } from '@/lib/data/tools';
import { buildCanonical } from '@/lib/canonical';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const canonical = buildCanonical('/tools', { language: locale });
  return {
    metadataBase: new URL('https://www.xfree.in'),
    title: 'Micro-Tools — XFree',
    description: 'Browse all XFree micro-tools: JSON formatters, regex testers, hash generators, and more. 100% client-side, no signup.',
    alternates: {
      canonical,
      languages: Object.fromEntries(
        LOCALES.map((loc) => [loc, buildCanonical("tools", { language: loc })])
      ),
    },
  };
}

export default function ToolsPage() {
  const indexableTools = TOOLS.filter((t) => t.indexable);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-white mb-4">All Micro-Tools</h1>
        <p className="text-cyber-muted max-w-2xl mx-auto">
          Privacy-first, client-side micro-tools for developers, SEOs, and creators.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {indexableTools.map((tool) => (
          <a
            key={tool.id}
            href={`/tools/${tool.slug}`}
            className="cyber-card p-5 block hover:border-cyber-glow/50 transition-colors"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyber-glow/10 border border-cyber-glow/20 flex items-center justify-center text-cyber-glow">
                ⚡
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{tool.title}</h3>
                <span className="text-[10px] text-cyber-muted font-mono">{tool.categoryLabel}</span>
              </div>
            </div>
            <p className="text-xs text-cyber-muted line-clamp-2">{tool.shortDescription}</p>
          </a>
        ))}
      </div>
    </div>
  );
}
