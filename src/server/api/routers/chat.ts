import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { baseMessageSchema } from "@/features/ai/schemas";
import { OpenAILLM } from "@/features/ai/llm";
import { env } from "@/env";
import { MemoryService } from "@/features/memory/service";
import { OpenAIEmbedder } from "@/features/ai/embedding";
import { getMemoryContextPrompt } from "@/features/memory/prompts";
import {
  companionConfigSchema,
  type CompanionContext,
} from "@/features/companion/schemas";
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

  const [memoryContext, companion] = await Promise.all([
    memory.search({
      query: input.newMessage.content,
      userId,
      companionId: input.companionId,
      threshold: 0,
      limit: 20,
    }),
    db.companion.findUniqueOrThrow({
      where: { id: input.companionId, userId },
      select: {
        name: true,
        personalityTags: true,
        customInstructions: true,
        communicationStyle: true,
      },
    }),
    db.message.create({
      data: {
        role: input.newMessage.role,
        content: input.newMessage.content,
        conversationId: input.conversationId,
      },
    }),
  ]);

  const companionContext: CompanionContext = {
    name: companion.name,
    personalityTags: companion.personalityTags,
    customInstructions: companion.customInstructions,
    communicationStyle:
      companion.communicationStyle as CompanionContext["communicationStyle"],
  };

  const llmInput: BaseMessage[] = [
    getMemoryContextPrompt(memoryContext.results, companionContext),
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
  getCompanions: protectedProcedure.query(async ({ ctx }) => {
    const companions = await ctx.db.companion.findMany({
      where: { userId: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        conversations: {
          select: {
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { createdAt: true },
            },
          },
          take: 1,
        },
      },
    });

    return companions
      .sort((a, b) => {
        const aTime =
          a.conversations[0]?.messages[0]?.createdAt?.getTime() ?? 0;
        const bTime =
          b.conversations[0]?.messages[0]?.createdAt?.getTime() ?? 0;
        return bTime - aTime;
      })
      .map(({ id, name }) => ({ id, name }));
  }),

  getUserConversation: protectedProcedure
    .input(z.object({ companionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      let conversation = await ctx.db.conversation.findFirst({
        where: { userId, companionId: input.companionId },
        include: {
          companion: true,
          messages: { orderBy: { createdAt: "asc" } },
        },
      });

      conversation ??= await ctx.db.conversation.create({
        data: {
          user: { connect: { id: userId } },
          companion: { connect: { id: input.companionId } },
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

  deleteChatHistory: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const conversation = await ctx.db.conversation.findFirst({
        where: { id: input.conversationId, userId },
      });
      if (!conversation) throw new Error("No conversation found");

      await ctx.db.message.deleteMany({
        where: { conversationId: conversation.id },
      });
    }),

  createCompanion: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.companion.create({
        data: { name: input.name, userId: ctx.session.user.id },
        select: { id: true, name: true },
      });
    }),

  renameCompanion: protectedProcedure
    .input(z.object({ companionId: z.string(), name: z.string().min(1).max(50) }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.companion.update({
        where: { id: input.companionId, userId: ctx.session.user.id },
        data: { name: input.name },
        select: { id: true, name: true },
      });
    }),

  deleteCompanion: protectedProcedure
    .input(z.object({ companionId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const count = await ctx.db.companion.count({ where: { userId } });
      if (count <= 1) throw new Error("Cannot delete your only companion");

      await ctx.db.companion.delete({
        where: { id: input.companionId, userId },
      });
    }),

  getCompanionConfig: protectedProcedure
    .input(z.object({ companionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.companion.findUniqueOrThrow({
        where: { id: input.companionId, userId: ctx.session.user.id },
        select: {
          personalityTags: true,
          customInstructions: true,
          communicationStyle: true,
        },
      });
    }),

  updateCompanionConfig: protectedProcedure
    .input(
      z.object({
        companionId: z.string(),
        config: companionConfigSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.companion.update({
        where: { id: input.companionId, userId: ctx.session.user.id },
        data: {
          personalityTags: input.config.personalityTags,
          customInstructions: input.config.customInstructions,
          communicationStyle: input.config.communicationStyle,
        },
        select: {
          personalityTags: true,
          customInstructions: true,
          communicationStyle: true,
        },
      });
    }),
});
