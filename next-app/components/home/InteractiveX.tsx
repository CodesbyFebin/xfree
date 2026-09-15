'use client';

import { useEffect, useRef } from 'react';
import { Link } from '@/i18n/navigation';

// Real routes only (verified against lib/data/toolsWithSEO.ts's CATEGORIES) -
// "Data" and "Web" aren't real category ids, so the two closest genuine
// categories stand in for them rather than linking to a route that 404s.
const ORBIT_LABELS = [
  { label: 'DEVELOPER', href: '/categories/developer-tools', position: 'left-0 top-[18%]' },
  { label: 'AI', href: '/categories/ai-tools', position: 'left-0 top-1/2' },
  { label: 'DATA', href: '/categories/converters', position: 'left-0 bottom-[18%]' },
  { label: 'WEB', href: '/categories/seo-url-tools', position: 'right-0 top-[18%]' },
  { label: 'PRODUCTIVITY', href: '/categories/generators', position: 'right-0 top-1/2' },
  { label: 'SECURITY', href: '/categories/security-tools', position: 'right-0 bottom-[18%]' },
] as const;

/**
 * The hero's animated "X" mark. Pointer parallax and the HUD rotation are
 * driven by direct style writes on refs (not React state) so neither
 * causes a re-render on every mousemove/frame - see the performance
 * requirement to avoid expensive continuous re-renders. Everything here is
 * `aria-hidden` except the six orbit labels, which are real links.
 */
export function InteractiveX() {
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
        {/* Four faceted blades (kite quadrilaterals, hand-mirrored across
            both axes so they meet cleanly at the center hub) - one
            metallic arm and three green arms, matching the approved
            reference's asymmetric coloring rather than a plain 2-tone
            pinwheel. Circuit-line and particle details on two of the
            green arms echo the reference's "half machine, half signal"
            read without tracing the source image directly. */}
        <svg viewBox="0 0 200 200" className="h-[70%] w-[70%] xfree-x-mark" role="presentation">
          <defs>
            <linearGradient id="xMetal" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e4e7eb" />
              <stop offset="55%" stopColor="#9aa3ad" />
              <stop offset="100%" stopColor="#5b636c" />
            </linearGradient>
            <linearGradient id="xGreen" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(var(--cyber-text))" />
              <stop offset="100%" stopColor="rgb(var(--cyber-glow))" />
            </linearGradient>
          </defs>

          {/* Upper-left: metallic */}
          <path d="M12,12 L50,10 L88,88 L10,50 Z" fill="url(#xMetal)" stroke="#3a3f45" strokeWidth="1" strokeLinejoin="round" />
          {/* Upper-right: green */}
          <path d="M188,12 L150,10 L112,88 L190,50 Z" fill="url(#xGreen)" className="xfree-x-mark-glow" strokeLinejoin="round" />
          {/* Lower-left: green, circuit-line texture */}
          <path d="M12,188 L50,190 L88,112 L10,150 Z" fill="rgb(var(--cyber-glow))" opacity="0.88" strokeLinejoin="round" />
          <g stroke="rgb(var(--cyber-bg))" strokeWidth="1.2" opacity="0.5" strokeLinecap="round">
            <path d="M22,168 L48,140" fill="none" />
            <path d="M30,178 L62,144" fill="none" />
            <circle cx="48" cy="140" r="1.6" fill="rgb(var(--cyber-bg))" stroke="none" />
          </g>
          {/* Lower-right: green, dissolving into particles at the tip */}
          <path d="M188,188 L150,190 L112,112 L190,150 Z" fill="rgb(var(--cyber-glow))" strokeLinejoin="round" />
          <g fill="rgb(var(--cyber-glow))" className="xfree-x-mark-glow">
            <circle cx="176" cy="176" r="2.2" opacity="0.8" />
            <circle cx="184" cy="164" r="1.6" opacity="0.6" />
            <circle cx="166" cy="184" r="1.4" opacity="0.6" />
            <circle cx="188" cy="180" r="1" opacity="0.4" />
            <circle cx="180" cy="190" r="1" opacity="0.4" />
          </g>

          <circle cx="100" cy="100" r="19" fill="rgb(var(--cyber-bg))" stroke="rgb(var(--cyber-glow))" strokeWidth="2" />
          <circle cx="100" cy="100" r="3.5" fill="rgb(var(--cyber-glow))" className="xfree-x-core-pulse" />
        </svg>
      </div>

      {ORBIT_LABELS.map(({ label, href, position }) => (
        <Link
          key={label}
          href={href}
          className={`absolute ${position} hidden -translate-y-1/2 text-[10px] font-mono uppercase tracking-[0.2em] text-cyber-muted transition-colors hover:text-cyber-glow focus-ring md:block`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
}
