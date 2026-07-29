import React, { useState } from "react";
import { MessageSquare, X, Send, CheckCircle2, Bug, Lightbulb, MessageCircle, HelpCircle } from "lucide-react";

interface FeedbackWidgetProps {
  toolId?: string;
  toolTitle?: string;
}

export interface FeedbackSubmission {
  id: string;
  toolId?: string;
  toolTitle?: string;
  category: "bug" | "feature" | "general" | "usability";
  message: string;
  contact?: string;
  timestamp: number;
}

export const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ toolId, toolTitle }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<"bug" | "feature" | "general" | "usability">("feature");
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          message: message.trim(),
          contact: contact.trim() || undefined,
          toolId,
          toolTitle,
          path: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMsg(body?.error === "rate_limited" ? "Too many submissions — try again later." : "Could not send feedback.");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      setSubmitting(false);
      setTimeout(() => {
        setSubmitted(false);
        setMessage("");
        setContact("");
        setIsOpen(false);
      }, 2200);
    } catch {
      setSubmitting(false);
      setErrorMsg("Network error. Please try again.");
    }
  };

  return (
    <>
      {/* Floating or Inline Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3.5 py-2 border-2 border-black bg-yellow-300 hover:bg-yellow-400 text-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer brutal-shadow-sm hover:-translate-y-0.5"
        title="Submit feedback or feature request for this tool"
      >
        <MessageSquare className="w-4 h-4 fill-black" />
        <span>Tool Feedback</span>
      </button>

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white brutal-border brutal-shadow-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b-2 border-black bg-yellow-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-black fill-black" />
                <h3 className="text-sm font-black uppercase text-black">
                  Feedback for {toolTitle || "XFree Micro-Tools"}
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            {submitted ? (
              <div className="p-8 text-center space-y-3 bg-green-50">
                <CheckCircle2 className="w-12 h-12 text-green-700 mx-auto" />
                <h4 className="text-base font-black uppercase text-black">Thank You for Your Feedback!</h4>
                <p className="text-xs text-gray-700 font-medium max-w-sm mx-auto">
                  Your feedback was sent to the XFree.in team. We review every submission and reply when useful.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-black block">
                    Submission Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCategory("feature")}
                      className={`p-2.5 border-2 border-black text-left flex items-center gap-2 text-xs font-bold uppercase transition-colors cursor-pointer ${
                        category === "feature" ? "bg-purple-200 text-black" : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Lightbulb className="w-4 h-4 text-purple-700 shrink-0" />
                      <span>Feature Request</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory("bug")}
                      className={`p-2.5 border-2 border-black text-left flex items-center gap-2 text-xs font-bold uppercase transition-colors cursor-pointer ${
                        category === "bug" ? "bg-red-200 text-black" : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <Bug className="w-4 h-4 text-red-700 shrink-0" />
                      <span>Bug Report</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory("general")}
                      className={`p-2.5 border-2 border-black text-left flex items-center gap-2 text-xs font-bold uppercase transition-colors cursor-pointer ${
                        category === "general" ? "bg-blue-200 text-black" : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <MessageCircle className="w-4 h-4 text-blue-700 shrink-0" />
                      <span>General Feedback</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory("usability")}
                      className={`p-2.5 border-2 border-black text-left flex items-center gap-2 text-xs font-bold uppercase transition-colors cursor-pointer ${
                        category === "usability" ? "bg-yellow-200 text-black" : "bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <HelpCircle className="w-4 h-4 text-black shrink-0" />
                      <span>Usability / Speed</span>
                    </button>
                  </div>
                </div>

                {/* Feedback Message */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-black block">
                    Your Feedback / Suggestion <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what worked well, what felt confusing, or what new micro-tool feature you'd like added..."
                    className="w-full p-3 border-2 border-black bg-gray-50 text-black text-xs font-medium focus:outline-none focus:bg-white resize-y"
                  />
                </div>

                {/* Optional Contact Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-black block">
                    Contact Email or Name <span className="text-gray-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={contact}
                    onChange={(e) => setContact(e.target.value)}
                    placeholder="you@example.com (so we can follow up if needed)"
                    className="w-full p-2.5 border-2 border-black bg-gray-50 text-black text-xs font-medium focus:outline-none focus:bg-white"
                  />
                </div>

                {/* Actions */}
                {errorMsg && (
                  <div className="text-xs text-red-700 bg-red-50 border-2 border-red-700 px-3 py-2 font-bold">{errorMsg}</div>
                )}
                <div className="flex items-center justify-end gap-3 pt-2 border-t-2 border-black">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 text-black font-bold text-xs uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!message.trim() || submitting}
                    className="inline-flex items-center gap-2 px-5 py-2 border-2 border-black bg-black text-white hover:bg-gray-800 font-black text-xs uppercase disabled:opacity-50 transition-colors cursor-pointer brutal-shadow-sm"
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? "Sending..." : "Submit Feedback"}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
