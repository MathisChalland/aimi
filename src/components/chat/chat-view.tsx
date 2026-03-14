"use client";

import { useState, useCallback } from "react";
import { MessageList } from "@/components/chat/message-list";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatHeader } from "@/components/chat/chat-header";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export function ChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);

  const handleSend = useCallback((content: string) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsSending(true);

    setTimeout(() => {
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `This is a placeholder response. You said: "${content.slice(0, 100)}"`,
        createdAt: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsSending(false);
    }, 3000);
  }, []);

  return (
    <div className="flex h-dvh w-full flex-col">
      <ChatHeader />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          isTyping={isSending}
          className="mx-auto w-full max-w-4xl px-4 py-6"
        />
      </div>
      <div className="bg-background shrink-0">
        <ChatInput onSend={handleSend} isLoading={isSending} />
      </div>
    </div>
  );
}
