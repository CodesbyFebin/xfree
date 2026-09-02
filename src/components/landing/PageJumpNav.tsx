import React from "react";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How It Works" },
  { href: "#architecture", label: "Architecture" },
  { href: "#use-cases", label: "Use Cases" },
  { href: "#faq", label: "FAQ" },
];

export const PageJumpNav: React.FC = () => {
  return (
    <nav className="flex flex-wrap items-center gap-2" aria-label="Page sections">
      {LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className="glass-pill px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
        >
          {link.label}
        </a>
      ))}
    </nav>
  );
};
