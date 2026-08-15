import { INDEXABLE_TOOLS, CATEGORIES, TOOLS_REGISTRY } from "../data/toolsRegistry";

export function generateCapabilitiesJson(baseUrl: string = "https://www.xfree.in"): string {
  const capabilitiesMap = new Map<string, any[]>();
  
  for (const tool of INDEXABLE_TOOLS) {
    if (tool.capabilities) {
      for (const cap of tool.capabilities) {
        if (!capabilitiesMap.has(cap.id)) {
          capabilitiesMap.set(cap.id, []);
        }
        capabilitiesMap.get(cap.id)!.push({
          toolId: tool.id,
          toolTitle: tool.title,
          toolUrl: `${baseUrl}/tools/${tool.slug}`,
          fit: cap.description,
        });
      }
    }
  }
  
  const capabilities = [];
  for (const [id, tools] of capabilitiesMap) {
    const primaryTool = tools[0];
    capabilities.push({
      id,
      name: primaryTool.toolTitle.split(" ")[0] || id,
      description: `Capability: ${id}`,
      tools,
      url: `${baseUrl}/capabilities/${encodeURIComponent(id)}`,
    });
  }
  
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "XFree Capabilities",
    "description": "Structured capability definitions for all tools in the XFree registry",
    "url": baseUrl,
    "itemListElement": capabilities.map((cap, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "url": cap.url,
      "item": {
        "@type": "DefinedTerm",
        "@id": `${baseUrl}/capabilities/${encodeURIComponent(cap.id)}`,
        "name": cap.id,
        "description": cap.description,
        "hasDefinedTerm": {
          "@type": "Tool",
          "name": cap.tools.length,
          "toolName": cap.tools.map(t => t.toolTitle).join(", "),
        }
      }
    }))
  }, null, 2);
}

export function generateToolsJson(baseUrl: string = "https://www.xfree.in"): string {
  const tools = INDEXABLE_TOOLS.map(tool => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${baseUrl}/tools/${tool.slug}`,
    "name": tool.title,
    "description": tool.shortDescription,
    "applicationCategory": tool.categoryLabel,
    "operatingSystem": "All",
    "offers": {
      "@type": "Offer",
      "price": tool.pricing?.model === "free" ? "0" : tool.pricing?.model || "unknown",
      "priceCurrency": tool.pricing?.currency || "USD",
    },
    "featureList": tool.keyFeatures?.slice(0, 5) || [],
    "requiredFeature": tool.supportedInputs?.slice(0, 3) || [],
    "url": `${baseUrl}/tools/${tool.slug}`,
    "sameAs": tool.integrations?.apis || [],
  }));

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "DataCatalog",
    "name": "XFree Tools Catalog",
    "description": "Complete catalog of all indexable tools on XFree.in",
    "url": baseUrl,
    "dataset": tools,
  }, null, 2);
}

export function generateProblemPagesSitemap(baseUrl: string = "https://www.xfree.in"): string {
  const problems = [
    "compress-pdf",
    "merge-pdf",
    "split-pdf",
    "compress-image",
    "remove-background",
    "convert-file",
    "clean-csv",
    "transform-csv",
    "format-json",
    "validate-sitemap",
    "generate-meta-tags",
    "build-utm-links",
    "generate-uuid",
    "test-regex",
    "generate-cron",
    "decode-jwt",
    "encode-base64",
    "generate-schema",
    "write-robots-txt",
    "create-sitemap",
    "format-xml",
    "validate-xml",
    "sort-lines",
    "count-words",
    "convert-color",
    "convert-timestamp",
    "generate-hash",
    "generate-sitemap",
    "debug-api",
    "analyze-code",
    "generate-readme",
    "write-commit-message",
    "review-pr",
    "find-bugs",
    "optimize-css",
    "minify-js",
    "create-image-compression-workflow",
    "build-seo-workflow",
    "generate-hreflang-sitemap",
    "create-robots-testing-workflow",
    "audit-open-graph",
    "validate-schema-org",
  ];

  const currentDate = new Date().toISOString().split("T")[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  for (const problem of problems) {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/solve/${problem}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>`;
  return xml;
}