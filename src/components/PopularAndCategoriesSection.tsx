import React from "react";
import {
  Globe,
  Code2,
  Sparkles,
  FileText,
  ArrowLeftRight,
  Shield,
  Calculator,
  Lock,
  Zap,
  UserCheck,
  ArrowRight,
  Search,
  Code,
  QrCode,
  Hash,
  Clock,
  Layout,
  Layers,
  Image as ImageIcon
} from "lucide-react";

interface PopularAndCategoriesProps {
  onSelectTool: (slug: string) => void;
  onSelectCategory: (catId: string) => void;
  onNavigatePage?: (path: string) => void;
}

export const PopularAndCategoriesSection: React.FC<PopularAndCategoriesProps> = ({
  onSelectTool,
  onSelectCategory,
  onNavigatePage,
}) => {
  const popularTools = [
    {
      slug: "bulk-url-extractor",
      title: "Bulk URL Extractor",
      description: "Extract all URLs from text content instantly.",
      icon: Globe,
      color: "text-cyan-400",
    },
    {
      slug: "json-formatter",
      title: "JSON Formatter",
      description: "Format, validate, and beautify JSON data.",
      icon: Code2,
      color: "text-indigo-400",
    },
    {
      slug: "regex-tester",
      title: "Regex Tester",
      description: "Test and validate regular expressions in real-time.",
      icon: Code,
      color: "text-blue-400",
    },
    {
      slug: "cron-expression-generator",
      title: "Cron Generator",
      description: "Generate cron expressions the easy way.",
      icon: Clock,
      color: "text-amber-400",
    },
    {
      slug: "xml-sitemap-generator",
      title: "Sitemap Generator",
      description: "Generate XML sitemaps for your website.",
      icon: Layers,
      color: "text-emerald-400",
    },
    {
      slug: "meta-tag-generator",
      title: "Meta Tag Preview",
      description: "Preview how your page looks in search results.",
      icon: Layout,
      color: "text-purple-400",
    },
    {
      slug: "qr-code-generator",
      title: "QR Code Generator",
      description: "Create QR codes for URLs and text.",
      icon: QrCode,
      color: "text-teal-400",
    },
    {
      slug: "base64-encoder-decoder",
      title: "Hash Generator",
      description: "Generate MD5, SHA-1, SHA-256 and more.",
      icon: Hash,
      color: "text-rose-400",
    },
  ];

  const categories = [
    {
      id: "seo-tools",
      title: "SEO Tools",
      description: "Optimize, analyze, and improve your SEO.",
      icon: Globe,
      color: "text-cyan-400",
    },
    {
      id: "developer-tools",
      title: "Developer Tools",
      description: "Utilities for developers and coders.",
      icon: Code2,
      color: "text-indigo-400",
    },
    {
      id: "ai-tools",
      title: "AI Tools",
      description: "Smart AI-powered tools to boost productivity.",
      icon: Sparkles,
      color: "text-purple-400",
    },
    {
      id: "text-tools",
      title: "Text Tools",
      description: "Transform, edit, and analyze your text.",
      icon: FileText,
      color: "text-emerald-400",
    },
    {
      id: "converters",
      title: "Data Converters",
      description: "Convert data between different formats.",
      icon: ArrowLeftRight,
      color: "text-blue-400",
    },
    {
      id: "image-tools",
      title: "Image Tools",
      description: "Edit, convert, and optimize images online.",
      icon: ImageIcon,
      color: "text-amber-400",
    },
    {
      id: "security-tools",
      title: "Security Tools",
      description: "Check, scan, and secure your data.",
      icon: Shield,
      color: "text-rose-400",
    },
    {
      id: "calculators",
      title: "Calculators",
      description: "Simple and advanced calculators.",
      icon: Calculator,
      color: "text-teal-400",
    },
  ];

  return (
    <div className="space-y-20 py-8">
      {/* 1. Popular Tools Grid */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Popular Tools
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Our most loved tools used by thousands every day.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <div
                key={tool.slug}
                onClick={() => onSelectTool(tool.slug)}
                className="group p-5 rounded-2xl bg-slate-900/70 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-xl hover:shadow-emerald-500/5"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Icon className={`w-5 h-5 ${tool.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => onSelectCategory("all")}
            className="inline-flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 font-semibold text-sm group cursor-pointer"
          >
            <span>Browse all tools</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </section>

      {/* 2. Tool Categories Section */}
      <section className="space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tool Categories
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Find the right tool in the right category.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="group p-5 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-slate-700 transition-all duration-200 cursor-pointer flex flex-col space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Icon className={`w-5 h-5 ${cat.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors">
                    {cat.title}
                  </h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Privacy-First. Always. Section */}
      <section className="rounded-3xl bg-slate-900/80 border border-slate-800 p-8 sm:p-12 relative overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Shield Graphic Left */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
              <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-2xl" />
              <div className="w-40 h-40 sm:w-52 sm:h-52 rounded-3xl bg-slate-950 border border-emerald-500/40 flex items-center justify-center relative shadow-2xl">
                <Shield className="w-20 h-20 sm:w-28 sm:h-28 text-emerald-400 stroke-[1.2]" />
                <Lock className="w-8 h-8 text-emerald-400 absolute fill-emerald-950" />
              </div>
            </div>
          </div>

          {/* Copy & Features Right */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Privacy-First. Always.
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Your data stays in your browser. We believe powerful tools should be private, fast, and hassle-free.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Code2 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">100% Local Processing</h4>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                    Everything runs in your browser. Your data never leaves your device.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">Blazing Fast</h4>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                    No uploads, no waits. Get instant results, every time.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <UserCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm sm:text-base">Zero Registration</h4>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                    No signup. No tracking. Just open and start using.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. One Problem. One Focused Tool Banner */}
      <section className="rounded-3xl bg-slate-900/90 border border-slate-800 p-8 sm:p-12 text-center space-y-6">
        <div className="max-w-2xl mx-auto space-y-3">
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            One problem. One focused tool.
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            No clutter. No complexity. Just the right tool to get X done.
          </p>
        </div>

        <div>
          <button
            onClick={() => onSelectCategory("all")}
            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-emerald-500/20 inline-flex items-center space-x-2 transition-all cursor-pointer hover:scale-105"
          >
            <span>Find Your Tool</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </section>
    </div>
  );
};
