import fs from "fs";
import path from "path";
import { WORKFLOW_RECIPES, getShareableRecipe } from "../data/recipes";
import { STATIC_ROUTES } from "../data/routes";
import { buildRecipeAgentPlan, validateWorkflowRecipe } from "../lib/recipe-runtime";
import { executeLocalAgentPlan } from "../lib/agent-core";

async function main() {
  const errors: string[] = [];
  const ids = new Set<string>();
  const slugs = new Set<string>();

  if (WORKFLOW_RECIPES.length !== 8) errors.push(`Expected 8 launch recipes; found ${WORKFLOW_RECIPES.length}.`);

  for (const recipe of WORKFLOW_RECIPES) {
    if (ids.has(recipe.id)) errors.push(`Duplicate recipe id: ${recipe.id}`);
    if (slugs.has(recipe.slug)) errors.push(`Duplicate recipe slug: ${recipe.slug}`);
    ids.add(recipe.id);
    slugs.add(recipe.slug);
    errors.push(...validateWorkflowRecipe(recipe));

    const route = `/recipes/${recipe.slug}`;
    if (!(STATIC_ROUTES as readonly string[]).includes(route)) errors.push(`${recipe.slug}: route missing from STATIC_ROUTES.`);

    const shared = JSON.stringify(getShareableRecipe(recipe));
    if (/function\s*\(|=>|<script|javascript:/i.test(shared)) errors.push(`${recipe.slug}: shareable representation contains executable-code markers.`);

    try {
      const plan = buildRecipeAgentPlan(recipe);
      if (plan.source !== "recipe") errors.push(`${recipe.slug}: plan source must be recipe.`);
      const executed = await executeLocalAgentPlan(plan, recipe.exampleInput, `Run shared recipe ${recipe.title}`);
      if (!executed.result.content.trim()) errors.push(`${recipe.slug}: example execution returned empty output.`);
      if (executed.plan.steps.some((step) => step.status !== "completed")) errors.push(`${recipe.slug}: not every example step completed.`);
      if (/nvidia|gemini|cloud/i.test(executed.result.engineId)) errors.push(`${recipe.slug}: local recipe resolved to a cloud engine.`);
    } catch (error) {
      errors.push(`${recipe.slug}: example execution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const catalogPath = path.join(process.cwd(), "public", "recipes.json");
  if (!fs.existsSync(catalogPath)) errors.push("public/recipes.json was not generated.");
  else {
    try {
      const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
      if (!Array.isArray(catalog.recipes) || catalog.recipes.length !== WORKFLOW_RECIPES.length) errors.push("recipes.json count does not match source registry.");
      if (catalog.recipes?.some((recipe: any) => recipe.safeConfiguration?.networkAccess !== false)) errors.push("recipes.json contains a recipe without networkAccess=false.");
    } catch (error) {
      errors.push(`recipes.json is invalid JSON: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length) {
    console.error("[recipes] FAIL");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }

  console.log(`[recipes] PASS — ${WORKFLOW_RECIPES.length} versioned local recipes validated and example-executed`);
  console.log(`[recipes] share format: recipeId + version + allowlisted steps + bounded configuration; arbitrary JS rejected`);
}

void main();
