"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import MascotFace from "./mascot-face";

const DIALOGUE: { match: (path: string) => boolean; lines: string[] }[] = [
  {
    match: (p) => p === "/",
    lines: [
      "Ahoy! I'm Skipper. Sign in and I'll show you the ropes.",
      "Every great print starts with a single layer. Let's get going!",
    ],
  },
  {
    match: (p) => p === "/login",
    lines: ["No password to remember — just your Google account. Smooth sailing."],
  },
  {
    match: (p) => p === "/dashboard",
    lines: [
      "This is mission control — your printers, jobs, and points, all in one place.",
      "Quick actions are right there if you want to get straight to it.",
    ],
  },
  {
    match: (p) => p.startsWith("/printers/new"),
    lines: ["Pick a code word only you'll remember — we only ever store a hash of it."],
  },
  {
    match: (p) => p.startsWith("/printers"),
    lines: ["A registered printer that's active shows up for other maKrs to find."],
  },
  {
    match: (p) => p.startsWith("/jobs/new"),
    lines: ["I'll try to match this with a free maKr automatically — fingers crossed!"],
  },
  {
    match: (p) => p.startsWith("/jobs"),
    lines: [
      "Open jobs here are ones nobody's grabbed yet. Give one a home!",
      "Accepted a job? Head to its detail page to move it along.",
    ],
  },
  {
    match: (p) => p.startsWith("/community"),
    lines: ["Every maKr on the network, right here. Say hello!"],
  },
  {
    match: (p) => p.startsWith("/shop"),
    lines: ["Points aren't just for jobs — this is where you'll spend them on gear."],
  },
  {
    match: (p) => p.startsWith("/buy-points"),
    lines: ["Running low? A quick top-up with a card or UPI and you're back in business."],
  },
  {
    match: (p) => p.startsWith("/profile"),
    lines: ["A good display name helps other maKrs recognize you."],
  },
  {
    match: (p) =>
      p.startsWith("/announcements") || p.startsWith("/recycling") || p.startsWith("/polishing"),
    lines: ["This part of the network isn't live yet — but it's coming."],
  },
];

const DEFAULT_LINES = ["Need a hand? I'm right here.", "Fair winds and steady layers!"];

const FAQ = [
  {
    q: "What's a maKr?",
    a: "Anyone on the network — whoever's submitting a job, printing one, or both.",
  },
  {
    q: "How do points work?",
    a: "Printing a job for someone earns you points; getting something printed spends them. You can also buy points directly with a card or UPI if you need more.",
  },
  {
    q: "How do I get matched with a printer?",
    a: "Submit a job and I'll try to match it to a free maKr automatically. If nobody's free right now, it lists on the open jobs marketplace for someone to accept.",
  },
  {
    q: "What's the secret code word for?",
    a: "It proves you're really the one operating a printer you registered — an anti-fraud check. We only ever store a hash of it, never the word itself.",
  },
  {
    q: "Can I back out of a job I accepted?",
    a: "Yes — if you haven't started printing yet, you can release it back to the marketplace from the job's page.",
  },
  {
    q: "Can I buy points directly?",
    a: "Yes — head to Buy Points and top up with a card or UPI via Razorpay, no need to wait to earn them.",
  },
];

function getDialogue(pathname: string): string {
  const bucket = DIALOGUE.find((d) => d.match(pathname));
  const lines = bucket?.lines ?? DEFAULT_LINES;
  return lines[0];
}

export default function Mascot() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dialogue = getDialogue(pathname);

  return (
    <div className="fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      {isOpen && (
        <div className="glass-strong flex w-72 max-w-[calc(100vw-2rem)] flex-col gap-4 rounded-3xl p-5 sm:w-80">
          <div className="flex items-start gap-2">
            <MascotFace size={32} />
            <p className="text-sm text-neutral-700 dark:text-neutral-300">
              <span className="font-semibold">Skipper: </span>
              {dialogue}
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
              Ask me something
            </p>
            {FAQ.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl bg-black/5 px-3 py-2 dark:bg-white/5"
              >
                <summary className="cursor-pointer text-sm font-medium marker:content-none">
                  {item.q}
                </summary>
                <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close Skipper" : "Open Skipper, the maKrd mascot"}
        className="glass-strong flex items-center gap-2 rounded-full p-2 pr-4 shadow-lg transition-transform hover:scale-105"
      >
        <MascotFace size={36} />
        {!isOpen && (
          <span className="hidden max-w-40 truncate text-xs text-neutral-600 sm:inline dark:text-neutral-300">
            {dialogue}
          </span>
        )}
      </button>
    </div>
  );
}
