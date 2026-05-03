"use client";
import { Button } from "@/components/ui/button";
import { SettingsDialogContent } from "@/features/settings/components/settings-dialog-content";
import { useDialog } from "@/hooks/dialog-provider";
import { MoreVertical, Phone } from "lucide-react";
import { useCallback } from "react";
import { CompanionSwitcher } from "./companion-switcher";

interface ChatHeaderProps {
  companionName?: string;
  currentCompanionId?: string;
}

export function ChatHeader({
  companionName = "Aimi",
  currentCompanionId,
}: ChatHeaderProps) {
  const { showDialog } = useDialog();
  const openSettings = useCallback(() => {
    showDialog(<SettingsDialogContent />);
  }, [showDialog]);

  return (
    <div className="bg-background flex shrink-0 border-b px-2 py-3">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
        {currentCompanionId ? (
          <CompanionSwitcher
            currentCompanionId={currentCompanionId}
            companionName={companionName}
          />
        ) : (
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-sm font-semibold">{companionName}</h1>
              <p className="text-muted-foreground text-xs">Your AI companion</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-lg">
            <Phone className="size-5" />
          </Button>
          <Button variant="ghost" size="icon-lg" onClick={openSettings}>
            <MoreVertical className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
