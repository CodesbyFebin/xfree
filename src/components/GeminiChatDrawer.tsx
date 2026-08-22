import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Sparkles, RefreshCw, Copy, Check } from "lucide-react";

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
      content: "Hello! I am XFree.in Gemini AI Assistant. How can I help you analyze SEO keywords, fix code errors, refine regex patterns, or generate schemas today?",
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
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const resData = await response.json();
      if (resData.success && resData.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: resData.reply,
            timestamp: Date.now(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "model",
            content: `Error: ${resData.error || "Failed to retrieve response from Gemini AI."}`,
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          content: `Network Error: ${err.message || "Failed to reach Gemini server."}`,
          timestamp: Date.now(),
        },
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
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm transition-opacity flex justify-end">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl text-white shadow-lg shadow-cyan-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                Gemini Multi-Turn AI Chatbot
                <span className="px-2 py-0.5 text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
                  Server-selected model
                </span>
              </h2>
              <p className="text-xs text-slate-400">Ask coding, regex, SEO, or schema questions anytime</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-sm">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "model" && (
                <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-4 shadow-sm relative group ${
                  msg.role === "user"
                    ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none"
                    : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none whitespace-pre-wrap font-mono text-xs leading-relaxed"
                }`}
              >
                {msg.content}

                {msg.role === "model" && (
                  <button
                    onClick={() => copyToClipboard(msg.content, idx)}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-900/60 text-slate-400 hover:text-cyan-400 border border-slate-700 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Copy message"
                  >
                    {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs py-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center animate-pulse">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="flex items-center space-x-2 bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Gemini is generating response...</span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-950/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[10px] uppercase font-mono text-slate-500 shrink-0">Quick Prompts:</span>
          {[
            "Explain Regex pattern",
            "Generate Schema JSON-LD",
            "Optimize Meta Tags",
            "Debug TypeScript error",
          ].map((promptText, i) => (
            <button
              key={i}
              onClick={() => setInput(promptText)}
              className="px-2.5 py-1 text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 rounded-lg border border-slate-700 shrink-0 transition-colors"
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Gemini anything..."
              className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
