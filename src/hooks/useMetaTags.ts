import { useEffect } from "react";
import { ToolDefinition } from "../types";
import { PUBLIC_CATEGORIES, PUBLIC_TOOLS } from "../data/publicTools";
import { findGuide } from "../data/guides";
import { categorySlugFromPath, guideSlugFromPath, pillarSlugFromPath } from "../data/routes";
import type { PublishedArtifact } from "../content-pipeline/published-artifact-schema";
import { CANONICAL_ORIGIN } from "../data/siteConfig";
import { getPillarBySlug } from "../data/masterBlueprint";

interface UseMetaTagsOptions {
  tool?: ToolDefinition | null;
  categoryName?: string;
  currentPath?: string;
  baseUrl?: string;
  generatedPage?: PublishedArtifact | null;
  indexable?: boolean;
  notFound?: boolean;
}

export function useMetaTags({
  tool,
  categoryName,
  currentPath = typeof window !== "undefined" ? window.location.pathname : "/",
  baseUrl = CANONICAL_ORIGIN,
  generatedPage,
  indexable = true,
  notFound = false,
}: UseMetaTagsOptions) {
  useEffect(() => {
    let title = `Free Developer, SEO & AI Tools — XFree.in | No Signup`;
    let description =
      `Use ${PUBLIC_TOOLS.length} published XFree developer, SEO, formatter, converter, and focused AI tools. No signup; local processing is the default and cloud features are disclosed.`;
    let canonicalUrl = `${baseUrl}/`;

    const routeCategory = categorySlugFromPath(currentPath);
    const category = routeCategory ? PUBLIC_CATEGORIES.find((item) => item.id === routeCategory) : undefined;
    const routeGuideSlug = guideSlugFromPath(currentPath);
    const guide = routeGuideSlug ? findGuide(routeGuideSlug) : undefined;
    const routePillarSlug = pillarSlugFromPath(currentPath);
    const pillar = routePillarSlug ? getPillarBySlug(routePillarSlug) : undefined;

    // 1. Determine Title & Description based on route / tool. Unknown
    // client-side routes must preserve the server's 404/noindex semantics and
    // must never inherit the homepage canonical.
    if (notFound) {
      title = "404 — Page Not Found | XFree.in";
      description = "This URL does not map to a published XFree.in tool or page.";
      canonicalUrl = "";
    } else if (generatedPage) {
      title = generatedPage.metadata.title;
      description = generatedPage.metadata.description;
      canonicalUrl = `${baseUrl}/tools/${generatedPage.slug}`;
    } else if (tool) {
      title = `${tool.title} — XFree.in`;
      description = tool.shortDescription || `Use ${tool.title} for free online with no registration and clear local or cloud processing disclosure.`;
      canonicalUrl = `${baseUrl}/tools/${tool.slug}`;
    } else if (categoryName || category) {
      const label = categoryName || category!.label;
      const slug = category?.id || label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      title = `${label} — XFree.in`;
      description = category?.description || `Explore published ${label} utilities with clear local or cloud processing disclosures.`;
      canonicalUrl = `${baseUrl}/${slug}`;
    } else if (guide) {
      title = `${guide.title} — XFree.in`;
      description = guide.description;
      canonicalUrl = `${baseUrl}/guides/${guide.slug}`;
    } else if (pillar) {
      title = `${pillar.name} Tools | XFree.in`;
      description = `Browse published XFree ${pillar.name} tools and reviewed roadmap context. Planned concepts stay noindex until implementation and editorial gates pass.`;
      canonicalUrl = `${baseUrl}/pillar/${pillar.slug}`;
    } else if (currentPath === "/pillars") {
      title = "XFree Tool Pillars — Developer & SEO Utilities";
      description = "Explore XFree's 50 developer and SEO tool pillars. Pillars with published utilities are indexable; planned concepts remain roadmap-only until implementation and review.";
      canonicalUrl = `${baseUrl}/pillars`;
    } else if (currentPath === "/roadmap") {
      title = "XFree 25,000-Concept Tool Roadmap — Planned Developer Utilities";
      description = "Explore XFree's 25,000-concept planning matrix. This roadmap is not a claim that 25,000 tools are live; planned concepts remain noindex until built, tested, and approved.";
      canonicalUrl = `${baseUrl}/roadmap`;
    } else if (currentPath === "/contribute") {
      title = "Contribute to XFree — Build Free Developer & SEO Tools";
      description = "Build and contribute real XFree developer and SEO tools through the public roadmap, automated quality gates, security review, and governed publication pipeline.";
      canonicalUrl = `${baseUrl}/contribute`;
    } else if (currentPath === "/guides") {
      title = "Developer & SEO Tool Guides | XFree.in";
      description = "Practical guides for JSON, regex, cron, sitemaps, technical SEO, and browser-based developer tools.";
      canonicalUrl = `${baseUrl}/guides`;
    } else if (currentPath === "/how-it-works") {
      title = "How XFree Works — Browser Tools and Optional Cloud Mode";
      description = "Follow XFree processing through browser JavaScript or Web Workers, result review, export, and an explicitly selected optional cloud handoff.";
      canonicalUrl = `${baseUrl}/how-it-works`;
    } else if (currentPath === "/use-cases") {
      title = "Developer and SEO Tool Use Cases & Examples | XFree.in";
      description = "Explore practical workflows for technical SEO, API payload inspection, regex testing, cron schedules, metadata previews, and text comparison.";
      canonicalUrl = `${baseUrl}/use-cases`;
    } else if (currentPath === "/docs") {
      title = "XFree Documentation Hub — Inputs, Examples and Limits";
      description = "Find verified tool references, input and output behavior, worked examples, processing disclosures, limitations, and reviewed technical guides.";
      canonicalUrl = `${baseUrl}/docs`;
    } else if (currentPath === "/blog") {
      title = "XFree Blog & Pillar Guides — Reviewed Technical Content";
      description = "Read progressively published technical guides with permanent URLs, unique metadata, concrete examples, and links to working XFree tools.";
      canonicalUrl = `${baseUrl}/blog`;
    } else if (currentPath === "/faq") {
      title = "FAQ & Guidance — Local and Cloud Tools | XFree.in";
      description = "Answers about XFree Local Mode, optional cloud processing, browser limits, sensitive data, accounts, verification, and production use.";
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
      title = "Privacy Policy — Local and Cloud Processing | XFree.in";
      description = "How XFree.in handles data, including advertising cookies from Google AdSense and input to local vs AI tools.";
      canonicalUrl = `${baseUrl}/privacy`;
    } else if (currentPath === "/terms") {
      title = "Terms of Service — XFree.in Web Utilities";
      description = "Read XFree.in terms for acceptable use, local and cloud processing, AI output limitations, intellectual property, service availability, and liability.";
      canonicalUrl = `${baseUrl}/terms`;
    } else if (currentPath === "/security") {
      title = "Security & Sandbox Architecture | XFree.in";
      description = "Deep dive into XFree.in browser sandbox execution, CSP headers, and API key security.";
      canonicalUrl = `${baseUrl}/security`;
    } else if (currentPath === "/xfree-app") {
      title = "XFree App — Install the Browser Tool Suite";
      description = "Install XFree as a browser app on supported desktop and mobile devices for fast access to published developer and SEO tools.";
      canonicalUrl = `${baseUrl}/xfree-app`;
    } else if (currentPath === "/studio") {
      title = "XFree Studio — Local Tools & Optional NVIDIA Cloud";
      description = "Use XFree browser tools locally by default or explicitly enable NVIDIA Cloud Mode with account-aware model discovery.";
      canonicalUrl = "https://app.xfree.in/";
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
      if (!href) {
        el?.remove();
        return;
      }
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    // Standard Meta Tags
    setMetaTag('meta[name="description"]', "name", "description", description);
    setMetaTag('meta[name="robots"]', "name", "robots", !notFound && indexable ? "index,follow" : "noindex,follow");
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

    if (notFound || !indexable) {
      document.getElementById("json-ld-structured-data")?.remove();
      return;
    }

    // 1. BreadcrumbList Schema
    const breadcrumbs: any[] = [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${baseUrl}/`,
      },
    ];

    if (generatedPage) {
      breadcrumbs.push({
        "@type": "ListItem",
        position: 2,
        name: generatedPage.metadata.h1,
        item: generatedPage.metadata.canonical,
      });
    } else if (tool) {
      breadcrumbs.push({
        "@type": "ListItem",
        position: 2,
        name: tool.categoryLabel || tool.category,
        item: `${baseUrl}/${tool.category}`,
      });
      breadcrumbs.push({
        "@type": "ListItem",
        position: 3,
        name: tool.title,
        item: `${baseUrl}/tools/${tool.slug}`,
      });
    } else if (categoryName || category) {
      const label = categoryName || category!.label;
      const slug = category?.id || label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      breadcrumbs.push({
        "@type": "ListItem",
        position: 2,
        name: label,
        item: `${baseUrl}/${slug}`,
      });
    } else if (pillar) {
      breadcrumbs.push({
        "@type": "ListItem",
        position: 2,
        name: "Pillars",
        item: `${baseUrl}/pillars`,
      });
      breadcrumbs.push({
        "@type": "ListItem",
        position: 3,
        name: pillar.name,
        item: `${baseUrl}/pillar/${pillar.slug}`,
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
      description: `${PUBLIC_TOOLS.length} published developer, SEO, and AI micro-tools with Local Mode by default and clear cloud disclosures.`,
      potentialAction: {
        "@type": "SearchAction",
        target: `${baseUrl}/?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    });

    // 3. SoftwareApplication Schema (for Tools)
    if (generatedPage) {
      jsonLdGraph.push(generatedPage.jsonLd);
    } else if (tool) {
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
          mainEntity: tool.faqs.slice(0, 6).map((faq) => ({
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
        description: "Learn how XFree Local Mode processes data in the browser and how optional cloud tools are disclosed.",
        step: [
          { "@type": "HowToStep", position: 1, name: "Select Tool", text: "Browse or search the tool directory." },
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
  }, [tool, generatedPage, categoryName, currentPath, baseUrl, indexable]);
}
