import React from "react";
import { Github, Mail } from "lucide-react";
import { RouterLink } from "./RouterLink";
import { PUBLIC_CATEGORIES, getPopularTools } from "../data/publicTools";

interface FooterProps {
  onSelectCategory: (catId: string) => void;
  onSelectTool: (slug: string) => void;
  onNavigatePage: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
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
                href="https://github.com/CodesbyFebin/xfree"
                target="_blank"
                rel="noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-700 transition-colors"
                title="GitHub Repository"
              >
                <Github className="w-4 h-4" />
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
              {PUBLIC_CATEGORIES.map((category) => (
                <li key={category.id}>
                  <RouterLink
                    href={`/category/${category.id}`}
                    onNavigate={onNavigatePage}
                    className="hover:text-cyan-400 transition-colors"
                  >
                    {category.label}
                  </RouterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Popular Tools */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase font-mono">
              Popular Tools
            </h4>
            <ul className="space-y-2 text-xs">
              {getPopularTools(7).map((tool) => (
                <li key={tool.id}>
                  <RouterLink
                    href={`/tools/${tool.slug}`}
                    onNavigate={onNavigatePage}
                    className="hover:text-cyan-400 transition-colors"
                  >
                    {tool.title}
                  </RouterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Resources & Docs */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase font-mono">
              Resources & Docs
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <RouterLink href="/how-it-works" onNavigate={onNavigatePage} className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1">
                  <span>How It Works</span>
                </RouterLink>
              </li>
              <li>
                <RouterLink href="/use-cases" onNavigate={onNavigatePage} className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1">
                  <span>Use Cases &amp; Examples</span>
                </RouterLink>
              </li>
              <li>
                <RouterLink href="/docs" onNavigate={onNavigatePage} className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1">
                  <span>Documentation Hub</span>
                </RouterLink>
              </li>
              <li>
                <RouterLink href="/guides" onNavigate={onNavigatePage} className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1">
                  <span>Guides</span>
                </RouterLink>
              </li>
              <li>
                <RouterLink href="/blog" onNavigate={onNavigatePage} className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1">
                  <span>Blog</span>
                </RouterLink>
              </li>
              <li>
                <RouterLink href="/faq" onNavigate={onNavigatePage} className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-1">
                  <span>FAQ</span>
                </RouterLink>
              </li>
            </ul>
          </div>

          {/* Col 5: Company & Legal */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase font-mono">
              Company &amp; Legal
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <RouterLink href="/about" onNavigate={onNavigatePage} className="hover:text-slate-200 transition-colors cursor-pointer">
                  About
                </RouterLink>
              </li>
              <li>
                <RouterLink href="/contact" onNavigate={onNavigatePage} className="hover:text-slate-200 transition-colors cursor-pointer">
                  Contact
                </RouterLink>
              </li>
              <li>
                <RouterLink href="/privacy" onNavigate={onNavigatePage} className="hover:text-slate-200 transition-colors cursor-pointer">
                  Privacy Policy
                </RouterLink>
              </li>
              <li>
                <RouterLink href="/terms" onNavigate={onNavigatePage} className="hover:text-slate-200 transition-colors cursor-pointer">
                  Terms of Service
                </RouterLink>
              </li>
              <li>
                <RouterLink href="/security" onNavigate={onNavigatePage} className="hover:text-slate-200 transition-colors cursor-pointer">
                  Security
                </RouterLink>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © 2026 XFree.in • Local tools run in your browser; AI tools proxy to Google Gemini. Advertising and consent technologies are disclosed in our Privacy Policy.
          </div>
          <div className="flex items-center space-x-4">
            <RouterLink href="/privacy" onNavigate={onNavigatePage} className="hover:text-slate-400 cursor-pointer">
              Privacy
            </RouterLink>
            <span aria-hidden="true">•</span>
            <RouterLink href="/terms" onNavigate={onNavigatePage} className="hover:text-slate-400 cursor-pointer">
              Terms
            </RouterLink>
            <span aria-hidden="true">•</span>
            <RouterLink href="/security" onNavigate={onNavigatePage} className="hover:text-slate-400 cursor-pointer">
              Security
            </RouterLink>
          </div>
        </div>
      </div>
    </footer>
  );
};
