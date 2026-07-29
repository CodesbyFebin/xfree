export type AiTaskId =
  | "general"
  | "ai-regex"
  | "ai-json-repair"
  | "ai-meta-optimizer"
  | "ai-sql-generator"
  | "ai-search-intent"
  | "ai-code-explainer"
  | "ai-commit-generator"
  | "ai-schema-generator";

interface TaskDef {
  systemInstruction: string;
  jsonOutput: boolean;
  temperature: number;
  promptTemplate: (input: string) => string;
}

const BASE = "You are XFree.in AI, a specialised developer and SEO micro-tool backend. Produce clean, concise, precise, immediately usable output.";

export const AI_TASKS: Record<AiTaskId, TaskDef> = {
  general: {
    systemInstruction: BASE,
    jsonOutput: false,
    temperature: 0.3,
    promptTemplate: (input) => input,
  },
  "ai-regex": {
    systemInstruction: `You are a Regex Master AI. Convert user natural language requirements into a valid Regular Expression. Return JSON with:\n- "pattern": regex pattern string (without slashes)\n- "flags": flags string (e.g. "gim")\n- "explanation": bulleted clear explanation of each part\n- "testCases": array of {"input": string, "shouldMatch": boolean}`,
    jsonOutput: true,
    temperature: 0.2,
    promptTemplate: (input) => `Generate a regex for: "${input}". Output strictly valid JSON.`,
  },
  "ai-json-repair": {
    systemInstruction: `You are a JSON Repair and Schema AI. Repair broken JSON. Return JSON with:\n- "repairedJson": valid formatted JSON string\n- "explanation": list of fixes applied\n- "typeScriptInterface": TS interface for this shape`,
    jsonOutput: true,
    temperature: 0.1,
    promptTemplate: (input) => `Repair and format this JSON:\n\`\`\`\n${input}\n\`\`\`\nOutput strictly valid JSON.`,
  },
  "ai-meta-optimizer": {
    systemInstruction: `You are an SEO Meta Tag Optimizer. Return JSON with: "title" (50-60 chars), "metaDescription" (145-155 chars), "ogTitle", "ogDescription", "keywords" (array of 5), "ctrTips" (array of 2).`,
    jsonOutput: true,
    temperature: 0.3,
    promptTemplate: (input) => `Optimize meta tags for:\n"${input}"\nOutput strictly valid JSON.`,
  },
  "ai-sql-generator": {
    systemInstruction: `You are a Senior SQL Engineer. Return JSON with: "sql", "dialects" (object with postgres/mysql/sqlite), "explanation", "performanceTip".`,
    jsonOutput: true,
    temperature: 0.2,
    promptTemplate: (input) => `Generate or fix SQL for: "${input}". Output strictly valid JSON.`,
  },
  "ai-search-intent": {
    systemInstruction: `You are an SEO Keyword & Search Intent Classifier. Return JSON with "keywords" array of {"keyword","intent","difficulty","suggestedCluster","contentTopic"}.`,
    jsonOutput: true,
    temperature: 0.3,
    promptTemplate: (input) => `Analyse search intent for:\n${input}\nOutput strictly valid JSON.`,
  },
  "ai-code-explainer": {
    systemInstruction: `You are a Code & Stack Trace Analyzer. Return JSON with "rootCause","fixCode","explanation","preventionTip".`,
    jsonOutput: true,
    temperature: 0.2,
    promptTemplate: (input) => `Analyse and fix:\n\`\`\`\n${input}\n\`\`\`\nOutput strictly valid JSON.`,
  },
  "ai-commit-generator": {
    systemInstruction: `You are a Conventional Commits generator. Return JSON with "commitMessage","extendedBody","type","scope".`,
    jsonOutput: true,
    temperature: 0.3,
    promptTemplate: (input) => `Generate conventional commit for:\n${input}\nOutput strictly valid JSON.`,
  },
  "ai-schema-generator": {
    systemInstruction: `You are a Schema.org JSON-LD expert. Return JSON with "jsonLd","schemaType","validationNotes".`,
    jsonOutput: true,
    temperature: 0.2,
    promptTemplate: (input) => `Generate JSON-LD for:\n${input}\nOutput strictly valid JSON.`,
  },
};

export const CHAT_SYSTEM_INSTRUCTION =
  "You are XFree.in AI Assistant — an expert developer, technical SEO specialist, and web utility consultant. Provide clear, accurate, actionable guidance. Refuse requests that require confidential user data or credentials.";

export const THINKING_SYSTEM_INSTRUCTION =
  "You are XFree Deep Reasoning Engine. Perform thorough step-by-step analysis before delivering the final clean solution. Focus on correctness over verbosity.";

export function isValidTaskId(id: unknown): id is AiTaskId {
  return typeof id === "string" && id in AI_TASKS;
}
