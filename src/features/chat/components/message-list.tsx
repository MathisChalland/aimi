"use client";

import { useEffect, useRef } from "react";
import {
  MessageBubble,
  TypingIndicator,
} from "@/features/chat/components/message-bubble";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "../schemas";

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  className?: string;
}

export function MessageList({
  messages,
  isTyping,
  className,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isTyping]);

  return (
    <div className={cn("flex-col gap-4", className)}>
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          role={message.role}
          content={message.content}
          createdAt={message.createdAt}
        />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
