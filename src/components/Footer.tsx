import React from "react";
import { Github, Mail, ShieldCheck } from "lucide-react";
import { RouterLink } from "./RouterLink";
import { PUBLIC_CATEGORIES, getPopularTools } from "../data/publicTools";

interface FooterProps {
  onSelectCategory: (catId: string) => void;
  onSelectTool: (slug: string) => void;
  onNavigatePage: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigatePage }) => (
  <footer className="mt-20 border-t border-slate-800 bg-slate-950 px-4 py-16 text-xs text-slate-400 sm:px-8" role="contentinfo">
    <div className="mx-auto max-w-7xl space-y-12">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <div className="space-y-4 sm:col-span-2 lg:col-span-1">
          <RouterLink href="/" onNavigate={onNavigatePage} className="inline-flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-black text-white shadow-lg shadow-indigo-500/20">X</span>
            <span className="text-lg font-black tracking-tight text-white">XFree</span>
          </RouterLink>
          <p className="max-w-sm text-sm leading-6 text-slate-400">Focused browser utilities for developers, technical SEO workflows and data transformation, with processing mode disclosed per feature.</p>
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-900/70 bg-emerald-950/40 px-3 py-1.5 text-[10px] font-bold text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" /> Published routes pass build gates
          </div>
          <div className="flex items-center gap-3 pt-1">
            <a href="https://github.com/CodesbyFebin/xfree" target="_blank" rel="noreferrer" className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-indigo-500/40 hover:text-indigo-300" aria-label="XFree GitHub repository"><Github className="h-4 w-4" /></a>
            <RouterLink href="/contact" onNavigate={onNavigatePage} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-400 transition hover:border-indigo-500/40 hover:text-indigo-300" aria-label="Contact XFree"><Mail className="h-4 w-4" /></RouterLink>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-white">Categories</h3>
          <ul className="space-y-2.5">
            {PUBLIC_CATEGORIES.slice(0, 8).map((category) => <li key={category.id}><RouterLink href={`/${category.id}`} onNavigate={onNavigatePage} className="transition hover:text-indigo-300">{category.label}</RouterLink></li>)}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-white">Popular Tools</h3>
          <ul className="space-y-2.5">
            {getPopularTools(7).map((tool) => <li key={tool.id}><RouterLink href={`/tools/${tool.slug}`} onNavigate={onNavigatePage} className="transition hover:text-indigo-300">{tool.title}</RouterLink></li>)}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-white">Resources</h3>
          <ul className="space-y-2.5">
            {[["/how-it-works","How It Works"],["/use-cases","Use Cases"],["/docs","Documentation"],["/guides","Guides"],["/json-tools","JSON Tools"],["/pillars","Tool Pillars"],["/roadmap","25K Roadmap"],["/contribute","Contribute"],["/instaserver","InstaServer"],["/faq","FAQ"]].map(([href,label]) => <li key={href}><RouterLink href={href} onNavigate={onNavigatePage} className="transition hover:text-indigo-300">{label}</RouterLink></li>)}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-bold text-white">Company & Legal</h3>
          <ul className="space-y-2.5">
            {[["/about","About"],["/contact","Contact"],["/privacy","Privacy Policy"],["/terms","Terms of Service"],["/security","Security"]].map(([href,label]) => <li key={href}><RouterLink href={href} onNavigate={onNavigatePage} className="transition hover:text-indigo-300">{label}</RouterLink></li>)}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-4 border-t border-slate-900 pt-8 text-[11px] text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 XFree.in · Published tools disclose whether processing stays local or uses an optional cloud provider.</p>
        <div className="flex items-center gap-4">
          <RouterLink href="/privacy" onNavigate={onNavigatePage} className="hover:text-slate-300">Privacy</RouterLink>
          <RouterLink href="/terms" onNavigate={onNavigatePage} className="hover:text-slate-300">Terms</RouterLink>
          <RouterLink href="/security" onNavigate={onNavigatePage} className="hover:text-slate-300">Security</RouterLink>
        </div>
      </div>
    </div>
  </footer>
);
