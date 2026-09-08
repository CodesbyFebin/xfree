import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig([{
    ignores: ["**/.vercel/**"],
}, {
    extends: [...nextCoreWebVitals],

    rules: {
        "react/jsx-no-comment-textnodes": "off",
        "react/no-unescaped-entities": "off",
        // This codebase's effects legitimately synchronize with external
        // systems on mount - localStorage-derived stats, browser-only
        // matchMedia/PWA state, canvas-based QR/barcode generation, DOM
        // audits - which is exactly the pattern React's own effect docs
        // recommend useEffect for. The rule has no allowance for that
        // category and would otherwise force a much larger, unrelated
        // refactor (e.g. useSyncExternalStore) as a side effect of the
        // Next.js 16 upgrade.
        "react-hooks/set-state-in-effect": "off",
    },
}]);