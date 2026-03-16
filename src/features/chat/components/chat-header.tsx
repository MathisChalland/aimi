import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bot, MoreVertical, Phone } from "lucide-react";

interface ChatHeaderProps {
  companionName?: string;
}

export function ChatHeader({ companionName = "Aimi" }: ChatHeaderProps) {
  return (
    <div className="bg-background flex shrink-0 border-b px-2 py-3">
      <div className="mx-auto flex w-full max-w-4xl items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="size-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-sm font-semibold">{companionName}</h1>
            <p className="text-muted-foreground text-xs">Your AI companion</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon-lg">
            <Phone className="size-5" />
          </Button>
          <Button variant="ghost" size="icon-lg">
            <MoreVertical className="size-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
