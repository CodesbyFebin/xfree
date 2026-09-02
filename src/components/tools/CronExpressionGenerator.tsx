import React, { useState, useMemo } from "react";
import { ToolDefinition } from "../../types";
import { Clock, Copy, Check, Calendar, ArrowRight } from "lucide-react";

interface CronGeneratorProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

export const CronExpressionGenerator: React.FC<CronGeneratorProps> = ({
  tool,
  onSaveHistory,
}) => {
  const [minute, setMinute] = useState("*/15");
  const [hour, setHour] = useState("9-17");
  const [dayOfMonth, setDayOfMonth] = useState("*");
  const [month, setMonth] = useState("*");
  const [dayOfWeek, setDayOfWeek] = useState("1-5");

  const [copied, setCopied] = useState(false);

  const cronString = `${minute} ${hour} ${dayOfMonth} ${month} ${dayOfWeek}`;

  // Plain English schedule translator
  const scheduleExplanation = useMemo(() => {
    let explanation = "";

    // Minutes
    if (minute === "*") explanation += "Every minute";
    else if (minute.startsWith("*/")) explanation += `Every ${minute.slice(2)} minutes`;
    else explanation += `At minute ${minute}`;

    // Hours
    if (hour === "*") explanation += ", every hour";
    else if (hour.includes("-")) explanation += `, between hours ${hour.split("-")[0]}:00 and ${hour.split("-")[1]}:59`;
    else explanation += `, at hour ${hour}:00`;

    // Days of week
    if (dayOfWeek === "1-5") explanation += ", Monday through Friday";
    else if (dayOfWeek === "0,6" || dayOfWeek === "6,0") explanation += ", on weekends (Saturday and Sunday)";
    else if (dayOfWeek === "*") explanation += ", every day of the week";
    else explanation += `, on day-of-week ${dayOfWeek}`;

    return explanation;
  }, [minute, hour, dayOfMonth, month, dayOfWeek]);

  // Calculate real next 5 execution times deterministically
  const upcomingExecutions = useMemo(() => {
    const parseField = (field: string, min: number, max: number): number[] => {
      const results = new Set<number>();
      if (field === "*") {
        for (let i = min; i <= max; i++) results.add(i);
      } else if (field.startsWith("*/")) {
        const step = parseInt(field.slice(2), 10) || 1;
        for (let i = min; i <= max; i += step) results.add(i);
      } else if (field.includes("-")) {
        const [s, e] = field.split("-").map((v) => parseInt(v, 10));
        if (!isNaN(s) && !isNaN(e)) {
          for (let i = Math.max(min, s); i <= Math.min(max, e); i++) results.add(i);
        }
      } else if (field.includes(",")) {
        field.split(",").forEach((v) => {
          const num = parseInt(v.trim(), 10);
          if (!isNaN(num) && num >= min && num <= max) results.add(num);
        });
      } else {
        const num = parseInt(field, 10);
        if (!isNaN(num) && num >= min && num <= max) results.add(num);
      }
      return Array.from(results).sort((a, b) => a - b);
    };

    const validMinutes = parseField(minute, 0, 59);
    const validHours = parseField(hour, 0, 23);
    const validDaysOfMonth = parseField(dayOfMonth, 1, 31);
    const validMonths = parseField(month, 1, 12);
    const validDaysOfWeek = parseField(dayOfWeek, 0, 6);

    const dates: string[] = [];
    let curr = new Date();
    curr.setSeconds(0, 0);
    curr.setMinutes(curr.getMinutes() + 1);

    let safety = 0;
    while (dates.length < 5 && safety < 100000) {
      safety++;
      const m = curr.getMinutes();
      const h = curr.getHours();
      const dom = curr.getDate();
      const mon = curr.getMonth() + 1;
      const dow = curr.getDay();

      if (
        validMinutes.includes(m) &&
        validHours.includes(h) &&
        validDaysOfMonth.includes(dom) &&
        validMonths.includes(mon) &&
        validDaysOfWeek.includes(dow)
      ) {
        dates.push(curr.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "medium" }));
      }
      curr = new Date(curr.getTime() + 60 * 1000);
    }

    return dates.length > 0 ? dates : ["No matching execution found in near future"];
  }, [minute, hour, dayOfMonth, month, dayOfWeek]);

  const handleCopy = () => {
    navigator.clipboard.writeText(cronString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onSaveHistory(cronString, scheduleExplanation);
  };

  return (
    <div className="space-y-6">
      {/* Generated Cron Display Banner */}
      <div className="p-6 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-zinc-400">
          <span className="font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Generated 5-Part Cron Syntax</span>
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied!" : "Copy Cron String"}</span>
          </button>
        </div>

        <div className="text-2xl sm:text-3xl font-mono text-emerald-400 font-bold bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-center tracking-widest">
          {cronString}
        </div>

        <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-zinc-200 font-medium text-center">
          "{scheduleExplanation}"
        </div>
      </div>

      {/* Visual Field Selectors */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Configure Schedule Parts</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Minute */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Minute (0-59)</label>
            <select
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="*">* (Every minute)</option>
              <option value="*/5">*/5 (Every 5 mins)</option>
              <option value="*/15">*/15 (Every 15 mins)</option>
              <option value="*/30">*/30 (Every 30 mins)</option>
              <option value="0">0 (At minute 0)</option>
            </select>
          </div>

          {/* Hour */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Hour (0-23)</label>
            <select
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="*">* (Every hour)</option>
              <option value="9-17">9-17 (Business hours 9am-5pm)</option>
              <option value="0">0 (Midnight)</option>
              <option value="12">12 (Noon)</option>
            </select>
          </div>

          {/* Day of Month */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Day of Month (1-31)</label>
            <select
              value={dayOfMonth}
              onChange={(e) => setDayOfMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="*">* (Every day of month)</option>
              <option value="1">1 (1st day of month)</option>
              <option value="15">15 (15th day of month)</option>
              <option value="L">L (Last day of month)</option>
            </select>
          </div>

          {/* Month */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Month (1-12)</label>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="*">* (Every month)</option>
              <option value="1">1 (Jan)</option>
              <option value="6">6 (Jun)</option>
              <option value="12">12 (Dec)</option>
            </select>
          </div>

          {/* Day of Week */}
          <div>
            <label className="text-[11px] font-semibold text-zinc-300 mb-1 block">Day of Week (0-6)</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs font-mono focus:outline-none focus:border-emerald-500"
            >
              <option value="*">* (Every day)</option>
              <option value="1-5">1-5 (Mon to Fri)</option>
              <option value="0,6">0,6 (Weekends)</option>
              <option value="1">1 (Monday)</option>
              <option value="5">5 (Friday)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Next Upcoming Executions List */}
      <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          <span>Next Scheduled Executions (Preview)</span>
        </h4>

        <div className="space-y-1.5 font-mono text-xs">
          {upcomingExecutions.map((time, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-300 flex items-center justify-between">
              <span>Execution #{idx + 1}</span>
              <span className="text-emerald-400 font-semibold">{time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
