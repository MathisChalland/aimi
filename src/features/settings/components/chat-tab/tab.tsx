"use client";

import { useConfirmationDialog } from "@/hooks/confirmation-dialog";
import {
  Setting,
  SettingsContent,
  SettingsGroup,
} from "../settings-components";
import { api } from "@/trpc/react";
import { AsyncButton } from "@/components/basic/async-action-button";
import { Switch } from "@/components/ui/switch";
import { useStreamingPreference } from "@/features/settings/hooks/use-streaming-preference";
import { usePathname } from "next/navigation";

export function ChatTab() {
  const { confirm } = useConfirmationDialog();
  const { enabled: streamingEnabled, toggle: toggleStreaming } =
    useStreamingPreference();

  const pathname = usePathname();
  const companionId = pathname.split("/chat/")[1];

  const utils = api.useUtils();
  const conversation = companionId
    ? utils.chat.getUserConversation.getData({ companionId })
    : undefined;

  const deleteChatHistory = api.chat.deleteChatHistory.useMutation({
    onSuccess: async () => {
      if (!companionId) return;
      await utils.chat.getUserConversation.cancel();
      utils.chat.getUserConversation.setData({ companionId }, undefined);
      void utils.chat.invalidate();
    },
  });

  const handleDeleteHistory = async () => {
    if (!conversation) return;
    const confirmed = await confirm({
      title: "Delete chat history?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    });
    if (confirmed) deleteChatHistory.mutate({ conversationId: conversation.id });
  };

  return (
    <SettingsContent>
      <SettingsGroup title="Response Behavior">
        <Setting
          title="Stream responses"
          description="Show the assistant's response as it's being generated with a typewriter effect."
        >
          <Switch
            checked={streamingEnabled}
            onCheckedChange={toggleStreaming}
          />
        </Setting>
      </SettingsGroup>
      <SettingsGroup title="Chat History">
        <Setting
          title="Delete chat history"
          description="Permanently delete the chat history with your companion. This will not delete any memories the companion has about you."
        >
          <AsyncButton
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={handleDeleteHistory}
            isLoading={deleteChatHistory.isPending}
          >
            Delete
          </AsyncButton>
        </Setting>
      </SettingsGroup>
    </SettingsContent>
  );
}
