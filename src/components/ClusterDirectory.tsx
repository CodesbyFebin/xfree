import React, { useState } from "react";
import { KEYWORD_CLUSTERS, KeywordCluster } from "../data/clustersData";
import { Search, Layers, ArrowRight, Sparkles, Database, Code, CheckCircle, Tag } from "lucide-react";

interface ClusterDirectoryProps {
  onSelectKeywordTool: (keyword: string, cluster: KeywordCluster) => void;
}

export const ClusterDirectory: React.FC<ClusterDirectoryProps> = ({
  onSelectKeywordTool,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

  // Extract unique categories
  const categories = Array.from(
    new Set(KEYWORD_CLUSTERS.map((c) => c.category))
  );

  // Filter clusters
  const filteredClusters = KEYWORD_CLUSTERS.filter((cluster) => {
    const matchesCategory =
      selectedCategory === "all" || cluster.category === selectedCategory;

    const query = searchQuery.toLowerCase().trim();
    if (!query) return matchesCategory;

    const matchesName = cluster.name.toLowerCase().includes(query);
    const matchesPillar = cluster.pillarKeyword.toLowerCase().includes(query);
    const matchesSupporting = cluster.supportingKeywords.some((k) =>
      k.toLowerCase().includes(query)
    );

    return matchesCategory && (matchesName || matchesPillar || matchesSupporting);
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Cluster Hub Header */}
      <div className="p-6 sm:p-8 bg-yellow-300 brutal-border brutal-shadow space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest">
              <Layers className="w-3.5 h-3.5 text-yellow-300" />
              <span>Blog Strategy & Architecture</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black uppercase tracking-tight">
              100 Pillar Keyword Clusters
            </h1>
            <p className="text-xs sm:text-sm text-black font-bold max-w-3xl">
              1,500+ targeted keywords grouped into 100 high-intent clusters. Every cluster tool features 2,000+ words equivalent rich pillar documentation, 20 FAQs, and 100% client-side interactive utility engines.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white p-3 border-2 border-black shrink-0">
            <div className="text-center">
              <div className="text-2xl font-black text-black leading-none">100</div>
              <div className="text-[10px] font-black uppercase text-gray-600">Clusters</div>
            </div>
            <div className="h-8 w-0.5 bg-black" />
            <div className="text-center">
              <div className="text-2xl font-black text-blue-600 leading-none">1,500+</div>
              <div className="text-[10px] font-black uppercase text-gray-600">Keywords</div>
            </div>
            <div className="h-8 w-0.5 bg-black" />
            <div className="text-center">
              <div className="text-2xl font-black text-green-700 leading-none">2,000</div>
              <div className="text-[10px] font-black uppercase text-gray-600">20 FAQs/Tool</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          <div className="md:col-span-7 relative">
            <Search className="w-5 h-5 absolute left-3 top-3 text-black pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 100 clusters or 1,500+ keywords (e.g. sitemap, json, regex, sql)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border-2 border-black font-bold text-xs sm:text-sm text-black placeholder-gray-500 focus:outline-none focus:bg-yellow-50"
            />
          </div>

          <div className="md:col-span-5 flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 bg-white border-2 border-black font-black text-xs text-black uppercase focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories (100 Clusters)</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Cluster Grid Display */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-black uppercase flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>
              Showing {filteredClusters.length} of 100 Keyword Clusters
            </span>
          </h2>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs font-bold text-blue-700 underline uppercase"
            >
              Clear Search
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClusters.map((cluster) => {
            const isExpanded = expandedClusterId === cluster.id;
            return (
              <div
                key={cluster.id}
                className="bg-white brutal-border brutal-shadow p-5 flex flex-col justify-between space-y-4 hover:-translate-y-1 transition-transform group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-black pb-2">
                    <span className="px-2.5 py-0.5 bg-yellow-300 text-black border border-black text-[10px] font-black uppercase">
                      Cluster #{cluster.clusterNumber}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-800 border border-black text-[10px] font-bold uppercase">
                      {cluster.category}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-black uppercase group-hover:text-blue-600 transition-colors">
                      {cluster.name}
                    </h3>
                    <div className="mt-1 text-xs font-black text-blue-700 bg-blue-50 p-2 border border-blue-200">
                      PILLAR: "{cluster.pillarKeyword}"
                    </div>
                  </div>

                  <p className="text-xs text-gray-700 font-medium line-clamp-2">
                    {cluster.description}
                  </p>

                  <div className="space-y-1.5 pt-2 border-t border-gray-200">
                    <div className="text-[10px] font-black uppercase text-gray-500 flex items-center justify-between">
                      <span>15 Supporting Tool Keywords:</span>
                      <span>{cluster.supportingKeywords.length} tools</span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {(isExpanded
                        ? cluster.supportingKeywords
                        : cluster.supportingKeywords.slice(0, 6)
                      ).map((kw, idx) => (
                        <button
                          key={idx}
                          onClick={() => onSelectKeywordTool(kw, cluster)}
                          className="px-2 py-1 bg-gray-50 hover:bg-black hover:text-white border border-black text-[10px] font-bold text-black transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Tag className="w-2.5 h-2.5 text-blue-600 group-hover:text-white" />
                          <span className="truncate max-w-[140px]">{kw}</span>
                        </button>
                      ))}
                    </div>

                    {cluster.supportingKeywords.length > 6 && (
                      <button
                        onClick={() => setExpandedClusterId(isExpanded ? null : cluster.id)}
                        className="text-[10px] font-black text-blue-700 underline uppercase pt-1 inline-block cursor-pointer"
                      >
                        {isExpanded
                          ? "Show Less"
                          : `+ ${cluster.supportingKeywords.length - 6} More Keywords`}
                      </button>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => onSelectKeywordTool(cluster.pillarKeyword, cluster)}
                  className="w-full py-2 bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black font-black text-xs uppercase flex items-center justify-center gap-2 brutal-shadow-sm cursor-pointer"
                >
                  <span>Open Cluster Pillar Tool</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
