"use client";

import {
  MessageList,
  MessageListSkeleton,
} from "@/features/chat/components/message-list";
import { ChatInput } from "@/features/chat/components/chat-input";
import { ChatHeader } from "@/features/chat/components/chat-header";
import { api } from "@/trpc/react";
import { useSendMessage } from "@/features/chat/use-send-message";

export default function ChatPage() {
  const { data: conversation } = api.chat.getUserConversation.useQuery();
  const { sendMessage, isResponding } = useSendMessage(conversation?.id);

  return (
    <div className="flex h-dvh w-full flex-col">
      <ChatHeader />
      <div className="-mb-0.5 min-h-0 flex-1 overflow-y-auto">
        {conversation ? (
          <MessageList
            messages={conversation.messages}
            isTyping={isResponding}
            className="mx-auto w-full max-w-4xl px-4 py-6"
          />
        ) : (
          <MessageListSkeleton className="mx-auto w-full max-w-4xl px-4 py-6" />
        )}
      </div>
      <div className="z-10 shrink-0">
        <ChatInput onSend={sendMessage} sendDisabled={isResponding} />
      </div>
    </div>
  );
}
