/**
 * app.xfree.in is a dedicated Studio host: its root ("/") is the canonical
 * Studio URL, not the marketing homepage. This resolves the effective SPA
 * path so client-side routing, static-route detection, and useMetaTags'
 * canonical logic (which treats "/studio" as canonical https://app.xfree.in/)
 * all agree — without bypassing the shared Header/Footer chrome.
 *
 * Pulled out of App.tsx so the mapping itself is unit-testable independent
 * of hostname, which jsdom/vitest can't easily fake per-test otherwise.
 */
export const STUDIO_HOST = "app.xfree.in";

export function isStudioHostname(hostname: string): boolean {
  return hostname.toLowerCase() === STUDIO_HOST;
}

export function resolveEffectivePathForHost(hostname: string, pathname: string): string {
  return isStudioHostname(hostname) && pathname === "/" ? "/studio" : pathname;
}
