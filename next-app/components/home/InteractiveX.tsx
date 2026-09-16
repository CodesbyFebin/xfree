'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

// Real routes only (verified against lib/data/toolsWithSEO.ts's CATEGORIES) -
// "Data" and "Web" aren't real category ids, so the two closest genuine
// categories stand in for them rather than linking to a route that 404s.
// labelKey resolves against the Home namespace (orbitDeveloper, orbitAI, ...).
const ORBIT_LABELS = [
  { labelKey: 'orbitDeveloper', href: '/categories/developer-tools', position: 'left-0 top-[18%]' },
  { labelKey: 'orbitAI', href: '/categories/ai-tools', position: 'left-0 top-1/2' },
  { labelKey: 'orbitData', href: '/categories/converters', position: 'left-0 bottom-[18%]' },
  { labelKey: 'orbitWeb', href: '/categories/seo-url-tools', position: 'right-0 top-[18%]' },
  { labelKey: 'orbitProductivity', href: '/categories/generators', position: 'right-0 top-1/2' },
  { labelKey: 'orbitSecurity', href: '/categories/security-tools', position: 'right-0 bottom-[18%]' },
] as const;

/**
 * The hero's animated "X" mark. Pointer parallax and the HUD rotation are
 * driven by direct style writes on refs (not React state) so neither
 * causes a re-render on every mousemove/frame - see the performance
 * requirement to avoid expensive continuous re-renders. Everything here is
 * `aria-hidden` except the six orbit labels, which are real links.
 */
export function InteractiveX() {
  const t = useTranslations('Home');
  const coreRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const container = containerRef.current;
    const core = coreRef.current;
    if (!container || !core) return;

    let raf = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    function onPointerMove(e: PointerEvent) {
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const relX = (e.clientX - rect.left) / rect.width - 0.5;
      const relY = (e.clientY - rect.top) / rect.height - 0.5;
      // Small max offset - this is parallax, not a joystick.
      targetX = relX * 14;
      targetY = relY * 14;
    }

    function tick() {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;
      if (core) {
        core.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    }

    // Touch devices get no pointer parallax (there's no hover position to
    // track) - the ambient CSS animations still run for them.
    container.addEventListener('pointermove', onPointerMove);
    raf = requestAnimationFrame(tick);

    return () => {
      container.removeEventListener('pointermove', onPointerMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative mx-auto mb-6 h-[260px] w-full max-w-[520px] sm:h-[340px] anim-slide-up">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Ambient rotating HUD rings - pure CSS, paused entirely under
            prefers-reduced-motion via globals.css. */}
        <div className="hud-ring hud-ring-outer" />
        <div className="hud-ring hud-ring-inner" />
      </div>

      <div ref={coreRef} className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
        {/* The real, already-approved brand mark (this exact file already
            ships as the site's favicon-512x512.png) - reused directly
            rather than hand-traced as new SVG geometry, so the hero
            centerpiece is pixel-true to the reference instead of an
            approximation. The ambient glow/rotation/parallax around it are
            still real CSS/JS on this page, not baked into the image. */}
        <img
          src="/favicon-512x512.png"
          alt=""
          className="h-[75%] w-[75%] object-contain xfree-x-mark xfree-x-mark-glow"
          width={512}
          height={512}
          decoding="async"
          fetchPriority="high"
        />
      </div>

      {ORBIT_LABELS.map(({ labelKey, href, position }) => (
        <Link
          key={labelKey}
          href={href}
          className={`absolute ${position} hidden -translate-y-1/2 text-[10px] font-mono uppercase tracking-[0.2em] text-cyber-muted transition-colors hover:text-cyber-glow focus-ring md:block`}
        >
          {t(labelKey)}
        </Link>
      ))}
    </div>
  );
}
