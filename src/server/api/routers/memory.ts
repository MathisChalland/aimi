import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { OpenAIEmbedder } from "@/features/ai/embedding";
import { OpenAILLM } from "@/features/ai/llm";
import { MemoryService } from "@/features/memory/service";
import { env } from "@/env";

const searchMemoryInputSchema = z.object({
  query: z.string().min(1),
  companionId: z.string().optional(),
  threshold: z.number().min(0).max(1).optional(),
  limit: z.number().int().positive().max(200).default(20).optional(),
});

export const memoryRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const memories = await ctx.db.memory.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        content: true,
        updatedAt: true,
      },
    });
    return memories;
  }),

  search: protectedProcedure
    .input(searchMemoryInputSchema)
    .query(async ({ ctx, input }) => {
      const embedder = new OpenAIEmbedder({
        apiKey: env.OPENAI_API_KEY,
      });
      const openai = new OpenAILLM({
        apiKey: env.OPENAI_API_KEY,
        model: "gpt-5-mini-2025-08-07",
      });
      const memoryService = new MemoryService(ctx.db, embedder, openai);

      const result = await memoryService.search({
        query: input.query,
        userId: ctx.session.user.id,
        companionId: input.companionId,
        threshold: input.threshold,
        limit: input.limit,
      });

      return result.results;
    }),
});
