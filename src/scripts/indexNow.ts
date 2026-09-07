import fs from "fs";
import path from "path";
import { INDEXNOW_KEY, INDEXNOW_KEY_FILE, buildIndexNowPayload, submitIndexNow } from "../utils/indexNow";
import { STATIC_ROUTES } from "../data/routes";

function writeKeyFile(publicDir: string): void {
  const keyPath = path.join(publicDir, INDEXNOW_KEY_FILE);
  fs.writeFileSync(keyPath, INDEXNOW_KEY, "utf-8");
  console.log(`IndexNow key file written to ${keyPath}`);
}

function collectUrls(): string[] {
  const baseUrl = process.env.BASE_URL || "https://www.xfree.in";
  // STATIC_ROUTES is the same list the client router and prerender.ts use —
  // this used to be a separate hand-maintained copy that had drifted to
  // include three routes with no Route case anywhere (/contribute,
  // /instaserver, /json-tools) and the old "/security" path (renamed /trust).
  const staticPaths = [
    ...STATIC_ROUTES,
    "/sitemap.xml",
    "/llms.txt",
    "/llms-full.txt",
    "/robots.txt",
    "/capabilities.json",
  ];

  return staticPaths.map((p) => `${baseUrl}${p}`);
}

async function run() {
  const publicDir = path.join(process.cwd(), "public");
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  writeKeyFile(publicDir);

  const urlList = collectUrls();
  const baseUrl = process.env.BASE_URL || "https://www.xfree.in";
  const payload = buildIndexNowPayload(baseUrl, urlList);

  console.log("Submitting IndexNow payload for", urlList.length, "URLs...");
  const result = await submitIndexNow(payload);
  console.log("IndexNow response:", result.status, result.body);
}

run().catch((err) => {
  console.error("IndexNow script failed:", err);
  process.exit(1);
});
