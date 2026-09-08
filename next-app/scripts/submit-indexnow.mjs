#!/usr/bin/env node
// Submits every URL in the live sitemap to IndexNow (a real, shared protocol
// used by Bing, Yandex, Seznam.cz, and Naver - explicitly NOT Google, which
// has never participated). One bulk POST notifies all participating engines
// at once. Run after a production deploy so newly published/changed pages
// get picked up faster than waiting for the next crawl.
//
// Usage: node scripts/submit-indexnow.mjs

const SITE = 'https://www.xfree.in';
const KEY = 'f41516c231dff4dda6a450aaac9a2a4a';
const KEY_LOCATION = `${SITE}/${KEY}.txt`;

async function main() {
  const sitemapRes = await fetch(`${SITE}/sitemap.xml`);
  if (!sitemapRes.ok) {
    throw new Error(`Failed to fetch sitemap.xml: ${sitemapRes.status}`);
  }
  const xml = await sitemapRes.text();
  const urlList = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

  if (urlList.length === 0) {
    throw new Error('No URLs found in sitemap.xml - refusing to submit an empty list');
  }

  console.log(`Submitting ${urlList.length} URLs to IndexNow...`);

  // IndexNow allows up to 10,000 URLs per request; chunk defensively in
  // case the sitemap grows well past that in the future.
  const CHUNK_SIZE = 10000;
  for (let i = 0; i < urlList.length; i += CHUNK_SIZE) {
    const chunk = urlList.slice(i, i + CHUNK_SIZE);
    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'www.xfree.in',
        key: KEY,
        keyLocation: KEY_LOCATION,
        urlList: chunk,
      }),
    });

    if (!res.ok && res.status !== 202) {
      const body = await res.text().catch(() => '');
      throw new Error(`IndexNow submission failed: ${res.status} ${body}`);
    }
    console.log(`Chunk ${Math.floor(i / CHUNK_SIZE) + 1}: ${res.status}`);
  }

  console.log('IndexNow submission complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
