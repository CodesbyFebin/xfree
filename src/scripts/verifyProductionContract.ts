/**
 * Post-deploy verification of the GSC Contract v2 redirect matrix and the
 * Studio raw-canonical fix against the real, live domains — the parts of
 * the contract that build-time validation (validateGscContract.ts) cannot
 * check, because they depend on Vercel's actual routing/middleware behavior
 * at request time, not just the source configuration.
 *
 * Not part of the build — run manually or in a post-deploy CI step:
 *   npm run verify:production
 *
 * Exits non-zero on any failure so it can gate a release step if wired in.
 */
const BASE = process.env.VERIFY_BASE_URL ?? "https://www.xfree.in";
const APP_BASE = process.env.VERIFY_APP_BASE_URL ?? "https://app.xfree.in";

interface Check {
  name: string;
  run: () => Promise<string | null>; // null = pass, string = failure reason
}

async function fetchNoRedirect(url: string): Promise<Response> {
  return fetch(url, { redirect: "manual" });
}

const checks: Check[] = [
  {
    name: "xfree.in (apex) -> www.xfree.in, single 308 hop",
    run: async () => {
      const res = await fetchNoRedirect("https://xfree.in/");
      if (res.status !== 308) return `expected 308, got ${res.status}`;
      const location = res.headers.get("location") ?? "";
      if (!location.startsWith("https://www.xfree.in/")) return `Location is "${location}", expected https://www.xfree.in/*`;
      return null;
    },
  },
  {
    name: "www.xfree.in/studio -> app.xfree.in/, single 301/308 hop",
    run: async () => {
      const res = await fetchNoRedirect(`${BASE}/studio`);
      if (res.status !== 301 && res.status !== 308) return `expected 301/308, got ${res.status}`;
      const location = res.headers.get("location") ?? "";
      if (location !== `${APP_BASE}/`) return `Location is "${location}", expected exactly ${APP_BASE}/`;
      return null;
    },
  },
  {
    name: "app.xfree.in/studio -> app.xfree.in/, single 301/308 hop",
    run: async () => {
      const res = await fetchNoRedirect(`${APP_BASE}/studio`);
      if (res.status !== 301 && res.status !== 308) return `expected 301/308, got ${res.status}`;
      const location = res.headers.get("location") ?? "";
      if (location !== `${APP_BASE}/`) return `Location is "${location}", expected exactly ${APP_BASE}/`;
      return null;
    },
  },
  {
    name: "app.xfree.in/ -> direct 200, no redirect",
    run: async () => {
      const res = await fetchNoRedirect(`${APP_BASE}/`);
      if (res.status !== 200) return `expected 200, got ${res.status}`;
      return null;
    },
  },
  {
    name: "app.xfree.in/ raw HTML canonical is exactly https://app.xfree.in/",
    run: async () => {
      const res = await fetch(`${APP_BASE}/`);
      const html = await res.text();
      const match = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
      if (!match) return "no canonical tag found in raw HTML";
      if (match[1] !== `${APP_BASE}/`) return `canonical is "${match[1]}", expected exactly ${APP_BASE}/`;
      return null;
    },
  },
  {
    name: "app.xfree.in/ raw HTML robots is index,follow (not noindex)",
    run: async () => {
      const res = await fetch(`${APP_BASE}/`);
      const html = await res.text();
      const match = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
      if (!match) return "no robots meta tag found";
      if (!match[1].includes("index") || match[1].includes("noindex")) {
        return `robots meta is "${match[1]}", expected index,follow — this exact regression happened once already`;
      }
      return null;
    },
  },
  {
    name: "www.xfree.in/ homepage canonical is unaffected (still self-referencing)",
    run: async () => {
      const res = await fetch(`${BASE}/`);
      const html = await res.text();
      const match = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
      if (!match) return "no canonical tag found";
      if (match[1] !== `${BASE}/`) return `canonical is "${match[1]}", expected exactly ${BASE}/`;
      return null;
    },
  },
  {
    name: "internal shell path /_app-shell is blocked in robots.txt and noindexed when requested directly",
    run: async () => {
      const res = await fetch(`${BASE}/robots.txt`);
      const text = await res.text();
      if (!/Disallow:\s*\/_app-shell/.test(text)) return "robots.txt does not disallow /_app-shell";
      const shell = await fetchNoRedirect(`${BASE}/_app-shell`);
      const xRobots = shell.headers.get("x-robots-tag") ?? "";
      if (!/noindex/i.test(xRobots)) return `direct /_app-shell X-Robots-Tag is "${xRobots}", expected noindex`;
      return null;
    },
  },
];

async function main() {
  let failures = 0;
  for (const check of checks) {
    try {
      const result = await check.run();
      if (result) {
        console.error(`  ✗ ${check.name}\n      ${result}`);
        failures++;
      } else {
        console.log(`  ✓ ${check.name}`);
      }
    } catch (err) {
      console.error(`  ✗ ${check.name}\n      threw: ${err instanceof Error ? err.message : String(err)}`);
      failures++;
    }
  }

  if (failures > 0) {
    console.error(`\n[verify-production] FAIL — ${failures}/${checks.length} check(s) failed`);
    process.exit(1);
  }
  console.log(`\n[verify-production] PASS — ${checks.length}/${checks.length} checks passed`);
}

main();
