import React from "react";
import { Globe, Github, Twitter, Linkedin, Mail, Shield, Zap, Lock, Sparkles, BookOpen, FileText, HelpCircle, ChevronRight } from "lucide-react";

interface FooterProps {
  onSelectCategory: (catId: string) => void;
  onSelectTool: (slug: string) => void;
  onNavigatePage: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onSelectTool,
  onNavigatePage,
}) => {
  return (
    <footer className="mt-20 border-t border-slate-800 bg-slate-950 text-slate-400 text-xs py-16 px-4 sm:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Main 5 Column Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          {/* Col 1: Brand & Social */}
          <div className="space-y-4 sm:col-span-2 lg:col-span-1">
            <div
              className="text-xl font-black tracking-tight flex items-center cursor-pointer select-none group"
              onClick={() => onNavigatePage("/")}
            >
              <span className="bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-500 text-slate-950 px-2 py-0.5 rounded-lg font-black shadow-lg shadow-cyan-500/20">
                X
              </span>
              <span className="ml-2 text-white font-black tracking-tight group-hover:text-cyan-300 transition-colors">
                Free<span className="text-emerald-400 font-mono text-xs">.in</span>
              </span>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              Fast, privacy-first browser micro-tools for developers, SEO professionals, creators, and AI builders.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <a
                href="https://github.com/xfree-in/xfree"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                title="GitHub Repository"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com/xfree_in"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-slate-700 transition-colors"
                title="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com/company/xfree-in"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-400 hover:border-slate-700 transition-colors"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <button
                onClick={() => onNavigatePage("/contact")}
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-slate-700 transition-colors cursor-pointer"
                title="Contact Support"
              >
                <Mail className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase font-mono">
              Categories
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onSelectCategory("seo-tools")}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  SEO & URL Tools
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory("developer-tools")}
                  className="hover:text-indigo-400 transition-colors cursor-pointer"
                >
                  Developer Tools
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory("ai-tools")}
                  className="hover:text-purple-400 transition-colors cursor-pointer"
                >
                  AI Utilities
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory("text-tools")}
                  className="hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Text & Diff Tools
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory("converters")}
                  className="hover:text-blue-400 transition-colors cursor-pointer"
                >
                  Converters & Encoders
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory("generators")}
                  className="hover:text-amber-400 transition-colors cursor-pointer"
                >
                  Generators
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectCategory("validators")}
                  className="hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Validators
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Popular Tools */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase font-mono">
              Popular Tools
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onSelectTool("bulk-url-extractor")}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Bulk URL Extractor
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool("json-formatter")}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  JSON Formatter & Tree
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool("regex-tester")}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Regex Tester
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool("cron-expression-generator")}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Cron Generator
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool("xml-sitemap-generator")}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  XML Sitemap Generator
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool("meta-tag-generator")}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Meta Tag SERP Preview
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool("robots-txt-generator")}
                  className="hover:text-cyan-400 transition-colors cursor-pointer"
                >
                  Robots.txt Generator
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Resources & Docs */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase font-mono">
              Resources & Docs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigatePage("/how-it-works")}
                  className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>How It Works</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage("/use-cases")}
                  className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Use Cases & Examples</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage("/docs")}
                  className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Documentation Hub</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage("/blog")}
                  className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Blog & Pillars</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage("/faq")}
                  className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>FAQ & Guidance</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Col 5: Company & Legal */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase font-mono">
              Company & Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigatePage("/about")}
                  className="hover:text-slate-200 transition-colors cursor-pointer"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage("/contact")}
                  className="hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage("/privacy")}
                  className="hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage("/terms")}
                  className="hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigatePage("/security")}
                  className="hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Security Architecture
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © 2026 XFree.in • All client-side tools run locally inside your browser memory.
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => onNavigatePage("/privacy")} className="hover:text-slate-400 cursor-pointer">
              Privacy
            </button>
            <span>•</span>
            <button onClick={() => onNavigatePage("/terms")} className="hover:text-slate-400 cursor-pointer">
              Terms
            </button>
            <span>•</span>
            <button onClick={() => onNavigatePage("/security")} className="hover:text-slate-400 cursor-pointer">
              Security
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
