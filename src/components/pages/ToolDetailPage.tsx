import React from "react";
import { ArrowLeft, CheckCircle2, ShieldCheck, Clock, Globe, Zap, Lock, Eye, EyeOff } from "lucide-react";
import { INDEXABLE_TOOLS, findIndexableTool } from "../../data/toolsRegistry";
import { ToolDefinition } from "../../types";

interface ToolDetailProps {
  slug: string;
  onBack: () => void;
}

export const ToolDetail: React.FC<ToolDetailProps> = ({ slug, onBack }) => {
  const tool = findIndexableTool(slug);

  if (!tool) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Tool not found</h1>
        <button onClick={onBack} className="text-cyan-400 hover:text-cyan-300">
          ← Back to home
        </button>
      </div>
    );
  }

  const relatedTools = tool.relatedToolIds
    ?.map((id) => INDEXABLE_TOOLS.find((t) => t.id === id))
    .filter((t): t is ToolDefinition => t !== undefined)
    .slice(0, 3) || [];

  return (
    <article className="max-w-4xl mx-auto px-4 py-12">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to all tools
      </button>

      <header className="rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-slate-900/90 to-slate-800/50 p-6 sm:p-9 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Free Tool
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-300">
            {tool.categoryLabel}
          </span>
        </div>

        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
          {tool.title}
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-slate-300">
          {tool.shortDescription}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {(tool.tags || []).slice(0, 6).map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-slate-700 bg-slate-800/50 px-2.5 py-1 text-xs text-slate-400"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <section className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-6">
            <h2 className="text-xl font-bold text-white mb-4">How to use this tool</h2>
            <ol className="space-y-3">
              {(tool.howToUse || []).map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-bold text-cyan-400">
                    {index + 1}
                  </span>
                  <span className="text-slate-300">{step}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-6">
            <h2 className="text-xl font-bold text-white mb-4">About this tool</h2>
            <div className="prose prose-invert prose-sm max-w-none text-slate-300">
              <p className="whitespace-pre-wrap">{tool.explanation}</p>
            </div>
          </section>

          {tool.faqs && tool.faqs.length > 0 && (
            <section className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {tool.faqs.map((faq, index) => (
                  <div key={index} className="border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                    <h3 className="font-semibold text-white mb-2">{faq.question}</h3>
                    <p className="text-sm leading-relaxed text-slate-400">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {tool.privacyNotice && (
            <section className="flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
              <div>
                <h3 className="font-semibold text-emerald-200">Privacy Notice</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{tool.privacyNotice}</p>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/30 p-6 sticky top-24">
            <h3 className="font-bold text-white mb-4">Tool Information</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-slate-400">Status</dt>
                <dd className="text-emerald-400 font-medium">Active</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Processing</dt>
                <dd className="text-cyan-400 font-medium">
                  {tool.execution === "local" ? "Local (Browser)" : "Cloud"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-400">Platform</dt>
                <dd className="text-slate-300">Web Browser</dd>
              </div>
              {tool.relatedToolIds && tool.relatedToolIds.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-slate-400">Related Tools</dt>
                  <dd className="text-slate-300">{tool.relatedToolIds.length}</dd>
                </div>
              )}
            </dl>

            {relatedTools.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-700">
                <h4 className="font-semibold text-white mb-3">Related Tools</h4>
                <div className="space-y-2">
                  {relatedTools.map((relatedTool) => (
                    <a
                      key={relatedTool.id}
                      href={`/tools/${relatedTool.slug}`}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.href = `/tools/${relatedTool.slug}`;
                      }}
                      className="block rounded-lg border border-slate-700/50 bg-slate-800/30 p-3 text-sm text-slate-300 transition hover:border-slate-600 hover:bg-slate-800/50"
                    >
                      <div className="font-medium text-white">{relatedTool.title}</div>
                      <div className="mt-1 text-xs text-slate-400 line-clamp-1">
                        {relatedTool.shortDescription}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default ToolDetail;
