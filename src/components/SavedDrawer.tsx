import React, { useState } from "react";
import { ToolDefinition, SavedItem, WorkspacePreset } from "../types";
import { TOOLS_REGISTRY } from "../data/toolsRegistry";
import { Star, History, X, Trash2, Folder, Download, Play, CheckCircle2 } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"workspace" | "starred" | "history">("workspace");

  if (!isOpen) return null;

  const actualHistory = history || savedItems || [];
  const favoriteTools = tools.filter((t) => favorites.includes(t.id));

  // Export single workspace preset as JSON
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

  // Export all workspace presets as JSON
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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex justify-end">
      <div className="w-full max-w-md bg-white border-l-2 border-black h-full flex flex-col shadow-[-8px_0px_0px_#1a1a1a]">
        {/* Header */}
        <div className="p-4 border-b-2 border-black flex items-center justify-between bg-yellow-300">
          <div className="flex items-center gap-2">
            <Folder className="w-5 h-5 text-black fill-black" />
            <h3 className="text-sm font-black text-black uppercase">Personal Workspace & History</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Bar */}
        <div className="flex border-b-2 border-black bg-gray-100 font-bold text-xs uppercase">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "workspace" ? "bg-black text-white font-black" : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Folder className="w-4 h-4 text-yellow-300" />
            <span>Workspace ({workspacePresets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("starred")}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "starred" ? "bg-black text-white font-black" : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <Star className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            <span>Starred ({favorites.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("history")}
            className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === "history" ? "bg-black text-white font-black" : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <History className="w-4 h-4 text-blue-400" />
            <span>History ({actualHistory.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-6">
          {activeTab === "workspace" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <span className="text-xs font-black uppercase text-black">Saved Workspaces</span>
                {workspacePresets.length > 0 && (
                  <button
                    onClick={handleExportAllPresets}
                    className="inline-flex items-center gap-1 px-2.5 py-1 border-2 border-black bg-blue-100 hover:bg-blue-200 text-black text-[10px] font-black uppercase cursor-pointer"
                  >
                    <Download className="w-3 h-3 text-blue-700" />
                    <span>Export All (JSON)</span>
                  </button>
                )}
              </div>

              {workspacePresets.length === 0 ? (
                <div className="p-5 border-2 border-black bg-blue-50 space-y-2 text-center">
                  <Folder className="w-8 h-8 text-blue-700 mx-auto" />
                  <h4 className="text-xs font-black uppercase text-black">Workspace is Empty</h4>
                  <p className="text-xs text-gray-700 font-medium leading-relaxed">
                    Click "Save Workspace" inside any tool page to save your configurations, inputs, and output results for one-click reload later!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {workspacePresets.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-3.5 bg-white border-2 border-black brutal-shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-yellow-300 border border-black text-[10px] font-black uppercase text-black">
                          {preset.toolTitle}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500 font-bold">
                          {new Date(preset.timestamp).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-black uppercase">{preset.name}</h4>

                      {preset.inputContent && (
                        <div className="p-2 bg-gray-50 border border-gray-300 font-mono text-[11px] text-gray-700 truncate">
                          In: {preset.inputContent}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                        {onDeletePreset && (
                          <button
                            onClick={() => onDeletePreset(preset.id)}
                            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 border border-gray-300"
                            title="Delete Preset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleExportSinglePreset(preset)}
                          className="px-2 py-1 border border-black bg-gray-100 hover:bg-gray-200 text-black text-[10px] font-bold uppercase flex items-center gap-1"
                          title="Export JSON file"
                        >
                          <Download className="w-3 h-3" />
                          <span>Export</span>
                        </button>

                        <button
                          onClick={() => {
                            if (onLoadPreset) onLoadPreset(preset);
                            onClose();
                          }}
                          className="px-3 py-1 border-2 border-black bg-yellow-300 hover:bg-yellow-400 text-black text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3 fill-black" />
                          <span>Load Preset</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "starred" && (
            <div>
              <h4 className="text-xs font-black uppercase text-black mb-3">
                Starred Tools ({favoriteTools.length})
              </h4>
              {favoriteTools.length === 0 ? (
                <p className="text-xs text-gray-600 font-medium bg-gray-50 p-3 border border-black">
                  No starred tools yet. Click the star icon on any tool card to bookmark it for quick access.
                </p>
              ) : (
                <div className="space-y-2">
                  {favoriteTools.map((tool) => (
                    <div
                      key={tool.id}
                      className="flex items-center justify-between p-3 bg-white border-2 border-black hover:bg-yellow-50 transition-colors"
                    >
                      <div
                        onClick={() => {
                          if (onSelectTool) onSelectTool(tool.id);
                          onClose();
                        }}
                        className="cursor-pointer flex-1"
                      >
                        <h5 className="text-sm font-black text-black hover:text-blue-600 uppercase">
                          {tool.title}
                        </h5>
                        <p className="text-[11px] text-gray-600 font-medium">{tool.categoryLabel}</p>
                      </div>
                      {onRemoveFavorite && (
                        <button
                          onClick={() => onRemoveFavorite(tool.id)}
                          className="p-1 text-black hover:text-red-600 cursor-pointer"
                          title="Unstar"
                        >
                          <Star className="w-4 h-4 fill-black" />
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
                <h4 className="text-xs font-black uppercase text-black flex items-center gap-1.5">
                  <History className="w-4 h-4 text-blue-600" />
                  <span>Recent Tool History ({actualHistory.length})</span>
                </h4>
                {actualHistory.length > 0 && onClearHistory && (
                  <button
                    onClick={onClearHistory}
                    className="text-[10px] font-black uppercase text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {actualHistory.length === 0 ? (
                <div className="text-xs text-gray-600 font-medium bg-blue-50 p-4 border-2 border-black">
                  Your recent outputs and actions will be saved locally here for easy retrieval.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {actualHistory.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (onSelectTool) onSelectTool(item.toolId);
                        onClose();
                      }}
                      className="p-3 bg-white border-2 border-black hover:bg-yellow-50 cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-blue-600 uppercase">{item.toolTitle}</span>
                        <span className="text-[10px] font-mono font-bold text-gray-500">
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      {item.inputSnippet && (
                        <div className="text-[11px] text-gray-700 font-mono truncate bg-gray-100 p-1.5 border border-gray-300">
                          In: {item.inputSnippet}
                        </div>
                      )}
                      {item.outputSnippet && (
                        <div className="text-[11px] text-black font-mono font-bold truncate bg-yellow-100 p-1.5 border border-black">
                          Out: {item.outputSnippet}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t-2 border-black bg-black text-white text-[10px] font-bold uppercase text-center tracking-wider">
          Saved locally in browser memory • XFree.in Workspace
        </div>
      </div>
    </div>
  );
};
