import React, { useState } from "react";
import { Send, CheckCircle2, AlertCircle, Mail, Github } from "lucide-react";

interface PageProps {
  onGoHome: () => void;
}

type Status = "idle" | "submitting" | "success" | "error";

export const ContactPage: React.FC<PageProps> = ({ onGoHome: _onGoHome }) => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    if (message.trim().length < 10) {
      setStatus("error");
      setErrorMessage("Message must be at least 10 characters.");
      return;
    }
    setStatus("submitting");
    setErrorMessage("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() || undefined, message: message.trim(), website }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setStatus("error");
        setErrorMessage(body?.error === "rate_limited" ? "You've sent too many messages recently. Try again later." : "Could not send. Please try again.");
        return;
      }
      setStatus("success");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Contact Support & Feedback</h1>
        <p className="text-slate-300 text-sm sm:text-base">
          Have a tool request, bug report, policy question, or partnership inquiry? Reach XFree through the form or a direct public channel.
        </p>
      </div>

      <section aria-labelledby="direct-contact" className="grid gap-3 sm:grid-cols-2">
        <a
          href="mailto:support@xfree.in"
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-cyan-500/40"
        >
          <div className="flex items-center gap-2 text-white font-bold text-sm"><Mail className="w-4 h-4 text-cyan-400" /> Email support</div>
          <p className="mt-2 text-xs text-slate-400">support@xfree.in</p>
        </a>
        <a
          href="https://github.com/CodesbyFebin/xfree/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-cyan-500/40"
        >
          <div className="flex items-center gap-2 text-white font-bold text-sm"><Github className="w-4 h-4 text-cyan-400" /> Public issue tracker</div>
          <p className="mt-2 text-xs text-slate-400">Bug reports and reproducible tool issues</p>
        </a>
        <h2 id="direct-contact" className="sr-only">Direct contact methods</h2>
      </section>

      <div className="p-8 rounded-3xl bg-slate-900/90 border border-slate-800">
        {status === "success" ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-xl font-bold text-white">Message sent</h3>
            <p className="text-slate-400 text-xs">Thanks — we'll review it and follow up if you left an email.</p>
            <button
              onClick={() => { setStatus("idle"); setMessage(""); setEmail(""); }}
              className="px-4 py-2 bg-slate-800 text-slate-200 rounded-xl text-xs hover:bg-slate-700 cursor-pointer"
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Your email (optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Your message *</label>
              <textarea
                required
                rows={5}
                minLength={10}
                maxLength={4000}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe the tool feature, bug, policy question, or feedback..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
            {status === "error" && (
              <div className="flex items-start gap-2 text-xs text-red-300 bg-red-950/40 border border-red-900 p-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Send className="w-4 h-4" />
              <span>{status === "submitting" ? "Sending..." : "Send message"}</span>
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-xs leading-relaxed text-slate-500">
        Please do not send passwords, API keys, private keys, regulated personal data, or other secrets through the contact form or public issue tracker.
      </p>
    </div>
  );
};
