import React, { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Sparkles, RefreshCw, Copy, Check } from "lucide-react";

interface ChatMessage {
  role: "user" | "model";
  content: string;
  timestamp: number;
}

interface GeminiChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialContext?: string;
}

export function GeminiChatDrawer({ isOpen, onClose, initialContext }: GeminiChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      content: "Hi — I'm the XFree AI Assistant, powered by Google Gemini. Ask about a tool, a regex pattern, a JSON error, or a schema you're trying to generate.",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialContext && isOpen) {
      setInput(`Please help me with this task: ${initialContext}`);
    }
  }, [initialContext, isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // The server's AiChatSchema only accepts "user" | "assistant" —
          // "model" is this component's own internal/UI role name (matching
          // Gemini SDK convention), not a valid wire value.
          messages: newMessages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content })),
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.reply) {
        setMessages((prev) => [
          ...prev,
          { role: "model", content: resData.reply, timestamp: Date.now() },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "model", content: `Error: ${resData.error || "Failed to get a response."}`, timestamp: Date.now() },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "model", content: `Network error: ${err.message || "Couldn't reach the server."}`, timestamp: Date.now() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-cyber-card border-l border-cyber-border h-full flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-cyber-border bg-cyber-bg/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyber-glow/10 border border-cyber-glow/30 rounded-xl text-cyber-glow">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2 font-mono">
                XFree AI Assistant
                <span className="px-2 py-0.5 text-[10px] font-mono bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30 rounded-full">
                  Gemini
                </span>
              </h2>
              <p className="text-xs text-cyber-muted">Ask coding, regex, SEO, or schema questions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-cyber-muted hover:text-white rounded-lg hover:bg-cyber-bg transition-colors focus-ring"
            aria-label="Close AI assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-sm">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "model" && (
                <div className="w-8 h-8 rounded-lg bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative group ${
                  msg.role === "user"
                    ? "bg-cyber-glow/15 text-white border border-cyber-glow/30 rounded-tr-none"
                    : "bg-cyber-bg/90 text-cyber-text border border-cyber-border rounded-tl-none whitespace-pre-wrap font-mono text-xs leading-relaxed"
                }`}
              >
                {msg.content}

                {msg.role === "model" && (
                  <button
                    onClick={() => copyToClipboard(msg.content, idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-cyber-surface text-cyber-muted hover:text-cyber-glow border border-cyber-border opacity-0 group-hover:opacity-100 transition-opacity focus-ring"
                    title="Copy message"
                  >
                    {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-cyber-glow" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/30 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-cyber-muted text-xs py-2">
              <div className="w-8 h-8 rounded-lg bg-cyber-glow/10 text-cyber-glow border border-cyber-glow/30 flex items-center justify-center anim-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex items-center gap-2 bg-cyber-bg/80 px-4 py-2.5 rounded-xl border border-cyber-border font-mono">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyber-glow" />
                <span>Thinking…</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-cyber-border bg-cyber-bg/40 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] uppercase font-mono text-cyber-dim shrink-0">Quick:</span>
          {["Explain this regex pattern", "Generate schema JSON-LD", "Optimize my meta tags", "Debug a JSON error"].map(
            (promptText, i) => (
              <button
                key={i}
                onClick={() => setInput(promptText)}
                className="px-2.5 py-1 text-xs bg-cyber-bg/80 hover:bg-cyber-surface text-cyber-muted hover:text-cyber-glow rounded-lg border border-cyber-border shrink-0 transition-colors focus-ring"
              >
                {promptText}
              </button>
            )
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-cyber-border bg-cyber-bg">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the XFree AI Assistant anything..."
              className="flex-1 min-w-0 bg-cyber-card border border-cyber-border rounded-xl px-4 py-3 text-sm text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-glow font-mono"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="cyber-btn cyber-btn-filled p-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
