'use client';

import { AnalyticsEvent, ToolUsageEvent, IntentMetric } from './types';

const isProduction = process.env.NODE_ENV === 'production';

export function trackEvent(event: AnalyticsEvent): void {
  if (!isProduction) {
    console.debug('[Analytics]', event.type, event.data);
    return;
  }

  try {
    const stored = localStorage.getItem('xfree_analytics');
    const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];

    events.push(event);

    const maxEvents = 100;
    const trimmed = events.slice(-maxEvents);

    localStorage.setItem('xfree_analytics', JSON.stringify(trimmed));
  } catch {
  }
}

export function trackToolUse(toolId: string, toolSlug: string, executionMode: 'local' | 'ai' | 'workflow', success: boolean, executionTimeMs?: number): void {
  trackEvent({
    type: 'tool_use',
    data: {
      toolId,
      toolSlug,
      timestamp: new Date().toISOString(),
      executionMode,
      success,
      executionTimeMs,
    } as ToolUsageEvent,
  });
}

export function trackIntentResolution(query: string, matchedTools: string[], confidence: number, resolved: boolean): void {
  trackEvent({
    type: 'intent_resolution',
    data: {
      intent: query,
      query,
      matchedTools,
      confidence,
      resolved,
    } as IntentMetric,
  });
}

export function getStoredAnalytics(): AnalyticsEvent[] {
  try {
    const stored = localStorage.getItem('xfree_analytics');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function clearAnalytics(): void {
  try {
    localStorage.removeItem('xfree_analytics');
  } catch {
  }
}

export function getToolUsageStats(toolId?: string): {
  totalUses: number;
  successRate: number;
  avgExecutionTime: number;
  recentUses: ToolUsageEvent[];
} {
  const events = getStoredAnalytics();
  const toolUses = events
    .filter((e): e is { type: 'tool_use'; data: ToolUsageEvent } => e.type === 'tool_use')
    .filter(e => !toolId || e.data.toolId === toolId);

  if (toolUses.length === 0) {
    return { totalUses: 0, successRate: 0, avgExecutionTime: 0, recentUses: [] };
  }

  const successful = toolUses.filter(e => e.data.success).length;
  const times = toolUses.map(e => e.data.executionTimeMs).filter((t): t is number => t !== undefined);

  return {
    totalUses: toolUses.length,
    successRate: successful / toolUses.length,
    avgExecutionTime: times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0,
    recentUses: toolUses.slice(-10).map(e => e.data),
  };
}
