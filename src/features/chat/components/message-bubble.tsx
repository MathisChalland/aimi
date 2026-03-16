"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface MessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export function MessageBubble({
  role,
  content,
  createdAt,
}: MessageBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div className="flex max-w-[80%] flex-col gap-1">
        <Bubble isUser={isUser}>
          <p className="whitespace-pre-wrap">{content}</p>
        </Bubble>
        <Timestamp date={createdAt} className={cn(isUser && "text-right")} />
      </div>
    </div>
  );
}

interface BubbleProps {
  isUser: boolean;
  className?: string;
  children: ReactNode;
}

function Bubble({ isUser, className, children }: BubbleProps) {
  return (
    <div
      className={cn(
        "rounded-lg px-4 py-2.5 text-sm",
        isUser
          ? "bg-primary text-primary-foreground rounded-br-xs"
          : "bg-muted text-foreground rounded-bl-xs",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface TimestampProps {
  date: Date;
  className?: string;
}

function Timestamp({ date, className }: TimestampProps) {
  return (
    <span className={cn("text-muted-foreground text-xs", className)}>
      {new Intl.DateTimeFormat(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date)}
    </span>
  );
}

export function TypingIndicator() {
  return (
    <Bubble isUser={false} className="flex h-10 w-fit items-center gap-1">
      <span className="bg-muted-foreground size-1.5 animate-bounce rounded-full [animation-delay:-0.3s]" />
      <span className="bg-muted-foreground size-1.5 animate-bounce rounded-full [animation-delay:-0.15s]" />
      <span className="bg-muted-foreground size-1.5 animate-bounce rounded-full" />
    </Bubble>
  );
}

export function MessageBubbleSkeleton({
  role,
  width,
  lines = 1,
}: {
  role: "user" | "assistant";
  width: string;
  lines?: number;
}) {
  const isUser = role === "user";

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div className="flex max-w-[80%] flex-col gap-1">
        <Bubble isUser={isUser} className={cn("animate-pulse", width)}>
          <div className="flex flex-col gap-2">
            {Array.from({ length: lines + 1 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-3 rounded",
                  isUser ? "bg-primary-foreground/20" : "bg-foreground/10",
                  i === lines && "w-3/5",
                )}
              />
            ))}
          </div>
        </Bubble>
      </div>
    </div>
  );
}
