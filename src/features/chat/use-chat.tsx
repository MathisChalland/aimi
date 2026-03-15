"use client";

import { useCallback, useState } from "react";
import { api } from "@/trpc/react";
import type { ChatMessage } from "./schemas";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const sendMutation = api.llm.send.useMutation();

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed || sendMutation.isPending) {
      return;
    }

    setError(null);

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: trimmed,
      createdAt: new Date(),
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    try {
      const response = await sendMutation.mutateAsync({
        messages: nextMessages.map(({ role, content }) => ({ role, content })),
      });

      setMessages((prev) => [...prev, response]);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : "something went wrong",
      );
    }
  };

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isResponding: sendMutation.isPending,
    error,
    sendMessage,
    clearMessages,
  };
}
