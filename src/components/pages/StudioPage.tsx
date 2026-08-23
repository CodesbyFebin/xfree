import React, { useEffect, useMemo, useRef, useState } from "react";
import { buildRulesAgentPlan, executeLocalAgentPlan } from "../../lib/agent-core";
import type { LocalAgentPlan } from "../../lib/agent-core";
import { DEFAULT_SOUL, detectLocalAgentCapabilities, planWithLocalBrain } from "../../lib/local-brain";
import type { LocalBrainProgress } from "../../lib/local-brain";
import { pickLocalWorkspace } from "../../lib/local-workspace";
import { LOCAL_ENGINES, resolveLocalEngine } from "../../lib/studio/engines";
import type { ProcessingMode, StudioFile, StudioMessage, StudioMobileTab, StudioResult } from "../../lib/studio/types";
import { StudioHeader } from "../studio/StudioHeader";
import { StudioSidebar } from "../studio/StudioSidebar";
import { StudioCenterPanel } from "../studio/StudioCenterPanel";
import { StudioResultsPanel } from "../studio/StudioResultsPanel";
import { StudioMobileTabs } from "../studio/StudioMobileTabs";

type TaskType = "code" | "json" | "sql" | "summarization" | "reasoning" | "general";
type AgentMode = "rules" | "webllm";

function inferTaskType(input: string): TaskType {
  const text = input.toLowerCase();
  if (/\b(json|schema)\b/.test(text)) return "json";
  if (/\b(sql|query|database)\b/.test(text)) return "sql";
  if (/\b(code|typescript|javascript|python|debug|regex)\b/.test(text)) return "code";
  if (/\b(summarize|summary|condense)\b/.test(text)) return "summarization";
  if (/\b(reason|analyze|compare|plan)\b/.test(text)) return "reasoning";
  return "general";
}

function readStoredAgentMode(): AgentMode {
  try { return localStorage.getItem("xfree_agent_mode") === "webllm" ? "webllm" : "rules"; }
  catch { return "rules"; }
}

function readStoredSoul(): string {
  try { return localStorage.getItem("xfree_agent_soul") || DEFAULT_SOUL; }
  catch { return DEFAULT_SOUL; }
}

