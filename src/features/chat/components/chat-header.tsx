import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot } from "lucide-react";

export function ChatHeader() {
  return (
    <div className="bg-background flex shrink-0 border-b px-4 py-3">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-sm font-semibold">Aimi</h1>
            <p className="text-muted-foreground text-xs">Your AI companion</p>
          </div>
        </div>
      </div>
    </div>
  );
}
