import React, { useState, useMemo } from "react";
import { ToolDefinition, WorkspacePreset } from "../types";
import { FeedbackWidget } from "./FeedbackWidget";
import { FaqJsonLdSchema } from "./FaqJsonLdSchema";
import { ToolGuide } from "./ToolGuide";
import { guideForSlug } from "../data/toolGuides";
import { downloadAsJson, downloadAsCsv, downloadAsTxt } from "../utils/exportUtils";
import {
  Star,
  Copy,
  Check,
  Download,
  RotateCcw,
  Share2,
  Lock,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Sparkles,
  Zap,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  FolderPlus,
  Layers,
  X,
  FileCode,
  FileSpreadsheet,
  ArrowRight,
  ArrowRightCircle
} from "lucide-react";

interface ToolPageLayoutProps {
  tool: ToolDefinition;
  isFavorite: boolean;
  onToggleFavorite: (toolId: string) => void;
  onBackToHome: () => void;
  onSelectTool: (toolId: string) => void;
  allTools: ToolDefinition[];
  onReset?: () => void;
  onLoadExample?: () => void;
  outputContent?: string;
  inputContent?: string;
  configState?: any;
  onSaveWorkspace?: (preset: Omit<WorkspacePreset, "id" | "timestamp">) => void;
  downloadFilename?: string;
  children: React.ReactNode;
}

const STUDIO_ENGINE_BY_TOOL: Record<string, string> = {
  "regex-tester": "regex",
  "base64-encoder-decoder": "base64-decode",
};

