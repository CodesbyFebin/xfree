# XFree.in API Reference

This document is the authoritative contract for XFree.in's HTTP API. It is
synchronized with the implementation in `src/server/app.ts` and the Zod schemas
in `src/server/schemas.ts`. All request/response bodies are JSON
(`Content-Type: application/json`). Every mutating endpoint is validated with Zod
and rate-limited per IP (and globally for AI endpoints).

> Base URL (production): `https://www.xfree.in`. In local dev the server listens
> on `PORT` (default 3000) via `server.ts`.

## Conventions

- **Auth:** None required for public endpoints. AI endpoints require a server-side
  `GEMINI_API_KEY`; when it is unset they return `503
  {"error":"ai_not_configured"}` instead of crashing.
- **Errors:** `4xx` for client/validation errors (with a `requestId` in
  production), `5xx` only for unexpected server faults. No stack traces are
  returned to clients.
- **Rate limits:** AI — per-minute + per-day per IP, plus a global daily cap.
  Contact/feedback/lead — per-IP limits; honeypot `website` field must be empty.
- **Task allowlist:** AI endpoints accept only `taskId` values defined in
  `src/server/tasks.ts` (client-supplied `systemInstruction` is never accepted).
  Unknown `taskId` → `400`.

## Health & metadata

### `GET /api/health`
Liveness probe. Returns `200 { "status": "ok" }`.

### `GET /api/ready`
Readiness probe (dependency/key checks). Returns `200` when the service can serve.

### `GET /sitemap.xml`, `/rss.xml`, `/llms.txt`, `/llms-full.txt`, `/robots.txt`
Static, build-generated discovery files. Served directly (see `src/scripts/generateSitemap.ts`).

## AI endpoints

### `POST /api/ai`
Single-purpose AI task.

**Request** (`AiRequestSchema`):
```json
{ "taskId": "ai-regex", "input": "turn this sentence into a regex that captures emails" }
```
- `taskId` (enum, default `general`): one of the server allowlist.
- `input` (string, 1–8000 chars).

**Response** `200`:
```json
{ "output": "...", "taskId": "ai-regex", "thinkingLevel": "off" }
```
**Errors:** `400` invalid body/taskId · `429` rate limited · `503` AI not configured.

### `POST /api/ai/batch`
Bulk processing for up to 20 items.

**Request** (`AiBatchSchema`):
```json
{ "taskId": "ai-json-repair", "items": ["{bad json}", "{more}"] }
```
- `items` (array of 1–20 strings, each ≤ 2000 chars).

**Response** `200`: `{ "results": [ "..." ], "taskId": "ai-json-repair" }`.

### `POST /api/ai/thinking`
High-reasoning variant (configurable model via `GEMINI_THINKING_MODEL`).

**Request** (`AiThinkingSchema`): `{ "taskId": "general", "prompt": "..." }`
(`prompt` 1–8000 chars).

### `POST /api/ai/chat`
Multi-turn assistant.

**Request** (`AiChatSchema`):
```json
{ "messages": [ { "role": "user", "content": "explain cron syntax" } ] }
```
- `messages` (1–20 entries, `role` ∈ {user, assistant}, content ≤ 4000 chars).

## Contact & feedback

### `POST /api/contact`
**Request** (`ContactSchema`):
```json
{ "email": "you@example.com", "message": "at least 10 characters", "website": "" }
```
- `website` is a honeypot; must be empty or omitted.

### `POST /api/feedback`
**Request** (`FeedbackSchema`):
```json
{ "category": "bug", "message": "steps to reproduce...", "toolId": "json-formatter" }
```
- `category` ∈ {bug, feature, general, usability}.

### `POST /api/lead`
**Request** (`LeadSchema`): requires `email`, `taskDescription`, and `consent: true`
(honeypot `website` must be empty). `source` defaults to `"popup"`.

All three are delivered via Resend when `RESEND_API_KEY` is set; otherwise they
are logged to stdout for review.

## Capability / execution (v1)

These map to the open-source intent → capability → execution engine
(`src/lib/intent-engine.ts`, `src/lib/execution-engine.ts`).

### `POST /api/v1/solve/:problem`
Natural-language problem solver. `:problem` is a URL-encoded problem string.

**Response** `200`:
```json
{
  "intent": { "intent": "generate sitemap", "entities": ["sitemap"], "confidence": 0.9 },
  "plan": { "steps": [ { "toolId": "bulk-url-sitemap", "action": "execute" } ] },
  "results": [ { "success": true, "toolExecuted": "bulk-url-sitemap" } ]
}
```

### `POST /api/v1/execute/:toolId`
Execute a single tool by id/slug.

### `POST /api/v1/verify/:toolId`
Verify a tool's result/output.

### `GET /api/v1/capabilities`
Returns the structured capability catalog (`public/capabilities.json` content).

### `GET /api/v1/tools`
Returns the tool registry summary (`public/tools.json` content).

---

## Change policy

This file is part of the documented API contract. When you change a route,
schema, or error code, update this document in the same PR and run
`npm run test` + `npm run build` (CI enforces both).
