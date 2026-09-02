import React from "react";

interface Props {
  href: string;
  onNavigate: (path: string) => void;
  className?: string;
  children: React.ReactNode;
  title?: string;
  "aria-label"?: string;
}

/**
 * Renders a real <a href> so search-engine crawlers see the link graph, while
 * still doing SPA navigation on plain left-clicks. Middle-click, cmd/ctrl-click,
 * shift-click all fall through to native behaviour (open in new tab, etc).
 */
export const RouterLink: React.FC<Props> = ({ href, onNavigate, className, children, title, "aria-label": ariaLabel }) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(href);
  };
  return (
    <a href={href} onClick={handleClick} className={className} title={title} aria-label={ariaLabel}>
      {children}
    </a>
  );
};
