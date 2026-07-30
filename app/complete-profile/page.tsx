import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import UsernameForm from "./username-form";

export const metadata: Metadata = { title: "Choose a Username · maKrd" };

export default async function CompleteProfilePage() {
  await requireUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
      <div className="glass-strong flex w-full max-w-sm flex-col items-center gap-6 rounded-3xl p-10 text-center">
        <div>
          <h1 className="text-2xl font-semibold">Pick a username</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            This is how other maKrs will see and message you — pick something unique. It can&apos;t
            be changed here later without asking us.
          </p>
        </div>
        <UsernameForm />
      </div>
    </main>
  );
}
