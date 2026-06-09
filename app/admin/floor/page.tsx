"use client";

import { useCallback, useEffect, useState } from "react";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import type { OrderStatus, ShopOrder } from "@/lib/mock";
import { fetchServiceCalls, resolveTableCalls, payMethodTH, payMethodEN, type CallReason, type PayMethod } from "@/lib/db";
import { subscribeCalls } from "@/lib/realtime";
import { baht } from "@/lib/format";
import { PageTitle } from "@/components/admin/ui";

const OVERDUE_MIN = 15;

const SMETA: Record<OrderStatus, { th: string; en: string; cls: string }> = {
  received: { th: "รับออเดอร์", en: "Received", cls: "bg-aqua/15 text-teal-deep" },
  cooking: { th: "กำลังปรุง", en: "Cooking", cls: "bg-coral/15 text-[#b23a1e]" },
  serving: { th: "กำลังเสิร์ฟ", en: "Serving", cls: "bg-gold/25 text-[#5b4708]" },
  done: { th: "เสร็จแล้ว", en: "Done", cls: "bg-success/15 text-[#0f7a47]" },
  cancelled: { th: "ยกเลิก", en: "Cancelled", cls: "bg-ink/10 text-ink/60" },
};
const NEXT: Record<OrderStatus, OrderStatus | null> = { received: "cooking", cooking: "serving", serving: "done", done: null, cancelled: null };
const PREV: Record<OrderStatus, OrderStatus | null> = { received: null, cooking: "received", serving: "cooking", done: "serving", cancelled: null };

type Tone = "idle" | "new" | "cooking" | "ready" | "overdue";
// each state gets a distinct hue + a solid dot so they're unmistakable at a glance
// (gray=idle · teal=new · amber=cooking · green=ready · red=overdue · coral ring is reserved for 🔔 called)
const TONE: Record<Tone, { box: string; dot: string }> = {
  idle: { box: "bg-surface ring-line", dot: "bg-muted/40" },
  new: { box: "bg-teal/10 ring-teal", dot: "bg-teal" },
  cooking: { box: "bg-gold/20 ring-gold", dot: "bg-gold" },
  ready: { box: "bg-success/15 ring-success", dot: "bg-success" },
  overdue: { box: "bg-danger/15 ring-danger", dot: "bg-danger" },
};

function toneOf(open: ShopOrder[]): Tone {
  if (open.length === 0) return "idle";
  const now = Date.now();
  const overdue = open.some(
    (o) => (o.status === "received" || o.status === "cooking") && o.ts && now - new Date(o.ts).getTime() > OVERDUE_MIN * 60_000
  );
  if (overdue) return "overdue";
  if (open.some((o) => o.status === "received")) return "new";
  if (open.some((o) => o.status === "cooking")) return "cooking";
  return "ready";
}

// module-level (kept out of render so Date.now() doesn't trip the React purity rule)
const waitMinutes = (o: ShopOrder): number => (o.ts ? Math.round((Date.now() - new Date(o.ts).getTime()) / 60000) : 0);
const isOverdue = (o: ShopOrder): boolean => (o.status === "received" || o.status === "cooking") && waitMinutes(o) >= OVERDUE_MIN;

