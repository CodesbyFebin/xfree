'use client';

import { CoreWebVitals } from '@/components/analytics/CoreWebVitals';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { AccessibilityAudit } from '@/components/analytics/AccessibilityAudit';

export function AnalyticsWidgets() {
  return (
    <>
      <CoreWebVitals />
      <AnalyticsDashboard />
      <AccessibilityAudit />
    </>
  );
}
