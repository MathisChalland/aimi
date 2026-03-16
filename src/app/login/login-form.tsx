"use client";
import { cn } from "@/lib/utils";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { AsyncButton } from "@/components/basic/async-action-button";
import { authClient } from "@/server/better-auth/client";
import { GoogleIcon } from "@/components/basic/icons";

export function LoginForm({ className }: { className?: string }) {
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = useSearchParams();
  const callbackURL = searchParams.get("callbackUrl") ?? "/";
  const error = searchParams.get("error");

  const signIn = async () => {
    setIsLoading(true);
    await authClient.signIn.social({
      provider: "google",
      callbackURL,
      errorCallbackURL: "/login",
    });
  };

  return (
    <div className={cn("flex flex-col gap-6 px-2", className)}>
      <AsyncButton
        variant="outline"
        className="hover:bg-primary/5 hover:text-accent-foreground w-full cursor-pointer"
        onClick={signIn}
        isLoading={isLoading}
      >
        <GoogleIcon className="size-4" />
        Continue with Google
      </AsyncButton>
      {error && <div className="text-center text-sm text-red-600">{error}</div>}
    </div>
  );
}
