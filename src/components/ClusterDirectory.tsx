import React, { useState } from "react";
import { KEYWORD_CLUSTERS, KeywordCluster } from "../data/clustersData";
import { Search, Layers, ArrowRight, Tag } from "lucide-react";

interface ClusterDirectoryProps {
  onSelectKeywordTool: (keyword: string, cluster: KeywordCluster) => void;
}

export const ClusterDirectory: React.FC<ClusterDirectoryProps> = ({ onSelectKeywordTool }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

  const categories = Array.from(new Set(KEYWORD_CLUSTERS.map((c) => c.category)));
  const totalKeywords = KEYWORD_CLUSTERS.reduce((sum, c) => sum + c.supportingKeywords.length + 1, 0);

  const filteredClusters = KEYWORD_CLUSTERS.filter((cluster) => {
    const matchesCategory = selectedCategory === "all" || cluster.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesName = cluster.name.toLowerCase().includes(query);
    const matchesPillar = cluster.pillarKeyword.toLowerCase().includes(query);
    const matchesSupporting = cluster.supportingKeywords.some((k) => k.toLowerCase().includes(query));

    return matchesCategory && (matchesName || matchesPillar || matchesSupporting);
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="cyber-card p-6 sm:p-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-cyber-border pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-cyber-glow/30 bg-cyber-glow/5 text-cyber-glow text-[10px] font-mono uppercase tracking-widest neon-box-green">
              <Layers className="w-3.5 h-3.5" />
              <span>Search Intent Directory</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight font-mono">
              {KEYWORD_CLUSTERS.length} Keyword Clusters
            </h1>
            <p className="text-xs sm:text-sm text-cyber-muted max-w-3xl">
              Search-intent keyword clusters mapped to XFree's real, published tool catalogue.
            </p>
          </div>

          <div className="flex items-center gap-3 cyber-card p-3 shrink-0">
            <div className="text-center">
              <div className="text-2xl font-black text-cyber-glow leading-none font-mono">{KEYWORD_CLUSTERS.length}</div>
              <div className="text-[10px] text-cyber-muted font-mono uppercase">Clusters</div>
            </div>
            <div className="h-8 w-px bg-cyber-border" />
            <div className="text-center">
              <div className="text-2xl font-black text-cyber-cyan leading-none font-mono">{totalKeywords.toLocaleString()}</div>
              <div className="text-[10px] text-cyber-muted font-mono uppercase">Keywords</div>
            </div>
            <div className="h-8 w-px bg-cyber-border" />
            <div className="text-center">
              <div className="text-2xl font-black text-white leading-none font-mono">{categories.length}</div>
              <div className="text-[10px] text-cyber-muted font-mono uppercase">Categories</div>
            </div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-7 relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-cyber-glow pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${KEYWORD_CLUSTERS.length} clusters or ${totalKeywords.toLocaleString()}+ keywords (e.g. sitemap, json, regex, sql)...`}
              className="w-full pl-10 pr-4 py-2.5 bg-cyber-bg border border-cyber-border rounded-lg font-mono text-xs sm:text-sm text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-glow"
            />
          </div>

          <div className="md:col-span-5">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 bg-cyber-bg border border-cyber-border rounded-lg font-mono text-xs text-white uppercase focus:outline-none focus:border-cyber-glow cursor-pointer"
            >
              <option value="all">All Categories ({KEYWORD_CLUSTERS.length} Clusters)</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cluster Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyber-glow" />
            <span>Showing {filteredClusters.length} of {KEYWORD_CLUSTERS.length} clusters</span>
          </h2>
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-xs text-cyber-glow hover:text-white transition-colors focus-ring font-mono">
              Clear search
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClusters.map((cluster) => {
            const isExpanded = expandedClusterId === cluster.id;
            return (
              <div key={cluster.id} className="cyber-card p-5 flex flex-col justify-between space-y-4 hover:border-cyber-glow/40 transition-colors">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-cyber-border pb-2">
                    <span className="px-2 py-0.5 rounded bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30 text-[10px] font-mono">
                      Cluster #{cluster.clusterNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyber-bg text-cyber-muted border border-cyber-border text-[10px] font-mono">
                      {cluster.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white font-mono">{cluster.name}</h3>
                    <div className="mt-1 text-xs font-mono text-cyber-cyan bg-cyber-cyan/5 p-2 rounded border border-cyber-cyan/20">
                      Pillar: &quot;{cluster.pillarKeyword}&quot;
                    </div>
                  </div>

                  <p className="text-xs text-cyber-muted leading-relaxed line-clamp-2">{cluster.description}</p>

                  <div className="space-y-1.5 pt-2 border-t border-cyber-border">
                    <div className="text-[10px] font-mono uppercase text-cyber-dim flex items-center justify-between">
                      <span>Supporting keywords</span>
                      <span>{cluster.supportingKeywords.length}</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(isExpanded ? cluster.supportingKeywords : cluster.supportingKeywords.slice(0, 6)).map((kw, idx) => (
                        <button
                          key={idx}
                          onClick={() => onSelectKeywordTool(kw, cluster)}
                          className="px-2 py-1 rounded bg-cyber-bg hover:bg-cyber-glow/10 border border-cyber-border hover:border-cyber-glow/40 text-[10px] font-mono text-cyber-muted hover:text-cyber-glow transition-colors flex items-center gap-1 focus-ring"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          <span className="truncate max-w-[140px]">{kw}</span>
                        </button>
                      ))}
                    </div>

                    {cluster.supportingKeywords.length > 6 && (
                      <button
                        onClick={() => setExpandedClusterId(isExpanded ? null : cluster.id)}
                        className="text-[10px] text-cyber-glow hover:text-white transition-colors pt-1 inline-block focus-ring font-mono"
                      >
                        {isExpanded ? "Show less" : `+ ${cluster.supportingKeywords.length - 6} more`}
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onSelectKeywordTool(cluster.pillarKeyword, cluster)}
                  className="cyber-btn cyber-btn-filled w-full py-2 text-xs rounded flex items-center justify-center gap-2 focus-ring"
                >
                  <span>Search this cluster</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
