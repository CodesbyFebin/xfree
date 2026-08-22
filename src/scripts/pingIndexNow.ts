/**
 * IndexNow pinger. Notifies Bing/Yandex/DuckDuckGo/Seznam/Naver of URL changes.
 *
 * Usage:
 *   npm run indexnow                  # ping every indexable URL in the sitemap
 *   npm run indexnow -- --url=https://www.xfree.in/tools/regex-tester
 *   npm run indexnow -- --url=... --url=...  # multiple
 *
 * Requires PUBLIC_SITE_URL to be set (production domain). The IndexNow key is
 * either INDEXNOW_KEY (env) or auto-detected from public/<32-hex>.txt.
 */
import fs from "fs";
import path from "path";
import { getPageSitemapEntries, getToolSitemapEntries, getGuideSitemapEntries } from "../utils/generateSitemap";
import { CANONICAL_ORIGIN } from "../data/siteConfig";

const ENDPOINT = "https://api.indexnow.org/indexnow";
const publicDir = path.join(process.cwd(), "public");

function resolveKey(): string {
  if (process.env.INDEXNOW_KEY && /^[a-f0-9]{8,128}$/i.test(process.env.INDEXNOW_KEY)) {
    return process.env.INDEXNOW_KEY;
  }
  if (!fs.existsSync(publicDir)) throw new Error("public/ not found — generate an IndexNow key first (see docs/indexing.md).");
  const match = fs.readdirSync(publicDir).find((f) => /^[a-f0-9]{8,128}\.txt$/i.test(f));
  if (!match) throw new Error("No IndexNow key file in public/. Set INDEXNOW_KEY or add public/<key>.txt.");
  return match.replace(/\.txt$/i, "");
}

function resolveHost(): string {
  return new URL(CANONICAL_ORIGIN).host;
}

function urlsFromCliArgs(): string[] {
  return process.argv.slice(2)
    .filter((a) => a.startsWith("--url="))
    .map((a) => a.slice("--url=".length));
}

function allSiteUrls(base: string): string[] {
  const entries = [
    ...getPageSitemapEntries(),
    ...getToolSitemapEntries(),
    ...getGuideSitemapEntries(),
  ];
  return Array.from(new Set(entries.map((entry) => `${base}${entry.path === "/" ? "/" : entry.path}`)));
}

async function ping(urls: string[]) {
  const key = resolveKey();
  const host = resolveHost();
  const base = `https://${host}`;
  const keyLocation = `${base}/${key}.txt`;

  console.log(`[indexnow] host=${host} key=${key.slice(0, 6)}… count=${urls.length}`);

  // IndexNow accepts up to 10,000 URLs per POST; batch to be safe.
  const BATCH = 500;
  for (let i = 0; i < urls.length; i += BATCH) {
    const slice = urls.slice(i, i + BATCH);
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation, urlList: slice }),
    });
    console.log(`[indexnow] batch ${i / BATCH + 1}: ${slice.length} urls → ${res.status} ${res.statusText}`);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      if (body) console.error(`[indexnow] response body: ${body.slice(0, 400)}`);
    }
  }
}

async function main() {
  const cliUrls = urlsFromCliArgs();
  const base = CANONICAL_ORIGIN;
  const urls = cliUrls.length ? cliUrls : allSiteUrls(base);
  if (!urls.length) { console.log("[indexnow] no urls to ping"); return; }
  await ping(urls);
}

main().catch((err) => {
  console.error("[indexnow] failed:", err.message || err);
  process.exit(1);
});
