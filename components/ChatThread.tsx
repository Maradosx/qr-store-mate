"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchMessages, sendMessage, markMessagesRead, type Message } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";

export function ChatThread({ restaurantId, meIsAdmin }: { restaurantId: string; meIsAdmin: boolean }) {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const refreshChatUnread = useShop((s) => s.refreshChatUnread);
  const [msgs, setMsgs] = useState<Message[] | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const m = await fetchMessages(restaurantId);
    setMsgs(m);
    await markMessagesRead(restaurantId);
    void refreshChatUnread();
  }, [restaurantId, refreshChatUnread]);

  useEffect(() => {
    if (!restaurantId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const ch = supabase
      .channel("msg-" + restaurantId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `restaurant_id=eq.${restaurantId}` },
        () => void load()
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [restaurantId, load]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    try {
      await sendMessage(restaurantId, body);
      await load();
    } catch {
      setText(body); // restore on failure
    } finally {
      setSending(false);
    }
  };

  const mineSender = meIsAdmin ? "admin" : "owner";

  return (
    <div className="flex h-[70dvh] flex-col overflow-hidden rounded-3xl bg-surface shadow-card ring-1 ring-line">
      <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
        {msgs === null ? (
          <div className="grid h-full place-items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-teal" />
          </div>
        ) : msgs.length === 0 ? (
          <div className="grid h-full place-items-center text-center text-sm text-muted">
            <div>
              <div className="text-4xl">💬</div>
              <p className="mt-2">
                {meIsAdmin
                  ? L("ยังไม่มีข้อความจากร้านนี้", "No messages from this shop yet")
                  : L("ส่งข้อความถึงทีมงานได้เลย เราจะรีบตอบกลับ", "Send us a message — we'll reply soon")}
              </p>
            </div>
          </div>
        ) : (
          msgs.map((m) => {
            const mine = m.sender === mineSender;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    mine ? "bg-teal text-white" : "bg-bg text-ink ring-1 ring-line"
                  }`}
                >
                  {!mine && (
                    <p className={`mb-0.5 text-[10px] font-bold ${m.sender === "admin" ? "text-teal-deep" : "text-muted"}`}>
                      {m.sender === "admin" ? L("ทีมงาน", "Team") : L("ร้าน", "Shop")}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-muted"}`}>
                    {new Date(m.created_at).toLocaleString(lang === "th" ? "th-TH" : "en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="flex items-center gap-2 border-t border-line p-3">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={L("พิมพ์ข้อความ…", "Type a message…")}
          className="flex-1 rounded-2xl border border-line bg-bg px-4 py-2.5 text-sm outline-none focus:border-teal"
        />
        <button
          onClick={send}
          disabled={sending || !text.trim()}
          className="rounded-2xl bg-teal px-5 py-2.5 text-sm font-bold text-white shadow-card active:scale-95 disabled:opacity-50"
        >
          {L("ส่ง", "Send")}
        </button>
      </div>
    </div>
  );
}
