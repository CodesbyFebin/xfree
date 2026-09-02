import React, { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";

export interface NvidiaModelOption {
  id: string;
  name: string;
  capabilities: string[];
  kind: string;
  chatCompatible: boolean;
}

interface ModelSelectorProps {
  active: boolean;
  value: string;
  onChange: (model: string) => void;
}

export function ModelSelector({ active, value, onChange }: ModelSelectorProps) {
  const [models, setModels] = useState<NvidiaModelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    let mounted = true;
    setLoading(true);
    setError(null);
    fetch("/api/nvidia/models", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || data.error || "Model discovery failed");
        if (mounted) setModels(Array.isArray(data.models) ? data.models : []);
      })
      .catch((reason) => {
        if (mounted && reason instanceof Error && reason.name !== "AbortError") setError(reason.message);
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [active, reloadKey]);

  if (!active) return null;
  const chatModels = models.filter((model) => model.chatCompatible);
  const specializedCount = models.length - chatModels.length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="nvidia-model" className="text-xs font-semibold text-slate-300">
          NVIDIA models available to this account
        </label>
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          disabled={loading}
          className="text-slate-400 hover:text-cyan-300 disabled:opacity-50"
          aria-label="Refresh NVIDIA models"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      <select
        id="nvidia-model"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={loading || Boolean(error)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white focus:border-cyan-500 focus:outline-none disabled:opacity-60"
      >
        <option value="auto">Auto (task-based routing)</option>
        {chatModels.map((model) => (
          <option key={model.id} value={model.id}>{model.id}</option>
        ))}
      </select>
      {error ? (
        <p className="text-xs text-rose-300">{error}. Check the server-side NVIDIA configuration.</p>
      ) : (
        <p className="text-[11px] text-slate-500">
          {chatModels.length} chat-compatible models available{specializedCount > 0 ? ` · ${specializedCount} specialized models discovered` : ""}. Availability and pricing are controlled by NVIDIA.
        </p>
      )}
    </div>
  );
}
