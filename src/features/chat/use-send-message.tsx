"use client";

import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";

const LLM_CONTEXT_SIZE = 20;

export type Conversation = NonNullable<
  RouterOutputs["chat"]["getUserConversation"]
>;

export function useSendMessage(conversationId?: string) {
  const utils = api.useUtils();

  const sendMutation = api.chat.send.useMutation({
    onMutate: async ({ newMessage }) => {
      await utils.chat.getUserConversation.cancel();

      const previous = utils.chat.getUserConversation.getData();

      utils.chat.getUserConversation.setData(undefined, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...old.messages,
            {
              id: crypto.randomUUID(),
              role: newMessage.role,
              content: newMessage.content,
              conversationId: conversationId!,
              createdAt: new Date(),
            },
          ],
        };
      });

      return { previous };
    },
    onSuccess: (response) => {
      utils.chat.getUserConversation.setData(undefined, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [...old.messages, response],
        };
      });
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        utils.chat.getUserConversation.setData(undefined, context.previous);
      }
    },
  });

  const sendMessage = (content: string) => {
    if (!conversationId) return;
    const trimmed = content.trim();
    if (!trimmed || sendMutation.isPending) return;

    const currentMessages =
      utils.chat.getUserConversation.getData()?.messages ?? [];

    const contextMessages = currentMessages
      .slice(-(LLM_CONTEXT_SIZE - 1))
      .map(({ role, content }) => ({ role, content }));

    sendMutation.mutate({
      conversationId,
      messages: contextMessages,
      newMessage: { role: "user", content: trimmed },
    });
  };

  return {
    sendMessage,
    isResponding: sendMutation.isPending,
    error: sendMutation.error?.message ?? null,
  };
}
