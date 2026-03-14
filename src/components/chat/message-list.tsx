"use client";

import { useEffect, useRef } from "react";
import {
  MessageBubble,
  TypingIndicator,
} from "@/components/chat/message-bubble";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
}

interface MessageListProps {
  messages: Message[];
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
          role={message.role as "user" | "assistant"}
          content={message.content}
          createdAt={message.createdAt}
        />
      ))}
      {isTyping && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  );
}
