"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useConfirmationDialog } from "@/hooks/confirmation-dialog";
import {
  Setting,
  SettingsContent,
  SettingsGroup,
} from "../settings-components";
import { api } from "@/trpc/react";
import { AsyncButton } from "@/components/basic/async-action-button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useStreamingPreference } from "@/features/settings/hooks/use-streaming-preference";
import { usePathname } from "next/navigation";
import { PersonalityTags } from "./personality-tags";
import { CommunicationStylePicker } from "./communication-style-picker";
import type { CompanionConfig } from "@/features/companion/schemas";

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

  const { data: config } = api.chat.getCompanionConfig.useQuery(
    { companionId: companionId! },
    { enabled: !!companionId },
  );

  const updateConfig = api.chat.updateCompanionConfig.useMutation({
    onMutate: async ({ companionId: cId, config: newConfig }) => {
      await utils.chat.getCompanionConfig.cancel({ companionId: cId });
      utils.chat.getCompanionConfig.setData({ companionId: cId }, {
        personalityTags: newConfig.personalityTags ?? [],
        customInstructions: newConfig.customInstructions ?? null,
        communicationStyle: newConfig.communicationStyle ?? "balanced",
      });
    },
  });

  const [localConfig, setLocalConfig] = useState<CompanionConfig>({
    personalityTags: [],
    customInstructions: null,
    communicationStyle: "balanced",
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (config) {
      setLocalConfig({
        personalityTags: config.personalityTags,
        customInstructions: config.customInstructions ?? null,
        communicationStyle:
          config.communicationStyle as CompanionConfig["communicationStyle"],
      });
    }
  }, [config]);

  const saveConfig = useCallback(
    (updated: CompanionConfig) => {
      if (!companionId) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        updateConfig.mutate({ companionId, config: updated });
      }, 800);
    },
    [companionId, updateConfig],
  );

  const saveConfigImmediate = useCallback(
    (updated: CompanionConfig) => {
      if (!companionId) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      updateConfig.mutate({ companionId, config: updated });
    },
    [companionId, updateConfig],
  );

  const handleTagsChange = (tags: string[]) => {
    const updated = { ...localConfig, personalityTags: tags };
    setLocalConfig(updated);
    saveConfigImmediate(updated);
  };

  const handleStyleChange = (style: string) => {
    const updated = {
      ...localConfig,
      communicationStyle: style as CompanionConfig["communicationStyle"],
    };
    setLocalConfig(updated);
    saveConfigImmediate(updated);
  };

  const handleInstructionsChange = (instructions: string) => {
    const updated = {
      ...localConfig,
      customInstructions: instructions || null,
    };
    setLocalConfig(updated);
    saveConfig(updated);
  };

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

      <SettingsGroup title="Companion Behavior">
        <div className="flex flex-col gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Personality</p>
            <p className="text-muted-foreground text-sm">
              Choose up to 5 traits that define your companion&apos;s
              personality.
            </p>
          </div>
          <PersonalityTags
            selected={localConfig.personalityTags}
            onChange={handleTagsChange}
          />
        </div>
        <Setting
          title="Communication style"
          description="How your companion phrases its responses."
        >
          <CommunicationStylePicker
            value={localConfig.communicationStyle}
            onChange={handleStyleChange}
          />
        </Setting>
        <div className="flex flex-col gap-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">Custom instructions</p>
            <p className="text-muted-foreground text-sm">
              Additional guidance for your companion. Tell it how to behave,
              what topics to focus on, or any other preferences.
            </p>
          </div>
          <div className="relative">
            <Textarea
              value={localConfig.customInstructions ?? ""}
              onChange={(e) => handleInstructionsChange(e.target.value)}
              placeholder="e.g. Always greet me by name. Focus on helping me with my creative writing projects."
              maxLength={500}
              className="min-h-24 resize-none"
            />
            <span className="text-muted-foreground absolute right-2 bottom-2 text-xs">
              {localConfig.customInstructions?.length ?? 0}/500
            </span>
          </div>
        </div>
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
