import { z } from "zod";

export const promptSchema = z.object({
  prompt: z.string().min(1, "Invalid prompt"),
  sessionId: z.string().optional(),
  model: z.string().optional(),
});
export type PromptBody = z.infer<typeof promptSchema>;

export const updateSessionNameSchema = z.object({
  name: z.string().trim().min(1, "Invalid name"),
});
export type UpdateSessionNameBody = z.infer<typeof updateSessionNameSchema>;
