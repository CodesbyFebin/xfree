export type NvidiaModelKind = "chat" | "vision-chat" | "embedding" | "rerank" | "safety" | "translation" | "speech" | "biology" | "video" | "simulation" | "autonomous-driving" | "image-generation";

const CATALOG_GROUPS: Record<NvidiaModelKind, string[]> = {
  chat: [
    "nvidia/nemotron-3-super-120b-a12b", "nvidia/nemotron-3-ultra-550b-a55b", "openai/gpt-oss-120b", "meta/llama-3.3-70b-instruct", "openai/gpt-oss-20b", "meta/llama-3.1-8b-instruct", "nvidia/nemotron-3-nano-30b-a3b", "z-ai/glm-5.2", "stepfun-ai/step-3.7-flash", "nvidia/llama-3.3-nemotron-super-49b-v1.5", "nvidia/llama-3.3-nemotron-super-49b-v1", "google/gemma-4-31b-it", "meta/llama-3.1-70b-instruct", "google/diffusiongemma-26b-a4b-it", "nvidia/nemotron-mini-4b-instruct", "nvidia/nvidia-nemotron-nano-9b-v2", "meta/llama-3.2-3b-instruct", "mistralai/mistral-nemotron", "nvidia/llama-3.1-nemotron-nano-8b-v1", "meta/llama-3.2-1b-instruct", "nvidia/ising-calibration-1-35b-a3b", "nvidia/cosmos3-nano-reasoner", "nvidia/cosmos3-nano", "deepseek-ai/deepseek-v4-flash-0731", "thinkingmachines/inkling", "nvidia/ising-calibration-1.5-31b", "poolside/laguna-xs-2.1", "nvidia/nemotron-3.5-lightning-30b-a3b",
  ],
  "vision-chat": ["nvidia/llama-3.1-nemotron-nano-vl-8b-v1", "minimaxai/minimax-m3", "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning", "nvidia/nemotron-nano-12b-v2-vl", "meta/llama-3.2-90b-vision-instruct", "meta/llama-3.2-11b-vision-instruct", "google/google-paligemma"],
  embedding: ["nvidia/nv-embed-v1", "nvidia/nv-embedcode-7b-v1", "nvidia/nemotron-3-embed-1b"],
  rerank: ["nvidia/rerank-qa-mistral-4b"],
  safety: ["nvidia/nemotron-3.5-content-safety", "meta/llama-guard-4-12b", "nvidia/llama-3.1-nemotron-safety-guard-8b-v3"],
  translation: ["nvidia/riva-translate-4b-instruct-v1.1", "nvidia/riva-translate-4b-instruct-v2"],
  speech: ["nvidia/magpie-tts-zeroshot", "nvidia/studiovoice", "nvidia/active-speaker-detection", "nvidia/bnr", "nvidia/nemotron-voicechat"],
  biology: ["meta/esmfold", "meta/esm2-650m"],
  video: ["nvidia/synthetic-video-detector", "nvidia/cosmos-transfer1-7b", "nvidia/cosmos-transfer2.5-2b"],
  simulation: [],
  "autonomous-driving": ["nvidia/streampetr", "nvidia/bevformer", "nvidia/sparsedrive"],
  "image-generation": ["meta/muse-glimmer-30b"],
};

function normalizeId(id: string) { return id.toLowerCase().replace(/_/g, ".").replace(/-v1\.5$/, "-v1.5"); }
const KNOWN_KIND = new Map<string, NvidiaModelKind>();
Object.entries(CATALOG_GROUPS).forEach(([kind, ids]) => ids.forEach((id) => KNOWN_KIND.set(normalizeId(id), kind as NvidiaModelKind)));

export const NVIDIA_REFERENCE_CATALOG = Object.entries(CATALOG_GROUPS).flatMap(([kind, ids]) => ids.map((id) => ({ id, kind: kind as NvidiaModelKind })));

export function inferModelKind(id: string): NvidiaModelKind {
  const normalized = normalizeId(id);
  const known = KNOWN_KIND.get(normalized);
  if (known) return known;
  if (/embed/.test(normalized)) return "embedding";
  if (/rerank/.test(normalized)) return "rerank";
  if (/guard|safety/.test(normalized)) return "safety";
  if (/translate/.test(normalized)) return "translation";
  if (/tts|voice|speaker|noise|\bbnr\b/.test(normalized)) return "speech";
  if (/esmfold|esm2/.test(normalized)) return "biology";
  if (/vision|\bvl\b|paligemma|omni|multimodal/.test(normalized)) return "vision-chat";
  if (/transfer|video-detector/.test(normalized)) return "video";
  if (/streampetr|bevformer|sparsedrive/.test(normalized)) return "autonomous-driving";
  if (/muse|image-gen/.test(normalized)) return "image-generation";
  return "chat";
}

export function isChatCompatibleKind(kind: NvidiaModelKind) { return kind === "chat" || kind === "vision-chat" || kind === "safety" || kind === "translation"; }
