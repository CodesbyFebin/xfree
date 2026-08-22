import { GoogleGenAI } from "@google/genai";
import type { ContentGenerationProvider } from "./orchestrator";
import type { ToolGenerationSpec } from "./schemas";

function parseJsonResponse(value: string): unknown {
  const trimmed = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(trimmed);
}

export class GeminiContentGenerationProvider implements ContentGenerationProvider {
  private readonly client: GoogleGenAI;

  constructor(
    apiKey: string,
    private readonly model = "gemini-2.5-flash",
  ) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is required for content generation");
    this.client = new GoogleGenAI({ apiKey });
  }

  async generate(_spec: ToolGenerationSpec, prompt: string): Promise<unknown> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        temperature: 0.25,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        systemInstruction: [
          "Return one JSON object with exactly two top-level keys: content and metadata.",
          "content requires directAnswer, technicalDetails, instructions, examples, edgeCases, and faqs.",
          "metadata requires title, description, and h1.",
          "Never emit HTML, Markdown fences, canonical URLs, robots directives, schema markup, publication status, testimonials, users, or benchmarks.",
        ].join(" "),
      },
    });
    if (!response.text) throw new Error("Gemini returned an empty editorial response");
    return parseJsonResponse(response.text);
  }
}
