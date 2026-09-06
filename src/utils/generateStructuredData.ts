import { PUBLIC_TOOLS } from "../data/publicTools";

export function generateCapabilitiesJson(baseUrl: string = "https://www.xfree.in"): string {
  const capabilitiesMap = new Map<string, { tools: any[]; description: string }>();

  for (const tool of PUBLIC_TOOLS) {
    const caps = tool.capabilities?.length ? tool.capabilities : [
      {
        id: `${tool.slug}-capability`,
        name: tool.title,
        description: tool.shortDescription || tool.explanation || tool.title,
        inputSchema: tool.supportedInputs ? { type: "object", properties: tool.supportedInputs.reduce((acc, input) => ({ ...acc, [input]: { type: "string" } }), {}) } : { type: "object" },
        outputSchema: { type: "string" },
      }
    ];

    for (const cap of caps) {
      if (!capabilitiesMap.has(cap.id)) {
        capabilitiesMap.set(cap.id, { tools: [], description: cap.description });
      }
      capabilitiesMap.get(cap.id)!.tools.push({
        toolId: tool.id,
        toolTitle: tool.title,
        toolUrl: `${baseUrl}/tools/${tool.slug}`,
        fit: cap.description,
      });
    }
  }

  const capabilities = Array.from(capabilitiesMap.entries()).map(([id, data], index) => ({
    id,
    name: data.tools[0]?.toolTitle?.split(" ")[0] || id,
    description: data.description,
    tools: data.tools,
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
        "name": cap.id,
        "description": cap.description,
        "hasDefinedTerm": {
          "@type": "Tool",
          "name": cap.tools.length,
          "toolName": cap.tools.map((t: any) => t.toolTitle).join(", "),
        }
      }
    }))
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
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "XFree Problem Pages",
    "description": "Machine-readable index of problem-solving pages for AI answer engines",
    "url": `${baseUrl}/problems`,
    "itemListElement": [],
  }, null, 2);
}
