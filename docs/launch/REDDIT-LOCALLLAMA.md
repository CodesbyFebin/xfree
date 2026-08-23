# r/LocalLLaMA launch notes — XFree

> **Internal fact sheet only.** Do not paste this file into Reddit as a finished post. r/LocalLLaMA's 2026 rule updates explicitly target low-effort/undisclosed LLM-written content, and moderators are actively enforcing the self-promotion participation rule. The human submitter should write the final post in their own voice and disclose AI assistance if required by the current rules.

## Technical angle to explain in your own words

Lead with the engineering problem: making browser automation reproducible and inspectable while keeping LLM planning optional.

Useful concepts for a human-written title:

- versioned local workflow recipes;
- 100 allowlisted browser engines;
- deterministic execution;
- optional SmolLM2/WebGPU planning.

Avoid generic “AI developer toolbox” wording and promotional superlatives.

## Facts the human-written post may cover

- XFree has 100 allowlisted local engines in Agent Studio.
- The deterministic Agent Core can chain those engines.
- An optional WebGPU/WebLLM planner can propose a plan with the pinned SmolLM2 model on supported browsers.
- Execution remains constrained to the same engine allowlist regardless of how the plan was proposed.
- Eight versioned v1 recipes can be shared without sharing prompts or arbitrary executable scripts.
- All eight v1 recipes run in Local Mode and require no model.
- Example recipe architecture: `http-url-extract → url-normalize (per line) → line-dedupe → line-sort → lines-to-json-array`.
- The share payload contains recipe ID/version, processing mode, LLM-required flag, allowlisted engine IDs, built-in transform IDs, and a small closed config set.
- The runner rejects unknown engines, transforms, config keys, non-local v1 recipes, and recipes longer than six steps.
- The WebGPU planner is a convenience layer, not execution authority.
- XFree is not described as an entirely client-side platform: Local Mode workflows execute in-browser, while optional separately labeled cloud/API features can send explicitly submitted data to configured providers.
- The PWA deliberately excludes model downloads, API requests, and ads from service-worker caching.

## Architecture diagram to recreate or explain manually

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

## Questions worth asking the community

Choose only questions the submitter genuinely wants answered and rewrite them naturally:

- Should LLM planning remain entirely separate from deterministic recipe execution, or should a future recipe be able to pin an optional planner/model version?
- What belongs in a portable recipe schema beyond engine IDs, versions, and closed configuration?
- Is a small fast local model the right planning tradeoff when it only proposes a plan and cannot expand execution permissions?
- What WebGPU/browser compatibility edge cases should be tested before recipe import/export expands?

## Links to have ready

- Runnable recipes: `https://www.xfree.in/recipes`
- Source: `https://github.com/CodesbyFebin/xfree`
- Recipe registry: `src/data/recipes.ts`
- Recipe runner: `src/lib/recipe-runner.ts`
- Agent Core: `src/lib/agent-core.ts`

## Before posting

- [ ] Write the final title and post manually in the submitter's own voice; do not paste this fact sheet as submission copy.
- [ ] Read the current r/LocalLLaMA rules and latest moderator announcements immediately before posting.
- [ ] Check the account's recent r/LocalLLaMA activity. Current moderator enforcement repeatedly uses the **rough 10% self-promotion / 90% meaningful participation guideline**; do not post until the account genuinely fits the community expectation.
- [ ] Participation must be meaningful, not filler comments written to satisfy a quota.
- [ ] If AI materially assisted the final post, follow the current disclosure rule.
- [ ] Prefer implementation details, source links, execution-trace screenshots, test results, and limitations over promotional language.
- [ ] Keep the topic genuinely about local models/local inference. Do not make the optional cloud mode the center of the r/LocalLLaMA post.
- [ ] Do not claim “100% client-side platform,” “zero tracking,” “unlimited,” or “25,000 live tools.”
- [ ] State that JWT decoding is not signature verification if that recipe is discussed.
- [ ] State that v1 recipes use no LLM; WebLLM planning is optional.

## Current moderation context

The April 2026 rule update introduced minimum-karma requirements and stronger Rule 3/Rule 4 wording because of spam, low-effort AI content, and self-promotion. Moderator replies throughout mid/late 2026 continue to enforce meaningful participation and repeatedly describe the 1-in-10 self-promotion ratio as the practical guideline.

Useful launch-day references:

- `https://www.reddit.com/r/LocalLLaMA/comments/1su3ao4/rlocalllama_rule_updates/`
- `https://www.reddit.com/r/LocalLLaMA/`

Rules can change. Treat this file as planning notes and verify the live subreddit rules on the day of submission.
