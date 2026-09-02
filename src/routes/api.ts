// API Routes for Execution Engine
export const API_ROUTES = {
  // Intent understanding
  INTENT: "/api/v1/intent",
  
  // Tool execution
  EXECUTE: "/api/v1/execute",
  EXECUTE_TOOL: "/api/v1/execute/:toolId",
  
  // Verification
  VERIFY: "/api/v1/verify",
  VERIFY_TOOL: "/api/v1/verify/:toolId",
  
  // Workflow management
  WORKFLOWS: "/api/v1/workflows",
  WORKFLOW: "/api/v1/workflows/:workflowId",
  
  // Tool metadata and capabilities
  TOOLS: "/api/v1/tools",
  TOOL: "/api/v1/tools/:toolId",
  
  // Capability discovery
  CAPABILITIES: "/api/v1/capabilities",
} as const;