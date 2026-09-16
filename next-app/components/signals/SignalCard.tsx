import { Link } from '@/i18n/navigation';
import type { SignalItem } from '@/lib/signals/types';
import { SIGNAL_CATEGORIES } from '@/lib/signals/sources';
import { matchToolsForSignal } from '@/lib/signals/matchTools';

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function SignalCard({ item }: { item: SignalItem }) {
  const tags = item.categories
    .map((id) => ({ id, label: SIGNAL_CATEGORIES.find((c) => c.id === id)?.label }))
    .filter((t): t is { id: typeof t.id; label: string } => Boolean(t.label));
  // Deterministic per-item match (title + feed summary against tool
  // tags/seoKeywords), falling back to the coarser category-level list
  // when nothing scores confidently enough - see matchTools.ts.
  const relatedTools = matchToolsForSignal(item);

  return (
    <article className="cyber-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-cyber-glow">{item.sourceName}</span>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-[10px] font-mono text-cyber-muted hover:text-cyber-glow flex items-center gap-1"
        >
          SOURCE
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
        </a>
      </div>
      <h3 className="text-sm font-bold text-cyber-text leading-snug mb-2">
        <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-cyber-glow">
          {item.title}
        </a>
      </h3>
      <div className="flex items-center justify-between text-[11px] font-mono text-cyber-muted">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Link key={tag.id} href={`/updates/${tag.id}`} className="text-cyber-cyan hover:text-cyber-glow">
              {tag.label}
            </Link>
          ))}
        </div>
        <span>{timeAgo(item.publishedAt)}</span>
      </div>
      {relatedTools.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2.5 border-t border-cyber-border/60">
          {relatedTools.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              className="text-[10px] font-mono px-2 py-1 rounded border border-cyber-border text-cyber-cyan hover:text-cyber-glow hover:border-cyber-glow/50"
            >
              {tool.title} →
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
