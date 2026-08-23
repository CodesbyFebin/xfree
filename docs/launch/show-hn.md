# Show HN draft

## Suggested title

**Show HN: XFree – local browser tools with inspectable workflow chaining**

## Draft

I built XFree because many small developer tasks do not need a SaaS backend.

The current release has 60 published browser tool routes, a 50-tool governed local expansion batch, and XFree Agent Studio with 100 allowlisted local engines. I have also added eight versioned workflow recipes so the launch is something concrete you can inspect and run rather than another “AI toolbox” landing page.

For example, the URL Cleanup Pipeline is:

`extract URLs → normalize each URL → dedupe → sort → JSON array`

The shared representation contains only a recipe ID, semantic version, allowlisted engine/transform IDs, and bounded configuration. It does not contain arbitrary JavaScript. Studio reconstructs the plan and validates every step against its local allowlist before executing it in the browser.

Planning can be deterministic through the Rules Agent. There is also an optional WebGPU/WebLLM planner, but it still cannot bypass the allowlist. The individual workflow steps remain visible and inspectable.

XFree is not entirely client-side: the platform also has explicitly selected server-backed AI surfaces. The published starter recipes in this launch are local and declare `networkAccess=false`.

Things I would especially value feedback on:

- Is the declarative recipe format small enough to audit at a glance?
- Which local workflow primitives would be worth adding next?
- Is the Rules Agent / optional local-model split understandable in the UI?
- Are there browser APIs or sandbox boundaries you would change?

Try the recipes: https://www.xfree.in/recipes

Repository: https://github.com/CodesbyFebin/xfree

Before posting: verify every linked recipe is live, use a participating HN account that is eligible for Show HN, and re-read the current Show HN guidance on launch day.
