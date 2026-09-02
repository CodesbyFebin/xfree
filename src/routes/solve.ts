/**
 * Solve routes - handle natural language problem statements
 * 
 * These routes interpret human intent as problems that need solving
 * and execute the appropriate workflows to produce outcomes.
 */
export const SOLVE_ROUTES = [
  "/solve/:problem",
  "/solve/:problem/*",
] as const;

export type SolveRoute = (typeof SOLVE_ROUTES)[number];

export function parseSolveRoute(pathname: string): string | null {
  const match = pathname.match(/^\/solve\/([^/]+)\/?$/);
  return match ? match[1] : null;
}