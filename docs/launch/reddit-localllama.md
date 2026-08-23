# r/LocalLLaMA engineering post draft

## Suggested title

**I added an optional local WebGPU planner to a browser toolchain, but kept execution deterministic and allowlisted**

## Draft

I have been building XFree as a browser-first developer utility platform. The part that may be interesting here is the split between planning and execution in the local Agent Studio.

The current release has 100 allowlisted local engines and eight versioned starter workflow recipes. The default Rules Agent is deterministic and requires no model download. Optional WebGPU/WebLLM planning can propose a workflow, but the proposed engine and transform IDs still pass the same local allowlist before anything runs.

A shared recipe looks roughly like this:

```json
{
  "recipeId": "url-cleanup-pipeline",
  "version": "1.0.0",
  "processing": "local",
  "llmRequired": false,
  "steps": [
    { "kind": "engine", "engineId": "http-url-extract" },
    { "kind": "transform", "transformId": "map-lines-url-normalize" },
    { "kind": "engine", "engineId": "line-dedupe" },
    { "kind": "engine", "engineId": "line-sort" },
    { "kind": "transform", "transformId": "lines-to-json-array" }
  ]
}
```

The local model is therefore not the authority over capabilities. It can only propose a plan that the browser runtime understands and permits.

I am deliberately not claiming the whole XFree platform is client-side. There are optional server-backed AI surfaces too; they are separate and explicitly selected. The starter recipes themselves run locally and declare no network access.

I would appreciate technical feedback on:

- plan validation and capability boundaries;
- browser-local model UX and download expectations;
- whether versioned recipe JSON is a useful sharing primitive;
- good small local models / WebGPU patterns for intent-to-tool planning;
- additional deterministic transforms worth exposing.

Recipes: https://www.xfree.in/recipes

Code: https://github.com/CodesbyFebin/xfree

Before posting: re-read the current subreddit rules, especially project/self-promotion requirements, and adapt the post if moderators require a different flair, source disclosure, or participation pattern.
