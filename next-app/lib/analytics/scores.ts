import { ToolDefinition } from '@/types';
import { ToolScore, PrivacyMetric } from './types';

export function calculatePrivacyScore(executionMode: 'local' | 'ai' | 'workflow'): PrivacyMetric {
  const scores: Record<string, PrivacyMetric> = {
    local: {
      executionMode: 'local',
      dataTransmission: 'none',
      storageUsed: 'none',
      thirdPartySharing: false,
      privacyScore: 100,
    },
    ai: {
      executionMode: 'ai',
      dataTransmission: 'minimal',
      storageUsed: 'session',
      thirdPartySharing: false,
      privacyScore: 75,
    },
    workflow: {
      executionMode: 'workflow',
      dataTransmission: 'minimal',
      storageUsed: 'session',
      thirdPartySharing: false,
      privacyScore: 70,
    },
  };

  return scores[executionMode] || scores.local;
}

export function calculateXFreeScore(tool: ToolDefinition, stats: Partial<ToolScore> = {}): ToolScore {
  const privacyScore = calculatePrivacyScore(tool.execution || 'local').privacyScore;

  const reliabilityScore = tool.engineVerified ? 95 : 85;

  const usabilityScore = tool.howToUse.length >= 3 ? 90 : tool.howToUse.length >= 2 ? 80 : 70;

  const baseScore = (privacyScore * 0.4) + (reliabilityScore * 0.3) + (usabilityScore * 0.3);

  const usageBonus = Math.min((stats.totalUses || 0) / 1000, 5);
  const successBonus = ((stats.successRate || 1) - 0.9) * 100;

  const finalScore = Math.min(100, Math.max(0, baseScore + usageBonus + successBonus));

  return {
    toolId: tool.id,
    xfreeScore: Math.round(finalScore),
    privacyScore,
    usabilityScore,
    reliabilityScore,
    totalUses: stats.totalUses || 0,
    successRate: stats.successRate || 1,
    avgExecutionTime: stats.avgExecutionTime || 0,
    lastUpdated: new Date().toISOString(),
  };
}

export function getScoreGrade(score: number): { grade: string; color: string } {
  if (score >= 95) return { grade: 'A+', color: 'text-green-400' };
  if (score >= 90) return { grade: 'A', color: 'text-green-400' };
  if (score >= 85) return { grade: 'B+', color: 'text-cyan-400' };
  if (score >= 80) return { grade: 'B', color: 'text-cyan-400' };
  if (score >= 75) return { grade: 'C+', color: 'text-yellow-400' };
  if (score >= 70) return { grade: 'C', color: 'text-yellow-400' };
  if (score >= 60) return { grade: 'D', color: 'text-orange-400' };
  return { grade: 'F', color: 'text-red-400' };
}

export function getVerificationBadge(engineVerified?: boolean): { label: string; icon: string; color: string } {
  if (engineVerified) {
    return {
      label: 'Engine Verified',
      icon: '✓',
      color: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
  }
  return {
    label: 'Community Verified',
    icon: '○',
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };
}
