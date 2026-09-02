import React, { useState, useMemo } from "react";
import { ToolDefinition } from "../../types";
import { Binary, Copy, Check, Lock, AlertCircle, FileText } from "lucide-react";

interface Base64JwtDecoderProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

export const Base64JwtDecoder: React.FC<Base64JwtDecoderProps> = ({
  tool,
  onSaveHistory,
}) => {
  const [activeTab, setActiveTab] = useState<"jwt" | "base64" | "url">("jwt");

  // JWT State
  const [jwtInput, setJwtInput] = useState(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXggRGV2IiwiaWF0IjoxNTE2MjM5MDIyLCJyb2xlIjoiYWRtaW4ifQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
  );

  // Base64 State
  const [base64Text, setBase64Text] = useState("Hello XFree.in Platform!");
  const [base64Mode, setBase64Mode] = useState<"encode" | "decode">("encode");

  // URL State
  const [urlText, setUrlText] = useState("https://xfree.in/search?q=developer tools & sitemaps");
  const [urlMode, setUrlMode] = useState<"encode" | "decode">("encode");

  const [copied, setCopied] = useState(false);

  // Decode JWT Token
  const jwtDecoded = useMemo(() => {
    if (!jwtInput.trim()) return { header: null, payload: null, error: null, expDate: null };

    const parts = jwtInput.trim().split(".");
    if (parts.length < 2) {
      return { header: null, payload: null, error: "Invalid JWT token structure (must have header.payload.signature)", expDate: null };
    }

    try {
      const base64UrlDecode = (str: string) => {
        let base64 = str.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) base64 += "=";
        return decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
      };

      const header = JSON.parse(base64UrlDecode(parts[0]));
      const payload = JSON.parse(base64UrlDecode(parts[1]));

      let expDate = null;
      if (payload.exp) {
        expDate = new Date(payload.exp * 1000).toLocaleString();
      }

      return { header, payload, error: null, expDate };
    } catch (err: any) {
      return { header: null, payload: null, error: "Failed to parse JWT JSON header or payload", expDate: null };
    }
  }, [jwtInput]);

  // Base64 Process
  const base64Result = useMemo(() => {
    try {
      if (base64Mode === "encode") {
        return btoa(unescape(encodeURIComponent(base64Text)));
      } else {
        return decodeURIComponent(escape(atob(base64Text)));
      }
    } catch {
      return "Invalid Base64 string";
    }
  }, [base64Text, base64Mode]);

  // URL Process
  const urlResult = useMemo(() => {
    try {
      if (urlMode === "encode") {
        return encodeURIComponent(urlText);
      } else {
        return decodeURIComponent(urlText);
      }
    } catch {
      return "Invalid URL string";
    }
  }, [urlText, urlMode]);

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onSaveHistory(activeTab, content.slice(0, 50));
  };

  return (
    <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-6">
      {/* Mode Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab("jwt")}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
            activeTab === "jwt" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          JWT Token Decoder
        </button>

        <button
          onClick={() => setActiveTab("base64")}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
            activeTab === "base64" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Base64 Encoder / Decoder
        </button>

        <button
          onClick={() => setActiveTab("url")}
          className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
            activeTab === "url" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          URL Encoder / Decoder
        </button>
      </div>

      {activeTab === "jwt" && (
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-white mb-1 block">Paste Encoded JWT Token</label>
            <textarea
              value={jwtInput}
              onChange={(e) => setJwtInput(e.target.value)}
              rows={3}
              placeholder="eyJhbGciOiJIUzI1Ni..."
              className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500 resize-none break-all"
            />
          </div>

          {jwtDecoded.error ? (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
              {jwtDecoded.error}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Header Box */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-rose-400 border-b border-zinc-800 pb-2">
                  <span>HEADER: Algorithm & Token Type</span>
                  <button onClick={() => handleCopy(JSON.stringify(jwtDecoded.header, null, 2))} className="hover:text-white">
                    Copy
                  </button>
                </div>
                <pre className="text-xs font-mono text-rose-300 leading-relaxed overflow-x-auto">
                  {JSON.stringify(jwtDecoded.header, null, 2)}
                </pre>
              </div>

              {/* Payload Claims Box */}
              <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-purple-400 border-b border-zinc-800 pb-2">
                  <span>PAYLOAD: Claims & Data</span>
                  <button onClick={() => handleCopy(JSON.stringify(jwtDecoded.payload, null, 2))} className="hover:text-white">
                    Copy
                  </button>
                </div>
                <pre className="text-xs font-mono text-purple-300 leading-relaxed overflow-x-auto">
                  {JSON.stringify(jwtDecoded.payload, null, 2)}
                </pre>

                {jwtDecoded.expDate && (
                  <div className="pt-2 text-[11px] text-amber-400 border-t border-zinc-800/80">
                    Expires at: {jwtDecoded.expDate}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "base64" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setBase64Mode("encode")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                base64Mode === "encode" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
              }`}
            >
              Encode Text
            </button>
            <button
              onClick={() => setBase64Mode("decode")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                base64Mode === "decode" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
              }`}
            >
              Decode Base64
            </button>
          </div>

          <textarea
            value={base64Text}
            onChange={(e) => setBase64Text(e.target.value)}
            rows={4}
            className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none"
          />

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>Base64 Result</span>
              <button
                onClick={() => handleCopy(base64Result)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="text-xs font-mono text-emerald-300 break-all overflow-x-auto">
              {base64Result}
            </pre>
          </div>
        </div>
      )}

      {activeTab === "url" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setUrlMode("encode")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                urlMode === "encode" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
              }`}
            >
              Encode URL Component
            </button>
            <button
              onClick={() => setUrlMode("decode")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${
                urlMode === "decode" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300"
              }`}
            >
              Decode URL Component
            </button>
          </div>

          <textarea
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            rows={4}
            className="w-full p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-200 font-mono text-xs focus:outline-none"
          />

          <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span>URL Result</span>
              <button
                onClick={() => handleCopy(urlResult)}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="text-xs font-mono text-emerald-300 break-all overflow-x-auto">
              {urlResult}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
