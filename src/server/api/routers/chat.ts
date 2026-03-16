import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { baseMessageSchema } from "@/features/ai/schemas";
import { OpenAILLM } from "@/features/ai/llm";
import { env } from "@/env";
import { MemoryService } from "@/features/memory/service";
import { OpenAIEmbedder } from "@/features/ai/embedding";
import { getMemoryContextPrompt } from "@/features/memory/prompts";

const llmCallInputSchema = z.object({
  conversationId: z.string(),
  companionId: z.string(),
  messages: z.array(baseMessageSchema),
  newMessage: baseMessageSchema,
});

export const chatRouter = createTRPCRouter({
  getUserConversation: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    let conversation = await ctx.db.conversation.findFirst({
      where: { userId },
      include: {
        companion: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    conversation ??= await ctx.db.conversation.create({
      data: {
        user: {
          connect: { id: userId },
        },
        companion: {
          create: {
            name: "Aimi",
            userId,
          },
        },
      },
      include: {
        companion: true,
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    return conversation;
  }),

  send: protectedProcedure
    .input(llmCallInputSchema)
    .mutation(async ({ ctx, input }) => {
      const openai = new OpenAILLM({
        apiKey: env.OPENAI_API_KEY,
        model: "gpt-5-mini-2025-08-07",
      });
      const embedder = new OpenAIEmbedder({
        apiKey: env.OPENAI_API_KEY,
        model: "text-embedding-3-small",
      });
      const memory = new MemoryService(ctx.db, embedder, openai);

      const [, memoryContext] = await Promise.all([
        ctx.db.conversation.findUniqueOrThrow({
          where: { id: input.conversationId, userId: ctx.session.user.id },
        }),
        memory.search({
          query: input.newMessage.content,
          userId: ctx.session.user.id,
          companionId: input.companionId,
          threshold: 0,
          limit: 20,
        }),
        ctx.db.message.create({
          data: {
            role: input.newMessage.role,
            content: input.newMessage.content,
            conversationId: input.conversationId,
          },
        }),
      ]);

      const assistantMessage = await openai.generateText([
        getMemoryContextPrompt(memoryContext.results),
        ...input.messages,
        input.newMessage,
      ]);

      void memory
        .add({
          messages: [input.newMessage],
          userId: ctx.session.user.id,
          companionId: input.companionId,
          metadata: { conversationId: input.conversationId },
        })
        .catch((err) => console.error("Background memory.add failed:", err));

      const savedAssistantMessage = await ctx.db.message.create({
        data: {
          ...assistantMessage,
          conversationId: input.conversationId,
        },
      });

      return savedAssistantMessage;
    }),
});
