import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: Array<Record<string, unknown>>;
  }
}

interface AdSenseUnitProps {
  slot?: string;
  className?: string;
}

const PUBLISHER_ID = "ca-pub-3573741815038097";
const ADSENSE_SCRIPT_ID = "xfree-adsense-script";
const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`;

function ensureAdSenseScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.getElementById(ADSENSE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("AdSense script failed to load")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = ADSENSE_SCRIPT_ID;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.src = ADSENSE_SCRIPT_SRC;
    script.dataset.adClient = PUBLISHER_ID;
    script.addEventListener("load", () => {
      script.dataset.loaded = "true";
      resolve();
    }, { once: true });
    script.addEventListener("error", () => reject(new Error("AdSense script failed to load")), { once: true });
    document.head.appendChild(script);
  });
}

export function AdSenseUnit({ slot, className = "" }: AdSenseUnitProps) {
  const element = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!slot || !element.current || element.current.dataset.adsbygoogleStatus) return;

    let cancelled = false;
    ensureAdSenseScript()
      .then(() => {
        if (cancelled || !element.current || element.current.dataset.adsbygoogleStatus) return;
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.warn("AdSense unit initialization was deferred", error);
      });

    return () => {
      cancelled = true;
    };
  }, [slot]);

  // Never render a fake or placeholder unit. The slot must come from the
  // approved AdSense ad-unit configuration exposed at build time. XFree uses
  // a project-level 160px separation guardrail above and below manual ad units
  // so ads are not immediately adjacent to interactive/action elements.
  if (!slot) return null;

  return (
    <aside
      aria-label="Advertisement"
      data-ad-safe-zone="true"
      style={{ marginBlock: "10rem" }}
      className={`rounded-2xl border border-white/10 bg-slate-900/40 p-4 ${className}`}
    >
      <p className="mb-2 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">Advertisement</p>
      <ins
        ref={element}
        className="adsbygoogle block min-h-24"
        data-ad-client={PUBLISHER_ID}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
