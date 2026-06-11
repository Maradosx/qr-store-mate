"use client";

import { useEffect, useState } from "react";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { useCaps } from "@/lib/plan";
import type { OrderStatus, ShopOrder } from "@/lib/mock";
import { PageTitle } from "@/components/admin/ui";
import { UpgradeCard } from "@/components/admin/UpgradeCard";
import { BillCallsBar } from "@/components/admin/BillCallsBar";

const OVERDUE_MIN = 15; // same threshold as the floor plan, so both screens agree on "ตกค้าง"
// module-level (kept out of render so the clock read doesn't trip the React purity rule)
const waitMinutes = (o: ShopOrder): number => (o.ts ? Math.round((Date.now() - new Date(o.ts).getTime()) / 60000) : 0);
const isOverdue = (o: ShopOrder): boolean => (o.status === "received" || o.status === "cooking") && waitMinutes(o) >= OVERDUE_MIN;

export default function KitchenPage() {
  const { lang, tr, t } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const caps = useCaps();
  const orders = useShop((s) => s.orders);
  const setStatus = useShop((s) => s.setOrderStatus);
  // re-render every 30s so the per-ticket wait time + overdue state stay current
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  // kitchen handles the whole cook→serve flow: received → cooking → serving → (done leaves the screen).
  // also drop PAID tickets: once the floor closes/pays a table the order is done & gone, so it must
  // leave the kitchen too — otherwise the kitchen and the floor disagree (floor's openOf excludes paid).
  const active = orders
    .filter((o) => !o.paidAt && (o.status === "received" || o.status === "cooking" || o.status === "serving"))
    .slice()
    .sort((a, b) => (a.ts ?? "").localeCompare(b.ts ?? "")); // FIFO (oldest first)

  // per-stage UI: header colour matches the floor palette, plus the next action + a step-back
  const STAGE: Record<"received" | "cooking" | "serving", {
    ring: string; header: string; next: OrderStatus; nextLabel: string; nextBtn: string; prev: OrderStatus;
  }> = {
    received: { ring: "ring-teal", header: "bg-teal text-white", next: "cooking", nextLabel: L("🔥 เริ่มปรุง", "🔥 Start cooking"), nextBtn: "bg-gold text-ink", prev: "received" },
    cooking: { ring: "ring-gold", header: "bg-gold text-ink", next: "serving", nextLabel: L("✓ ปรุงเสร็จ — เสิร์ฟ", "✓ Cooked — serve"), nextBtn: "bg-[#127a48] text-white", prev: "received" },
    serving: { ring: "ring-success", header: "bg-[#127a48] text-white", next: "done", nextLabel: L("✓ เสร็จสิ้น", "✓ Complete"), nextBtn: "bg-teal-deep text-white", prev: "cooking" },
  };

  return (
    <div>
      <PageTitle
        title={L("จอครัว", "Kitchen Display")}
        subtitle={L(`${active.length} ออเดอร์ที่ต้องทำ • อัปเดตสด`, `${active.length} tickets to cook • live`)}
      />

      {caps.kitchen && <BillCallsBar />}

      {!caps.kitchen ? (
        <UpgradeCard title={{ th: "จอครัว (Kitchen Display)", en: "Kitchen Display" }} need="Pro" />
      ) : active.length === 0 ? (
        <div className="grid place-items-center rounded-3xl bg-surface py-20 text-center shadow-card ring-1 ring-line">
          <div>
            <div className="text-5xl">🍳</div>
            <p className="mt-3 font-display text-lg font-bold">{L("ไม่มีออเดอร์ค้าง", "All caught up")}</p>
            <p className="text-sm text-muted">{L("ออเดอร์ใหม่จะเด้งขึ้นมาที่นี่อัตโนมัติ", "New orders appear here automatically")}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {active.map((o) => {
            const st = STAGE[o.status as "received" | "cooking" | "serving"] ?? STAGE.received;
            const canStepBack = o.status !== "received";
            // cooks care about "how long has this waited", not the wall-clock time
            const waitMin = waitMinutes(o);
            const overdue = isOverdue(o);
            const waitLabel = waitMin >= 60 ? `${Math.floor(waitMin / 60)} ${L("ชม.", "h")} ${waitMin % 60} ${L("น.", "m")}` : `${waitMin} ${L("นาที", "min")}`;
            return (
              <div
                key={o.id ?? o.no}
                className={`flex flex-col overflow-hidden rounded-3xl bg-surface shadow-card ring-2 ${overdue ? "ring-danger animate-pulse" : st.ring}`}
              >
                <div className={`flex items-center justify-between gap-2 px-5 py-3 ${overdue ? "bg-danger text-white" : st.header}`}>
                  <span className="font-display text-2xl font-extrabold">{L("โต๊ะ", "Table")} {o.table}</span>
                  <span className="text-right leading-tight">
                    <span className="block font-display text-base font-extrabold">
                      {overdue ? `⏰ ${L("ตกค้าง", "Overdue")} ` : "⏱ "}{waitLabel}
                    </span>
                    <span className="block text-xs font-bold opacity-80">{o.no} · {o.placedAt}</span>
                  </span>
                </div>
                <ul className="flex-1 space-y-2.5 px-5 py-4">
                  {o.items.map((i, idx) => {
                    // add-ons + spice stay on the red line; the customer's NOTE gets its own
                    // loud yellow chip — missed notes (allergies, "no peanuts") are the most
                    // expensive kitchen mistake, so they must not blend into the add-on list
                    const extras = [i.addonLabel ? tr(i.addonLabel) : "", i.spice ? t(i.spice as never) : ""].filter(Boolean).join(" · ");
                    return (
                      <li key={idx} className="flex items-start gap-3">
                        <span
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl font-display text-xl font-extrabold ${
                            i.qty > 1 ? "bg-teal-deep text-white shadow-card" : "bg-bg text-teal-deep"
                          }`}
                        >
                          {i.qty}
                        </span>
                        <span className="min-w-0 pt-0.5">
                          <span className="font-display text-2xl font-bold leading-snug">{tr(i.name)}</span>
                          {extras && <span className="mt-0.5 block text-base font-bold leading-snug text-[#b23a1e]">↳ {extras}</span>}
                          {i.note && (
                            <span className="mt-1.5 inline-block rounded-lg bg-gold/30 px-2.5 py-1 text-base font-extrabold leading-snug text-[#5b4708] ring-1 ring-gold/50">
                              📝 {i.note}
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {/* current stage label so it's clear what state the ticket is in */}
                <p className="px-5 pb-1 text-xs font-bold text-muted">
                  {o.status === "received" ? L("📋 รับออเดอร์แล้ว", "📋 Received") : o.status === "cooking" ? L("🍳 กำลังปรุง", "🍳 Cooking") : L("🍽️ เสิร์ฟแล้ว — รอปิดออเดอร์", "🍽️ Served — close when done")}
                </p>
                <div className="m-3 flex gap-2">
                  {canStepBack && (
                    <button
                      onClick={() => setStatus(o.id ?? o.no, st.prev)}
                      aria-label={L("ย้อนกลับ", "Step back")}
                      title={L("เผลอกด? ย้อนกลับ", "Mis-tap? Step back")}
                      className="rounded-2xl bg-bg px-4 py-3.5 font-display text-base font-extrabold text-ink/70 ring-1 ring-line active:scale-95"
                    >
                      ↩
                    </button>
                  )}
                  <button
                    onClick={() => setStatus(o.id ?? o.no, st.next)}
                    className={`flex-1 rounded-2xl py-3.5 font-display text-base font-extrabold shadow-card active:scale-[.99] ${st.nextBtn}`}
                  >
                    {st.nextLabel}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
