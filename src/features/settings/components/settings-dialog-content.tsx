import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { SettingsDialogSidebar } from "./dialog-sidebar";
import { AccountSettings } from "./account-tab/tab";
import { authClient } from "@/server/better-auth/client";
import { MemoryTab } from "./memory-tab/tab";

export function SettingsDialogContent() {
  const [openTab, setOpenTab] = useState("account");

  const { data: session } = authClient.useSession();

  return (
    <DialogContent
      className="flex h-178.75 max-h-[calc(100vh-100px)] w-6xl max-w-[calc(100vw-10px)]! flex-col gap-0 overflow-hidden p-0 focus:outline-none sm:max-w-[calc(100vw-25px)]! md:max-w-[calc(100vw-100px)]!"
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <DialogTitle className="sr-only">Settings</DialogTitle>
      <DialogDescription className="sr-only">
        Customize your settings here.
      </DialogDescription>

      <SettingsDialogSidebar openTab={openTab} setOpenTab={setOpenTab}>
        <div className="flex h-full w-full flex-col overflow-y-auto">
          <div className="flex flex-1 flex-col px-3 py-9 sm:px-15">
            {openTab === "account" && <AccountSettings session={session} />}
            {openTab === "billing" && <div>Billing settings</div>}
            {openTab === "memory" && <MemoryTab />}
          </div>
        </div>
      </SettingsDialogSidebar>
    </DialogContent>
  );
}
