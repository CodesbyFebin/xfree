import { describe, expect, it } from "vitest";
import { PUBLIC_TOOLS } from "../../data/publicTools";
import { categorySlugFromPath } from "../../data/routes";
import { generateSitemapXml } from "../../utils/generateSitemap";

describe("public SEO contract", () => {
  it("exposes only published and indexable tools", () => {
    expect(PUBLIC_TOOLS.length).toBeGreaterThan(0);
    expect(PUBLIC_TOOLS.every((tool) => tool.status === "published" && tool.indexable === true)).toBe(true);
  });

  it("keeps the marketing sitemap limited to public marketing routes", () => {
    const sitemap = generateSitemapXml("https://www.xfree.in");

    expect(sitemap).not.toContain("https://www.xfree.in/studio");
    for (const tool of PUBLIC_TOOLS) {
      expect(sitemap).toContain(`https://www.xfree.in/tools/${tool.slug}`);
    }
  });

  it("recognizes every public category route advertised by the sitemap", () => {
    const categoryIds = new Set(PUBLIC_TOOLS.map((tool) => tool.category));
    for (const categoryId of categoryIds) {
      expect(categorySlugFromPath(`/category/${categoryId}`)).toBe(categoryId);
    }
  });

  it("does not publish legacy inflated tool-count claims", () => {
    const legacyClaims = ["400+", "406 tools", "403 tools"];
    const publicSummary = `${PUBLIC_TOOLS.length} published tools`;

    expect(legacyClaims.some((claim) => publicSummary.includes(claim))).toBe(false);
  });
});
