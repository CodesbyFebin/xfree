import { useEffect } from "react";
import { ToolDefinition } from "../types";

interface UseMetaTagsOptions {
  tool?: ToolDefinition | null;
  categoryName?: string;
  isClusterPage?: boolean;
  isThinkingPage?: boolean;
  currentPath?: string;
  baseUrl?: string;
}

export function useMetaTags({
  tool,
  categoryName,
  isClusterPage = false,
  isThinkingPage = false,
  currentPath = typeof window !== "undefined" ? window.location.pathname : "/",
  baseUrl = "https://www.xfree.in",
}: UseMetaTagsOptions) {
  useEffect(() => {
    let title = "XFree.in — 400+ Free Online Developer & SEO Micro-Tools";
    let description =
      "Access 400+ free online developer utilities, SEO analyzers, AI single-purpose assistants, data formatters, and converters with 100% client-side privacy.";
    let canonicalUrl = `${baseUrl}/`;

    // 1. Determine Title & Description based on route / tool
    if (tool) {
      const pillar = tool.pillarKeyword ? ` | ${tool.pillarKeyword}` : "";
      title = `${tool.title}${pillar} — Free Browser Utility | XFree.in`;
      description = tool.shortDescription
        ? `${tool.shortDescription} 100% free client-side execution, zero data logging, instant output.`
        : `Use ${tool.title} for free online in your browser with zero registration and 100% privacy.`;
      canonicalUrl = `${baseUrl}/tools/${tool.slug}`;
    } else if (categoryName) {
      title = `${categoryName} Hub — 100% Free Browser Micro-Tools | XFree.in`;
      description = `Explore free online ${categoryName} utilities. Clean, client-side browser execution, instant data exports, zero registration.`;
      canonicalUrl = `${baseUrl}/category/${categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    } else if (isClusterPage) {
      title = "100 SEO Keyword Clusters & Micro-Tool Directory | XFree.in";
      description = "Programmatic SEO directory mapping 100 search intent keyword clusters to 400+ high-performance browser micro-tools.";
      canonicalUrl = `${baseUrl}/clusters`;
    } else if (isThinkingPage) {
      title = "Gemini 3.1 Pro Deep Thinking Mode — Complex Analytical Reasoning | XFree.in";
      description = "Perform step-by-step deep analytical reasoning for complex SQL queries, regex logic, and SEO architecture migration using Gemini 3.1 Pro preview.";
      canonicalUrl = `${baseUrl}/thinking`;
    } else if (currentPath === "/how-it-works") {
      title = "How It Works — XFree.in Browser Micro-Tools Architecture";
      description = "Learn how XFree.in executes 100% client-side web utilities inside your browser with zero server latency and total privacy.";
      canonicalUrl = `${baseUrl}/how-it-works`;
    } else if (currentPath === "/use-cases") {
      title = "Use Cases & Workflows — Developer & SEO Micro-Tools | XFree.in";
      description = "Discover real-world engineering and technical SEO workflows powered by XFree.in micro-tools.";
      canonicalUrl = `${baseUrl}/use-cases`;
    } else if (currentPath === "/docs") {
      title = "Documentation & Integration Guides | XFree.in";
      description = "Comprehensive documentation, API specs, and usage guides for XFree.in developer and SEO utilities.";
      canonicalUrl = `${baseUrl}/docs`;
    } else if (currentPath === "/blog") {
      title = "Technical SEO & Developer Engineering Blog | XFree.in";
      description = "Deep-dive articles and tutorials on technical SEO, regex, developer tooling, security, and AI micro-apps.";
      canonicalUrl = `${baseUrl}/blog`;
    } else if (currentPath === "/faq") {
      title = "Frequently Asked Questions — XFree.in Micro-Tools Platform";
      description = "Answers to common questions about XFree.in client-side privacy, free execution, and AI micro-tools.";
      canonicalUrl = `${baseUrl}/faq`;
    } else if (currentPath === "/about") {
      title = "About XFree.in — Privacy-First Web Micro-Tools Platform";
      description = "Our mission to build the fastest, privacy-first, zero-install web micro-tool platform for developers and SEOs.";
      canonicalUrl = `${baseUrl}/about`;
    } else if (currentPath === "/contact") {
      title = "Contact Support & Tool Requests | XFree.in";
      description = "Reach out for support, report issues, or suggest new developer micro-tools on XFree.in.";
      canonicalUrl = `${baseUrl}/contact`;
    } else if (currentPath === "/privacy") {
      title = "Privacy Policy — XFree.in Zero Server Upload Standard";
      description = "XFree.in privacy policy explaining 100% client-side browser execution and zero data logging.";
      canonicalUrl = `${baseUrl}/privacy`;
    } else if (currentPath === "/terms") {
      title = "Terms of Service — XFree.in Web Utilities";
      description = "Terms of service and acceptable use policy for XFree.in online micro-tools.";
      canonicalUrl = `${baseUrl}/terms`;
    } else if (currentPath === "/security") {
      title = "Security & Sandbox Architecture | XFree.in";
      description = "Deep dive into XFree.in browser sandbox execution, CSP headers, and API key security.";
      canonicalUrl = `${baseUrl}/security`;
    }

    // Update Document Title
    document.title = title;

    // Helper to update or create meta tag
    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    // Helper to update or create link tag
    const setLinkTag = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    // Standard Meta Tags
    setMetaTag('meta[name="description"]', "name", "description", description);
    setLinkTag("canonical", canonicalUrl);

    // OpenGraph Meta Tags
    setMetaTag('meta[property="og:title"]', "property", "og:title", title);
    setMetaTag('meta[property="og:description"]', "property", "og:description", description);
    setMetaTag('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMetaTag('meta[property="og:type"]', "property", "og:type", "website");
    setMetaTag('meta[property="og:site_name"]', "property", "og:site_name", "XFree.in");

    // Twitter Card Meta Tags
    setMetaTag('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMetaTag('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMetaTag('meta[name="twitter:description"]', "name", "twitter:description", description);

    // ==========================================
    // Dynamic JSON-LD Structured Data Injection
    // ==========================================
    const jsonLdGraph: any[] = [];

    // 1. BreadcrumbList Schema
    const breadcrumbs: any[] = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl}/`,
      },
    ];

    if (tool) {
      breadcrumbs.push({
        "@type": "ListItem",
        position: 2,
        name: tool.categoryLabel || tool.category,
        item: `${baseUrl}/category/${tool.category}`,
      });
      breadcrumbs.push({
        "@type": "ListItem",
        position: 3,
        name: tool.title,
        item: `${baseUrl}/tools/${tool.slug}`,
      });
    } else if (categoryName) {
      breadcrumbs.push({
        "@type": "ListItem",
        position: 2,
        name: categoryName,
        item: `${baseUrl}/category/${categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      });
    } else if (currentPath && currentPath !== "/") {
      const cleanName = currentPath.replace("/", "").replace(/-/g, " ");
      const formatted = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      breadcrumbs.push({
        "@type": "ListItem",
        position: 2,
        name: formatted,
        item: `${baseUrl}${currentPath}`,
      });
    }

    jsonLdGraph.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs,
    });

    // 2. WebSite & Organization Schema
    jsonLdGraph.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "XFree.in",
      url: `${baseUrl}/`,
      description: "100% Free Client-Side Developer & SEO Micro-Tools Suite",
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });

    // 3. SoftwareApplication Schema (for Tools)
    if (tool) {
      jsonLdGraph.push({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: tool.title,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description: tool.shortDescription,
        url: canonicalUrl,
      });

      // 4. HowTo Schema for Tools
      if (tool.howToUse && tool.howToUse.length > 0) {
        jsonLdGraph.push({
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: `How to use ${tool.title}`,
          description: tool.shortDescription,
          step: tool.howToUse.map((stepText, idx) => ({
            "@type": "HowToStep",
            position: idx + 1,
            name: `Step ${idx + 1}`,
            text: stepText,
          })),
        });
      }

      // 5. FAQPage Schema for Tools
      if (tool.faqs && tool.faqs.length > 0) {
        jsonLdGraph.push({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: tool.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer,
            },
          })),
        });
      }
    }

    // 6. HowTo Schema for /how-it-works static page
    if (currentPath === "/how-it-works") {
      jsonLdGraph.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How XFree.in Browser Micro-Tools Work",
        description: "Learn how client-side browser micro-tools process data locally with zero server latency.",
        step: [
          { "@type": "HowToStep", position: 1, name: "Select Tool", text: "Browse or search 400+ micro-tools." },
          { "@type": "HowToStep", position: 2, name: "Input Data", text: "Paste your text, JSON, URLs, or regex patterns into the editor." },
          { "@type": "HowToStep", position: 3, name: "Execute Locally", text: "Data is transformed instantly in your browser JavaScript memory." },
          { "@type": "HowToStep", position: 4, name: "Export Output", text: "Copy or download clean formatted outputs in 1 click." },
        ],
      });
    }

    // 7. Article Schema for informational static pages (/blog, /docs, /use-cases, /about, /security)
    if (["/blog", "/docs", "/use-cases", "/about", "/security"].includes(currentPath)) {
      jsonLdGraph.push({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: description,
        author: {
          "@type": "Organization",
          name: "XFree.in Engineering",
        },
        publisher: {
          "@type": "Organization",
          name: "XFree.in",
          logo: {
            "@type": "ImageObject",
            url: `${baseUrl}/favicon.ico`,
          },
        },
        mainEntityOfPage: canonicalUrl,
        datePublished: "2026-03-15T00:00:00Z",
      });
    }

    // Inject or update JSON-LD script tag in head
    let scriptEl = document.getElementById("json-ld-structured-data") as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = "json-ld-structured-data";
      scriptEl.type = "application/ld+json";
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify({ "@graph": jsonLdGraph }, null, 2);
  }, [tool, categoryName, isClusterPage, isThinkingPage, currentPath, baseUrl]);
}
