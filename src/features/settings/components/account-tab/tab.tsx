import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Setting,
  SettingsContent,
  SettingsGroup,
} from "../settings-components";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";
import { authClient, type Session } from "@/server/better-auth/client";
import { toast } from "sonner";
import { DeviceSessionsGroup } from "./session-group";
import { useState } from "react";
import { AsyncButton } from "@/components/basic/async-action-button";

interface Props {
  session: Session | null;
}

export const AccountSettings: React.FC<Props> = ({ session }) => {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () =>
    await authClient.signOut({
      fetchOptions: {
        onRequest: () => setIsSigningOut(true),
        onError: () => {
          toast.error("Error when signing out!");
        },
        onSuccess: () => redirect("/login"),
      },
    });
  return (
    <SettingsContent>
      <SettingsGroup title="Account">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <Avatar className="h-14.5 w-14.5 rounded-full">
              <AvatarImage
                src={session?.user.image ?? undefined}
                alt={session?.user.name ?? undefined}
              />
              <AvatarFallback className="rounded-lg">
                {session?.user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1 text-left text-sm leading-tight">
              {session?.user.name ? (
                <span className="truncate font-medium">
                  {session.user.name}
                </span>
              ) : (
                <Skeleton className="mb-1 h-4 w-24" />
              )}
              {session?.user.name ? (
                <span className="truncate text-xs">{session.user.email}</span>
              ) : (
                <Skeleton className="h-3 w-32" />
              )}
            </div>
          </div>
          <AsyncButton
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            isLoading={isSigningOut}
          >
            Log out
          </AsyncButton>
        </div>
      </SettingsGroup>

      <DeviceSessionsGroup session={session} />

      <SettingsGroup title="Danger zone">
        <Setting
          title="Delete my account"
          description="Permanently delete the account and all its data."
        >
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            Delete
          </Button>
        </Setting>
      </SettingsGroup>
    </SettingsContent>
  );
};
