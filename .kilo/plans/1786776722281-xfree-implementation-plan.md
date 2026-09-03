# XFree.in Implementation Plan — Missing Core Modules

## Goal
Complete the remaining missing pieces of the XFree.in developer tool platform: WorkflowEngine, VerificationSystem, ComparisonEngine extraction, SolvePage, IntentBar, and agent execution runtime.

## Current State
- Home page (`public/home.html`) rendered with 7 public tools, 12 pillars, dark theme
- Server (`src/server/app.ts`) serves `/home`, `/pillars`, and API endpoints (`/api/v1/solve/:problem`, `/api/v1/execute/:toolId`, `/api/v1/verify/:toolId`)
- Client SPA (`src/App.tsx`) uses pathname-based routing with localStorage persistence
- Tool registry (`src/data/toolsRegistry.ts`) has 10 hand-crafted published tools + seed data
- Intent engine (`src/lib/intent-engine.ts`) fully implemented and tested
- Execution engine (`src/lib/execution-engine.ts`) fully implemented (executeTool, solveProblem, verifyToolResult, compareTools)
- Agents definitions (`src/lib/agents.ts`) has types + definitions only, no execution runtime
- 10 React tool components exist in `src/components/tools/`
- CommandPalette.tsx exists for tool search
- Tests: intent-engine, execution-engine (existing), agents (existing)

## Architecture Context
- **Routing**: Client-side SPA uses `window.location.pathname` (no React Router). `/solve/*` currently NOT handled — falls to NotFoundPage
- **Persistence**: Uses `localStorage` pattern (`xfree_favorites`, `xfree_history`, `xfree_workspace_configs`)
- **Theming**: Two parallel systems — home.html/ pillars.html use cyberpunk CSS, App.tsx SPA uses Tailwind dark slate
- **Types**: `WorkflowStep`, `WorkflowDefinition`, `ExecutionPlan`, `ExecutionStep`, `VerificationResult`, `IntentConstraints` are duplicated in both `types.ts` and the lib modules — need consolidation

## Implementation Tasks

### Task 1: WorkflowEngine (`src/lib/workflow.ts`)
**Purpose**: Manage workflow lifecycle — save, load, list, and execute multi-step tool chains.

**Design Decisions**:
- Persistence: `localStorage` with key `xfree_workflows` (consistent with existing app pattern)
- Imports `executeWorkflow`, `executeTool` from `execution-engine.ts` — NO circular dependency (workflow.ts → execution-engine.ts, NOT vice versa)
- Re-export `WorkflowDefinition`, `WorkflowStep` from `types.ts` (not its own local copy)
- `WorkflowEngine` is a class with methods: `save(workflow)`, `load(id)`, `list()`, `delete(id)`, `run(workflowId, input, context)`

**Exports**:
- `class WorkflowEngine` (singleton instance exported as `workflowEngine`)
- `saveWorkflow(wf: WorkflowDefinition): string`
- `loadWorkflow(id: string): WorkflowDefinition | null`
- `listWorkflows(): WorkflowDefinition[]`
- `runWorkflow(id: string, input: any, context?: ExecutionContext): Promise<ExecutionResult[]>`

### Task 2: VerificationSystem (`src/lib/verification-system.ts`)
**Purpose**: Track verification state and `lastVerified` timestamps per tool.

**Design Decisions**:
- Persistence: `localStorage` with key `xfree_verifications` — maps toolId → `{ status, lastVerified, confidence }`
- Wraps the existing `verifyToolResult` from `execution-engine.ts` — calls it, stores result with timestamp
- Single source of truth for verification status; `verifyToolResult` stays in execution-engine for result verification, VerificationSystem manages the *tracking* layer

**Exports**:
- `class VerificationSystem` (singleton exported as `verificationSystem`)
- `verifyTool(toolId: string, input: any, output: any): Promise<VerificationRecord>`
- `getVerificationStatus(toolId: string): VerificationRecord | null`
- `getLastVerified(toolId: string): string | null`
- Interface: `VerificationRecord { toolId, status, lastVerified: string, confidence: number, issues: string[] }`

### Task 3: ComparisonEngine (`src/lib/comparison-engine.ts`)
**Purpose**: Extract comparison logic currently in `execution-engine.ts` into a dedicated module.

