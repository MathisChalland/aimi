import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { baseMessageSchema } from "@/features/ai/schemas";
import { OpenAILLM } from "@/features/ai/llm";
import { env } from "@/env";
import { MemoryService } from "@/features/memory/service";
import { OpenAIEmbedder } from "@/features/ai/embedding";
import { getMemoryContextPrompt } from "@/features/memory/prompts";
import { after } from "next/server";
import type { PrismaClient } from "@prisma/client";
import type { BaseMessage } from "@/features/ai/schemas";

const llmCallInputSchema = z.object({
  conversationId: z.string(),
  companionId: z.string(),
  messages: z.array(baseMessageSchema),
  newMessage: baseMessageSchema,
});

type LlmCallInput = z.infer<typeof llmCallInputSchema>;

async function prepareLlmCall(
  db: PrismaClient,
  input: LlmCallInput,
  userId: string,
) {
  const openai = new OpenAILLM({
    apiKey: env.OPENAI_API_KEY,
    model: "gpt-5-mini-2025-08-07",
  });
  const embedder = new OpenAIEmbedder({ apiKey: env.OPENAI_API_KEY });
  const memory = new MemoryService(db, embedder, openai);

  await db.conversation.findUniqueOrThrow({
    where: { id: input.conversationId, userId },
  });

  const [memoryContext] = await Promise.all([
    memory.search({
      query: input.newMessage.content,
      userId,
      companionId: input.companionId,
      threshold: 0,
      limit: 20,
    }),
    db.message.create({
      data: {
        role: input.newMessage.role,
        content: input.newMessage.content,
        conversationId: input.conversationId,
      },
    }),
  ]);

  const llmInput: BaseMessage[] = [
    getMemoryContextPrompt(memoryContext.results),
    ...input.messages,
    input.newMessage,
  ];

  return { openai, memory, llmInput };
}

function scheduleMemoryAdd(
  memory: MemoryService,
  input: LlmCallInput,
  userId: string,
) {
  after(async () => {
    try {
      await memory.add({
        messages: [input.newMessage],
        userId,
        companionId: input.companionId,
        metadata: { conversationId: input.conversationId },
      });
    } catch (err) {
      console.error("Background memory.add failed:", err);
    }
  });
}

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
      const userId = ctx.session.user.id;
      const { openai, memory, llmInput } = await prepareLlmCall(
        ctx.db,
        input,
        userId,
      );

      const assistantMessage = await openai.generateText({
        input: llmInput,
        reasoning: { effort: "low" },
      });

      const savedAssistantMessage = await ctx.db.message.create({
        data: {
          ...assistantMessage,
          conversationId: input.conversationId,
        },
      });

      scheduleMemoryAdd(memory, input, userId);

      return savedAssistantMessage;
    }),

  sendStream: protectedProcedure
    .input(llmCallInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const { openai, memory, llmInput } = await prepareLlmCall(
        ctx.db,
        input,
        userId,
      );

      const db = ctx.db;
      const conversationId = input.conversationId;

      async function* textStream() {
        let fullText = "";
        for await (const delta of openai.generateTextStream({
          input: llmInput,
          reasoning: { effort: "low" },
        })) {
          fullText += delta;
          yield delta;
        }

        await db.message.create({
          data: {
            role: "assistant",
            content: fullText,
            conversationId,
          },
        });

        scheduleMemoryAdd(memory, input, userId);
      }

      return { textStream: textStream() };
    }),

  deleteChatHistory: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const conversation = await ctx.db.conversation.findFirst({
      where: { userId },
    });
    if (!conversation) throw new Error("No conversation found");

    await ctx.db.message.deleteMany({
      where: {
        conversationId: conversation.id,
      },
    });
  }),
});
