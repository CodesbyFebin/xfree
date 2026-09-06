import React from "react";
import { PUBLIC_TOOLS } from "../../data/publicTools";
import { FileJson, ArrowLeftRight, Search, ListOrdered, Quote } from "lucide-react";

interface JsonToolsPageProps {
  onSelectTool: (slug: string) => void;
}

interface JsonGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  slugs: string[];
}

const GROUPS: JsonGroup[] = [
  {
    label: "Format & Validate",
    icon: FileJson,
    slugs: ["json-formatter", "json-pretty-printer", "json-minifier", "json-syntax-validator", "json-key-sorter"],
  },
  {
    label: "Convert",
    icon: ArrowLeftRight,
    slugs: ["json-to-csv-converter", "csv-to-json-converter", "jsonl-to-json-array", "json-array-to-jsonl"],
  },
  {
    label: "Inspect & Extract",
    icon: Search,
    slugs: [
      "json-value-type-inspector",
      "json-object-key-extractor",
      "json-array-length-counter",
      "json-pointer-resolver",
      "json-nesting-depth-calculator",
    ],
  },
  {
    label: "Array Tools",
    icon: ListOrdered,
    slugs: ["json-array-deduplicator", "json-array-sorter"],
  },
  {
    label: "Escape & Encode",
    icon: Quote,
    slugs: ["json-string-escaper", "json-string-unescaper"],
  },
];

export const JsonToolsPage: React.FC<JsonToolsPageProps> = ({ onSelectTool }) => {
  const bySlug = new Map(PUBLIC_TOOLS.map((t) => [t.slug, t]));
  const totalCount = GROUPS.reduce((n, g) => n + g.slugs.filter((s) => bySlug.has(s)).length, 0);

  return (
    <div className="space-y-10">
      <header className="rounded-3xl border border-cyan-500/20 bg-slate-900/70 p-6 sm:p-9">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-cyan-300">
          <FileJson className="h-4 w-4" /> {totalCount} working tools, one hub
        </div>
        <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-tight text-white sm:text-5xl">
          Free JSON Tools — Formatter, Validator, Converter &amp; Inspector
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-slate-300">
          {totalCount} browser-local JSON utilities in one place: format and validate a payload, convert it to or from
          CSV and JSON Lines, sort or deduplicate arrays, resolve a JSON Pointer, or escape a string for embedding.
          Every tool here runs in your browser — no JSON you paste is sent to XFree.in servers.
        </p>
      </header>

      {GROUPS.map((group) => {
        const tools = group.slugs.map((slug) => bySlug.get(slug)).filter((t): t is NonNullable<typeof t> => Boolean(t));
        if (tools.length === 0) return null;
        const Icon = group.icon;
        return (
          <section key={group.label} aria-labelledby={`json-group-${group.label}`} className="space-y-4">
            <h2 id={`json-group-${group.label}`} className="flex items-center gap-2 text-2xl font-black text-white sm:text-3xl">
              <Icon className="h-5 w-5 text-cyan-300" /> {group.label}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <button
                  key={tool.slug}
                  onClick={() => onSelectTool(tool.slug)}
                  className="text-left rounded-2xl border border-white/10 bg-slate-900/60 p-5 transition hover:border-cyan-500/40 hover:bg-slate-900"
                >
                  <h3 className="text-base font-bold text-white">{tool.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{tool.shortDescription}</p>
                </button>
              ))}
            </div>
          </section>
        );
      })}

      <section aria-labelledby="json-faq" className="space-y-4">
        <h2 id="json-faq" className="text-2xl font-black text-white sm:text-3xl">
          Common questions
        </h2>
        {[
          [
            "Does any of this leave the browser?",
            "No. Every JSON tool on this page — formatting, validation, conversion, sorting, escaping — runs as browser JavaScript. The site loads Google AdSense which sets advertising cookies (see the Privacy page), but the JSON payloads you paste are never uploaded to XFree.in or any AI backend.",
          ],
          [
            "What's the difference between formatting and minifying?",
            "Formatting adds indentation and line breaks for human readability. Minifying strips all insignificant whitespace for compact transport or storage. Both parse and reserialize the same underlying JSON value — neither changes the data itself.",
          ],
          [
            "What is JSON Lines and why would I convert to it?",
            "JSON Lines (JSONL/NDJSON) is one JSON value per line instead of one big array. It's the format many log pipelines, streaming APIs, and bulk-import tools expect, because each line can be parsed independently without loading the whole file into memory.",
          ],
          [
            "Can these tools handle deeply nested or very large JSON?",
            "The nesting depth calculator will report how deep a structure goes, and the tools generally handle typical API-response-sized payloads (up to a few MB) without issue. For very large files, browser memory becomes the limit — a command-line tool like jq is a better fit past that point.",
          ],
        ].map(([q, a]) => (
          <details key={q} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <summary className="cursor-pointer font-semibold text-white">{q}</summary>
            <p className="mt-3 text-sm leading-6 text-slate-300">{a}</p>
          </details>
        ))}
      </section>
    </div>
  );
};
