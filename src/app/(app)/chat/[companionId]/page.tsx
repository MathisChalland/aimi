"use client";

import {
  MessageList,
  MessageListSkeleton,
} from "@/features/chat/components/message-list";
import { ChatInput } from "@/features/chat/components/chat-input";
import { ChatHeader } from "@/features/chat/components/chat-header";
import { api } from "@/trpc/react";
import { useSendMessage } from "@/features/chat/use-send-message";
import { use } from "react";

export default function ChatPage({
  params,
}: {
  params: Promise<{ companionId: string }>;
}) {
  const { companionId } = use(params);
  const { data: conversation } = api.chat.getUserConversation.useQuery({
    companionId,
  });
  const { sendMessage, isResponding, isStreaming, streamingMessageId } =
    useSendMessage(conversation?.id, companionId);

  return (
    <div className="flex h-dvh w-full flex-col">
      <ChatHeader
        companionName={conversation?.companion.name}
        currentCompanionId={companionId}
      />
      <div data-scroll-container className="-mb-0.5 min-h-0 flex-1 overflow-y-auto">
        {conversation ? (
          <MessageList
            messages={conversation.messages}
            isTyping={isResponding}
            isStreaming={isStreaming}
            streamingMessageId={streamingMessageId}
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
