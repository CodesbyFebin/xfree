# r/LocalLLaMA technical launch draft — XFree

## Positioning

Do not post this as “I launched an AI developer toolbox.” Lead with the engineering problem: making browser automation reproducible and inspectable while keeping LLM planning optional.

Recommended title:

**I built versioned local workflow recipes on top of 100 allowlisted browser engines (optional WebGPU planner)**

Shorter alternative:

**Local browser workflow recipes with deterministic execution + optional SmolLM2 WebGPU planning**

## Draft post

I have been working on XFree, a browser-based developer-tool project, and the part I wanted to share here is the local workflow architecture rather than the tool directory itself.

The current governed release has 100 allowlisted local engines. The deterministic Agent Core can chain those engines, and an optional WebGPU/WebLLM planner can propose a plan using a pinned SmolLM2 model when the browser supports it. Regardless of how the plan is proposed, execution is constrained to the same engine allowlist.

I have now added a versioned recipe layer so useful workflows can be shared without sharing prompts or arbitrary scripts.

Example:

```text
URL Cleanup Pipeline v1
http-url-extract
→ url-normalize (per line)
→ line-dedupe
→ line-sort
→ lines-to-json-array
```

The share payload contains only:

- recipe ID and version;
- processing mode;
- whether an LLM is required;
- allowlisted engine IDs;
- built-in transform IDs;
- a tiny closed set of reviewed config flags.

It deliberately cannot contain arbitrary JavaScript. Before execution, the runner rejects unknown engines, unknown transforms, unsupported configuration keys, non-local v1 recipes, and recipes longer than six steps.

The first eight recipes are URL cleanup, log sanitization, JWT inspection, SEO URL classification, JSON cleanup, text cleanup, CSV normalization, and developer clipboard URL extraction. All eight v1 recipes are deterministic Local Mode workflows and require no model.

The WebGPU planner is therefore an optional convenience layer, not the execution authority. The architecture I am testing is:

```text
natural-language request (optional)
        │
        ├─ deterministic rules planner
        │
        └─ optional local SmolLM2/WebLLM planner
                    │
                    ▼
             validated plan
                    │
                    ▼
         allowlisted local engines
                    │
                    ▼
          visible execution trace
```

A privacy clarification: I do not describe the whole XFree platform as 100% client-side. Local recipes and Local Mode tools execute in the browser, while separate optional cloud/API functionality can send explicitly submitted data to configured providers. The PWA also intentionally excludes model downloads, API requests, and ads from service-worker caching.

I would be interested in feedback from people running local models in-browser:

1. Would you keep LLM planning entirely separate from deterministic recipe execution, or allow recipes to opt into a pinned planner version later?
2. What would you include in a portable recipe schema beyond engine IDs, versions, and closed configuration?
3. For WebGPU planning, is a tiny fast model the right tradeoff here, given that the model only proposes a plan and never expands execution permissions?

Runnable recipes: `https://www.xfree.in/recipes`

Source: `https://github.com/CodesbyFebin/xfree`

## Before posting

- Rewrite the final post in the submitter's own voice. Do not paste a generic promotional AI-written post unchanged.
- If AI materially assisted the final text, disclose that assistance if the subreddit rules require it at posting time.
- Check the account's recent r/LocalLLaMA participation. Do not use the subreddit as a drive-by self-promotion channel.
- Read the current subreddit rules immediately before posting; moderation requirements changed in 2026 and can change again.
- Prefer implementation details, benchmarkable behavior, source links, screenshots of the execution trace, and concrete limitations over adjectives.
- Do not claim “100% client-side platform,” “zero tracking,” “unlimited,” or “25,000 live tools.”
- Be explicit that JWT decoding is not signature verification.
- Be explicit that the initial recipe layer uses no LLM; WebLLM planning is optional.

## Participation / moderation notes

Recent moderator guidance has emphasized meaningful community participation and has become stricter about low-effort self-promotion and undisclosed LLM-written content. Treat the launch as a technical discussion, not an advertisement. If the account is not yet within the community's current self-promotion expectations, participate first and post the project later.

Useful launch-day reference:

`https://www.reddit.com/r/LocalLLaMA/`

Check the current sidebar/rules and recent moderator announcements immediately before submission rather than relying on this document as a permanent statement of policy.
