import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import OpenAI from "openai";
import { TRPCError } from "@trpc/server";
import { baseMessageSchema } from "@/features/chat/schemas";

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

    if (!conversation) {
      conversation = await ctx.db.conversation.create({
        data: { userId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    return conversation;
  }),

  send: protectedProcedure
    .input(llmCallInputSchema)
    .mutation(async ({ ctx, input }) => {
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
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

      const llmResponse = await client.chat.completions.create({
        model: "gpt-5-mini-2025-08-07",
        messages: [...input.messages, input.newMessage],
      });

      const assistantMessage = llmResponse.choices[0]?.message;
      if (!assistantMessage)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No response from LLM",
        });

      const savedAssistantMessage = await ctx.db.message.create({
        data: {
          role: assistantMessage.role,
          content: assistantMessage.content ?? "",
          conversationId: input.conversationId,
        },
      });

      return savedAssistantMessage;
    }),
});