export const ToolPageLayout: React.FC<ToolPageLayoutProps> = ({
  tool,
  isFavorite,
  onToggleFavorite,
  onBackToHome,
  onSelectTool,
  allTools,
  onReset,
  onLoadExample,
  outputContent,
  inputContent,
  configState,
  onSaveWorkspace,
  downloadFilename = "xfree-export.txt",
  children,
}) => {
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [presetName, setPresetName] = useState(`${tool.title} Preset`);
  const [workspaceSaved, setWorkspaceSaved] = useState(false);

  const pillarKeyword = tool.pillarKeyword || tool.title;
  const studioEngine = STUDIO_ENGINE_BY_TOOL[tool.slug || tool.id];
  const studioUrl = studioEngine
    ? `https://app.xfree.in/?tool=${encodeURIComponent(studioEngine)}`
    : "https://app.xfree.in/studio";

  // Dynamically suggest 2-3 related tools based primarily on the current tool's category
  const suggestedNextSteps = useMemo(() => {
    // 1. Get all tools in the exact same category (excluding current tool)
    const sameCatTools = allTools.filter(
      (t) => t.id !== tool.id && t.slug !== tool.slug && t.category === tool.category
    );

    // Start with same category tools
    let candidates = [...sameCatTools];

    // 2. If same category has fewer than 3 tools, append handpicked related tools
    if (candidates.length < 3) {
      const ids = tool.relatedToolIds || [];
      const relatedByHand = allTools.filter(
        (t) => t.id !== tool.id && t.slug !== tool.slug && ids.includes(t.id) && !candidates.some((c) => c.id === t.id)
      );
      candidates = [...candidates, ...relatedByHand];
    }

    // 3. Fallback to any remaining tools if still fewer than 2
    if (candidates.length < 2) {
      const remaining = allTools.filter(
        (t) => t.id !== tool.id && t.slug !== tool.slug && !candidates.some((c) => c.id === t.id)
      );
      candidates = [...candidates, ...remaining];
    }

    // Return 2 to 3 related tools
    return candidates.slice(0, 3);
  }, [tool, allTools]);

  const keyFeatures = tool.keyFeatures || [
    tool.isAi
      ? "Cloud AI processing is clearly disclosed before your input is submitted."
      : "Local Mode processes working input in your browser by default.",
    "Real-time syntax validation, formatting, and live error feedback.",
    "1-Click copy to clipboard and instant text/file export options.",
    "Save workspace presets locally to reload configurations anytime.",
    "No registration or signup is required for published standard tools."
  ];

  const benefits = tool.benefits || [
    tool.isAi
      ? "Transparent Cloud Mode: The interface identifies when submitted content is sent to an AI provider."
      : "Local-First Privacy: Working input stays in browser memory during normal tool processing.",
    "Responsive Processing: Performance and practical limits depend on your browser, device memory, and input size.",
    "Production Ready: Clean, standards-compliant output ready for immediate deployment in web apps, SEO campaigns, or CMS platforms.",
    "Cross-Platform & Lightweight: Fully responsive interface optimized for keyboard navigation and quick workflow efficiency."
  ];

  const existingFaqs = tool.faqs || [];
  const defaultStandardFaqs = [
    {
      question: `Is this ${tool.title} completely free to use?`,
      answer: `Yes! ${tool.title} is 100% free with no hidden fees, subscriptions, or daily usage caps.`
    },
    {
      question: `Does ${tool.title} require account registration or sign-up?`,
      answer: `No account or sign-up is required. You can start using this tool immediately in your web browser.`
    },
    {
      question: `Is my input data secure when using ${tool.title}?`,
      answer: tool.isAi
        ? `This AI tool uses disclosed Cloud Mode processing. Content you submit is sent to the configured AI provider; avoid submitting sensitive information.`
        : `This tool runs in Local Mode by default, so working input is processed in your browser rather than submitted to a tool-processing endpoint.`
    },
    {
      question: `Can I use ${tool.title} on mobile devices?`,
      answer: `Absolutely. The tool is fully responsive and optimized for mobile phones, tablets, laptops, and desktop computers.`
    },
    {
      question: `Does ${tool.title} work offline?`,
      answer: tool.isAi
        ? `No. This AI tool needs a network connection to reach the disclosed cloud provider.`
        : `The core transformation can run in your browser after the application assets have loaded, although some browser or site features may still require a connection.`
    },
    {
      question: `What is the maximum data or payload size supported?`,
      answer: `There is no universal guaranteed payload size. Practical limits depend on the selected tool, browser, device memory, and input complexity.`
    }
  ];

  const finalFaqs = [...existingFaqs];
  for (const fallbackFaq of defaultStandardFaqs) {
    if (!finalFaqs.some(f => f.question.toLowerCase() === fallbackFaq.question.toLowerCase())) {
      finalFaqs.push(fallbackFaq);
    }
  }

  const handleCopy = () => {
    if (!outputContent) return;
    navigator.clipboard.writeText(outputContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!outputContent) return;
    downloadAsTxt(outputContent, downloadFilename);
  };

  const handleExportJson = () => {
    const payload = outputContent
      ? { tool: tool.title, output: outputContent, config: configState || null }
      : configState || { tool: tool.title, input: inputContent || "" };
    downloadAsJson(payload, `${tool.slug || tool.id}_export.json`);
  };

  const handleExportCsv = () => {
    if (outputContent) {
      const lines = outputContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const csvRows = lines.map((line, idx) => ({ Index: idx + 1, Value: line }));
      downloadAsCsv(csvRows, `${tool.slug || tool.id}_export.csv`);
    } else if (configState) {
      downloadAsCsv([configState], `${tool.slug || tool.id}_export.csv`);
    } else {
      downloadAsTxt(outputContent || inputContent || "", `${tool.slug || tool.id}_export.csv`);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* FAQ Schema Markup */}
      <FaqJsonLdSchema faqs={finalFaqs} toolTitle={tool.title} />

      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass-panel-interactive text-xs font-semibold text-slate-200 hover:text-white cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-cyan-400" />
          <span>Back to All Tools</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          <span className="cursor-pointer hover:text-white transition-colors" onClick={onBackToHome}>
            Home
          </span>
          <span>/</span>
          <span className="text-slate-400">{tool.categoryLabel}</span>
          <span>/</span>
          <span className="text-cyan-400 font-semibold truncate max-w-[200px] sm:max-w-none">
            {tool.title}
          </span>
        </div>
      </div>

      {/* Header Pillar Card */}
      <div className="p-6 md:p-8 glass-panel rounded-3xl space-y-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {tool.isFlagship && (
                <span className="px-3 py-1 text-[10px] font-semibold tracking-wider rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Flagship Utility
                </span>
              )}
              {tool.isAi && (
                <span className="px-3 py-1 text-[10px] font-semibold tracking-wider rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  AI Micro-Tool
                </span>
              )}
              <span className="px-3 py-1 text-[10px] font-semibold tracking-wider rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Pillar Tool
              </span>
              <span className="px-3 py-1 text-[10px] font-semibold tracking-wider rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {tool.categoryLabel}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight">
              {pillarKeyword}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              {tool.shortDescription}
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <a
              href={studioUrl}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-colors hover:bg-indigo-400"
              aria-label={studioEngine ? `Open ${tool.title} workflow in XFree Studio` : "Open XFree Studio"}
            >
              <Layers className="h-4 w-4" />
              <span>{studioEngine ? "Open in Studio" : "Open Studio"}</span>
            </a>
            {onLoadExample && (
              <button
                onClick={onLoadExample}
                className="px-3 py-1.5 rounded-xl glass-panel-interactive text-slate-200 hover:text-white text-xs font-semibold cursor-pointer"
                title="Load sample input data"
              >
                Load Example
              </button>
            )}

            {onReset && (
              <button
                onClick={onReset}
                className="p-2 rounded-xl glass-panel-interactive text-slate-300 hover:text-white cursor-pointer"
                title="Reset Clean State"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setShowWorkspaceModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-cyan-400" />
              <span>Save Workspace</span>
            </button>

            <button
              onClick={() => onToggleFavorite(tool.id)}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isFavorite
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                  : "glass-panel-interactive text-slate-400 hover:text-amber-300"
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-xl glass-panel-interactive text-slate-300 hover:text-white cursor-pointer"
            >
              {shared ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            <FeedbackWidget toolId={tool.id} toolTitle={tool.title} />

            {outputContent && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? "Copied!" : "Copy Result"}</span>
                </button>

                <button
                  onClick={handleDownload}
                  className="p-2 rounded-xl glass-panel-interactive text-slate-200 cursor-pointer"
                  title="Download File"
                >
                  <Download className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Primary Tool Working Section */}
      <section className="min-h-[400px]" aria-label="Interactive Tool Utility">
        {children}
      </section>

      {/* Long-form guide: worked examples, when-to / when-not-to, troubleshooting */}
      {(() => {
        const guide = guideForSlug(tool.slug);
        return guide ? <ToolGuide guide={guide} toolTitle={tool.title} onSelectTool={onSelectTool} /> : null;
      })()}

      {/* Suggested Next Steps Section (Dynamically suggested 2-3 tools based on current tool category) */}
      {suggestedNextSteps.length > 0 && (
        <section
          id="suggested-next-steps"
          className="p-6 md:p-8 glass-panel rounded-3xl space-y-5 border border-cyan-500/30 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-cyan-950/30 shadow-xl shadow-cyan-500/5"
          aria-label="Suggested Next Steps"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  <ArrowRightCircle className="w-4 h-4 text-cyan-400" />
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Suggested Next Steps
                </h2>
              </div>
              <p className="text-xs text-slate-300">
                Recommended workflow tools based on your current work in{" "}
                <span className="font-semibold text-cyan-300">{tool.categoryLabel || tool.category}</span>
              </p>
            </div>
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20 self-start sm:self-auto">
              {suggestedNextSteps.length} Related Tools
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {suggestedNextSteps.map((nextTool) => (
              <div
                key={nextTool.id}
                onClick={() => onSelectTool(nextTool.slug || nextTool.id)}
                className="group p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900/90 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-md hover:shadow-cyan-500/10"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-md border border-cyan-500/20">
                      {nextTool.categoryLabel || nextTool.category}
                    </span>
                    {nextTool.isFlagship && (
                      <span className="text-[9px] font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        Flagship
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                    {nextTool.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {nextTool.shortDescription}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                  <span>Open Tool</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Save Workspace Modal */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 space-y-4 border border-white/20 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Save to Personal Workspace</h3>
              </div>
              <button
                onClick={() => setShowWorkspaceModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {workspaceSaved ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-1">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <div className="text-xs font-bold text-emerald-300">Preset Saved to Workspace!</div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Save current configuration, parameters, and outputs so you can reload or export them anytime from the navigation workspace drawer.
                </p>

                <div className="space-y-1">
                  <label className="text-xs font-mono uppercase text-slate-400 block">Preset Name</label>
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="e.g. Production Sitemap for Clients"
                    className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    onClick={() => setShowWorkspaceModal(false)}
                    className="px-4 py-2 rounded-xl glass-panel-interactive text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!presetName.trim()) return;
                      if (onSaveWorkspace) {
                        onSaveWorkspace({
                          name: presetName.trim(),
                          toolId: tool.id,
                          toolSlug: tool.slug,
                          toolTitle: tool.title,
                          inputContent,
                          outputContent,
                          configState,
                        });
                      }
                      setWorkspaceSaved(true);
                      setTimeout(() => {
                        setWorkspaceSaved(false);
                        setShowWorkspaceModal(false);
                      }, 1200);
                    }}
                    disabled={!presetName.trim()}
                    className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs cursor-pointer shadow-lg shadow-cyan-500/20"
                  >
                    Save Preset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pillar Content Sections */}
      <article className="space-y-8 pt-8 border-t border-white/10">
        {/* SECTION 1: Introduction */}
        <div className="p-6 md:p-8 glass-panel rounded-3xl space-y-3">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span>What is {tool.title}?</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {tool.explanation}
          </p>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Whether you are auditing website architecture, optimizing crawl paths, debugging structured data, or standardizing output, <strong className="text-white">{tool.title}</strong> provides a focused workflow with processing behavior disclosed on this page.
          </p>
        </div>

        {/* SECTION 2: How to Use */}
        <div className="p-6 md:p-8 glass-panel rounded-3xl space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <span>How to Use This {pillarKeyword} (Step-by-Step)</span>
          </h2>
          <ol className="list-decimal list-inside space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
            {tool.howToUse.map((step, idx) => (
              <li key={idx} className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
                <strong className="text-cyan-400">Step {idx + 1}: </strong>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        {/* SECTION 3: Key Features & Technical Advantages */}
        <div className="p-6 md:p-8 glass-panel rounded-3xl space-y-4">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 border-b border-white/10 pb-3">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>Key Features & Technical Advantages</span>
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-300">
            {keyFeatures.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* SECTION 4: FAQs */}
        {finalFaqs.length > 0 && (
          <div className="p-6 md:p-8 glass-panel rounded-3xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <span>Frequently Asked Questions ({finalFaqs.length} FAQs)</span>
              </h2>
            </div>

            <div className="space-y-3">
              {finalFaqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="border border-white/10 rounded-2xl overflow-hidden bg-slate-900/40">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full p-4 text-left font-semibold text-xs sm:text-sm text-white flex items-center justify-between hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <span>
                        <span className="text-cyan-400 mr-2 font-mono">Q{idx + 1}.</span>
                        {faq.question}
                      </span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-2 text-xs sm:text-sm text-slate-300 border-t border-white/5 leading-relaxed bg-slate-950/40">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION 5: Dynamic Related Tools Grid (3 Items) */}
        {suggestedNextSteps.length > 0 && (
          <div className="space-y-4 pt-6 border-t border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <span>Related Category Micro-Tools ({suggestedNextSteps.length} Suggested)</span>
              </h2>
              <span className="text-xs font-mono text-slate-400">Handpicked Workflow Integrations</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suggestedNextSteps.map((rel) => (
                <div
                  key={rel.id}
                  onClick={() => onSelectTool(rel.slug || rel.id)}
                  className="p-5 glass-panel-interactive rounded-2xl cursor-pointer space-y-3 group flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-semibold text-cyan-300 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/30 inline-block">
                      {rel.categoryLabel || rel.category}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1">
                      {rel.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {rel.shortDescription}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                    <span>Open Tool</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
};
