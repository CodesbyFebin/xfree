import React from "react";
import { BookOpen, ArrowRight } from "lucide-react";
import { RouterLink } from "../RouterLink";
import { GUIDES } from "../../data/guides";

interface PageProps {
  onGoHome: () => void;
  onSelectTool: (slug: string) => void;
  onNavigatePage?: (path: string) => void;
}

/**
 * The blog previously listed ~10 article teasers that opened inline on /blog
 * without individual URLs — Google and AdSense can only reach the one page.
 * Until real per-article routes exist we don't want to imply distinct articles.
 * The four /guides pages ARE real distinct routes; point people there instead.
 */
export const BlogPage: React.FC<PageProps> = ({ onGoHome: _onGoHome, onSelectTool: _onSelectTool, onNavigatePage }) => {
  const navigate = onNavigatePage || ((_: string) => {});
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8 text-slate-200">
      <header className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-xs font-semibold text-cyan-300">
          <BookOpen className="w-4 h-4" />
          <span>Blog</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Blog</h1>
        <p className="text-slate-300 text-sm">
          Long-form articles will land here at their own URLs. Our current published writing lives
          under <RouterLink href="/guides" onNavigate={navigate} className="text-cyan-300 underline">Guides</RouterLink> —
          each guide has its own permanent route, canonical, and structured data.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">Published guides</h2>
        <ul className="space-y-2 text-sm">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <RouterLink
                href={`/guides/${g.slug}`}
                onNavigate={navigate}
                className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200 cursor-pointer"
              >
                {g.title}
                <ArrowRight className="w-3 h-3" />
              </RouterLink>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-xs text-slate-500 italic">
        We intentionally don&apos;t list article teasers without real per-article URLs — that&apos;s the
        pattern Google&apos;s spam policy calls scaled content abuse when the shell is one page.
        Articles will appear here once each has its own permanent URL and unique metadata.
      </p>
    </div>
  );
};
