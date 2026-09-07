"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { PillarDefinition } from "@/lib/data/pillars";
import { Locale } from "@/lib/i18n";

interface InteractiveHeroProps {
  pillars: PillarDefinition[];
  locale: Locale;
  dict: {
    hero: {
      title: string;
      subtitle: string;
      cta: string;
      stats: {
        tools: string;
        pillars: string;
        languages: string;
        privacy: string;
      };
    };
    pillars: {
      title: string;
      viewAll: string;
    };
  };
}

export function InteractiveHero({ pillars, locale, dict }: InteractiveHeroProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredPillars = searchQuery
    ? pillars.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.keywords?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : pillars.slice(0, 12);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "/" && !isFocused && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === "Escape") {
        inputRef.current?.blur();
        setSearchQuery("");
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredPillars.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && filteredPillars[selectedIndex]) {
        window.location.href = `/${locale}/pillars/${filteredPillars[selectedIndex].slug}`;
      }
    },
    [filteredPillars, selectedIndex, isFocused, locale]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  useEffect(() => {
    if (listRef.current && filteredPillars[selectedIndex]) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      selectedEl?.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex, filteredPillars]);

  return (
    <section className="text-center py-12 sm:py-16">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyber-glow/30 bg-cyber-glow/5 text-cyber-glow text-xs font-mono mb-6">
        <span className="w-2 h-2 rounded-full bg-cyber-glow animate-pulse" />
        v1.0 — 55 Pillars • 58 Tools
      </div>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white font-mono mb-6 leading-tight">
        <span className="text-cyber-glow">$</span> XFree
        <span className="block text-2xl sm:text-3xl md:text-4xl font-bold text-cyber-muted mt-2">
          {dict.hero.title}
        </span>
      </h1>
      <p className="text-cyber-muted max-w-2xl mx-auto text-base sm:text-lg mb-8">
        {dict.hero.subtitle}
      </p>

      <div className="max-w-3xl mx-auto mb-10">
        <div className="relative">
          <div className="absolute inset-0 bg-cyber-glow/20 blur-xl rounded-full opacity-30" />
          <div className="relative cyber-card p-2">
            <div className="flex items-center gap-3 px-4">
              <span className="text-cyber-glow font-mono text-sm">›</span>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search pillars... (Press / to focus)"
                className="flex-1 bg-transparent text-white placeholder-cyber-dim font-mono text-sm outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-cyber-dim hover:text-cyber-glow transition-colors text-sm"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 mt-2 text-cyber-dim text-xs font-mono">
            <span className="hidden sm:inline">↑↓ navigate • Enter select • Esc clear</span>
          </div>
        </div>
      </div>

      {searchQuery && (
        <div className="text-cyber-dim text-sm font-mono mb-4">
          Found {filteredPillars.length} pillars matching &ldquo;{searchQuery}&rdquo;
        </div>
      )}

      <div
        ref={listRef}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto mb-8"
      >
        {filteredPillars.map((pillar, index) => (
          <Link
            key={pillar.slug}
            href={`/${locale}/pillars/${pillar.slug}`}
            data-index={index}
            className={`
              cyber-card p-4 group text-left transition-all duration-150 cursor-pointer
              ${index === selectedIndex ? "ring-1 ring-cyber-glow bg-cyber-glow/10" : ""}
              hover:bg-cyber-glow/5
            `}
          >
            <div className="flex items-start gap-3">
              <span className="text-2xl shrink-0">{pillar.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-cyber-glow">#{pillar.num}</span>
                  <span className="text-[10px] text-cyber-dim font-mono">hub</span>
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-cyber-glow transition-colors font-mono truncate">
                  XFree {pillar.name}
                </h3>
                <p className="text-xs text-cyber-muted mt-1 line-clamp-2">
                  {pillar.description}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-cyber-dim font-mono">
                    {pillar.toolCount} tools
                  </span>
                  <span className="text-cyber-glow text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                    → Explore
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href={`/${locale}/pillars`}
          className="cyber-btn cyber-btn-filled px-6 py-3 rounded text-sm font-mono"
        >
          {dict.hero.cta}
        </Link>
        <Link
          href={`/${locale}/tools`}
          className="cyber-btn cyber-btn-outline px-6 py-3 rounded text-sm font-mono"
        >
          Browse All Tools
        </Link>
      </div>

      {!searchQuery && (
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          {pillars.slice(0, 6).map((pillar) => (
            <Link
              key={pillar.slug}
              href={`/${locale}/pillars/${pillar.slug}`}
              className="text-xs font-mono text-cyber-dim hover:text-cyber-glow transition-colors px-2 py-1 rounded border border-transparent hover:border-cyber-glow/30"
            >
              {pillar.icon} {pillar.name.split(" ")[0]}
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
