import { useEffect } from "react";
import { ToolDefinition } from "../types";
import { PUBLIC_CATEGORIES, PUBLIC_TOOLS } from "../data/publicTools";
import { findGuide } from "../data/guides";
import { categorySlugFromPath, guideSlugFromPath, pillarSlugFromPath, recipeSlugFromPath } from "../data/routes";
import type { PublishedArtifact } from "../content-pipeline/published-artifact-schema";
import { CANONICAL_ORIGIN } from "../data/siteConfig";
import { getPillarBySlug } from "../data/masterBlueprint";
import { getRecipeBySlug, type WorkflowRecipe } from "../data/recipes";
import { keywordCluster } from "../data/keywordArchitecture";

interface UseMetaTagsOptions {
  tool?: ToolDefinition | null;
  recipe?: WorkflowRecipe | null;
  categoryName?: string;
  currentPath?: string;
  baseUrl?: string;
  generatedPage?: PublishedArtifact | null;
  indexable?: boolean;
  notFound?: boolean;
}

export function useMetaTags({
  tool,
  recipe,
  categoryName,
  currentPath = typeof window !== "undefined" ? window.location.pathname : "/",
  baseUrl = CANONICAL_ORIGIN,
  generatedPage,
  indexable = true,
  notFound = false,
}: UseMetaTagsOptions) {
  useEffect(() => {
    const homeKeyword = keywordCluster("home")?.primary || "free developer tools";
    let title = `Free Developer Tools — Browser-Based, No Signup | XFree.in`;
    let description = `Use ${PUBLIC_TOOLS.length} ${homeKeyword}, technical SEO utilities, formatters, converters, and workflow tools. Local Mode is the default; optional cloud features are disclosed.`;
    let canonicalUrl = `${baseUrl}/`;

    const routeCategory = categorySlugFromPath(currentPath);
    const category = routeCategory ? PUBLIC_CATEGORIES.find((item) => item.id === routeCategory) : undefined;
    const routeGuideSlug = guideSlugFromPath(currentPath);
    const guide = routeGuideSlug ? findGuide(routeGuideSlug) : undefined;
    const routeRecipeSlug = recipeSlugFromPath(currentPath);
    const routeRecipe = recipe || (routeRecipeSlug ? getRecipeBySlug(routeRecipeSlug) : undefined);
    const routePillarSlug = pillarSlugFromPath(currentPath);
    const pillar = routePillarSlug ? getPillarBySlug(routePillarSlug) : undefined;

    if (notFound) {
      title = "404 — Page Not Found | XFree.in";
      description = "This URL does not map to a published XFree.in tool, recipe, guide, or page.";
      canonicalUrl = "";
    } else if (generatedPage) {
      title = generatedPage.metadata.title;
      description = generatedPage.metadata.description;
      canonicalUrl = `${baseUrl}/tools/${generatedPage.slug}`;
    } else if (tool) {
      title = `${tool.title} — XFree.in`;
      description = tool.shortDescription || `Use ${tool.title} with no signup and a clear local or optional cloud processing disclosure.`;
      canonicalUrl = `${baseUrl}/tools/${tool.slug}`;
    } else if (routeRecipe) {
      title = `${routeRecipe.title} — Local Browser Workflow | XFree.in`;
      description = routeRecipe.shortDescription;
      canonicalUrl = `${baseUrl}/recipes/${routeRecipe.slug}`;
    } else if (categoryName || category) {
      const label = categoryName || category!.label;
      const slug = category?.id || label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      title = `${label} — XFree.in`;
      description = category?.description || `Explore published ${label} utilities with clear local or optional cloud processing disclosures.`;
      canonicalUrl = `${baseUrl}/category/${slug}`;
    } else if (guide) {
      title = `${guide.title} — XFree.in`;
      description = guide.description;
      canonicalUrl = `${baseUrl}/guides/${guide.slug}`;
    } else if (pillar) {
      title = `${pillar.name} Tools | XFree.in`;
      description = `Browse published XFree ${pillar.name} tools and reviewed roadmap context. Planned concepts stay noindex until implementation and editorial gates pass.`;
      canonicalUrl = `${baseUrl}/pillar/${pillar.slug}`;
    } else if (currentPath === "/recipes") {
      title = "Local Browser Workflow Recipes — XFree.in";
      description = "Run versioned, inspectable developer workflow recipes locally in XFree Agent Studio. See every allowlisted engine and transform before execution.";
      canonicalUrl = `${baseUrl}/recipes`;
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
      description = "Follow XFree processing through browser JavaScript or Web Workers, result review, export, deterministic recipes, and explicitly selected optional cloud handoffs.";
      canonicalUrl = `${baseUrl}/how-it-works`;
    } else if (currentPath === "/use-cases") {
      title = "Developer and SEO Tool Use Cases & Examples | XFree.in";
      description = "Explore practical workflows for technical SEO, API payload inspection, regex testing, cron schedules, metadata previews, text comparison, and local recipes.";
      canonicalUrl = `${baseUrl}/use-cases`;
    } else if (currentPath === "/docs") {
      title = "XFree Documentation Hub — Inputs, Examples and Limits";
      description = "Find verified tool references, workflow recipes, input and output behavior, worked examples, processing disclosures, limitations, and reviewed technical guides.";
      canonicalUrl = `${baseUrl}/docs`;
    } else if (currentPath === "/blog") {
      title = "XFree Blog & Pillar Guides — Reviewed Technical Content";
      description = "Read progressively published technical guides with permanent URLs, unique metadata, concrete examples, and links to working XFree tools.";
      canonicalUrl = `${baseUrl}/blog`;
    } else if (currentPath === "/faq") {
      title = "FAQ & Guidance — Local and Cloud Tools | XFree.in";
      description = "Answers about XFree Local Mode, workflow recipes, optional cloud processing, browser limits, sensitive data, accounts, verification, and production use.";
      canonicalUrl = `${baseUrl}/faq`;
    } else if (currentPath === "/about") {
      title = "About XFree.in — Browser Developer Tools & Workflows";
      description = "Learn how XFree builds focused browser developer tools, technical SEO utilities, inspectable local workflows, and clearly disclosed optional cloud features.";
      canonicalUrl = `${baseUrl}/about`;
    } else if (currentPath === "/contact") {
      title = "Contact Support & Tool Requests | XFree.in";
      description = "Reach out for support, report issues, or suggest new developer tools and local workflow recipes on XFree.in.";
      canonicalUrl = `${baseUrl}/contact`;
    } else if (currentPath === "/privacy") {
      title = "Privacy Policy — Local and Cloud Processing | XFree.in";
      description = "How XFree.in handles browser-local tools and recipes, optional Cloud AI, advertising cookies, forms, and privacy requests.";
      canonicalUrl = `${baseUrl}/privacy`;
    } else if (currentPath === "/terms") {
      title = "Terms of Service — XFree.in Web Utilities";
      description = "Read XFree.in terms for acceptable use, local and cloud processing, AI output limitations, intellectual property, service availability, and liability.";
      canonicalUrl = `${baseUrl}/terms`;
    } else if (currentPath === "/security") {
      title = "Security & Sandbox Architecture | XFree.in";
      description = "Review XFree browser sandbox execution, recipe allowlists, CSP headers, local WebGPU boundaries, and server-side API key security.";
      canonicalUrl = `${baseUrl}/security`;
    } else if (currentPath === "/xfree-app") {
      title = "XFree App — Install the Browser Tool Suite";
      description = "Install XFree as a browser app on supported desktop and mobile devices for fast access to published developer, SEO, and local workflow tools.";
      canonicalUrl = `${baseUrl}/xfree-app`;
    } else if (currentPath === "/studio") {
      title = "Local Agent Workflow Studio — XFree Studio";
      description = "Run deterministic local browser workflows, inspect allowlisted steps, or explicitly enable optional WebGPU planning and NVIDIA Cloud Mode in XFree Studio.";
      canonicalUrl = "https://app.xfree.in/";
    }

    document.title = title;

    const setMetaTag = (selector: string, attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    const setLinkTag = (rel: string, href: string) => {
      let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
      if (!href) { el?.remove(); return; }
      if (!el) {
        el = document.createElement("link");
        el.setAttribute("rel", rel);
        document.head.appendChild(el);
      }
      el.setAttribute("href", href);
    };

    setMetaTag('meta[name="description"]', "name", "description", description);
    setMetaTag('meta[name="robots"]', "name", "robots", !notFound && indexable ? "index,follow" : "noindex,follow");
    setLinkTag("canonical", canonicalUrl);
    setMetaTag('meta[property="og:title"]', "property", "og:title", title);
    setMetaTag('meta[property="og:description"]', "property", "og:description", description);
    setMetaTag('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMetaTag('meta[property="og:type"]', "property", "og:type", "website");
    setMetaTag('meta[property="og:site_name"]', "property", "og:site_name", "XFree.in");
    setMetaTag('meta[name="twitter:card"]', "name", "twitter:card", "summary_large_image");
    setMetaTag('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMetaTag('meta[name="twitter:description"]', "name", "twitter:description", description);

    const jsonLdGraph: any[] = [];
    if (notFound || !indexable) {
      document.getElementById("json-ld-structured-data")?.remove();
      return;
    }

    const breadcrumbs: any[] = [{ "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` }];
    if (generatedPage) {
      breadcrumbs.push({ "@type": "ListItem", position: 2, name: generatedPage.metadata.h1, item: generatedPage.metadata.canonical });
    } else if (tool) {
      breadcrumbs.push({ "@type": "ListItem", position: 2, name: tool.categoryLabel || tool.category, item: `${baseUrl}/category/${tool.category}` });
      breadcrumbs.push({ "@type": "ListItem", position: 3, name: tool.title, item: `${baseUrl}/tools/${tool.slug}` });
    } else if (routeRecipe) {
      breadcrumbs.push({ "@type": "ListItem", position: 2, name: "Recipes", item: `${baseUrl}/recipes` });
      breadcrumbs.push({ "@type": "ListItem", position: 3, name: routeRecipe.title, item: `${baseUrl}/recipes/${routeRecipe.slug}` });
    } else if (categoryName || category) {
      const label = categoryName || category!.label;
      const slug = category?.id || label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      breadcrumbs.push({ "@type": "ListItem", position: 2, name: label, item: `${baseUrl}/category/${slug}` });
    } else if (pillar) {
      breadcrumbs.push({ "@type": "ListItem", position: 2, name: "Pillars", item: `${baseUrl}/pillars` });
      breadcrumbs.push({ "@type": "ListItem", position: 3, name: pillar.name, item: `${baseUrl}/pillar/${pillar.slug}` });
    } else if (currentPath && currentPath !== "/") {
      const cleanName = currentPath.replace(/^\//, "").replace(/-/g, " ");
      breadcrumbs.push({ "@type": "ListItem", position: 2, name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1), item: `${baseUrl}${currentPath}` });
    }

    jsonLdGraph.push({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: breadcrumbs });
    jsonLdGraph.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "XFree.in",
      url: `${baseUrl}/`,
      description: `${PUBLIC_TOOLS.length} published developer and SEO tools plus inspectable local workflow recipes, with optional cloud features clearly disclosed.`,
      potentialAction: { "@type": "SearchAction", target: `${baseUrl}/?q={search_term_string}`, "query-input": "required name=search_term_string" },
    });

    if (generatedPage) {
      jsonLdGraph.push({ "@context": "https://schema.org", ...generatedPage.jsonLd });
    } else if (tool) {
      jsonLdGraph.push({
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: tool.title,
        applicationCategory: "DeveloperApplication",
        operatingSystem: "Any",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        description: tool.shortDescription,
        url: canonicalUrl,
      });
      if (tool.howToUse?.length) {
        jsonLdGraph.push({ "@context": "https://schema.org", "@type": "HowTo", name: `How to use ${tool.title}`, description: tool.shortDescription, step: tool.howToUse.map((text, index) => ({ "@type": "HowToStep", position: index + 1, name: `Step ${index + 1}`, text })) });
      }
      if (tool.faqs?.length) {
        jsonLdGraph.push({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: tool.faqs.slice(0, 6).map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) });
      }
    } else if (routeRecipe) {
      jsonLdGraph.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: routeRecipe.title,
        description: routeRecipe.shortDescription,
        url: canonicalUrl,
        tool: routeRecipe.steps.map((step) => step.kind === "engine" ? step.engineId : step.transformId),
        step: routeRecipe.steps.map((step, index) => ({ "@type": "HowToStep", position: index + 1, name: step.label, text: step.kind === "engine" ? `Run allowlisted local engine ${step.engineId}.` : `Run bounded local transform ${step.transformId}.` })),
      });
      jsonLdGraph.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "Does this recipe upload my working input?", acceptedAnswer: { "@type": "Answer", text: "No. This launch recipe is local and declares networkAccess=false. It uses XFree local engines and bounded transforms in the browser." } },
          { "@type": "Question", name: "Is a local LLM required?", acceptedAnswer: { "@type": "Answer", text: "No. The shared starter recipes are deterministic; optional WebGPU planning remains a separate Studio feature." } },
          { "@type": "Question", name: "Can a shared recipe run arbitrary code?", acceptedAnswer: { "@type": "Answer", text: "No. Studio reconstructs the versioned plan from engine and transform identifiers and rejects identifiers outside the local allowlist." } },
        ],
      });
    } else if (currentPath === "/recipes") {
      jsonLdGraph.push({ "@context": "https://schema.org", "@type": "CollectionPage", name: "XFree Local Browser Workflow Recipes", description, url: canonicalUrl });
    }

    if (currentPath === "/how-it-works") {
      jsonLdGraph.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: "How XFree.in Browser Micro-Tools Work",
        description: "Learn how XFree Local Mode processes data in the browser, how deterministic recipes chain local operations, and how optional cloud tools are disclosed.",
        step: [
          { "@type": "HowToStep", position: 1, name: "Select Tool or Recipe", text: "Browse or search the published tool and workflow directories." },
          { "@type": "HowToStep", position: 2, name: "Input Data", text: "Paste your text, JSON, URLs, code, or other supported input into the selected local workspace." },
          { "@type": "HowToStep", position: 3, name: "Execute", text: "Local tools and recipes run through browser JavaScript, Web Workers, or bounded transforms; optional cloud features require an explicit choice." },
          { "@type": "HowToStep", position: 4, name: "Review and Export", text: "Inspect the visible result and copy or download it when the output is correct." },
        ],
      });
    }

    if (["/blog", "/docs", "/use-cases", "/about", "/security"].includes(currentPath)) {
      jsonLdGraph.push({
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        author: { "@type": "Organization", name: "XFree.in Engineering" },
        publisher: { "@type": "Organization", name: "XFree.in", logo: { "@type": "ImageObject", url: `${baseUrl}/favicon.ico` } },
        mainEntityOfPage: canonicalUrl,
        datePublished: "2026-03-15T00:00:00Z",
      });
    }

    let scriptEl = document.getElementById("json-ld-structured-data") as HTMLScriptElement | null;
    if (!scriptEl) {
      scriptEl = document.createElement("script");
      scriptEl.id = "json-ld-structured-data";
      scriptEl.type = "application/ld+json";
      document.head.appendChild(scriptEl);
    }
    scriptEl.textContent = JSON.stringify({ "@graph": jsonLdGraph }, null, 2);
  }, [tool, recipe, generatedPage, categoryName, currentPath, baseUrl, indexable, notFound]);
}
