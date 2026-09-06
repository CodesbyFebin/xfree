'use client';

import { useState, useEffect } from 'react';

interface A11yIssue {
  type: 'error' | 'warning' | 'info';
  element: string;
  message: string;
  suggestion: string;
}

export function AccessibilityAudit() {
  const [issues, setIssues] = useState<A11yIssue[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isAuditing, setIsAuditing] = useState(false);

  const runAudit = async () => {
    setIsAuditing(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    const foundIssues: A11yIssue[] = [];

    const body = document.body;
    if (!body) {
      setIssues([{
        type: 'error',
        element: 'body',
        message: 'Page body not found',
        suggestion: 'Ensure page content is properly rendered',
      }]);
      setIsAuditing(false);
      return;
    }

    const mainContent = document.getElementById('main-content');
    if (!mainContent) {
      foundIssues.push({
        type: 'warning',
        element: '#main-content',
        message: 'Skip to main content link missing',
        suggestion: 'Add a skip link for keyboard users',
      });
    }

    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
      foundIssues.push({
        type: 'error',
        element: 'headings',
        message: 'No heading elements found',
        suggestion: 'Use proper heading hierarchy (h1-h6) for content structure',
      });
    }

    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    if (imagesWithoutAlt.length > 0) {
      foundIssues.push({
        type: 'error',
        element: 'img',
        message: `${imagesWithoutAlt.length} image(s) missing alt text`,
        suggestion: 'Add descriptive alt attributes to all images',
      });
    }

    const linksWithoutText = document.querySelectorAll('a:not(:has(img))');
    const emptyLinks = Array.from(linksWithoutText).filter(link => !link.textContent?.trim());
    if (emptyLinks.length > 0) {
      foundIssues.push({
        type: 'error',
        element: 'a',
        message: `${emptyLinks.length} link(s) have no text content`,
        suggestion: 'Ensure all links have descriptive text or aria-label',
      });
    }

    const buttonsWithoutText = document.querySelectorAll('button:not(:has(span))');
    const emptyButtons = Array.from(buttonsWithoutText).filter(btn => !btn.textContent?.trim() && !btn.getAttribute('aria-label'));
    if (emptyButtons.length > 0) {
      foundIssues.push({
        type: 'warning',
        element: 'button',
        message: `${emptyButtons.length} button(s) have no text or aria-label`,
        suggestion: 'Add text content or aria-label to buttons',
      });
    }

    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (!input.id) {
        foundIssues.push({
          type: 'warning',
          element: input.tagName.toLowerCase(),
          message: 'Form element missing id attribute',
          suggestion: 'Add id attribute for label association',
        });
      }
    });

    setIssues(foundIssues);
    setIsAuditing(false);
  };

  useEffect(() => {
    if (isOpen) {
      runAudit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 px-3 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-xs font-mono text-cyber-muted hover:text-white transition-colors z-40 flex items-center gap-2"
      >
        ♿ <span>Accessibility</span>
        {errorCount > 0 && (
          <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">{errorCount}</span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-96 max-h-96 overflow-y-auto p-4 rounded-lg bg-cyber-surface border border-cyber-border shadow-xl z-40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white font-mono flex items-center gap-2">
          ♿ Accessibility Audit
          {isAuditing && <span className="animate-pulse">Running...</span>}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={runAudit}
            className="text-xs font-mono text-cyber-muted hover:text-cyber-glow"
            disabled={isAuditing}
          >
            ↻
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-cyber-muted hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="flex gap-4 mb-4 text-xs font-mono">
        <span className="text-red-400">{errorCount} errors</span>
        <span className="text-yellow-400">{warningCount} warnings</span>
      </div>

      {issues.length === 0 && !isAuditing ? (
        <p className="text-sm text-green-400 font-mono">✓ No issues found</p>
      ) : (
        <div className="space-y-2">
          {issues.map((issue, i) => (
            <div
              key={i}
              className={`p-2 rounded text-xs font-mono ${
                issue.type === 'error'
                  ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                  : issue.type === 'warning'
                  ? 'bg-yellow-500/10 border border-yellow-500/20 text-yellow-400'
                  : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
              }`}
            >
              <div className="font-semibold">{issue.message}</div>
              <div className="text-cyber-dim mt-1">{issue.suggestion}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
