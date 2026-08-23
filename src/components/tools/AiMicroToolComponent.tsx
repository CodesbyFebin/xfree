import React from "react";
import type { ToolDefinition } from "../../types";
import { CloudAiMicroToolComponent } from "./CloudAiMicroToolComponent";
import { LocalEngineToolComponent } from "./LocalEngineToolComponent";

interface AiMicroToolProps {
  tool: ToolDefinition;
  onSaveHistory: (input: string, output: string) => void;
}

function isPublishedLocalEngineTool(tool: ToolDefinition): boolean {
  return tool.execution === "local" && Boolean(tool.toolComponent?.startsWith("local-engine:"));
}

/**
 * Runtime router retained at the legacy import path used by App.tsx.
 * Published local tools never fall through to the cloud AI endpoints.
 */
export const AiMicroToolComponent: React.FC<AiMicroToolProps> = (props) => {
  if (isPublishedLocalEngineTool(props.tool)) {
    return <LocalEngineToolComponent {...props} />;
  }
  return <CloudAiMicroToolComponent {...props} />;
};
