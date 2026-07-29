import { z } from "zod";
import { AI_TASKS } from "./tasks";

const taskIdSchema = z.enum(Object.keys(AI_TASKS) as [string, ...string[]]);

export const AiRequestSchema = z.object({
  taskId: taskIdSchema.default("general"),
  input: z.string().trim().min(1, "Input required").max(8_000, "Input too long"),
});

export const AiBatchSchema = z.object({
  taskId: taskIdSchema,
  items: z.array(z.string().trim().min(1).max(2_000)).min(1).max(20),
});

export const AiChatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4_000),
      }),
    )
    .min(1)
    .max(20),
});

export const AiThinkingSchema = z.object({
  taskId: taskIdSchema.default("general"),
  prompt: z.string().trim().min(1).max(8_000),
});

export const ContactSchema = z.object({
  email: z.string().email().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(4_000),
  website: z.string().max(0).optional(),
});

export const LeadSchema = z.object({
  email: z.string().email().max(200),
  taskDescription: z.string().trim().min(3).max(1_000),
  recommendedToolSlug: z.string().max(200).optional(),
  recommendedToolTitle: z.string().max(300).optional(),
  source: z.enum(["popup", "exit-intent", "cta", "manual"]).default("popup"),
  path: z.string().max(500).optional(),
  consent: z.literal(true, { errorMap: () => ({ message: "consent required" }) }),
  website: z.string().max(0).optional(),
});

export const FeedbackSchema = z.object({
  category: z.enum(["bug", "feature", "general", "usability"]),
  message: z.string().trim().min(5).max(4_000),
  contact: z.string().max(200).optional().or(z.literal("")),
  toolId: z.string().max(120).optional(),
  toolTitle: z.string().max(200).optional(),
  path: z.string().max(500).optional(),
  website: z.string().max(0).optional(),
});
