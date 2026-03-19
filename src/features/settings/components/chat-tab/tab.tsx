"use client";

import { useConfirmationDialog } from "@/hooks/confirmation-dialog";
import {
  Setting,
  SettingsContent,
  SettingsGroup,
} from "../settings-components";
import { api } from "@/trpc/react";
import { AsyncButton } from "@/components/basic/async-action-button";

export function ChatTab() {
  const { confirm } = useConfirmationDialog();

  const utils = api.useUtils();

  const deleteChatHistory = api.chat.deleteChatHistory.useMutation({
    onSuccess: async () => {
      await utils.chat.getUserConversation.cancel();
      utils.chat.getUserConversation.setData(undefined, undefined);
      void utils.chat.invalidate();
    },
  });

  const handleDeleteHistory = async () => {
    const confirmed = await confirm({
      title: "Delete chat history?",
      description: "This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
    });
    if (confirmed) deleteChatHistory.mutate();
  };

  return (
    <SettingsContent>
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
