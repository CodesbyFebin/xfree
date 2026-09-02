# This is a standalone local prototype — not production

This repository is a **design exploration**, not the real XFree codebase and not connected to
any live deployment. It exists only on this machine, has no `git remote`, and should not be
pushed, deployed, or treated as a source of truth.

## What this actually is

A fork of a stale intermediate snapshot of XFree (from around when the "governed content
pipeline + 100 local Studio engines" work landed), extended here with a full AI-agent-platform
landing page — hero, features, how-it-works, architecture, use cases, security, and FAQ sections
— exploring what that positioning could look like as real React components instead of a static
mockup.

## What it is not

It is **not** current with the real, actively-developed production repository at
[github.com/CodesbyFebin/xfree](https://github.com/CodesbyFebin/xfree) (`main` branch), which as
of this writing has:

- 60 published/indexable tools (this snapshot has 10)
- 8 versioned workflow recipes (this snapshot has none)
- `agent-core.ts` — deterministic local plan validation and chaining (this snapshot has a
  different, earlier `agents.ts` design with 6 declared specialist agents)
- A WebGPU/WebLLM local planner (pinned SmolLM2)
- `middleware.ts` Vercel routing and a "GSC Contract v2" enforced in CI

None of that drift is a bug in this prototype — it's just a different, older base. If any of the
landing-page ideas here (copy, section structure, the "real exported signatures" architecture
code block, the corrected FAQ answers) are worth carrying forward, they should be reimplemented
against a fresh clone of the real repo's current `main`, not merged from here directly — the
underlying facts (tool count, agent architecture, file paths) would need re-verifying against
that codebase first.
