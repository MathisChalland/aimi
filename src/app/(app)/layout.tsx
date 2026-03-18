import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";
import { TRPCReactProvider } from "@/trpc/react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DialogProvider } from "@/hooks/dialog-provider";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <TRPCReactProvider>
      <TooltipProvider>
        <DialogProvider>{children}</DialogProvider>
      </TooltipProvider>
    </TRPCReactProvider>
  );
}
