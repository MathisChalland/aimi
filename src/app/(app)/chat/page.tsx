import { getSession } from "@/server/better-auth/server";
import { db } from "@/server/db";
import { redirect } from "next/navigation";

export default async function ChatRedirectPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const latestMessage = await db.message.findFirst({
    where: { conversation: { userId: session.user.id } },
    orderBy: { createdAt: "desc" },
    select: { conversation: { select: { companionId: true } } },
  });

  if (latestMessage) {
    redirect(`/chat/${latestMessage.conversation.companionId}`);
  }

  const companion =
    (await db.companion.findFirst({
      where: { userId: session.user.id },
      select: { id: true },
    })) ??
    (await db.companion.create({
      data: { name: "Aimi", userId: session.user.id },
      select: { id: true },
    }));

  redirect(`/chat/${companion.id}`);
}
