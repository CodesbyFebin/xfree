'use client';

import { ToolDefinition } from '@/types';
import { calculateXFreeScore, getScoreGrade, getVerificationBadge } from '@/lib/analytics/scores';

interface TrustBadgeProps {
  tool: ToolDefinition;
  showScores?: boolean;
}

export function TrustBadge({ tool, showScores = true }: TrustBadgeProps) {
  const score = calculateXFreeScore(tool);
  const grade = getScoreGrade(score.xfreeScore);
  const verification = getVerificationBadge(tool.engineVerified);
  const privacyScore = score.privacyScore;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${verification.color}`}>
        {verification.icon} {verification.label}
      </span>

      {showScores && (
        <>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border border-cyber-border bg-cyber-surface`}>
            <span className="text-cyber-muted mr-1">X</span>
            <span className={grade.color}>{grade.grade}</span>
          </span>

          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${
            privacyScore === 100
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : privacyScore >= 75
              ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
              : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
          }`}>
            🔒 {privacyScore}% Private
          </span>
        </>
      )}
    </div>
  );
}

export function PrivacyScore({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-24 h-2 rounded-full bg-cyber-surface border border-cyber-border overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            score === 100
              ? 'bg-green-500'
              : score >= 75
              ? 'bg-yellow-500'
              : 'bg-orange-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-mono text-cyber-muted">{score}%</span>
    </div>
  );
}

export function XFreeScoreBadge({ score }: { score: number }) {
  const grade = getScoreGrade(score);

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-sm font-mono border border-cyber-border bg-cyber-surface ${grade.color}`}>
      XFree Score: <span className="font-bold ml-1">{score}</span>
    </span>
  );
}
