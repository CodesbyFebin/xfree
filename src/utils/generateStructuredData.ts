import { PUBLIC_TOOLS } from "../data/publicTools";

export function generateCapabilitiesJson(baseUrl: string = "https://www.xfree.in"): string {
  const capabilitiesMap = new Map<
    string,
    { name: string; description: string; inputSchema: Record<string, any>; outputSchema: Record<string, any>; tools: any[] }
  >();

  for (const tool of PUBLIC_TOOLS) {
    if (tool.capabilities) {
      for (const cap of tool.capabilities) {
        if (!capabilitiesMap.has(cap.id)) {
          capabilitiesMap.set(cap.id, {
            name: cap.name,
            description: cap.description,
            inputSchema: cap.inputSchema,
            outputSchema: cap.outputSchema,
            tools: [],
          });
        }
        capabilitiesMap.get(cap.id)!.tools.push({
          toolId: tool.id,
          toolTitle: tool.title,
          toolUrl: `${baseUrl}/tools/${tool.slug}`,
          requiredAuth: cap.requiredAuth ?? false,
          supportsBatch: cap.supportsBatch ?? false,
          estimatedLatencyMs: cap.estimatedLatencyMs,
        });
      }
    }
  }

  const capabilities = Array.from(capabilitiesMap.entries()).map(([id, cap]) => ({
    id,
    ...cap,
    url: `${baseUrl}/capabilities/${encodeURIComponent(id)}`,
  }));

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
        "name": cap.name,
        "description": cap.description,
        "inputSchema": cap.inputSchema,
        "outputSchema": cap.outputSchema,
        "hasDefinedTerm": {
          "@type": "Tool",
          "toolCount": cap.tools.length,
          "tools": cap.tools,
        },
      },
    })),
  }, null, 2);
}

export function generateToolsJson(baseUrl: string = "https://www.xfree.in"): string {
  const tools = PUBLIC_TOOLS.map(tool => ({
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
    "softwareRequirements": "Modern web browser with JavaScript enabled",
    "url": `${baseUrl}/tools/${tool.slug}`,
    "isAccessibleForFree": tool.pricing?.model === "free" || tool.pricing === undefined,
    // Non-standard extension properties: agents/crawlers that read this catalog for
    // capability matching (not general SEO consumers) can use these to filter tools
    // by data format without fetching each tool page's own JSON-LD.
    ...(tool.supportedInputs?.length ? { "xfree:supportedInputFormats": tool.supportedInputs } : {}),
    ...(tool.supportedOutputs?.length ? { "xfree:supportedOutputFormats": tool.supportedOutputs } : {}),
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