export default function FloorPage() {
  const { lang, tr, t } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const tables = useShop((s) => s.tables);
  const orders = useShop((s) => s.orders);
  const setStatus = useShop((s) => s.setOrderStatus);
  const payTableBill = useShop((s) => s.payTableBill);
  const unpayTableBill = useShop((s) => s.unpayTableBill);
  const restaurantId = useShop((s) => s.restaurantId);
  const [sel, setSel] = useState<string | null>(null);
  const [calls, setCalls] = useState<Map<string, { reason: CallReason; method: PayMethod | null }>>(new Map());
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false); // guards pay/unpay against double-clicks

  const loadCalls = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const rows = await fetchServiceCalls(restaurantId);
      const m = new Map<string, { reason: CallReason; method: PayMethod | null }>();
      for (const r of rows) if (r.reason === "bill" || !m.has(r.table_no)) m.set(r.table_no, { reason: r.reason, method: r.pay_method }); // bill wins the table badge
      setCalls(m);
    } catch {
      /* transient failure — keep current calls, don't flicker the rings */
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCalls();
    const unsub = subscribeCalls(restaurantId, () => void loadCalls()); // instant push on call-staff
    const id = setInterval(loadCalls, 30000); // safety-net fallback
    return () => {
      unsub();
      clearInterval(id);
    };
  }, [restaurantId, loadCalls]);

  const openOf = (no: string) => orders.filter((o) => o.table === no && !o.paidAt && o.status !== "cancelled");
  const paidRecentlyOf = (no: string) => orders.filter((o) => o.table === no && o.paidAt);

  const toneLabel: Record<Tone, string> = {
    idle: L("ว่าง", "Open"),
    new: L("ออเดอร์ใหม่", "New order"),
    cooking: L("กำลังปรุง", "Cooking"),
    ready: L("พร้อมเสิร์ฟ / รอเก็บเงิน", "Ready / to bill"),
    overdue: L("ตกค้าง!", "Overdue!"),
  };

  const selOpen = sel ? openOf(sel) : [];
  const selTotal = selOpen.reduce((s, o) => s + o.total, 0);
  const canUnpay = sel ? selOpen.length === 0 && paidRecentlyOf(sel).length > 0 : false;

  const pay = async (no: string) => {
    if (busy) return;
    const open = openOf(no);
    const total = open.reduce((s, o) => s + o.total, 0); // fresh total at confirm time
    if (total <= 0) {
      setSel(null);
      return;
    }
    // guard against collecting before the food is fully served: closing the bill also marks every
    // unpaid order paid, which pulls any still-unserved ticket OUT of the kitchen — so warn first.
    const pending = open.filter((o) => o.status !== "done").length;
    const warn = pending > 0
      ? L(
          `⚠️ ยังมี ${pending} รายการที่ยังไม่ได้เสิร์ฟ — ถ้าปิดบิลตอนนี้ รายการเหล่านั้นจะถูกปิด/หลุดจากครัวไปด้วย\n\n`,
          `⚠️ ${pending} item(s) not served yet — closing now will close them and drop them from the kitchen.\n\n`,
        )
      : "";
    if (window.confirm(warn + L(`เก็บเงินโต๊ะ ${no} รวม ${baht(total)} และปิดบิล?`, `Bill table ${no} for ${baht(total)} and close it?`))) {
      setBusy(true);
      const ok = await payTableBill(no);
      setBusy(false);
      if (ok) setSel(null);
      else setErr(L("เก็บเงินไม่สำเร็จ กรุณาลองอีกครั้ง", "Couldn't take payment, please try again"));
    }
  };

  return (
    <div>
      <PageTitle title={L("ผังโต๊ะ", "Floor")} subtitle={L("ภาพรวมทุกโต๊ะ • แตะเพื่อจัดการ/เก็บเงิน", "All tables at a glance • tap to manage / bill")} />

      {err && (
        <button onClick={() => setErr(null)} className="mb-3 block w-full rounded-xl bg-coral/10 px-3 py-2 text-sm font-semibold text-[#b23a1e]">
          {err} · {L("แตะเพื่อปิด", "tap to dismiss")}
        </button>
      )}

      {/* legend */}
      <div className="mb-4 flex flex-wrap gap-2 text-[11px]">
        {(["new", "cooking", "ready", "overdue", "idle"] as Tone[]).map((tn) => (
          <span key={tn} className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold ring-1 ${TONE[tn].box}`}>
            <span className={`h-2 w-2 shrink-0 rounded-full ${TONE[tn].dot}`} />
            {toneLabel[tn]}
          </span>
        ))}
      </div>

      {tables.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">{L("ยังไม่มีโต๊ะ — เพิ่มที่หน้า โต๊ะ / QR", "No tables yet — add them on Tables / QR")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tables.map((t) => {
            const open = openOf(t.no);
            const tone = toneOf(open);
            const total = open.reduce((s, o) => s + o.total, 0);
            const call = calls.get(t.no);
            const callReason = call?.reason;
            const hasCall = !!call;
            const callMethod = call?.method ? (lang === "th" ? payMethodTH[call.method] : payMethodEN[call.method]) : null;
            return (
              <button
                key={t.id}
                onClick={() => setSel(t.no)}
                // a pending call forces a coral ring deterministically (inline var beats the tone's ring-* class regardless of CSS order)
                style={hasCall ? ({ ["--tw-ring-color"]: "var(--color-coral)" } as React.CSSProperties) : undefined}
                className={`flex flex-col items-start rounded-3xl p-4 text-left shadow-card ring-2 transition active:scale-[.98] ${TONE[tone].box} ${
                  tone === "overdue" || hasCall ? "animate-pulse" : ""
                }`}
              >
                <div className="flex w-full items-center justify-between">
                  <span className="font-display text-2xl font-extrabold">{t.no}</span>
                  <span className="flex items-center gap-1">
                    {hasCall && <span className="text-base" title={callReason === "bill" ? L("เรียกเก็บเงิน", "Bill, please") : L("ลูกค้าเรียกพนักงาน", "Customer called")}>{callReason === "bill" ? "💰" : "🔔"}</span>}
                    {open.length > 0 && (
                      <span className="grid h-7 min-w-7 place-items-center rounded-full bg-ink/80 px-2 text-xs font-bold text-white">
                        {open.length}
                      </span>
                    )}
                  </span>
                </div>
                <span className="mt-2 flex items-center gap-1.5 text-[11px] font-bold">
                  {hasCall ? (
                    callReason === "bill" ? `💰 ${L("เรียกเก็บเงิน", "Bill")}${callMethod ? ` · ${callMethod}` : ""}` : L("🔔 เรียกพนักงาน", "🔔 Called")
                  ) : (
                    <>
                      <span className={`h-2 w-2 shrink-0 rounded-full ${TONE[tone].dot}`} />
                      {toneLabel[tone]}
                    </>
                  )}
                </span>
                {open.length > 0 && <span className="mt-0.5 font-display text-sm font-extrabold text-teal-deep">{baht(total)}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* detail sheet */}
      {sel && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <div className="absolute inset-0 bg-ink/45" onClick={() => setSel(null)} />
          <div className="relative max-h-[88dvh] w-full overflow-y-auto rounded-t-3xl bg-bg p-5 shadow-pop sm:max-w-md sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-xl font-extrabold">{L("โต๊ะ", "Table")} {sel}</h2>
              <button onClick={() => setSel(null)} className="grid h-9 w-9 place-items-center rounded-full bg-surface ring-1 ring-line">✕</button>
            </div>

            {calls.has(sel) && (
              <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-coral/15 px-4 py-3 ring-1 ring-coral/40">
                <span className="text-sm font-bold text-[#b23a1e]">
                  {calls.get(sel)!.reason === "bill"
                    ? `💰 ${L("ลูกค้าขอเก็บเงิน", "Customer is asking for the bill")}${calls.get(sel)!.method ? ` · ${lang === "th" ? payMethodTH[calls.get(sel)!.method!] : payMethodEN[calls.get(sel)!.method!]}` : ""}`
                    : `🔔 ${L("ลูกค้าเรียกพนักงาน", "Customer is calling staff")}`}
                </span>
                <button
                  onClick={async () => {
                    if (restaurantId) await resolveTableCalls(restaurantId, sel);
                    await loadCalls();
                  }}
                  className="shrink-0 rounded-full bg-coral px-4 py-1.5 text-xs font-bold text-white active:scale-95"
                >
                  {L("รับเรื่องแล้ว", "Got it")}
                </button>
              </div>
            )}

            {selOpen.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted">
                <p>{L("โต๊ะนี้ไม่มีบิลค้าง", "No open bill on this table")}</p>
                {canUnpay && (
                  <button
                    disabled={busy}
                    onClick={async () => {
                      if (busy) return;
                      if (window.confirm(L("คืนบิล: เปิดรายการที่จ่ายล่าสุดของโต๊ะนี้กลับมา?", "Reopen this table's most recent payment?"))) {
                        setBusy(true);
                        const ok = await unpayTableBill(sel);
                        setBusy(false);
                        if (ok) setSel(null);
                        else setErr(L("ยกเลิกไม่สำเร็จ กรุณาลองอีกครั้ง", "Couldn't undo, please try again"));
                      }
                    }}
                    className="mt-4 rounded-2xl bg-bg px-5 py-2.5 text-sm font-bold text-[#b23a1e] ring-1 ring-coral/40 active:scale-95 disabled:opacity-50"
                  >
                    ↩ {L("ยกเลิกการจ่ายล่าสุด (คืนบิล)", "Undo last payment (reopen bill)")}
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {selOpen.map((o) => {
                    const next = NEXT[o.status];
                    const prev = PREV[o.status];
                    // an order still received/cooking past the threshold is what turns the table red ("ตกค้าง") —
                    // surface it here so the table colour and the order status line up
                    const waitMin = waitMinutes(o);
                    const overdue = isOverdue(o);
                    const waitLabel = waitMin >= 60 ? `${Math.floor(waitMin / 60)} ${L("ชม.", "h")}` : `${waitMin} ${L("น.", "m")}`;
                    return (
                      <div key={o.id ?? o.no} className={`rounded-2xl bg-surface p-3 shadow-card ring-1 ${overdue ? "ring-danger/50" : "ring-line"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm font-extrabold">{o.no}</span>
                          <div className="flex items-center gap-1.5">
                            {overdue && (
                              <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-bold text-[#b23a1e]">⏰ {L("ตกค้าง", "Overdue")} {waitLabel}</span>
                            )}
                            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${SMETA[o.status].cls}`}>{L(SMETA[o.status].th, SMETA[o.status].en)}</span>
                          </div>
                        </div>
                        <ul className="mt-2 space-y-1 text-sm">
                          {o.items.map((i, idx) => {
                            const extras = [i.addonLabel ? tr(i.addonLabel) : "", i.spice ? t(i.spice as never) : "", i.note ?? ""].filter(Boolean).join(" · ");
                            return (
                              <li key={idx} className="text-muted">
                                {i.qty}× {tr(i.name)}
                                {extras && <span className="block pl-4 text-xs font-semibold text-[#b23a1e]">↳ {extras}</span>}
                              </li>
                            );
                          })}
                        </ul>
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-2">
                          <span className="font-display text-sm font-bold text-teal-deep">{baht(o.total)}</span>
                          <div className="flex gap-1.5">
                            {prev && (
                              <button onClick={() => setStatus(o.id ?? o.no, prev)} className="rounded-lg bg-bg px-3 py-2.5 text-xs font-bold text-ink/70 ring-1 ring-line active:scale-95">↩</button>
                            )}
                            {next && (
                              <button onClick={() => setStatus(o.id ?? o.no, next)} className="rounded-lg bg-teal px-3 py-2.5 text-xs font-bold text-white active:scale-95">→ {L(SMETA[next].th, SMETA[next].en)}</button>
                            )}
                            <button
                              onClick={() => { if (window.confirm(L("ยกเลิกออเดอร์นี้?", "Cancel this order?"))) setStatus(o.id ?? o.no, "cancelled"); }}
                              className="rounded-lg bg-coral/10 px-3 py-2.5 text-xs font-bold text-[#b23a1e] active:scale-95"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="sticky bottom-0 mt-4 bg-bg pt-2">
                  <button
                    onClick={() => pay(sel)}
                    disabled={busy}
                    className="flex w-full items-center justify-between rounded-2xl bg-teal-deep px-5 py-4 text-white shadow-pop active:scale-[.99] disabled:opacity-60"
                  >
                    <span className="font-display font-bold">✓ {L("เก็บเงิน & ปิดบิล", "Take payment & close")}</span>
                    <span className="font-display text-xl font-extrabold">{baht(selTotal)}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
