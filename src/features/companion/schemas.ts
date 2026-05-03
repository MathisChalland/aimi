import { z } from "zod";

export const PERSONALITY_TAGS = {
  emotional: ["supportive", "empathetic", "nurturing", "patient", "calm"],
  social: ["playful", "humorous", "sarcastic", "encouraging", "witty"],
  intellectual: ["curious", "philosophical", "intellectual", "direct"],
  energy: ["adventurous", "motivating"],
} as const;

export const ALL_PERSONALITY_TAGS = Object.values(PERSONALITY_TAGS).flat();

export const COMMUNICATION_STYLES = [
  "formal",
  "casual",
  "balanced",
  "concise",
  "expressive",
] as const;

export const companionConfigSchema = z.object({
  personalityTags: z.array(z.string()).max(5).default([]),
  customInstructions: z.string().max(500).nullable().default(null),
  communicationStyle: z.enum(COMMUNICATION_STYLES).default("balanced"),
});

export type CompanionConfig = z.infer<typeof companionConfigSchema>;

export interface CompanionContext extends CompanionConfig {
  name: string;
}
