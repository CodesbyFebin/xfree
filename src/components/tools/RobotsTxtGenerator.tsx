import React, { useState } from "react";
import { ToolDefinition } from "../../types";
import { FileCode2, Copy, Check, Download, Plus, Trash2, CheckCircle2, XCircle, Sparkles } from "lucide-react";

interface RobotsRule {
  userAgent: string;
  disallow: string[];
  allow: string[];
}

interface RobotsTxtGeneratorProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

export const RobotsTxtGenerator: React.FC<RobotsTxtGeneratorProps> = ({
  tool,
  onSaveHistory,
}) => {
  const [sitemapUrl, setSitemapUrl] = useState("https://example.com/sitemap.xml");
  const [crawlDelay, setCrawlDelay] = useState("");
  const [rules, setRules] = useState<RobotsRule[]>([
    {
      userAgent: "*",
      disallow: ["/admin/", "/checkout/", "/private/"],
      allow: ["/public/"],
    },
    {
      userAgent: "GPTBot",
      disallow: ["/"],
      allow: [],
    },
  ]);

  const [testUrl, setTestUrl] = useState("/admin/login");
  const [testUserAgent, setTestUserAgent] = useState("*");
  const [copied, setCopied] = useState(false);

  const addRule = () => {
    setRules([...rules, { userAgent: "Googlebot", disallow: ["/tmp/"], allow: [] }]);
  };

  const removeRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const addPath = (ruleIndex: number, type: "disallow" | "allow") => {
    const updated = [...rules];
    if (type === "disallow") updated[ruleIndex].disallow.push("/new-path/");
    else updated[ruleIndex].allow.push("/public-path/");
    setRules(updated);
  };

  const removePath = (ruleIndex: number, type: "disallow" | "allow", pathIndex: number) => {
    const updated = [...rules];
    if (type === "disallow") updated[ruleIndex].disallow.splice(pathIndex, 1);
    else updated[ruleIndex].allow.splice(pathIndex, 1);
    setRules(updated);
  };

  // Generate raw robots.txt output
  const generateRobotsTxt = () => {
    let lines: string[] = [];

    rules.forEach((rule) => {
      lines.push(`User-agent: ${rule.userAgent}`);
      rule.disallow.forEach((d) => {
        if (d.trim()) lines.push(`Disallow: ${d.trim()}`);
      });
      rule.allow.forEach((a) => {
        if (a.trim()) lines.push(`Allow: ${a.trim()}`);
      });
      if (crawlDelay.trim()) {
        lines.push(`Crawl-delay: ${crawlDelay.trim()}`);
      }
      lines.push("");
    });

    if (sitemapUrl.trim()) {
      lines.push(`Sitemap: ${sitemapUrl.trim()}`);
    }

    return lines.join("\n");
  };

  const robotsOutput = generateRobotsTxt();

  // Test URL Accessibility against rules
  const testAccess = () => {
    const targetPath = testUrl.trim() || "/";
    const matchingRule = rules.find((r) => r.userAgent === testUserAgent) || rules.find((r) => r.userAgent === "*");

    if (!matchingRule) return { allowed: true, reason: "No matching rules found" };

    // Check allow overrides first
    const isAllowed = matchingRule.allow.some((a) => a && targetPath.startsWith(a));
    if (isAllowed) return { allowed: true, reason: "Explicitly Allowed by rule" };

    const isDisallowed = matchingRule.disallow.some((d) => d && (d === "/" || targetPath.startsWith(d)));
    if (isDisallowed) return { allowed: false, reason: "Blocked by Disallow rule" };

    return { allowed: true, reason: "No Disallow match found" };
  };

  const testResult = testAccess();

  const handleCopy = () => {
    navigator.clipboard.writeText(robotsOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onSaveHistory("Robots.txt Rules", robotsOutput.slice(0, 100));
  };

  const handleDownload = () => {
    const blob = new Blob([robotsOutput], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "robots.txt";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Rule Builder Grid */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-emerald-400" />
            <span>Robots.txt Directives & User Agents</span>
          </h3>
          <button
            onClick={addRule}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add User-Agent Block
          </button>
        </div>

        {/* Global Sitemap & Crawl Delay Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-950 border border-zinc-800/80">
          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1 block">
              Sitemap URL
            </label>
            <input
              type="text"
              value={sitemapUrl}
              onChange={(e) => setSitemapUrl(e.target.value)}
              placeholder="https://example.com/sitemap.xml"
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-zinc-300 mb-1 block">
              Crawl Delay (Seconds, Optional)
            </label>
            <input
              type="text"
              value={crawlDelay}
              onChange={(e) => setCrawlDelay(e.target.value)}
              placeholder="e.g. 10"
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* User Agent Block Cards */}
        <div className="space-y-4">
          {rules.map((rule, ruleIdx) => (
            <div key={ruleIdx} className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <span className="text-xs font-semibold text-zinc-400">User-agent:</span>
                  <select
                    value={rule.userAgent}
                    onChange={(e) => {
                      const updated = [...rules];
                      updated[ruleIdx].userAgent = e.target.value;
                      setRules(updated);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="*">* (All Crawlers)</option>
                    <option value="Googlebot">Googlebot (Google Search)</option>
                    <option value="Bingbot">Bingbot (Bing)</option>
                    <option value="GPTBot">GPTBot (ChatGPT AI Crawler)</option>
                    <option value="ClaudeBot">ClaudeBot (Anthropic AI)</option>
                    <option value="Twitterbot">Twitterbot (Social Link Cards)</option>
                  </select>
                </div>

                {rules.length > 1 && (
                  <button
                    onClick={() => removeRule(ruleIdx)}
                    className="p-1 rounded text-rose-400 hover:bg-zinc-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Disallow & Allow Paths */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Disallow Paths */}
                <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between text-rose-400 font-semibold">
                    <span>Disallow Paths</span>
                    <button
                      onClick={() => addPath(ruleIdx, "disallow")}
                      className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20"
                    >
                      + Path
                    </button>
                  </div>
                  {rule.disallow.map((p, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={p}
                        onChange={(e) => {
                          const updated = [...rules];
                          updated[ruleIdx].disallow[pIdx] = e.target.value;
                          setRules(updated);
                        }}
                        className="flex-1 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => removePath(ruleIdx, "disallow", pIdx)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                {/* Allow Overrides */}
                <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between text-emerald-400 font-semibold">
                    <span>Allow Overrides</span>
                    <button
                      onClick={() => addPath(ruleIdx, "allow")}
                      className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20"
                    >
                      + Path
                    </button>
                  </div>
                  {rule.allow.map((p, pIdx) => (
                    <div key={pIdx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={p}
                        onChange={(e) => {
                          const updated = [...rules];
                          updated[ruleIdx].allow[pIdx] = e.target.value;
                          setRules(updated);
                        }}
                        className="flex-1 px-2 py-1 rounded bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => removePath(ruleIdx, "allow", pIdx)}
                        className="text-zinc-500 hover:text-rose-400 p-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Accessibility Tester Box */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
          Live URL Tester Simulator
        </h4>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            placeholder="e.g. /admin/dashboard or /public/about"
            className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
          />
          <div className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold text-xs ${
            testResult.allowed ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
          }`}>
            {testResult.allowed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            <span>{testResult.allowed ? "ALLOWED" : "BLOCKED"}</span>
            <span className="text-[10px] font-normal opacity-80">({testResult.reason})</span>
          </div>
        </div>
      </div>

      {/* Output Robots.txt Box */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white uppercase tracking-wider">Generated robots.txt Output</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy Output"}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download robots.txt</span>
            </button>
          </div>
        </div>
        <pre className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-300 leading-relaxed overflow-x-auto">
          {robotsOutput}
        </pre>
      </div>
    </div>
  );
};
