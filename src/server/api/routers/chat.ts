import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { baseMessageSchema } from "@/features/ai/schemas";
import { OpenAILLM } from "@/features/ai/llm";
import { env } from "@/env";

const llmCallInputSchema = z.object({
  conversationId: z.string(),
  messages: z.array(baseMessageSchema),
  newMessage: baseMessageSchema,
});

export const chatRouter = createTRPCRouter({
  getUserConversation: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    let conversation = await ctx.db.conversation.findFirst({
      where: { userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });

    conversation ??= await ctx.db.conversation.create({
      data: { userId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
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

      await ctx.db.conversation.findUniqueOrThrow({
        where: { id: input.conversationId, userId: ctx.session.user.id },
      });

      const userMessage = await ctx.db.message.create({
        data: {
          role: input.newMessage.role,
          content: input.newMessage.content,
          conversationId: input.conversationId,
        },
      });

      const assistantMessage = await openai.generateText([
        ...input.messages,
        input.newMessage,
      ]);

      const savedAssistantMessage = await ctx.db.message.create({
        data: {
          ...assistantMessage,
          conversationId: input.conversationId,
        },
      });

      return savedAssistantMessage;
    }),
});
