import { z } from "zod";

export const TypingEntitySchema = z.object({
  id: z.string(),
  text: z.string(),
  description: z.string(),
});

export type TypingEntity = z.infer<typeof TypingEntitySchema>;
