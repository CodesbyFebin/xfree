import React, { useState } from "react";
import { ToolDefinition } from "../../types";
import { Copy, Check, Download, Plus, Trash2, Code, Sparkles } from "lucide-react";

interface SchemaMarkupGeneratorProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

export const SchemaMarkupGenerator: React.FC<SchemaMarkupGeneratorProps> = ({
  tool,
  onSaveHistory,
}) => {
  const [schemaType, setSchemaType] = useState<"FAQPage" | "Organization" | "Article" | "Product">("FAQPage");

  // FAQ State
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([
    {
      question: "Is XFree.in free to use?",
      answer: "Yes, all core browser micro-tools on XFree.in are 100% free with no signup or software installation required.",
    },
    {
      question: "Where is my data processed?",
      answer: "All processing happens locally inside your browser memory whenever possible to maintain absolute data privacy.",
    },
  ]);

  // Organization State
  const [orgName, setOrgName] = useState("XFree Platform");
  const [orgUrl, setOrgUrl] = useState("https://www.xfree.in");
  const [orgLogo, setOrgLogo] = useState("https://www.xfree.in/logo.png");

  // Article State
  const [articleTitle, setArticleTitle] = useState("Top 10 Developer & SEO Micro-Tools in 2026");
  const [authorName, setAuthorName] = useState("XFree Engineering Team");

  const [copied, setCopied] = useState(false);

  // Generate JSON-LD schema
  const generateJsonLd = () => {
    let schemaObj: any = {};

    if (schemaType === "FAQPage") {
      schemaObj = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: f.answer,
          },
        })),
      };
    } else if (schemaType === "Organization") {
      schemaObj = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: orgName,
        url: orgUrl,
        logo: orgLogo,
      };
    } else if (schemaType === "Article") {
      schemaObj = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: articleTitle,
        author: {
          "@type": "Person",
          name: authorName,
        },
        publisher: {
          "@type": "Organization",
          name: orgName,
          logo: {
            "@type": "ImageObject",
            url: orgLogo,
          },
        },
        datePublished: new Date().toISOString().split("T")[0],
      };
    }

    return `<script type="application/ld+json">\n${JSON.stringify(schemaObj, null, 2)}\n</script>`;
  };

  const jsonLdOutput = generateJsonLd();

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonLdOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onSaveHistory(`Schema ${schemaType}`, jsonLdOutput.slice(0, 100));
  };

  const addFaq = () => {
    setFaqs([...faqs, { question: "New Question?", answer: "Answer description." }]);
  };

  const removeFaq = (idx: number) => {
    setFaqs(faqs.filter((_, i) => i !== idx));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Controls Column */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <label className="text-xs font-bold text-white uppercase tracking-wider">Select Schema Type</label>
          <select
            value={schemaType}
            onChange={(e) => setSchemaType(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-semibold focus:outline-none focus:border-emerald-500"
          >
            <option value="FAQPage">FAQPage (Rich Accordion)</option>
            <option value="Organization">Organization (Brand Info)</option>
            <option value="Article">Article / Blog Post</option>
          </select>
        </div>

        {schemaType === "FAQPage" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-300">FAQ Question & Answer Entries ({faqs.length})</span>
              <button
                onClick={addFaq}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Q&A
              </button>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const updated = [...faqs];
                        updated[idx].question = e.target.value;
                        setFaqs(updated);
                      }}
                      placeholder="Question..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                    {faqs.length > 1 && (
                      <button onClick={() => removeFaq(idx)} className="text-rose-400 p-1 hover:bg-zinc-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={faq.answer}
                    onChange={(e) => {
                      const updated = [...faqs];
                      updated[idx].answer = e.target.value;
                      setFaqs(updated);
                    }}
                    placeholder="Answer details..."
                    rows={2}
                    className="w-full p-2.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {schemaType === "Organization" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">Website URL</label>
              <input
                type="text"
                value={orgUrl}
                onChange={(e) => setOrgUrl(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">Logo Image URL</label>
              <input
                type="text"
                value={orgLogo}
                onChange={(e) => setOrgLogo(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
              />
            </div>
          </div>
        )}

        {schemaType === "Article" && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">Article Headline</label>
              <input
                type="text"
                value={articleTitle}
                onChange={(e) => setArticleTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-300 mb-1 block">Author Name</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* JSON-LD Code Output Column */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Code className="w-4 h-4 text-emerald-400" />
              <span>Generated JSON-LD Output</span>
            </span>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy JSON-LD"}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto max-h-96">
            {jsonLdOutput}
          </pre>
        </div>

        <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-400">
          Paste this script block inside the <code className="text-emerald-400 font-mono">&lt;head&gt;</code> tag of your HTML document.
        </div>
      </div>
    </div>
  );
};
