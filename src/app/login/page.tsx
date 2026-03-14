import { auth } from "@/server/better-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/");
  return (
    <div className="bg-muted flex min-h-dvh w-full flex-col overscroll-none">
      <div className="mx-auto my-5 mt-[35vh] w-full max-w-3xl">
        <div className="mb-10 flex w-full items-center justify-center gap-5">
          <h1 className="text-primary/90 text-center font-serif text-4xl font-extralight">
            Aimi
          </h1>
        </div>
        <div className="w-full">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
