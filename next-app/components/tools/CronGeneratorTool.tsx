'use client';

import { useState, useCallback, useEffect } from 'react';

interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

export function CronGeneratorTool() {
  const [expression, setExpression] = useState('0 9 * * 1-5');
  const [cronParts, setCronParts] = useState<CronParts>({
    minute: '0',
    hour: '9',
    dayOfMonth: '*',
    month: '*',
    dayOfWeek: '1-5',
  });
  const [nextRuns, setNextRuns] = useState<string[]>([]);
  const [humanReadable, setHumanReadable] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const describeCron = (parts: CronParts): string => {
    const { minute, hour, dayOfMonth, month, dayOfWeek } = parts;

    let desc = 'At ';

    if (minute === '*' && hour === '*') {
      desc += 'every minute';
    } else if (minute === '0' && hour === '*') {
      desc += 'every hour';
    } else if (minute !== '*' && hour === '*') {
      desc += `minute ${minute} of every hour`;
    } else if (minute === '0' && hour !== '*') {
      desc += `${hour === '9' ? '9:00 AM' : hour + ':00'}`;
    } else {
      desc += `${minute} past ${hour}`;
    }

    if (dayOfWeek !== '*') {
      const days = dayOfWeek.split(',').map((d) => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return dayNames[parseInt(d)] || d;
      });
      desc += ` on ${days.join(', ')}`;
    }

    if (dayOfMonth !== '*') {
      desc += ` on day ${dayOfMonth}`;
    }

    if (month !== '*') {
      desc += ` in month ${month}`;
    }

    return desc;
  };

  const calculateNextRuns = (expr: string): string[] => {
    // Simplified calculation - just show the pattern
    const runs: string[] = [];
    const now = new Date();

    for (let i = 0; i < 5; i++) {
      const next = new Date(now);
      next.setDate(next.getDate() + i + 1);
      next.setHours(9, 0, 0, 0);
      runs.push(next.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }));
    }

    return runs;
  };

  useEffect(() => {
    const fullExpression = `${cronParts.minute} ${cronParts.hour} ${cronParts.dayOfMonth} ${cronParts.month} ${cronParts.dayOfWeek}`;
    setExpression(fullExpression);
    setHumanReadable(describeCron(cronParts));
    setNextRuns(calculateNextRuns(fullExpression));
    setError(null);
  }, [cronParts]);

  const parseExpression = useCallback(() => {
    const parts = expression.split(' ');
    if (parts.length !== 5) {
      setError('Invalid cron expression (need 5 parts)');
      return;
    }
    setCronParts({
      minute: parts[0],
      hour: parts[1],
      dayOfMonth: parts[2],
      month: parts[3],
      dayOfWeek: parts[4],
    });
  }, [expression]);

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2 block">
          Cron Expression
        </label>
        <input
          type="text"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          onBlur={parseExpression}
          className="w-full bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm text-cyber-glow focus:border-cyber-glow focus:outline-none transition-colors"
          placeholder="* * * * *"
        />
        <p className="text-[10px] text-cyber-dim mt-1 font-mono">
          minute hour day-of-month month day-of-week
        </p>
      </div>

      <div className="cyber-card p-4">
        <h3 className="text-xs uppercase tracking-wider text-cyber-cyan font-mono font-semibold mb-3">
          Visual Builder
        </h3>
        <div className="grid grid-cols-5 gap-2">
          {(['minute', 'hour', 'dayOfMonth', 'month', 'dayOfWeek'] as const).map((field) => (
            <div key={field}>
              <label className="text-[10px] text-cyber-muted font-mono mb-1 block capitalize">
                {field === 'dayOfMonth' ? 'DOM' : field === 'dayOfWeek' ? 'DOW' : field}
              </label>
              <input
                type="text"
                value={cronParts[field]}
                onChange={(e) =>
                  setCronParts((prev) => ({ ...prev, [field]: e.target.value }))
                }
                className="w-full bg-cyber-bg border border-cyber-border rounded p-2 font-mono text-xs text-cyber-glow focus:border-cyber-glow focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="cyber-card p-4 border-cyber-cyan/30">
        <h3 className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-2">
          Schedule Description
        </h3>
        <p className="text-white font-mono">{humanReadable}</p>
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-cyber-glow font-mono font-semibold mb-3">
          Next 5 Run Times
        </h3>
        <div className="space-y-1">
          {nextRuns.map((run, i) => (
            <div key={i} className="flex items-center gap-2 text-sm font-mono">
              <span className="text-cyber-dim text-xs">#{i + 1}</span>
              <span className="text-cyber-muted">{run}</span>
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-cyber-red/10 border border-cyber-red/30 rounded-lg p-3">
          <p className="text-cyber-red text-xs font-mono">{error}</p>
        </div>
      )}
    </div>
  );
}
