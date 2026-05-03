"use client";

import { useCallback, useRef, useState } from "react";
import { api } from "@/trpc/react";
import type { RouterOutputs } from "@/trpc/react";
import { useStreamingPreference } from "@/features/settings/hooks/use-streaming-preference";

const LLM_CONTEXT_SIZE = 20;

export type Conversation = NonNullable<
  RouterOutputs["chat"]["getUserConversation"]
>;

export function useSendMessage(conversationId?: string, companionId?: string) {
  const utils = api.useUtils();
  const { enabled: streamingEnabled } = useStreamingPreference();

  const [isStreaming, setIsStreaming] = useState(false);
  const [hasFirstChunk, setHasFirstChunk] = useState(false);
  const streamingMessageIdRef = useRef<string | null>(null);

  const buildMutationInput = useCallback(
    (content: string) => {
      const currentMessages =
        utils.chat.getUserConversation.getData({ companionId: companionId! })?.messages ?? [];
      const contextMessages = currentMessages
        .slice(-(LLM_CONTEXT_SIZE - 1))
        .map(({ role, content }) => ({ role, content }));

      return {
        conversationId: conversationId!,
        companionId: companionId!,
        messages: contextMessages,
        newMessage: { role: "user" as const, content },
      };
    },
    [conversationId, companionId, utils],
  );

  const optimisticAddUserMessage = useCallback(
    (content: string) => {
      utils.chat.getUserConversation.setData({ companionId: companionId! }, (old) => {
        if (!old) return old;
        return {
          ...old,
          messages: [
            ...old.messages,
            {
              id: crypto.randomUUID(),
              role: "user" as const,
              content,
              conversationId: conversationId!,
              createdAt: new Date(),
            },
          ],
        };
      });
    },
    [conversationId, companionId, utils],
  );

  const sendMutation = api.chat.send.useMutation({
    onMutate: async ({ newMessage }) => {
      await utils.chat.getUserConversation.cancel();
      const previous = utils.chat.getUserConversation.getData({ companionId: companionId! });
      optimisticAddUserMessage(newMessage.content);
      return { previous };
    },
    onSuccess: (response) => {
      utils.chat.getUserConversation.setData({ companionId: companionId! }, (old) => {
        if (!old) return old;
        return { ...old, messages: [...old.messages, response] };
      });
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        utils.chat.getUserConversation.setData({ companionId: companionId! }, context.previous);
      }
    },
  });

  const sendStreamMutation = api.chat.sendStream.useMutation();

  const sendStreaming = useCallback(
    async (content: string) => {
      if (!conversationId || !companionId) return;

      const input = buildMutationInput(content);
      const previous = utils.chat.getUserConversation.getData({ companionId });
      const tempId = crypto.randomUUID();
      streamingMessageIdRef.current = tempId;

      await utils.chat.getUserConversation.cancel();
      optimisticAddUserMessage(content);
      setIsStreaming(true);
      setHasFirstChunk(false);

      try {
        const data = await sendStreamMutation.mutateAsync(input);

        let accumulated = "";
        let rafScheduled = false;
        let firstChunk = true;

        for await (const chunk of data.textStream) {
          accumulated += chunk;

          if (firstChunk) {
            firstChunk = false;
            setHasFirstChunk(true);
            utils.chat.getUserConversation.setData({ companionId }, (old) => {
              if (!old) return old;
              return {
                ...old,
                messages: [
                  ...old.messages,
                  {
                    id: tempId,
                    role: "assistant" as const,
                    content: accumulated,
                    conversationId,
                    createdAt: new Date(),
                  },
                ],
              };
            });
            continue;
          }

          if (!rafScheduled) {
            rafScheduled = true;
            requestAnimationFrame(() => {
              rafScheduled = false;
              const latest = accumulated;
              utils.chat.getUserConversation.setData({ companionId }, (old) => {
                if (!old) return old;
                return {
                  ...old,
                  messages: old.messages.map((m) =>
                    m.id === tempId ? { ...m, content: latest } : m,
                  ),
                };
              });
            });
          }
        }

        utils.chat.getUserConversation.setData({ companionId }, (old) => {
          if (!old) return old;
          return {
            ...old,
            messages: old.messages.map((m) =>
              m.id === tempId ? { ...m, content: accumulated } : m,
            ),
          };
        });

        setIsStreaming(false);
        setHasFirstChunk(false);
        streamingMessageIdRef.current = null;
        void utils.chat.getUserConversation.invalidate();
      } catch {
        setIsStreaming(false);
        setHasFirstChunk(false);
        streamingMessageIdRef.current = null;
        if (previous) {
          utils.chat.getUserConversation.setData({ companionId }, previous);
        }
      }
    },
    [conversationId, companionId, utils, sendStreamMutation, buildMutationInput, optimisticAddUserMessage],
  );

  const sendMessage = useCallback(
    (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || !conversationId || !companionId) return;
      if (sendMutation.isPending || isStreaming) return;

      if (streamingEnabled) {
        void sendStreaming(trimmed);
      } else {
        sendMutation.mutate(buildMutationInput(trimmed));
      }
    },
    [
      conversationId,
      companionId,
      sendMutation,
      isStreaming,
      streamingEnabled,
      sendStreaming,
      buildMutationInput,
    ],
  );

  return {
    sendMessage,
    isResponding: sendMutation.isPending || isStreaming,
    isStreaming: isStreaming && hasFirstChunk,
    streamingMessageId: streamingMessageIdRef.current,
    error:
      sendMutation.error?.message ?? sendStreamMutation.error?.message ?? null,
  };
}
