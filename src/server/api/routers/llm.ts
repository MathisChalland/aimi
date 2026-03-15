import z from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import OpenAI from "openai";
import { TRPCError } from "@trpc/server";
import { baseMessageSchema } from "@/features/chat/schemas";

const llmCallInputSchema = z.object({
  messages: z.array(baseMessageSchema),
});

export const llmRouter = createTRPCRouter({
  send: protectedProcedure
    .input(llmCallInputSchema)
    .mutation(async ({ input }) => {
      const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const response = await client.chat.completions.create({
        model: "gpt-5-mini-2025-08-07",
        messages: input.messages,
      });

      const assistantMessage = response.choices[0]?.message;
      if (!assistantMessage)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "No response from LLM",
        });

      return {
        id: crypto.randomUUID(),
        role: assistantMessage.role,
        content: assistantMessage.content ?? "",
        createdAt: new Date(),
      };
    }),
});
