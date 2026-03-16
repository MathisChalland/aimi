"use client";

import { useEffect, useRef } from "react";
import {
  MessageBubble,
  MessageBubbleSkeleton,
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
  const hasInitializedScroll = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: hasInitializedScroll.current ? "smooth" : "auto",
    });
    hasInitializedScroll.current = true;
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

const skeletonEntries: {
  role: "user" | "assistant";
  width: string;
  lines: number;
}[] = [
  { role: "user", width: "w-80", lines: 3 },
  { role: "assistant", width: "w-96", lines: 2 },
  { role: "user", width: "w-96", lines: 1 },
  { role: "assistant", width: "w-xl", lines: 3 },
  { role: "user", width: "w-xs", lines: 2 },
  { role: "assistant", width: "w-xs", lines: 1 },
  { role: "user", width: "w-72", lines: 1 },
  { role: "assistant", width: "w-xs", lines: 4 },
  { role: "user", width: "w-xl", lines: 2 },
  { role: "assistant", width: "w-96", lines: 2 },
  { role: "user", width: "w-xs", lines: 2 },
  { role: "assistant", width: "w-xl", lines: 5 },
  { role: "user", width: "w-3xs", lines: 1 },
  { role: "assistant", width: "w-2xs", lines: 2 },
  { role: "user", width: "w-xs", lines: 1 },
  { role: "assistant", width: "w-xl", lines: 3 },
  { role: "user", width: "w-3xs", lines: 1 },
  { role: "assistant", width: "w-xl", lines: 6 },
  { role: "user", width: "w-96", lines: 2 },
  { role: "assistant", width: "w-3xs", lines: 1 },
];

export function MessageListSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-7.75", className)}>
      {skeletonEntries.map((entry, i) => (
        <MessageBubbleSkeleton key={i} {...entry} />
      ))}
    </div>
  );
}
