"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { GLASS_INPUT } from "@/lib/ui";

type Message = {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
};

export default function DirectMessageChat({
  currentUserId,
  otherUserId,
}: {
  currentUserId: string;
  otherUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data, error: loadError } = await supabase
        .from("direct_messages")
        .select("id, sender_id, recipient_id, content, created_at")
        .or(
          `and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})`,
        )
        .order("created_at", { ascending: true })
        .limit(200);

      if (loadError) {
        setError(loadError.message);
        return;
      }
      setMessages(data ?? []);
    }

    load();

    // RLS already scopes which rows this user can ever receive here (sender
    // or recipient), so an unfiltered subscription is safe — just filter to
    // this specific conversation before appending.
    const channel = supabase
      .channel(`dm_${[currentUserId, otherUserId].sort().join("_")}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "direct_messages" },
        (payload) => {
          const row = payload.new as Message;
          const belongsHere =
            (row.sender_id === currentUserId && row.recipient_id === otherUserId) ||
            (row.sender_id === otherUserId && row.recipient_id === currentUserId);
          if (belongsHere) {
            setMessages((prev) => [...prev, row]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;

    setSending(true);
    const supabase = createClient();
    const { error: sendError } = await supabase
      .from("direct_messages")
      .insert({ sender_id: currentUserId, recipient_id: otherUserId, content });
    setSending(false);

    if (!sendError) {
      setDraft("");
    } else {
      setError(sendError.message);
    }
  }

  return (
    <div className="glass-strong flex h-[32rem] flex-col rounded-3xl p-5">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((m) => {
            const isMine = m.sender_id === currentUserId;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    isMine
                      ? "btn-gradient text-white"
                      : "bg-black/5 text-neutral-700 dark:bg-white/10 dark:text-neutral-200"
                  }`}
                >
                  <p>{m.content}</p>
                  <p
                    className={`mt-0.5 text-[10px] ${isMine ? "text-white/70" : "text-neutral-400 dark:text-neutral-500"}`}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={1000}
          placeholder="Message…"
          className={`${GLASS_INPUT} flex-1`}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="btn-gradient rounded-full px-4 py-2 text-sm font-medium text-white transition-transform hover:scale-[1.03] active:scale-[0.98] disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
