import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { SettingsDialogSidebar } from "./dialog-sidebar";

export function SettingsDialogContent() {
  const [openTab, setOpenTab] = useState("account");

  return (
    <DialogContent
      className="flex h-178.75 max-h-[calc(100vh-100px)] w-6xl max-w-[calc(100vw-100px)]! flex-col gap-0 overflow-hidden p-0 focus:outline-none"
      onOpenAutoFocus={(e) => e.preventDefault()}
    >
      <DialogTitle className="sr-only">Settings</DialogTitle>
      <DialogDescription className="sr-only">
        Customize your settings here.
      </DialogDescription>

      <SettingsDialogSidebar openTab={openTab} setOpenTab={setOpenTab}>
        <div className="flex h-full w-full flex-col overflow-y-auto">
          <div className="flex flex-1 flex-col px-15 py-9">
            {openTab === "account" && <div>Account settings</div>}
            {openTab === "billing" && <div>Billing settings</div>}
            {openTab === "memory" && <div>Memory settings</div>}
          </div>
        </div>
      </SettingsDialogSidebar>
    </DialogContent>
  );
}
