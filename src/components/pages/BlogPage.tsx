import React, { useState } from "react";
import { FileText, ArrowRight, Clock, User, Tag, Sparkles, CheckCircle2 } from "lucide-react";

interface PageProps {
  onGoHome: () => void;
  onSelectTool: (slug: string) => void;
}

export const BlogPage: React.FC<PageProps> = ({ onGoHome, onSelectTool }) => {
  const [selectedPost, setSelectedPost] = useState<number | null>(null);

  const posts = [
    {
      id: 1,
      title: "Mastering Bulk URL Extraction & Sitemap Generation in 2026",
      category: "Technical SEO",
      date: "March 15, 2026",
      readTime: "6 min read",
      author: "XFree Engineering",
      summary: "How modern web crawlers handle massive URL lists, parameter stripping, domain filtering, and Google-compliant XML sitemaps.",
      toolSlug: "bulk-url-extractor",
      content: `
# Mastering Bulk URL Extraction & Sitemap Generation in 2026

Extracting URLs from massive raw text files, web crawls, or logs is a core requirement for digital marketers, webmasters, and SEO auditors. When auditing enterprise websites with thousands of pages, manual copy-pasting is inefficient and prone to errors.

## Why Client-Side Bulk URL Extraction is Superior

Traditional URL extraction tools upload your raw text payloads or HTML source code to backend servers. This creates severe privacy concerns when working with staging URLs, confidential client reports, or internal CMS logs.

XFree.in solves this by processing 100% of the extraction logic locally inside your browser memory using optimized regular expressions.

### Key Steps in Automated URL Processing:
1. **RegEx Pattern Isolation**: Isolates all http:// and https:// URI schemes cleanly.
2. **Domain Filtering**: Selectively includes or excludes specific subdomains or TLDs.
3. **Query Parameter Removal**: Strips tracking parameters like utm_source, gclid, or session IDs.
4. **XML Sitemap Construction**: Exports valid schema-compliant sitemap.xml files ready for Google Search Console submission.
      `
    },
    {
      id: 2,
      title: "Debugging Malformed JSON & XML API Responses Instantly",
      category: "Developer Tools",
      date: "March 14, 2026",
      readTime: "5 min read",
      author: "DevRel Team",
      summary: "A practical guide to diagnosing line-column syntax errors, formatting nested JSON trees, and auto-repairing broken quotes.",
      toolSlug: "json-formatter",
      content: `
# Debugging Malformed JSON & XML API Responses Instantly

JSON is the universal standard for web API data exchange. However, unformatted, minified, or syntax-broken JSON strings can cause runtime exceptions in client applications.

## Common JSON Errors:
- Unescaped special characters or line breaks
- Trailing commas in arrays or objects
- Single quotes instead of valid double quotes
- Unclosed curly brackets or square brackets

XFree.in provides an interactive JSON tree viewer and instant syntax validator with exact line and column markers to resolve errors in seconds.
      `
    },
    {
      id: 3,
      title: "Building & Testing Complex Regular Expressions (Regex Guide)",
      category: "Programming",
      date: "March 12, 2026",
      readTime: "7 min read",
      author: "Alex Dev",
      summary: "Understand lookaheads, lookbehinds, group captures, and global replacement flags with real-time browser highlighting.",
      toolSlug: "regex-tester",
      content: `
# Building & Testing Complex Regular Expressions (Regex Guide)

Regular expressions (regex) allow developers to search, validate, and manipulate text strings with unmatched power.

## Key Regex Flags Explained:
- \`g\` (Global): Find all matches rather than stopping at the first match.
- \`i\` (Case Insensitive): Match characters regardless of uppercase or lowercase.
- \`m\` (Multiline): Treat start (^)\` and end ($)\` characters as matching individual lines rather than the entire string.
      `
    },
    {
      id: 4,
      title: "Demystifying Cron Expression Syntax & Scheduled Tasks",
      category: "DevOps & Cloud",
      date: "March 10, 2026",
      readTime: "4 min read",
      author: "DevOps Desk",
      summary: "Learn the 5-field cron expression standard and calculate upcoming execution timestamps for Linux servers and cloud jobs.",
      toolSlug: "cron-expression-generator",
      content: `
# Demystifying Cron Expression Syntax & Scheduled Tasks

Cron jobs execute automated scripts at scheduled intervals on Unix-like operating systems.

## Cron Standard Fields:
1. Minute (0 - 59)
2. Hour (0 - 23)
3. Day of Month (1 - 31)
4. Month (1 - 12)
5. Day of Week (0 - 6)
      `
    },
    {
      id: 5,
      title: "Optimizing Robots.txt Directives for Search Crawlers & AI Bots",
      category: "Technical SEO",
      date: "March 08, 2026",
      readTime: "5 min read",
      author: "SEO Guild",
      summary: "How to balance search engine indexing with protection against unapproved AI scrapers using RFC 9309 rules.",
      toolSlug: "robots-txt-generator",
      content: `
# Optimizing Robots.txt Directives for Search Crawlers & AI Bots

A clean \`robots.txt\` file acts as the front door for web crawlers visiting your web properties.
      `
    },
    {
      id: 6,
      title: "Decoding OAuth JWT Tokens and Base64 Strings Safely",
      category: "Security Architecture",
      date: "March 06, 2026",
      readTime: "6 min read",
      author: "SecOps Lead",
      summary: "Why you should never paste production JWT tokens into online decoders that log your request headers.",
      toolSlug: "base64-encoder-decoder",
      content: `
# Decoding OAuth JWT Tokens and Base64 Strings Safely

JSON Web Tokens (JWTs) carry sensitive user identity claims and expiration dates. Transmitting active production tokens over third-party APIs can lead to severe security leaks.
      `
    },
    {
      id: 7,
      title: "Leveraging Single-Purpose AI Tools for Development Speed",
      category: "AI & Automation",
      date: "March 04, 2026",
      readTime: "5 min read",
      author: "AI Research",
      summary: "How deterministic AI prompts in Gemini produce higher precision than general-purpose conversational chats.",
      toolSlug: "ai-regex",
      content: `
# Leveraging Single-Purpose AI Tools for Development Speed

Focused AI micro-tools constrained to strict JSON outputs provide predictable results for code generation, regex building, and SQL query synthesis.
      `
    },
    {
      id: 8,
      title: "Schema.org & JSON-LD Structured Data for Search Visibility",
      category: "Technical SEO",
      date: "March 02, 2026",
      readTime: "6 min read",
      author: "SEO Guild",
      summary: "Boost CTR with Google Rich Results using schema markup for FAQPage, Organization, Article, and SoftwareApplication.",
      toolSlug: "schema-markup-generator",
      content: `
# Schema.org & JSON-LD Structured Data for Search Visibility

Adding valid JSON-LD structured data helps search engines understand page context and unlock rich SERP features.
      `
    },
    {
      title: "Creating High-CTR Meta Descriptions & SERP Cards",
      category: "Content Strategy",
      date: "February 28, 2026",
      readTime: "4 min read",
      author: "Content Lead",
      summary: "Design compelling Google search result previews and Open Graph cards that drive organic clicks.",
      toolSlug: "meta-tag-generator",
      id: 9,
      content: `
# Creating High-CTR Meta Descriptions & SERP Cards

A great title tag and meta description directly impact your click-through rate from search engine result pages.
      `
    },
    {
      id: 10,
      title: "The Case for Browser-Based Micro-Tools Over Desktop Suites",
      category: "Productivity",
      date: "February 25, 2026",
      readTime: "5 min read",
      author: "XFree Platform",
      summary: "Why lightweight zero-install browser utilities are replacing heavy desktop applications.",
      toolSlug: "bulk-url-extractor",
      content: `
# The Case for Browser-Based Micro-Tools Over Desktop Suites

Speed, zero latency, no setup costs, and complete privacy make browser-based execution the future of software utilities.
      `
    }
  ];

  if (selectedPost !== null) {
    const post = posts.find((p) => p.id === selectedPost);
    if (!post) return null;

    return (
      <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
        <button
          onClick={() => setSelectedPost(null)}
          className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
        >
          ← Back to All Posts
        </button>

        <div className="space-y-4 border-b border-slate-800 pb-6">
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/30">
            {post.category}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">
            {post.title}
          </h1>
          <div className="flex items-center space-x-4 text-xs text-slate-400 font-mono">
            <span>By {post.author}</span>
            <span>•</span>
            <span>{post.date}</span>
            <span>•</span>
            <span>{post.readTime}</span>
          </div>
        </div>

        <div className="prose prose-invert max-w-none text-slate-300 space-y-4 text-sm sm:text-base leading-relaxed">
          {post.content.split("\n\n").map((paragraph, idx) => {
            if (paragraph.startsWith("# ")) {
              return <h1 key={idx} className="text-2xl font-bold text-white pt-4">{paragraph.replace("# ", "")}</h1>;
            }
            if (paragraph.startsWith("## ")) {
              return <h2 key={idx} className="text-xl font-bold text-white pt-4">{paragraph.replace("## ", "")}</h2>;
            }
            if (paragraph.startsWith("### ")) {
              return <h3 key={idx} className="text-lg font-bold text-cyan-400 pt-2">{paragraph.replace("### ", "")}</h3>;
            }
            return <p key={idx}>{paragraph}</p>;
          })}
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-white text-base">Try the Related Tool</h4>
            <p className="text-slate-400 text-xs">Execute this article's core workflow directly in your browser.</p>
          </div>
          <button
            onClick={() => onSelectTool(post.toolSlug)}
            className="px-5 py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-colors cursor-pointer shrink-0"
          >
            Launch Tool Now →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 space-y-12">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-semibold text-emerald-400">
          <FileText className="w-4 h-4" />
          <span>SEO & Engineering Articles</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          XFree.in Blog & Guides
        </h1>
        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto">
          Deep-dive guides on technical SEO, regex, developer tooling, security, and AI micro-apps.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => setSelectedPost(post.id)}
            className="p-6 rounded-2xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 font-mono">
                <span className="text-emerald-400 font-bold">{post.category}</span>
                <span>{post.readTime}</span>
              </div>

              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                {post.title}
              </h3>

              <p className="text-slate-400 text-xs leading-relaxed">
                {post.summary}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
              <span>Read Full Article</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
