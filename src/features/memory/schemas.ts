import { z } from "zod";
import { baseMessageSchema } from "../ai/schemas";

export const ownedEntitySchema = z.object({
  id: z.string(),
  userId: z.string(),
});

export const memoryFiltersSchema = z.object({
  userId: z.string(),
  companionId: z.string().optional(),
});

export const memoryConfigSchema = z.object({
  dimension: z.number().int().positive().default(1536),
  customPrompt: z.string().optional(),
});

export const addMemoryInputSchema = z.object({
  messages: z.array(baseMessageSchema),
  userId: z.string(),
  companionId: z.string(),
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const searchMemoryInputSchema = z.object({
  query: z.string().min(1),
  userId: z.string(),
  companionId: z.string().optional(),
  threshold: z.number().min(0).max(1).optional(),
  limit: z.number().int().positive().max(200).default(20).optional(),
});

export const listMemoryInputSchema = z.object({
  userId: z.string(),
  companionId: z.string().optional(),
  limit: z.number().int().positive().max(200).default(100),
});

export const deleteAllMemoryInputSchema = z.object({
  userId: z.string(),
  companionId: z.string().optional(),
});

export const factExtractionSchema = z.object({
  facts: z
    .array(z.string())
    .describe(
      "Personal facts about the user extracted from the conversation. Each fact is a concise, atomic, third-person statement (e.g. 'User works at Stripe'). Empty array if no personal facts found.",
    ),
});

export const memoryActionSchema = z.object({
  memory: z.array(
    z.object({
      id: z
        .string()
        .describe(
          "Memory ID. Use the existing ID for UPDATE/DELETE/NONE. For ADD, generate a new unique numeric string ID.",
        ),
      text: z
        .string()
        .describe(
          "The memory content. For ADD/UPDATE: the new text. For DELETE/NONE: can be empty",
        ),
      event: z
        .enum(["ADD", "UPDATE", "DELETE", "NONE"])
        .describe(
          "ADD: new info not in memory. UPDATE: refines/extends an existing memory (same ID). DELETE: contradicted by a new fact. NONE: already captured.",
        ),
    }),
  ),
});

export type OwnedEntity = z.infer<typeof ownedEntitySchema>;
export type MemoryFilters = z.infer<typeof memoryFiltersSchema>;
export type MemoryConfig = z.infer<typeof memoryConfigSchema>;
export type AddMemoryInput = z.infer<typeof addMemoryInputSchema>;
export type SearchMemoryInput = z.infer<typeof searchMemoryInputSchema>;
export type ListMemoryInput = z.infer<typeof listMemoryInputSchema>;
export type DeleteAllMemoryInput = z.infer<typeof deleteAllMemoryInputSchema>;
export type FactExtraction = z.infer<typeof factExtractionSchema>;
export type MemoryAction = z.infer<typeof memoryActionSchema>;

export interface MemoryItem {
  id: string;
  memory: string;
  createdAt: Date;
  updatedAt: Date;
  score?: number;
  userId: string;
  companionId: string;
  metadata: Record<string, unknown>;
}

export interface SearchResult {
  results: MemoryItem[];
}
