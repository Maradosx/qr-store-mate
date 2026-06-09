"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { useShop } from "@/lib/shop";
import { callStaff, addReview, fetchTableBill, fetchOrderStatus, type TableBill } from "@/lib/db";
import { subscribeShop } from "@/lib/realtime";
import type { OrderStatus } from "@/lib/mock";
import { baht } from "@/lib/format";
import { DishImage } from "./DishImage";
import { Check, Bell } from "./icons";

const STEPS = [
  { key: "status.received", icon: "📋" },
  { key: "status.cooking", icon: "🍳" },
  { key: "status.serving", icon: "🍽️" },
  { key: "status.done", icon: "✅" },
] as const;

const stepOf = (s: OrderStatus | null): number =>
  s === "done" ? STEPS.length : s === "serving" ? 2 : s === "cooking" ? 1 : 0;

// per-order status badge
const ST: Record<string, { th: string; en: string; cls: string }> = {
  received: { th: "รับออเดอร์แล้ว", en: "Received", cls: "bg-aqua/15 text-teal-deep" },
  cooking: { th: "กำลังปรุง", en: "Cooking", cls: "bg-coral/15 text-[#b23a1e]" },
  serving: { th: "กำลังเสิร์ฟ", en: "Serving", cls: "bg-gold/25 text-[#5b4708]" },
  done: { th: "เสร็จแล้ว", en: "Done", cls: "bg-success/15 text-[#0f7a47]" },
  cancelled: { th: "ยกเลิก", en: "Cancelled", cls: "bg-ink/10 text-ink/60" },
};

