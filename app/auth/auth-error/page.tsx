import { BTN_PRIMARY } from "@/lib/ui";

export default function AuthErrorPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div className="glass-strong flex flex-col items-center gap-3 rounded-3xl p-10">
        <h1 className="text-2xl font-semibold">Sign-in failed</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Something went wrong completing sign-in. Please try again.
        </p>
        <a href="/login" className={BTN_PRIMARY}>
          Back to sign in
        </a>
      </div>
    </main>
  );
}
