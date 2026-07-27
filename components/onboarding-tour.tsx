"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "makrd_tour_seen";

const STEPS = [
  {
    title: "Welcome to makrd",
    body: "A peer-to-peer 3D printing network. Let's take sixty seconds to show you around.",
  },
  {
    title: "1. Submit a job",
    body: "Upload a model, pick a material and quantity, and see the points cost instantly — before you commit to anything.",
  },
  {
    title: "2. A member nearby prints it",
    body: "Anyone with a registered printer can browse open jobs and accept the ones that fit their machine.",
  },
  {
    title: "3. Earn points printing for others",
    body: "No cash changes hands. Fulfilling a job earns you points; getting something printed spends them.",
  },
  {
    title: "4. Everything, in one dashboard",
    body: "Your printers, your jobs — as both requester and provider — and your points balance, all in one place.",
  },
];

export default function OnboardingTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Reads localStorage (unavailable during SSR) to decide whether to
    // auto-open on first visit — this one-time sync-from-external-system
    // read is the case React's effect docs call out as legitimate.
    if (!window.localStorage.getItem(SEEN_KEY)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(true);
    }
  }, []);

  function close() {
    window.localStorage.setItem(SEEN_KEY, "1");
    setIsOpen(false);
    setStep(0);
  }

  function open() {
    setStep(0);
    setIsOpen(true);
  }

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <>
      <button
        onClick={open}
        className="rounded-full px-5 py-2.5 text-sm font-medium text-neutral-600 underline underline-offset-4 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
      >
        Take the tour
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="glass-strong flex w-full max-w-md flex-col gap-6 rounded-3xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5">
              {STEPS.map((s, i) => (
                <span
                  key={s.title}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    i <= step ? "btn-gradient" : "bg-black/10 dark:bg-white/10"
                  }`}
                />
              ))}
            </div>

            <div>
              <h2 className="text-lg font-semibold">{current.title}</h2>
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{current.body}</p>
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={close}
                className="text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
              >
                Skip
              </button>
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-neutral-700 dark:hover:bg-white/10"
                  >
                    Back
                  </button>
                )}
                {isLast ? (
                  <a
                    href="/login"
                    className="btn-gradient rounded-full px-5 py-2 text-sm font-medium text-white"
                  >
                    Sign in with Google
                  </a>
                ) : (
                  <button
                    onClick={() => setStep((s) => s + 1)}
                    className="btn-gradient rounded-full px-5 py-2 text-sm font-medium text-white"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
