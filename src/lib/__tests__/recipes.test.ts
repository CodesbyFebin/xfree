import { describe, expect, it } from "vitest";
import { RECIPES, getRecipeBySlug } from "../../data/recipes";
import { executeRecipe, validateRecipeDefinition } from "../recipe-runner";

describe("workflow recipe registry", () => {
  it("publishes eight unique deterministic local recipes", () => {
    expect(RECIPES).toHaveLength(8);
    expect(new Set(RECIPES.map((recipe) => recipe.slug)).size).toBe(8);
    for (const recipe of RECIPES) {
      expect(recipe.mode).toBe("local");
      expect(recipe.llmRequired).toBe(false);
      expect(validateRecipeDefinition(recipe)).toEqual([]);
    }
  });

  it("rejects unknown engine ids and arbitrary configuration", () => {
    const source = RECIPES[0];
    const badEngine = {
      ...source,
      steps: [{ ...source.steps[0], engineId: "arbitrary-script-engine" }],
    };
    expect(validateRecipeDefinition(badEngine)).toContain("unknown engine: arbitrary-script-engine");

    const badConfig = {
      ...source,
      steps: [{ ...source.steps[0], config: { arbitraryCode: "alert(1)" } as any }],
    };
    expect(validateRecipeDefinition(badConfig).some((error) => error.includes("unsupported configuration key"))).toBe(true);
  });

  it("runs the URL cleanup recipe deterministically", async () => {
    const recipe = getRecipeBySlug("url-cleanup-pipeline")!;
    const executed = await executeRecipe(recipe, "https://Example.com:443/a#x\nhttps://example.com/a#y\nhttps://www.xfree.in/docs#one");
    expect(executed.plan.steps.every((step) => step.status === "completed")).toBe(true);
    expect(JSON.parse(executed.result.content)).toEqual([
      "https://example.com/a",
      "https://www.xfree.in/docs",
    ]);
  });

  it("classifies SEO audit URLs against the first extracted origin", async () => {
    const recipe = getRecipeBySlug("seo-url-audit")!;
    const executed = await executeRecipe(recipe, "https://www.xfree.in/\nhttps://www.xfree.in/docs#x\nhttps://example.com/reference");
    const output = JSON.parse(executed.result.content);
    expect(output.baseOrigin).toBe("https://www.xfree.in");
    expect(output.internal).toContain("https://www.xfree.in/docs");
    expect(output.external).toContain("https://example.com/reference");
  });
});