export function StudioPage() {
  const deepLinkedEngine = useMemo(() => new URLSearchParams(window.location.search).get("tool") ?? undefined, []);
  const initialEngine = resolveLocalEngine("", deepLinkedEngine);
  const [mode, setMode] = useState<ProcessingMode>("local");
  const [model, setModel] = useState("auto");
  const [engineId, setEngineId] = useState(initialEngine.id);
  const [command, setCommand] = useState(deepLinkedEngine ? `Run ${initialEngine.name}` : "");
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<StudioFile[]>([]);
  const [workspaceLabel, setWorkspaceLabel] = useState<string | null>(null);
  const [results, setResults] = useState<StudioResult[]>([]);
  const [messages, setMessages] = useState<StudioMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<StudioMobileTab>("chat");
  const [agentMode, setAgentMode] = useState<AgentMode>(readStoredAgentMode);
  const [agentPlan, setAgentPlan] = useState<LocalAgentPlan | null>(null);
  const [brainProgress, setBrainProgress] = useState<LocalBrainProgress | null>(null);
  const [soul, setSoul] = useState(readStoredSoul);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentCapabilities = useMemo(() => detectLocalAgentCapabilities(), []);
  const cloud = mode === "cloud";
  const activeEngine = LOCAL_ENGINES.find((engine) => engine.id === engineId) ?? LOCAL_ENGINES[0];

  useEffect(() => {
    try { localStorage.setItem("xfree_agent_mode", agentMode); } catch { /* Storage can be disabled. */ }
  }, [agentMode]);

  useEffect(() => {
    try { localStorage.setItem("xfree_agent_soul", soul); } catch { /* Storage can be disabled. */ }
  }, [soul]);

  useEffect(() => {
    if (agentMode === "webllm" && !agentCapabilities.webGpu) setAgentMode("rules");
  }, [agentCapabilities.webGpu, agentMode]);

  const addMessage = (message: Omit<StudioMessage, "id">) => setMessages((current) => [...current, { ...message, id: crypto.randomUUID() }]);

  const addFiles = async (selected: FileList | File[]) => {
    const accepted = await Promise.all([...selected].slice(0, 10).map(async (file) => ({
      id: crypto.randomUUID(), name: file.name, size: file.size, type: file.type || "text/plain", content: await file.text(),
    })));
    setWorkspaceLabel(null);
    setFiles((current) => [...current, ...accepted]);
    if (accepted[0]) setInput(accepted[0].content);
    setMobileTab("chat");
  };

  const openLocalFolder = async () => {
    try {
      const snapshot = await pickLocalWorkspace();
      setWorkspaceLabel(snapshot.directoryName);
      setFiles(snapshot.files);
      if (snapshot.files[0]) setInput(snapshot.files[0].content);
      addMessage({ role: "assistant", provider: "Local", content: `Read-only workspace “${snapshot.directoryName}” opened locally: ${snapshot.files.length} text file${snapshot.files.length === 1 ? "" : "s"} available to Studio${snapshot.skippedFiles ? `; ${snapshot.skippedFiles} unsupported or oversized entries skipped` : ""}. No folder contents were uploaded.` });
      setMobileTab("chat");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      addMessage({ role: "assistant", provider: "Local", content: error instanceof Error ? error.message : "Could not open the local folder." });
    }
  };

  const runLocalAgent = async (prompt: string) => {
    setBrainProgress(null);
    const plan = agentMode === "webllm"
      ? await planWithLocalBrain(prompt || `Run ${activeEngine.name}`, input, soul, setBrainProgress)
      : buildRulesAgentPlan(prompt || `Run ${activeEngine.name}`, activeEngine.id);
    setAgentPlan(plan);

    const executed = await executeLocalAgentPlan(plan, input, prompt, setAgentPlan);
    const result: StudioResult = { ...executed.result, id: crypto.randomUUID(), createdAt: Date.now(), processing: "Local" };
    setResults((current) => [result, ...current]);
    addMessage({ role: "assistant", provider: "Local", content: `${executed.plan.steps.length} local step${executed.plan.steps.length === 1 ? "" : "s"} completed. Final engine: ${executed.result.engineId}.` });
    setBrainProgress(null);
  };

  const submit = async () => {
    const prompt = command.trim();
    if (loading || (!prompt && !input.trim())) return;
    const userMessage: StudioMessage = { id: crypto.randomUUID(), role: "user", content: prompt || `Run ${activeEngine.name}`, provider: cloud ? "NVIDIA" : "Local" };
    setMessages((current) => [...current, userMessage]);
    setLoading(true);

    try {
      if (!cloud) {
        await runLocalAgent(prompt);
      } else {
        setAgentPlan(null);
        setBrainProgress(null);
        const history = [...messages.filter((message) => message.provider === "NVIDIA"), userMessage].map(({ role, content }) => ({ role, content }));
        const response = await fetch("/api/nvidia/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model, taskType: inferTaskType(prompt), messages: history }) });
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.message || data.error || "NVIDIA request failed");
        addMessage({ role: "assistant", provider: "NVIDIA", model: data.usedModel, fallbackNotice: data.wasFallback ? `Requested model unavailable — used ${data.usedModel} instead.` : undefined, content: data.reply });
        setResults((current) => [{ id: crypto.randomUUID(), title: "NVIDIA response", content: data.reply, mimeType: "text/plain", extension: "txt", engineId: "nvidia-chat", createdAt: Date.now(), processing: "NVIDIA", model: data.usedModel }, ...current]);
      }
    } catch (error) {
      addMessage({ role: "assistant", provider: cloud ? "NVIDIA" : "Local", content: error instanceof Error ? error.message : "Processing failed" });
    } finally {
      setLoading(false);
    }
  };

  const download = (result: StudioResult) => {
    const url = URL.createObjectURL(new Blob([result.content], { type: result.mimeType }));
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `xfree-${result.engineId}.${result.extension}`; anchor.click(); URL.revokeObjectURL(url);
  };

  const chain = (result: StudioResult) => {
    setInput(result.content);
    setCommand("Transform the previous result");
    setMode("local");
    setAgentMode("rules");
    setMobileTab("chat");
    document.getElementById("studio-command")?.focus();
  };

  const selectEngine = (id: string, name: string) => { setEngineId(id); setCommand(`Run ${name}`); setAgentPlan(null); setMobileTab("chat"); };
  const sideProps = {
    files,
    engineId,
    onFiles: (list: FileList) => { void addFiles(list); },
    onClear: () => { setFiles([]); setWorkspaceLabel(null); },
    onSelectFile: (file: StudioFile) => { setInput(file.content); setMobileTab("chat"); },
    onSelectEngine: selectEngine,
    onOpenFolder: () => { void openLocalFolder(); },
    folderSupported: agentCapabilities.fileSystemAccess,
    workspaceLabel,
  };
  const resultProps = { cloud, model, results, onModel: setModel, onClear: () => setResults([]), onDownload: download, onChain: chain };

  return <div className="fixed inset-0 z-[100] flex flex-col overflow-hidden bg-[#F8F7F4] text-stone-900">
    <StudioHeader mode={mode} onModeChange={(nextMode) => { setMode(nextMode); if (nextMode === "local") setModel("auto"); }} />
    <main className="flex min-h-0 flex-1 overflow-hidden">
      <StudioSidebar {...sideProps} />
      <div className={`${mobileTab === "chat" ? "flex" : "hidden"} min-w-0 flex-1 lg:flex`}>
        <StudioCenterPanel cloud={cloud} engine={activeEngine} input={input} command={command} messages={messages} loading={loading} agentMode={agentMode} agentCapabilities={agentCapabilities} agentPlan={agentPlan} brainProgress={brainProgress} soul={soul} onInput={setInput} onCommand={setCommand} onSubmit={() => { void submit(); }} onAttach={() => fileInputRef.current?.click()} onSuggestion={(value) => { setCommand(value); setAgentPlan(null); }} onAgentMode={setAgentMode} onSoul={setSoul} />
      </div>
      <StudioResultsPanel {...resultProps} />
      {mobileTab === "files" ? <div className="w-full overflow-y-auto p-4 lg:hidden"><StudioSidebar {...sideProps} compact /></div> : null}
      {mobileTab === "results" ? <div className="w-full overflow-y-auto p-4 lg:hidden"><StudioResultsPanel {...resultProps} compact /></div> : null}
    </main>
    <StudioMobileTabs tab={mobileTab} fileCount={files.length} resultCount={results.length} onChange={setMobileTab} />
    <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(event) => event.target.files && void addFiles(event.target.files)} />
  </div>;
}
