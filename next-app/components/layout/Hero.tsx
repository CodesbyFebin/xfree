import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface HeroCategory {
  id: string;
  name: string;
  icon: string;
  count: number;
}

interface HeroStats {
  tools: number;
  pillars: number;
  signupRate: number;
}

interface InteractiveXProps {
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerLeave?: () => void;
  reducedMotion: boolean;
}

function InteractiveX({ onPointerMove, onPointerLeave, reducedMotion }: InteractiveXProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const xRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!xRef.current) return;
      
      const rect = xRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = (e.clientX - centerX) / 20;
      const deltaY = (e.clientY - centerY) / 20;
      
      setPosition({ x: deltaX, y: deltaY });
    };

    const handleScroll = () => {
      if (!reducedMotion) {
        const scrollY = window.scrollY;
        setPosition(prev => ({ 
          x: prev.x, 
          y: prev.y + (scrollY * 0.01)
        }));
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={xRef}
      className="relative w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 flex items-center justify-center"
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => {
        setIsHovered(false);
        onPointerLeave?.();
      }}
      onPointerMove={onPointerMove}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0) rotate(${isHovered ? 360 : 0}deg)`,
        transition: reducedMotion ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      <div className="relative w-full h-full">
        {/* Glow effect */}
        <div 
          className="absolute inset-0 rounded-full bg-cyber-glow/40 blur-2xl"
          style={{
            animation: reducedMotion ? 'none' : 'pulse 4s ease-in-out infinite'
          }}
        />
        
        {/* Core X */}
        <div className="relative w-full h-full flex items-center justify-center">
          <svg viewBox="0 0 200 200" className="w-full h-full" role="img" aria-label="XFree">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* X shape */}
            <path
              d="M80 40 L120 40 L160 80 L160 120 L120 160 L80 160 L40 120 L40 80 Z"
              fill="none"
              stroke="url(#cyberGradient)"
              strokeWidth="8"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
            
            <defs>
              <linearGradient id="cyberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="rgb(6, 182, 212)" /> {/* cyan-500 */}
                <stop offset="100%" stopColor="rgb(168, 85, 247)" /> {/* purple-500 */}
              </linearGradient>
            </defs>
          </svg>
        </div>
        
        {/* Circuit particles */}
        {!reducedMotion && (
          <div className="absolute inset-0 pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-cyber-cyan rounded-full"
                style={{
                  left: `${40 + Math.sin(i * 30 * Math.PI / 180) * 60}%",
                  top: `${40 + Math.cos(i * 30 * Math.PI / 180) * 60}%",
                  animation: `float ${3 + i * 0.5}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function HeroCategoryShortcuts() {
  const t = useTranslations('Hero');
  const categories: HeroCategory[] = [
    {
      id: 'developer-tools',
      name: t('categories.developer'),
      icon: '⚡',
      count: 66
    },
    {
      id: 'ai-tools', 
      name: t('categories.ai'),
      icon: '🧠',
      count: 0
    },
    {
      id: 'data-tools',
      name: t('categories.data'),
      icon: '📊',
      count: 0
    },
    {
      id: 'web-tools',
      name: t('categories.web'),
      icon: '🌐',
      count: 0
    },
    {
      id: 'seo-tools',
      name: t('categories.seo'),
      icon: '🔍',
      count: 0
    },
    {
      id: 'security-tools',
      name: t('categories.security'),
      icon: '🔒',
      count: 0
    }
  ];

  return (
    <nav className="flex flex-wrap justify-center gap-3" aria-label="Tool categories">
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/categories/${category.id}`}
          className="group relative px-4 py-2 rounded-lg bg-cyber-surface border border-cyber-border hover:border-cyber-glow/50 transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-cyber-glow focus:ring-offset-2 focus:ring-offset-cyber-bg"
        >
          <span className="text-2xl mr-2" aria-hidden="true">{category.icon}</span>
          <span className="font-mono text-sm text-cyber-text group-hover:text-cyber-glow transition-colors">
            {category.name}
          </span>
          <span className="text-xs text-cyber-muted ml-1">({category.count}+)</span>
        </Link>
      ))}
    </nav>
  );
}

export function Hero() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [stats, setStats] = useState<HeroStats>({ tools: 400, pillars: 12, signupRate: 0 });
  const t = useTranslations('Hero');

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    // Fetch actual stats from the tool registry
    const fetchStats = async () => {
      try {
        // This would normally fetch from the actual API, but for now use placeholder
        // The actual implementation should fetch from the tool registry
      } catch (error) {
        console.error('Failed to fetch hero stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <section 
      className="relative min-h-[92vh] flex items-center justify-center pt-20 pb-12 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-cyber-bg matrix-grid hex-pattern" />
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyber-bg/50 via-transparent to-cyber-bg/80" />

      {/* Decorative orbs (faint) */}
      <div className="hero-orb w-[600px] h-[600px] bg-cyber-glow/20 -top-60 -left-60" aria-hidden="true" />
      <div className="hero-orb w-[400px] h-[400px] bg-cyber-magenta/20 top-1/4 -right-32" aria-hidden="true" />

      {/* Interactive X */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <InteractiveX reducedMotion={reducedMotion} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-12 px-4" aria-label="Main navigation">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyber-glow rounded flex items-center justify-center">
              <span className="text-cyber-bg font-bold">X</span>
            </div>
            <span className="font-mono text-cyber-text">XFree</span>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/tools" className="text-cyber-muted hover:text-cyber-text transition-colors">Tools</Link>
            <Link href="/resources" className="text-cyber-muted hover:text-cyber-text transition-colors">Resources</Link>
            <Link href="/about" className="text-cyber-muted hover:text-cyber-text transition-colors">About</Link>
            <Link href="/contact" className="text-cyber-muted hover:text-cyber-text transition-colors">Contact</Link>
          </div>
        </nav>

        {/* Brand Promise */}
        <div className="mb-8 anim-slide-up" style={{ animationDelay: '0.1s' }}>
          <p className="font-mono text-cyber-glow text-lg tracking-wider uppercase">
            ROOT ACCESS FOR EVERYONE
          </p>
        </div>

        {/* Main Heading */}
        <div className="mb-6">
          <h1 
            id="hero-heading" 
            className="hero-title text-4xl sm:text-5xl lg:text-7xl font-black text-cyber-text leading-[1.05] tracking-tight mb-4 uppercase glitch anim-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            XFree — Free Tools.<br />
            <span className="text-cyber-glow">Real Freedom.</span>
          </h1>
        </div>

        {/* Subheading */}
        <div className="mb-6 anim-slide-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-xl sm:text-2xl text-cyber-cyan font-mono max-w-3xl mx-auto">
            Meet the XFree App and XFree Studio — the new XFree workspace for developer, AI, data, SEO and web tools.
          </h2>
        </div>

        {/* Description */}
        <div className="mb-10 anim-slide-up" style={{ animationDelay: '0.4s' }}>
          <p className="text-base sm:text-lg text-cyber-muted max-w-2xl mx-auto leading-relaxed">
            Discover free developer tools, AI utilities, data tools, SEO tools, converters and web utilities through XFree. 
            Use XFree Studio to search, create, convert, analyze and build from one privacy-first workspace.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-8 anim-slide-up" style={{ animationDelay: '0.5s' }}>
          <form action="/search" method="get" role="search">
            <div className="cmd-bar relative flex items-center bg-cyber-card rounded-lg p-1.5 border border-cyber-border transition-all duration-300 corner-brackets">
              <div className="pl-4 pr-2 text-cyber-glow">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <label htmlFor="heroSearch" className="sr-only">{t('searchPlaceholder')}</label>
              <input 
                type="text" 
                id="heroSearch" 
                name="q" 
                placeholder="Search XFree tools — JSON, Regex, Sitemap, JWT, Image, SEO..." 
                className="flex-1 px-3 py-3.5 text-base bg-transparent placeholder-cyber-muted focus:outline-none font-mono"
              />
              <kbd aria-hidden="true">⌘K</kbd>
              <button 
                type="submit" 
                className="cyber-btn cyber-btn-filled text-xs px-4 py-2 rounded"
              >
                <span>EXPLORE NOW →</span>
              </button>
            </div>
          </form>
          
          {/* Popular Searches */}
          <nav className="flex items-center justify-center gap-2 mt-4 flex-wrap" aria-label="Popular searches">
            <span className="text-[11px] text-cyber-muted font-mono">{t('popular')}</span>
            <Link href="/tools/json-formatter" className="text-[11px] text-cyber-glow hover:text-cyber-text font-mono">XFree JSON Formatter</Link>
            <span className="text-cyber-dim">·</span>
            <Link href="/tools/regex-tester" className="text-[11px] text-cyber-glow hover:text-cyber-text font-mono">XFree Regex Tester</Link>
            <span className="text-cyber-dim">·</span>
            <Link href="/tools/xml-sitemap-generator" className="text-[11px] text-cyber-glow hover:text-cyber-text font-mono">XFree Sitemap Generator</Link>
            <span className="text-cyber-dim">·</span>
            <Link href="/tools/meta-tag-generator" className="text-[11px] text-cyber-glow hover:text-cyber-text font-mono">XFree Meta Tags</Link>
            <span className="text-cyber-dim">·</span>
            <Link href="/tools/jwt-decoder" className="text-[11px] text-cyber-glow hover:text-cyber-text font-mono">XFree JWT Decoder</Link>
          </nav>
          
          <small className="block mt-2 text-[10px] text-cyber-dim font-mono">
            Pro-tip: Press <kbd>Ctrl+Enter</kbd> to process, <kbd>Ctrl+Shift+C</kbd> to copy.
          </small>
        </div>

        {/* Category Shortcuts */}
        <div className="mb-8 anim-slide-up" style={{ animationDelay: '0.6s' }}>
          <HeroCategoryShortcuts />
        </div>

        {/* Trust Signals */}
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm anim-slide-up" style={{ animationDelay: '0.7s' }}>
          <div className="flex items-center gap-2">
            <span className="text-cyber-glow" aria-hidden="true">⚡</span>
            <span className="text-cyber-muted font-mono">100% Free</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyber-glow" aria-hidden="true">🔒</span>
            <span className="text-cyber-muted font-mono">Privacy First</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyber-glow" aria-hidden="true">🌐</span>
            <span className="text-cyber-muted font-mono">Browser Based</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-cyber-glow" aria-hidden="true">💻</span>
            <span className="text-cyber-muted font-mono">Open Source</span>
          </div>
        </div>

        {/* Brand Line */}
        <div className="mt-12 anim-slide-up" style={{ animationDelay: '0.8s' }}>
          <p className="text-cyber-dim font-mono text-sm uppercase tracking-wider">
            SIMPLE TOOLS. REAL FREEDOM.
          </p>
        </div>

        {/* Primary CTA */}
        <div className="mt-10 anim-slide-up" style={{ animationDelay: '0.9s' }}>
          <Link
            href="https://app.xfree.in/"
            className="cyber-btn cyber-btn-filled text-lg px-8 py-4 rounded inline-flex items-center gap-3 hover:scale-105 transition-transform"
            rel="noopener"
          >
            <span>LAUNCH XFREE STUDIO →</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}