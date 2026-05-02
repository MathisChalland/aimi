"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MessageBubble,
  MessageBubbleSkeleton,
  TypingIndicator,
} from "@/features/chat/components/message-bubble";
import { cn } from "@/lib/utils";
import { ArrowDown } from "lucide-react";
import type { ChatMessage } from "@/features/ai/schemas";

interface MessageListProps {
  messages: ChatMessage[];
  isTyping: boolean;
  isStreaming?: boolean;
  streamingMessageId?: string | null;
  className?: string;
}

export function MessageList({
  messages,
  isTyping,
  isStreaming,
  streamingMessageId,
  className,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const isStuckToBottom = useRef(true);
  const isProgrammaticScroll = useRef(false);
  const prevMessageCount = useRef(messages.length);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    const container = bottomRef.current?.closest(
      "[data-scroll-container]",
    ) as HTMLElement | null;
    scrollContainerRef.current = container;
    if (!container) return;

    let lastScrollTop = container.scrollTop;

    const handleScroll = () => {
      if (isProgrammaticScroll.current) return;
      const currentScrollTop = container.scrollTop;
      const distanceFromBottom =
        container.scrollHeight - currentScrollTop - container.clientHeight;

      if (currentScrollTop < lastScrollTop) {
        isStuckToBottom.current = false;
        setShowScrollButton(true);
      } else if (distanceFromBottom < 10) {
        isStuckToBottom.current = true;
        setShowScrollButton(false);
      }

      lastScrollTop = currentScrollTop;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const lastMessage = messages[messages.length - 1];
  const streamingContent = isStreaming ? lastMessage?.content : "";

  useEffect(() => {
    if (messages.length > prevMessageCount.current) {
      isStuckToBottom.current = true;
      setShowScrollButton(false);
    }
    prevMessageCount.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    if (!isStuckToBottom.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    isProgrammaticScroll.current = true;
    container.scrollTop = container.scrollHeight;
    requestAnimationFrame(() => {
      isProgrammaticScroll.current = false;
    });
  }, [messages.length, isTyping, streamingContent]);

  const scrollToBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    isStuckToBottom.current = true;
    setShowScrollButton(false);
    isProgrammaticScroll.current = true;
    container.scrollTop = container.scrollHeight;
    requestAnimationFrame(() => {
      isProgrammaticScroll.current = false;
    });
  }, []);

  return (
    <div className={cn("relative flex-col gap-4", className)}>
      {messages.map((message) =>
        message.role !== "system" ? (
          <MessageBubble
            key={message.id}
            role={message.role}
            content={message.content}
            createdAt={message.createdAt}
            isStreaming={isStreaming && message.id === streamingMessageId}
          />
        ) : null,
      )}
      {isTyping && !isStreaming && <TypingIndicator />}
      <div ref={bottomRef} />
      {showScrollButton && isStreaming && (
        <button
          onClick={scrollToBottom}
          className="bg-background/80 border-border text-muted-foreground hover:text-foreground fixed bottom-20 left-1/2 z-20 flex -translate-x-1/2 items-center justify-center rounded-full border p-2 shadow-md backdrop-blur-sm transition-colors"
        >
          <ArrowDown className="size-4" />
        </button>
      )}
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
