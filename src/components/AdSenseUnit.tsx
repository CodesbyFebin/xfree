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

export function AdSenseUnit({ slot, className = "" }: AdSenseUnitProps) {
  const element = useRef<HTMLModElement>(null);

  useEffect(() => {
    if (!slot || !element.current || element.current.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      if (import.meta.env.DEV) console.warn("AdSense unit initialization was deferred", error);
    }
  }, [slot]);

  // Never render a fake or placeholder unit. The slot must come from the
  // approved AdSense ad-unit configuration exposed at build time.
  if (!slot) return null;

  return (
    <aside aria-label="Advertisement" className={`rounded-2xl border border-white/10 bg-slate-900/40 p-4 ${className}`}>
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