export function OrderScreen({ slug, table }: { slug: string; table: string }) {
  const { t, lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  // only show the success order if it belongs to THIS shop/table (guards shared/loaner devices)
  const lastOrder = useCart((s) => s.lastOrder);
  const order = lastOrder && lastOrder.ctx === `${slug}/${table}` ? lastOrder : null;
  const hydrateBySlug = useShop((s) => s.hydrateBySlug);
  const restaurantId = useShop((s) => s.restaurantId);
  const [bill, setBill] = useState<TableBill | null>(null);
  const [headStatus, setHeadStatus] = useState<OrderStatus | null>(null); // THIS order's live status (incl. cancelled)
  const [called, setCalled] = useState(false);
  const no = order?.no ?? null;

  const [rating, setRating] = useState(0);
  const [rComment, setRComment] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewErr, setReviewErr] = useState(false);

  const callStaffNow = async () => {
    if (!restaurantId || called) return;
    try {
      await callStaff(restaurantId, table);
      setCalled(true);
      window.setTimeout(() => setCalled(false), 5000);
    } catch {
      /* ignore */
    }
  };

  const submitReview = async () => {
    if (!restaurantId || rating === 0 || reviewing) return; // guard against double-submit
    setReviewing(true);
    setReviewErr(false);
    try {
      const c = rComment.trim();
      await addReview(restaurantId, rating, c || null, table); // send null, not ""
      setReviewed(true);
    } catch {
      setReviewErr(true); // surface the failure instead of faking success
    } finally {
      setReviewing(false);
    }
  };

  useEffect(() => {
    void hydrateBySlug(slug);
  }, [slug, hydrateBySlug]);

  // live: the WHOLE table's orders + per-order statuses (not just the last one) via the table-bill RPC,
  // pushed in realtime (kitchen advances/cancels, new orders from anyone at the table) + a slow fallback poll
  useEffect(() => {
    if (!restaurantId || !no) return;
    let alive = true;
    const poll = async () => {
      // table_bill filters out cancelled orders, so it can never report a cancel; fetch THIS order's
      // status separately (order_status has no cancelled filter) to drive the headline tracker
      const [b, s] = await Promise.all([
        fetchTableBill(restaurantId, table),
        fetchOrderStatus(restaurantId, no),
      ]);
      if (alive) {
        setBill(b);
        setHeadStatus(s);
      }
    };
    void poll();
    const unsub = subscribeShop(restaurantId, () => void poll()); // instant push
    const id = setInterval(poll, 15000); // safety-net fallback
    return () => {
      alive = false;
      unsub();
      clearInterval(id);
    };
  }, [restaurantId, table, no]);

  // no order in this session (e.g. opened the URL directly / reloaded) — don't fake a success screen
  if (!order) {
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center bg-bg px-6 text-center">
        <div>
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-surface shadow-card">🧾</div>
          <p className="font-display text-lg font-bold">{t("status.none")}</p>
          <Link
            href={`/r/${slug}/t/${table}`}
            className="mt-5 inline-block rounded-2xl bg-teal px-6 py-3 font-display font-bold text-white shadow-card"
          >
            {t("checkout.back")}
          </Link>
        </div>
      </div>
    );
  }

  const orders = bill?.orders ?? [];
  // the customer's own order status (from order_status, includes cancelled) drives the headline tracker
  const cancelled = headStatus === "cancelled";
  const cur = stepOf(headStatus);
  const combined = bill?.total ?? order.total;

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-bg pb-10">
      {/* header */}
      <header className={`relative overflow-hidden rounded-b-[28px] px-5 pb-7 pt-8 text-center text-white ${cancelled ? "bg-coral" : "bg-teal"}`}>
        <div className="dotgrid absolute inset-0 opacity-40" />
        <div className="relative">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white" style={{ animation: "rise .5s both" }}>
            <span className={cancelled ? "text-[#b23a1e]" : "text-teal"}>{cancelled ? <span className="text-2xl font-extrabold">✕</span> : <Check size={32} />}</span>
          </div>
          <h1 className="mt-3 font-display text-2xl font-extrabold">{cancelled ? t("status.cancelledTitle") : t("status.placed")}</h1>
          <p className="mt-1 text-sm text-white/85">{cancelled ? t("status.cancelledSub") : t("status.placedSub")}</p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-bold ring-1 ring-white/25">
            {t("status.orderNo")} {order.no} · {t("table")} {table}
          </div>
        </div>
      </header>

      {/* tracker for the customer's latest order */}
      {cancelled ? (
        <section className="px-6 pt-7">
          <div className="rounded-3xl bg-coral/10 p-5 text-center text-sm font-semibold text-[#b23a1e] ring-1 ring-coral/30">
            {t("status.cancelledSub")}
          </div>
        </section>
      ) : (
        <section className="px-6 pt-7">
          <div className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-success">
            <span className="h-2 w-2 rounded-full bg-success" style={{ animation: "pulse-ring 1.8s infinite" }} />
            {t("status.live")}
          </div>
          <ol className="relative">
            {STEPS.map((s, i) => {
              const done = i < cur;
              const active = i === cur;
              return (
                <li key={s.key} className="relative flex gap-4 pb-7 last:pb-0">
                  {i < STEPS.length - 1 && (
                    <span className={`absolute left-[18px] top-9 h-[calc(100%-20px)] w-0.5 ${done ? "bg-teal" : "bg-line"}`} />
                  )}
                  <span
                    className={`relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold transition ${
                      done ? "bg-teal text-white" : active ? "bg-coral text-white" : "bg-surface text-muted ring-1 ring-line"
                    }`}
                    style={active ? { animation: "pulse-ring 1.6s infinite" } : undefined}
                  >
                    {done ? <Check size={16} /> : i + 1}
                  </span>
                  <div className="pt-1">
                    <p className={`font-display font-bold ${active ? "text-[#b23a1e]" : done ? "text-ink" : "text-muted"}`}>{t(s.key)}</p>
                    {active && <p className="mt-0.5 text-xs text-muted">{t("status.inProgress")}</p>}
                    {done && <p className="mt-0.5 text-xs text-muted">{t("status.doneShort")}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {/* ALL of this table's orders (everyone), each with its own live status */}
      <section className="mx-5 mt-3">
        <h2 className="mb-2 font-display text-sm font-extrabold">{L("รายการทั้งหมดในโต๊ะนี้", "All orders at this table")}</h2>
        {bill === null ? (
          <div className="grid place-items-center py-10">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-teal" />
          </div>
        ) : orders.length === 0 ? (
          <p className="rounded-3xl bg-surface p-5 text-center text-sm text-muted shadow-card ring-1 ring-line">{L("ยังไม่มีรายการ", "No items yet")}</p>
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const st = ST[o.status] ?? ST.received;
              const sub = o.items.reduce((s, i) => s + i.unit_price * i.qty, 0);
              const isMine = o.order_no === order.no;
              return (
                <div key={o.order_no} className={`rounded-3xl bg-surface p-4 shadow-card ring-1 ${isMine ? "ring-teal/40" : "ring-line"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-extrabold">
                      {o.order_no}
                      {isMine && <span className="ml-1.5 text-[11px] font-bold text-teal-deep">· {L("ของคุณ", "yours")}</span>}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>{L(st.th, st.en)}</span>
                  </div>
                  <ul className="mt-3 space-y-2 border-t border-dashed border-line pt-3">
                    {o.items.map((i, idx) => {
                      const addonLbl = lang === "th" ? (i.addon_label_th || i.addon_label_en) : (i.addon_label_en || i.addon_label_th);
                      const extras = [addonLbl || "", i.spice ? t(i.spice as never) : "", i.note ?? ""].filter(Boolean).join(" · ");
                      return (
                        <li key={idx} className="flex items-start gap-3">
                          <DishImage tone={i.tone} emoji={i.emoji} emojiSize={18} className="h-9 w-9 shrink-0 rounded-lg" />
                          <span className="min-w-0 flex-1 text-sm">
                            <span className="text-muted">{i.qty}× </span>
                            {lang === "th" ? i.name_th : i.name_en}
                            {extras && <span className="mt-0.5 block text-xs font-semibold text-[#b23a1e]">↳ {extras}</span>}
                          </span>
                          <span className="shrink-0 text-sm font-semibold text-muted">{baht(i.unit_price * i.qty)}</span>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-2 flex justify-end text-sm font-bold text-teal-deep">{baht(sub)}</div>
                </div>
              );
            })}
            <div className="flex items-center justify-between rounded-3xl bg-teal-deep px-5 py-3.5 text-white shadow-card">
              <span className="font-display font-bold">{L("รวมทั้งโต๊ะ", "Table total")}</span>
              <span className="font-display text-lg font-extrabold">{baht(combined)}</span>
            </div>
          </div>
        )}
      </section>

      {/* review */}
      <section className="mx-5 mt-3 rounded-3xl bg-surface p-4 shadow-card ring-1 ring-line">
        {reviewed ? (
          <p className="py-2 text-center text-sm font-bold text-success">⭐ {t("review.thanks")}</p>
        ) : (
          <>
            <h2 className="mb-2 text-center font-display text-sm font-extrabold">{t("review.title")}</h2>
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} aria-label={`${n}`} className="text-3xl leading-none transition active:scale-90">
                  <span style={{ filter: n <= rating ? "none" : "grayscale(1)", opacity: n <= rating ? 1 : 0.35 }}>⭐</span>
                </button>
              ))}
            </div>
            <textarea
              value={rComment}
              onChange={(e) => setRComment(e.target.value)}
              rows={2}
              placeholder={t("review.placeholder")}
              className="mt-3 w-full resize-none rounded-2xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-teal"
            />
            <button
              onClick={submitReview}
              disabled={rating === 0 || reviewing}
              className="mt-2 w-full rounded-2xl bg-teal py-2.5 font-display text-sm font-bold text-white active:scale-[.99] disabled:opacity-50"
            >
              {reviewing ? "…" : t("review.submit")}
            </button>
            {reviewErr && (
              <p className="mt-2 text-center text-xs font-semibold text-[#b23a1e]">{t("review.failed")}</p>
            )}
          </>
        )}
      </section>

      {/* actions */}
      <div className="mt-5 space-y-3 px-5">
        {/* primary: the whole-table combined bill (pay once at the end) */}
        <Link
          href={`/r/${slug}/t/${table}/bill`}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal-deep py-3.5 font-display font-bold text-white shadow-pop active:scale-[.99]"
        >
          🧾 {L("ดูบิล / จ่ายทั้งโต๊ะ", "View / pay the table bill")}
        </Link>
        <div className="flex gap-3">
          <button
            onClick={callStaffNow}
            disabled={called}
            className={`flex flex-1 items-center justify-center gap-2 rounded-2xl py-3.5 font-display font-bold shadow-card ring-1 active:scale-[.99] ${
              called ? "bg-success/15 text-success ring-success/30" : "bg-surface text-teal-deep ring-line"
            }`}
          >
            <Bell size={18} /> {called ? t("status.called") : t("status.callStaff")}
          </button>
          <Link
            href={`/r/${slug}/t/${table}`}
            className="flex flex-1 items-center justify-center rounded-2xl bg-teal py-3.5 font-display font-bold text-white shadow-card active:scale-[.99]"
          >
            ＋ {L("สั่งเพิ่ม", "Order more")}
          </Link>
        </div>
      </div>
    </div>
  );
}
