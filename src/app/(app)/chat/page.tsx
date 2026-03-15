"use client";

import { MessageList } from "@/features/chat/components/message-list";
import { ChatInput } from "@/features/chat/components/chat-input";
import { ChatHeader } from "@/features/chat/components/chat-header";
import { useChat } from "@/features/chat/use-chat";

export default function ChatPage() {
  const { messages, isResponding, sendMessage } = useChat();

  return (
    <div className="flex h-dvh w-full flex-col">
      <ChatHeader />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <MessageList
          messages={messages}
          isTyping={isResponding}
          className="mx-auto w-full max-w-4xl px-4 py-6"
        />
      </div>
      <div className="bg-background shrink-0">
        <ChatInput onSend={sendMessage} isLoading={isResponding} />
      </div>
    </div>
  );
}
