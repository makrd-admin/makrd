"use client";

import { BTN_PRIMARY } from "@/lib/ui";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="glass-strong flex flex-col items-center gap-4 rounded-3xl p-10">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="max-w-md text-sm text-neutral-500 dark:text-neutral-400">{error.message}</p>
        <button onClick={reset} className={BTN_PRIMARY}>
          Try again
        </button>
      </div>
    </main>
  );
}
