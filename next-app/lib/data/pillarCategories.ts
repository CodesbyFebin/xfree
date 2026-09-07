export type PillarCategory =
  | "dev-tools"
  | "web-seo"
  | "ai-auto"
  | "media-docs"
  | "security"
  | "business"
  | "pdf-tools"
  | "image-tools"
  | "video-tools"
  | "text-tools"
  | "design-uiux"
  | "productivity";

export interface PillarCategoryDefinition {
  id: PillarCategory;
  label: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}

export const PILLAR_CATEGORIES: ReadonlyArray<PillarCategoryDefinition> = [
  { id: "dev-tools", label: "Developer Tools", slug: "developer-tools", description: "Formatters, validators, debuggers, regex, encoding, converters", icon: "⚡", color: "glow" },
  { id: "web-seo", label: "Web & SEO Tools", slug: "web-seo", description: "Sitemaps, meta tags, schema, crawl, performance, accessibility", icon: "🌐", color: "cyan" },
  { id: "ai-auto", label: "AI & Automation Tools", slug: "ai-automation", description: "Prompt engineering, LLM tools, agents, RAG, MCP workflows", icon: "🧠", color: "purple" },
  { id: "media-docs", label: "Media & Documents Tools", slug: "media-documents", description: "Image, video, audio, PDF, documents, spreadsheets, markdown", icon: "📁", color: "amber" },
  { id: "security", label: "Security & Privacy Tools", slug: "security-privacy", description: "Hash, passwords, JWT, DNS, HTTP, certificates, encryption", icon: "🔒", color: "red" },
  { id: "business", label: "Business & Productivity Tools", slug: "business-productivity", description: "Text, writing, calculators, finance, marketing, productivity", icon: "💼", color: "green" },
  { id: "pdf-tools", label: "PDF Tools", slug: "pdf-tools", description: "PDF conversion, compression, extraction, merging, splitting, editing", icon: "📄", color: "orange" },
  { id: "image-tools", label: "Image Tools", slug: "image-tools", description: "Compression, resizing, format conversion, optimization, editing", icon: "🖼️", color: "pink" },
  { id: "video-tools", label: "Video Tools", slug: "video-tools", description: "Compression, conversion, trimming, thumbnails, GIF creation", icon: "🎬", color: "indigo" },
  { id: "text-tools", label: "Text Tools", slug: "text-tools", description: "Word count, diff, case conversion, formatting, extraction", icon: "📝", color: "teal" },
  { id: "design-uiux", label: "Design & UI/UX Tools", slug: "design-uiux", description: "Color palette, typography, mockups, wireframes, accessibility", icon: "🎨", color: "fuchsia" },
  { id: "productivity", label: "Productivity & Automation", slug: "productivity-automation", description: "Task management, workflows, scheduling, reminders, templates", icon: "⚙️", color: "slate" },
];
