import { CANONICAL_ORIGIN } from "../data/siteConfig";

export function generateOpenApiJson(baseUrl: string = CANONICAL_ORIGIN): string {
  const origin = baseUrl === CANONICAL_ORIGIN ? baseUrl : CANONICAL_ORIGIN;
  const document = {
    openapi: "3.1.0",
    info: {
      title: "XFree.in Public API",
      version: "0.1.0",
      description: "Public health, AI, NVIDIA, contact, feedback, and lead endpoints used by XFree.in. Cloud AI endpoints require server-side provider configuration; no provider key is accepted from browsers.",
      license: { name: "MIT", url: "https://opensource.org/licenses/MIT" },
    },
    servers: [{ url: origin }],
    paths: {
      "/api/health": {
        get: { summary: "Liveness check", responses: { "200": { description: "Service process is responding" } } },
      },
      "/api/ready": {
        get: { summary: "Provider readiness", responses: { "200": { description: "Configured for available features" }, "503": { description: "Required cloud provider configuration is unavailable" } } },
      },
      "/api/ai": {
        post: {
          summary: "Run an allow-listed AI micro-task",
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["input"], properties: { taskId: { type: "string", default: "general" }, input: { type: "string", maxLength: 8000 } } } } } },
          responses: { "200": { description: "AI result" }, "400": { description: "Invalid task or payload" }, "429": { description: "Rate limited" }, "503": { description: "AI provider not configured" } },
        },
      },
      "/api/ai/batch": {
        post: { summary: "Run an allow-listed AI task over a bounded batch", responses: { "200": { description: "Batch result" }, "400": { description: "Invalid payload" }, "429": { description: "Rate limited" } } },
      },
      "/api/ai/chat": {
        post: { summary: "Multi-turn AI chat", responses: { "200": { description: "Assistant reply" }, "400": { description: "Invalid messages" }, "429": { description: "Rate limited" }, "503": { description: "AI provider not configured" } } },
      },
      "/api/ai/thinking": {
        post: { summary: "Server-governed reasoning request", responses: { "200": { description: "Reasoning answer" }, "400": { description: "Invalid prompt" }, "429": { description: "Rate limited" }, "503": { description: "AI provider not configured" } } },
      },
      "/api/nvidia/models": {
        get: { summary: "List NVIDIA models available to the configured account", responses: { "200": { description: "Available model list" }, "503": { description: "NVIDIA provider not configured" } } },
      },
      "/api/nvidia/validate": {
        post: { summary: "Validate an NVIDIA model selection", responses: { "200": { description: "Validation result" }, "400": { description: "Invalid model payload" } } },
      },
      "/api/nvidia/chat": {
        post: { summary: "NVIDIA chat completion with server-side model resolution", responses: { "200": { description: "Chat completion" }, "400": { description: "Invalid payload" }, "429": { description: "Rate limited" }, "503": { description: "NVIDIA provider not configured" } } },
      },
      "/api/contact": {
        post: { summary: "Submit a contact message", responses: { "200": { description: "Accepted" }, "400": { description: "Invalid payload" }, "429": { description: "Rate limited" }, "502": { description: "Delivery failed" } } },
      },
      "/api/feedback": {
        post: { summary: "Submit product feedback", responses: { "200": { description: "Accepted" }, "400": { description: "Invalid payload" }, "429": { description: "Rate limited" }, "502": { description: "Delivery failed" } } },
      },
      "/api/lead": {
        post: { summary: "Submit an explicitly consented lead request", responses: { "200": { description: "Accepted" }, "400": { description: "Invalid payload or missing consent" }, "429": { description: "Rate limited" }, "502": { description: "Delivery failed" } } },
      },
    },
  };
  return `${JSON.stringify(document, null, 2)}\n`;
}
