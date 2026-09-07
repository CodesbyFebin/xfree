'use client';

import { useState, useEffect } from 'react';
import { getToolUsageStats, clearAnalytics } from '@/lib/analytics/client';
import { PrivacyScore, XFreeScoreBadge } from './TrustBadge';

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<ReturnType<typeof getToolUsageStats>>({
    totalUses: 0,
    successRate: 0,
    avgExecutionTime: 0,
    recentUses: [],
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setStats(getToolUsageStats());
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 px-3 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-xs font-mono text-cyber-muted hover:text-white transition-colors z-40"
      >
        📊 Analytics
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 p-4 rounded-lg bg-cyber-surface border border-cyber-border shadow-xl z-40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-white font-mono">📊 Your XFree Stats</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-cyber-muted hover:text-white text-xs"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded bg-cyber-bg border border-cyber-border">
            <div className="text-lg font-bold text-cyber-glow">{stats.totalUses}</div>
            <div className="text-xs text-cyber-muted font-mono">Total Uses</div>
          </div>
          <div className="p-3 rounded bg-cyber-bg border border-cyber-border">
            <div className="text-lg font-bold text-cyber-glow">
              {stats.successRate > 0 ? `${Math.round(stats.successRate * 100)}%` : '-'}
            </div>
            <div className="text-xs text-cyber-muted font-mono">Success Rate</div>
          </div>
        </div>

        <div className="p-3 rounded bg-cyber-bg border border-cyber-border">
          <div className="text-xs text-cyber-muted font-mono mb-2">Avg Execution Time</div>
          <div className="text-lg font-bold text-cyber-cyan">
            {stats.avgExecutionTime > 0 ? `${Math.round(stats.avgExecutionTime)}ms` : '-'}
          </div>
        </div>

        <div className="p-3 rounded bg-cyber-bg border border-cyber-border">
          <div className="text-xs text-cyber-muted font-mono mb-2">Privacy Score</div>
          <PrivacyScore score={100} />
          <p className="text-[10px] text-cyber-dim mt-2">All processing happens locally in your browser</p>
        </div>

        {stats.recentUses.length > 0 && (
          <div>
            <div className="text-xs text-cyber-muted font-mono mb-2">Recent Activity</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {stats.recentUses.slice(-5).reverse().map((use, i) => (
                <div key={i} className="text-xs font-mono flex items-center justify-between">
                  <span className="text-white truncate flex-1">{use.toolSlug}</span>
                  <span className={`ml-2 ${use.success ? 'text-green-400' : 'text-red-400'}`}>
                    {use.success ? '✓' : '✕'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => {
            clearAnalytics();
            setStats({ totalUses: 0, successRate: 0, avgExecutionTime: 0, recentUses: [] });
          }}
          className="w-full px-3 py-2 rounded text-xs font-mono text-cyber-muted hover:text-red-400 border border-cyber-border hover:border-red-500/30 transition-colors"
        >
          Clear Local Data
        </button>
      </div>
    </div>
  );
}
