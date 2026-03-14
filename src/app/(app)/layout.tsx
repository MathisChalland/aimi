import { getSession } from "@/server/better-auth/server";
import { redirect } from "next/navigation";
import { TRPCReactProvider } from "@/trpc/react";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  if (!session) redirect("/login");

  return <TRPCReactProvider>{children}</TRPCReactProvider>;
}
