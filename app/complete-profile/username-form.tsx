"use client";

import { useActionState } from "react";
import { GLASS_INPUT } from "@/lib/ui";
import { setUsername, type SetUsernameState } from "./actions";

const initialState: SetUsernameState = { error: null };

export default function UsernameForm() {
  const [state, formAction, isPending] = useActionState(setUsername, initialState);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <label className="flex flex-col gap-1 text-left text-sm">
        Username
        <input
          name="username"
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]+"
          placeholder="e.g. mohit_k"
          className={GLASS_INPUT}
          autoFocus
        />
      </label>

      {state.error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800 dark:bg-red-950/60 dark:text-red-300">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="btn-gradient rounded-full px-4 py-2.5 text-sm font-medium text-white transition-transform hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Continue"}
      </button>
    </form>
  );
}
