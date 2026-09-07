import React, { useState } from "react";
import { ToolDefinition, SavedItem, WorkspacePreset } from "../types";
import { TOOLS_REGISTRY } from "../data/toolsRegistry";
import { Star, History, X, Trash2, Folder, Download, Play } from "lucide-react";

interface SavedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  workspacePresets?: WorkspacePreset[];
  onLoadPreset?: (preset: WorkspacePreset) => void;
  onDeletePreset?: (presetId: string) => void;
  savedItems?: SavedItem[];
  favorites?: string[];
  history?: SavedItem[];
  tools?: ToolDefinition[];
  onSelectTool?: (toolId: string) => void;
  onClearHistory?: () => void;
  onRemoveFavorite?: (toolId: string) => void;
}

export const SavedDrawer: React.FC<SavedDrawerProps> = ({
  isOpen,
  onClose,
  workspacePresets = [],
  onLoadPreset,
  onDeletePreset,
  savedItems,
  favorites = [],
  history,
  tools = TOOLS_REGISTRY,
  onSelectTool,
  onClearHistory,
  onRemoveFavorite,
}) => {
  const [activeTab, setActiveTab] = useState<"workspace" | "starred" | "history">("starred");

  if (!isOpen) return null;

  const actualHistory = history || savedItems || [];
  const favoriteTools = tools.filter((t) => favorites.includes(t.id));

  const handleExportSinglePreset = (preset: WorkspacePreset) => {
    const jsonStr = JSON.stringify(preset, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `workspace_preset_${preset.name.toLowerCase().replace(/\s+/g, "_")}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAllPresets = () => {
    const jsonStr = JSON.stringify(workspacePresets, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `xfree_workspace_export_${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const tabBtn = (tab: typeof activeTab, icon: React.ReactNode, label: string, count: number) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 text-xs font-mono font-semibold uppercase transition-colors cursor-pointer ${
        activeTab === tab ? "bg-cyber-glow/10 text-cyber-glow border-b-2 border-cyber-glow" : "text-cyber-muted hover:text-white border-b-2 border-transparent"
      }`}
    >
      {icon}
      <span>{label} ({count})</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-cyber-card border-l border-cyber-border h-full flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-cyber-border flex items-center justify-between bg-cyber-bg/80">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-cyber-glow" />
            <h3 className="text-sm font-bold text-white font-mono">Saved Tools &amp; History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-cyber-border bg-cyber-bg hover:bg-cyber-surface text-cyber-muted hover:text-white transition-colors cursor-pointer focus-ring"
            aria-label="Close saved drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-cyber-border">
          {tabBtn("starred", <Star className="w-3.5 h-3.5" />, "Starred", favorites.length)}
          {tabBtn("history", <History className="w-3.5 h-3.5" />, "History", actualHistory.length)}
          {tabBtn("workspace", <Folder className="w-3.5 h-3.5" />, "Workspace", workspacePresets.length)}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-sm">
          {activeTab === "starred" && (
            <div>
              {favoriteTools.length === 0 ? (
                <p className="text-xs text-cyber-muted font-mono bg-cyber-bg/60 p-4 rounded-lg border border-cyber-border">
                  No saved tools yet. Click the star icon on any tool page to save it here for quick access.
                </p>
              ) : (
                <div className="space-y-2">
                  {favoriteTools.map((tool) => (
                    <div key={tool.id} className="flex items-center justify-between p-3 cyber-card hover:border-cyber-glow/40 transition-colors">
                      <div
                        onClick={() => {
                          onSelectTool?.(tool.id);
                          onClose();
                        }}
                        className="cursor-pointer flex-1 min-w-0"
                      >
                        <h5 className="text-sm font-semibold text-white font-mono truncate">{tool.title}</h5>
                        <p className="text-[11px] text-cyber-muted">{tool.categoryLabel}</p>
                      </div>
                      {onRemoveFavorite && (
                        <button
                          onClick={() => onRemoveFavorite(tool.id)}
                          className="p-1.5 text-cyber-glow hover:text-white transition-colors focus-ring shrink-0"
                          title="Remove"
                          aria-label={`Remove ${tool.title} from saved`}
                        >
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-cyber-muted font-mono">Recent actions, this browser only</span>
                {actualHistory.length > 0 && onClearHistory && (
                  <button onClick={onClearHistory} className="text-[10px] font-mono text-cyber-magenta hover:underline flex items-center gap-1 focus-ring">
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {actualHistory.length === 0 ? (
                <div className="text-xs text-cyber-muted font-mono bg-cyber-bg/60 p-4 rounded-lg border border-cyber-border">
                  Your recent tool inputs and outputs will show up here for easy retrieval.
                </div>
              ) : (
                <div className="space-y-2">
                  {actualHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectTool?.(item.toolId);
                        onClose();
                      }}
                      className="p-3 cyber-card hover:border-cyber-glow/40 cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-cyber-glow font-mono">{item.toolTitle}</span>
                        <span className="text-[10px] font-mono text-cyber-dim">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {item.inputSnippet && (
                        <div className="text-[11px] text-cyber-muted font-mono truncate bg-cyber-bg/60 p-1.5 rounded border border-cyber-border">
                          In: {item.inputSnippet}
                        </div>
                      )}
                      {item.outputSnippet && (
                        <div className="text-[11px] text-cyber-text font-mono truncate bg-cyber-bg/60 p-1.5 rounded border border-cyber-border">
                          Out: {item.outputSnippet}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "workspace" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-cyber-border pb-2">
                <span className="text-xs font-mono text-cyber-muted">Saved workspace configurations</span>
                {workspacePresets.length > 0 && (
                  <button
                    onClick={handleExportAllPresets}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-cyber-border bg-cyber-bg/60 hover:border-cyber-glow/40 text-cyber-muted hover:text-cyber-glow text-[10px] font-mono focus-ring"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export All</span>
                  </button>
                )}
              </div>

              {workspacePresets.length === 0 ? (
                <div className="p-5 rounded-lg border border-cyber-border bg-cyber-bg/60 space-y-2 text-center">
                  <Folder className="w-8 h-8 text-cyber-muted mx-auto" />
                  <p className="text-xs text-cyber-muted leading-relaxed font-mono">
                    Workspace presets aren&apos;t available yet — this needs each tool to support saving its own
                    input/output state, which isn&apos;t built for any tool today.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workspacePresets.map((preset) => (
                    <div key={preset.id} className="p-3.5 cyber-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-cyber-glow/10 border border-cyber-glow/30 text-[10px] font-mono text-cyber-glow rounded">
                          {preset.toolTitle}
                        </span>
                        <span className="text-[10px] font-mono text-cyber-dim">
                          {new Date(preset.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-white font-mono">{preset.name}</h4>
                      {preset.inputContent && (
                        <div className="p-2 bg-cyber-bg/60 border border-cyber-border rounded font-mono text-[11px] text-cyber-muted truncate">
                          In: {preset.inputContent}
                        </div>
                      )}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-cyber-border">
                        {onDeletePreset && (
                          <button
                            onClick={() => onDeletePreset(preset.id)}
                            className="p-1.5 text-cyber-muted hover:text-cyber-magenta transition-colors focus-ring"
                            title="Delete Preset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleExportSinglePreset(preset)}
                          className="px-2 py-1 rounded border border-cyber-border bg-cyber-bg/60 hover:border-cyber-glow/40 text-cyber-muted hover:text-cyber-glow text-[10px] font-mono flex items-center gap-1 focus-ring"
                        >
                          <Download className="w-3 h-3" />
                          <span>Export</span>
                        </button>
                        <button
                          onClick={() => {
                            onLoadPreset?.(preset);
                            onClose();
                          }}
                          className="cyber-btn cyber-btn-filled px-3 py-1 text-[10px] rounded flex items-center gap-1 focus-ring"
                        >
                          <Play className="w-3 h-3" />
                          <span>Load</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-cyber-border text-cyber-dim text-[10px] font-mono text-center">
          Saved locally in this browser only
        </div>
      </div>
    </div>
  );
};
