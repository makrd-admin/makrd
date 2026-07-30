"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { GLASS_INPUT } from "@/lib/ui";

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  sender_name: string;
};

export default function CommunityChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id ?? null);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, username, display_name");
      const nameMap: Record<string, string> = {};
      for (const p of profiles ?? []) {
        nameMap[p.id] = p.username ?? p.display_name ?? "A maKr";
      }

      const { data: history, error } = await supabase
        .from("community_messages")
        .select("id, user_id, content, created_at")
        .order("created_at", { ascending: true })
        .limit(100);

      if (error) {
        setLoadError(error.message);
        return;
      }

      setMessages(
        (history ?? []).map((m) => ({ ...m, sender_name: nameMap[m.user_id] ?? "A maKr" })),
      );

      channel = supabase
        .channel("community_messages_feed")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "community_messages" },
          (payload) => {
            const row = payload.new as Omit<Message, "sender_name">;
            setMessages((prev) => [
              ...prev,
              { ...row, sender_name: nameMap[row.user_id] ?? "A maKr" },
            ]);
          },
        )
        .subscribe();
    }

    load();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !userId) return;

    setSending(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("community_messages")
      .insert({ user_id: userId, content });
    setSending(false);

    if (!error) {
      setDraft("");
    } else {
      setLoadError(error.message);
    }
  }

  return (
    <div className="glass-strong flex h-[28rem] flex-col rounded-3xl p-5">
      <h2 className="mb-3 text-lg font-semibold">Community chat</h2>

      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            No messages yet — say hello to the network.
          </p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="text-sm">
              <span className="font-medium">{m.sender_name}</span>{" "}
              <span className="text-neutral-500 dark:text-neutral-400">
                {new Date(m.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <p className="text-neutral-700 dark:text-neutral-300">{m.content}</p>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {loadError && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{loadError}</p>}

      <form onSubmit={handleSend} className="mt-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={1000}
          placeholder="Say something to the network…"
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
