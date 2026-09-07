'use client';

import { useEffect } from 'react';

interface WebVitalsMetrics {
  LCP?: number;
  FID?: number;
  CLS?: number;
  TTFB?: number;
  FCP?: number;
}

export function CoreWebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const metrics: WebVitalsMetrics = {};

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          metrics.LCP = entry.startTime;
        } else if (entry.entryType === 'first-input') {
          metrics.FID = (entry as PerformanceEntry & { processingStart: number }).processingStart - entry.startTime;
        } else if (entry.entryType === 'layout-shift') {
          const layoutEntry = entry as PerformanceEntry & { value: number; hadRecentInput: boolean };
          if (!layoutEntry.hadRecentInput) {
            metrics.CLS = (metrics.CLS || 0) + layoutEntry.value;
          }
        }
      }
    });

    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
    } catch {
    }

    const handleLoad = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        metrics.TTFB = navigation.responseStart;
        metrics.FCP = navigation.domContentLoadedEventEnd;
      }

      if (process.env.NODE_ENV === 'development') {
        console.debug('[WebVitals]', metrics);
      }
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
    }

    return () => {
      observer.disconnect();
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  return null;
}

export function getWebVitalsScore(metrics: WebVitalsMetrics): {
  score: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  details: string;
} {
  let score = 100;
  const issues: string[] = [];

  if (metrics.LCP && metrics.LCP > 2500) {
    score -= 20;
    issues.push(`LCP: ${Math.round(metrics.LCP)}ms`);
  } else if (metrics.LCP && metrics.LCP > 2000) {
    score -= 10;
  }

  if (metrics.FID && metrics.FID > 100) {
    score -= 15;
    issues.push(`FID: ${Math.round(metrics.FID)}ms`);
  }

  if (metrics.CLS && metrics.CLS > 0.1) {
    score -= 25;
    issues.push(`CLS: ${metrics.CLS.toFixed(3)}`);
  } else if (metrics.CLS && metrics.CLS > 0.05) {
    score -= 10;
  }

  const rating = score >= 90 ? 'good' : score >= 50 ? 'needs-improvement' : 'poor';

  return {
    score: Math.max(0, score),
    rating,
    details: issues.length > 0 ? issues.join(', ') : 'All metrics in good range',
  };
}
