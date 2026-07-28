"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GLASS_INPUT } from "@/lib/ui";

type Mode = "password" | "otp-sent";

export default function EmailForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [mode, setMode] = useState<Mode>("password");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleSignIn(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setIsPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
  }

  async function handleSignUp() {
    if (!email || !password) {
      setError("Enter an email and password first");
      return;
    }
    setError(null);
    setInfo(null);
    setIsPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard` },
    });
    setIsPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo("Check your email to confirm your account, then come back and sign in.");
  }

  async function handleSendCode() {
    if (!email) {
      setError("Enter your email first");
      return;
    }
    setError(null);
    setInfo(null);
    setIsPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setIsPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setMode("otp-sent");
    setInfo("We sent a 6-digit code to your email — it's valid for a few minutes.");
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
    setIsPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
  }

  if (mode === "otp-sent") {
    return (
      <form onSubmit={handleVerifyCode} className="flex w-full flex-col gap-3 text-left">
        <label className="flex flex-col gap-1 text-sm">
          6-digit code
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            inputMode="numeric"
            autoFocus
            required
            className={GLASS_INPUT}
          />
        </label>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        {info && <p className="text-sm text-neutral-500 dark:text-neutral-400">{info}</p>}
        <button
          type="submit"
          disabled={isPending}
          className="btn-gradient rounded-full px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Verifying…" : "Verify code"}
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("password");
            setError(null);
            setInfo(null);
          }}
          className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-800 dark:hover:text-neutral-200"
        >
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSignIn} className="flex w-full flex-col gap-3 text-left">
      <label className="flex flex-col gap-1 text-sm">
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={GLASS_INPUT}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
          className={GLASS_INPUT}
        />
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {info && <p className="text-sm text-neutral-500 dark:text-neutral-400">{info}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="btn-gradient flex-1 rounded-full px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {isPending ? "Signing in…" : "Sign in"}
        </button>
        <button
          type="button"
          onClick={handleSignUp}
          disabled={isPending}
          className="flex-1 rounded-full border border-black/10 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/10"
        >
          Create account
        </button>
      </div>

      <button
        type="button"
        onClick={handleSendCode}
        disabled={isPending}
        className="text-xs text-neutral-500 underline underline-offset-2 hover:text-neutral-800 disabled:opacity-50 dark:hover:text-neutral-200"
      >
        Or email me a one-time code instead
      </button>
    </form>
  );
}