**Design Decisions**:
- Move `compareTools`, `extractStrengths`, `extractWeaknesses` from `execution-engine.ts` → `comparison-engine.ts`
- Keep `ComparisonResult` interface in `comparison-engine.ts` (not in types.ts)
- Add `comparisonCriteria` config with default weights (capabilityFit: 0.25, reliability: 0.2, speed: 0.15, privacy: 0.2, pricing: 0.2)

**Exports**:
- `compareTools(toolIds: string[], criteria?: string[]): ComparisonResult[]`
- `ComparisonResult` interface

### Task 4: Agent Execution Runtime (`src/lib/agents.ts` — extend)
**Purpose**: Add `executeAgent()` to invoke specialist agents with Gemini.

**Design Decisions**:
- Add runtime `executeAgent(request: AgentExecutionRequest): Promise<AgentExecutionResult>`
- Imports from `./gemini` for AI client (same pattern as server app)
- Handles intent-agent routing via `classifyIntent` → `solveProblem` pipeline
- For workflow/security/verification agents: delegate to respective modules
- Reuses `ExecutionContext`, `AgentExecutionRequest`, `AgentExecutionResult` from agents.ts (already defined)

### Task 5: SolvePage Component (`src/components/solve/SolvePage.tsx`)
**Purpose**: Render the solve interface at client route `/solve/:problem`.

**Design Decisions**:
- Props: `{ problem: string; onNavigate?: (path: string) => void }`
- Uses `solveProblem()` from execution-engine client-side (import directly, not via API)
- State machine: `"idle" | "loading-plan" | "plan-ready" | "executing" | "results" | "error"`
- Displays: problem statement, intent classification, execution plan steps, step-by-step results with verification badges, final output
- Integrates `IntentBar` for alternative tool selection
- Dark theme: adapts existing Tailwind dark classes from App.tsx (`slate-900` base)

**Routing Integration**: Add route handling in `App.tsx`:
- Parse `/solve/:problem` from `currentPath`
- Render `<SolvePage problem={problem} />` in the main content area
- Add navigate callback

### Task 6: IntentBar Component (`src/components/intent/IntentBar.tsx`)
**Purpose**: Horizontal intent/navigation bar with categorized tools and quick-search.

**Design Decisions**:
- Adapt from `CommandPalette.tsx` pattern — uses `Fuse.js` for fuzzy search (already a dependency)
- Props: `{ onExecuteTool: (toolSlug: string) => void; onSearchIntent: (query: string) => void; recentInputs?: string[] }`
- Shows grouped by category: SEO & URL, Developer, AI, Text, Converters, Generators, Validators
- Click-to-expand for detailed tool listing per category
- Keyboard: `Ctrl+K` focuses input, `⌘` + Enter triggers primary action

### Task 7: Tests
- `src/lib/__tests__/workflow.test.ts` — test save/load/run, localStorage round-trip, singleton behavior
- `src/lib/__tests__/verification-system.test.ts` — test verifyTool stores `lastVerified`, getVerificationStatus returns record, stale detection

## Integration Points
- `app.tsx`: Add `/solve/:problem` route handling
- `src/server/app.ts`: API endpoints `/api/v1/solve/:problem*`, `/api/v1/execute/:toolId`, `/api/v1/verify/:toolId` already wired — components call client-side functions directly for instant UX, optionally fall back to API

## Validation Plan
1. `npm run typecheck` — strict TypeScript, zero errors for all 9 modules
2. `npm run test` — all tests pass (existing 3 files + 2 new = 53+ tests)
3. `npm run build` — production build succeeds with /solve route prerendered
4. `npm run lint:noindex` — no indexable leakage for new routes

## Risks & Mitigations
- **Type duplication**: `types.ts` and lib modules both define similar interfaces. Solution: consolidate into `types.ts`, import everywhere.
- **SolvePage calling server APIs vs client functions**: Use client-side function calls for instant UX (no network), with optional API fallback for AI-heavy workflows.
- **WorkflowEngine persistence**: localStorage may be cleared. Acceptable for MVP — note in user docs.
- **Circular dependency**: workflow.ts → execution-engine.ts only (not reverse). VerificationSystem → execution-engine.ts (imports verifyToolResult) only.

## Priority
1. WorkflowEngine + tests
2. VerificationSystem + tests  
3. ComparisonEngine extraction
4. Agent execution runtime
5. IntentBar (adapt from CommandPalette)
6. SolvePage + App.tsx route integration
