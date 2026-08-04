import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { recommendTool, type Recommendation } from "../utils/recommendTool";

interface Props {
  currentPath: string;
  onOpenTool: (slug: string) => void;
}

type Step = "task" | "email" | "success";
type Status = "idle" | "submitting" | "error";

// Suppressed site-wide until AdSense review is complete. Google AdSense
// program policy prohibits pop-ups that interfere with site use during
// the review phase. Flip to `true` after approval + reviewer sign-off.
const LEAD_POPUP_ENABLED = false;

const DISMISS_KEY = "xfree_lead_dismissed_at";
const SUBMIT_KEY = "xfree_lead_submitted";
const SUPPRESS_DAYS = 7;
const AUTO_OPEN_MS = 25_000;

function isSuppressed(): boolean {
  try {
    if (localStorage.getItem(SUBMIT_KEY)) return true;
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const then = Number(raw);
    if (!Number.isFinite(then)) return false;
    return Date.now() - then < SUPPRESS_DAYS * 86_400_000;
  } catch {
    return true;
  }
}

function markDismissed() {
  try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch { /* ignore */ }
}

function markSubmitted() {
  try { localStorage.setItem(SUBMIT_KEY, String(Date.now())); } catch { /* ignore */ }
}

function isInterruptiblePath(pathname: string): boolean {
  // Never popup while the user is actively working inside a tool.
  if (pathname.startsWith("/tools/")) return false;
  // Never on legal/contact pages — those visits usually have a specific intent.
  if (["/privacy", "/terms", "/security", "/contact"].includes(pathname)) return false;
  // Never on guide pages — reading a guide is not the moment to interrupt.
  if (pathname.startsWith("/guides/") || pathname === "/guides") return false;
  return true;
}

export const LeadFunnelPopup: React.FC<Props> = ({ currentPath, onOpenTool }) => {
  if (!LEAD_POPUP_ENABLED) return null;
  return <LeadFunnelPopupInner currentPath={currentPath} onOpenTool={onOpenTool} />;
};

const LeadFunnelPopupInner: React.FC<Props> = ({ currentPath, onOpenTool }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<Step>("task");
  const [task, setTask] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [rec, setRec] = useState<Recommendation>({ tool: null, confidence: "none" });
  const [website, setWebsite] = useState("");

  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const canInterrupt = useMemo(() => isInterruptiblePath(currentPath), [currentPath]);

  const open = useCallback(() => {
    if (isSuppressed()) return;
    if (!isInterruptiblePath(window.location.pathname)) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    setIsOpen(true);
  }, []);

  const close = useCallback((reason: "dismiss" | "success") => {
    setIsOpen(false);
    if (reason === "dismiss") markDismissed();
    if (reason === "success") markSubmitted();
    try { previouslyFocused.current?.focus(); } catch { /* ignore */ }
  }, []);

  // Auto-open after dwell + exit-intent
  useEffect(() => {
    if (!canInterrupt) return;
    if (isSuppressed()) return;

    const dwellTimer = window.setTimeout(open, AUTO_OPEN_MS);

    const onMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !isSuppressed() && isInterruptiblePath(window.location.pathname)) {
        open();
      }
    };
    document.addEventListener("mouseleave", onMouseLeave);

    return () => {
      window.clearTimeout(dwellTimer);
      document.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [canInterrupt, open]);

  // Close on ESC + focus trap
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close("dismiss");
      if (e.key === "Tab" && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    setTimeout(() => dialogRef.current?.querySelector<HTMLElement>("textarea, input")?.focus(), 30);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, close]);

  const goToEmail = () => {
    if (task.trim().length < 3) return;
    setRec(recommendTool(task));
    setStep("email");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    if (!consent) { setStatus("error"); setErrorMsg("Please confirm the consent checkbox."); return; }
    setStatus("submitting");
    setErrorMsg("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          taskDescription: task.trim(),
          recommendedToolSlug: rec.tool?.slug,
          recommendedToolTitle: rec.tool?.title,
          source: "popup",
          path: window.location.pathname,
          consent: true,
          website,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMsg(body?.error === "rate_limited" ? "Too many submissions — try again later." : "Could not send. Please try again.");
        return;
      }
      setStatus("idle");
      setStep("success");
    } catch {
      setStatus("error");
      setErrorMsg("Network error — please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-popup-title"
      onClick={(e) => { if (e.target === e.currentTarget) close("dismiss"); }}
    >
      <div
        ref={dialogRef}
        className="w-full sm:max-w-lg bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="flex items-start justify-between p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 id="lead-popup-title" className="text-white font-bold text-base">Find the right XFree tool</h2>
          </div>
          <button
            onClick={() => close("dismiss")}
            aria-label="Close"
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {step === "task" && (
            <div className="space-y-4">
              <p className="text-slate-300 text-sm">
                Tell us what you're trying to get done. We'll point you at the right tool — no signup, no fluff.
              </p>
              <textarea
                autoFocus
                rows={3}
                value={task}
                onChange={(e) => setTask(e.target.value)}
                onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") goToEmail(); }}
                placeholder="e.g. Generate a JSON-LD FAQ schema for my blog post"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => close("dismiss")}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  No thanks
                </button>
                <button
                  onClick={goToEmail}
                  disabled={task.trim().length < 3}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Recommend a tool
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === "email" && (
            <form onSubmit={submit} className="space-y-4">
              <input
                type="text"
                name="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
              />
              {rec.tool ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="text-xs text-cyan-400 uppercase tracking-wider font-bold">Best match</div>
                  <div className="text-white font-bold text-sm">{rec.tool.title}</div>
                  <div className="text-slate-400 text-xs">{rec.tool.shortDescription}</div>
                  <button
                    type="button"
                    onClick={() => { onOpenTool(rec.tool!.slug); close("dismiss"); }}
                    className="text-xs text-cyan-300 hover:underline cursor-pointer"
                  >
                    Open this tool now →
                  </button>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-slate-400 text-xs">
                  No direct match in our current toolset. Leave your email and we'll ping you if we build it.
                </div>
              )}

              <div className="space-y-1">
                <label htmlFor="lead-email" className="text-xs font-bold text-slate-300 block">
                  Your email
                </label>
                <input
                  id="lead-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                />
              </div>

              <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 shrink-0"
                />
                <span>
                  Send me occasional emails about new XFree tools that match this task. You can unsubscribe any time.
                </span>
              </label>

              {status === "error" && (
                <div className="flex items-start gap-2 text-xs text-red-300 bg-red-950/40 border border-red-900 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep("task")}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={status === "submitting" || !consent || !email}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  {status === "submitting" ? "Sending..." : "Notify me"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {step === "success" && (
            <div className="text-center space-y-4 py-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <h3 className="text-white font-bold text-lg">You're on the list</h3>
              <p className="text-slate-400 text-sm">
                We'll email you when there's a tool worth your time. No spam.
              </p>
              {rec.tool && (
                <button
                  onClick={() => { onOpenTool(rec.tool!.slug); close("success"); }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                >
                  Open {rec.tool.title}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
              <div>
                <button
                  onClick={() => close("success")}
                  className="text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
