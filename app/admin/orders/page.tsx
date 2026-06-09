"use client";

import { useState } from "react";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import type { OrderStatus } from "@/lib/mock";
import { baht } from "@/lib/format";
import { Card, PageTitle } from "@/components/admin/ui";

const META: Record<OrderStatus, { th: string; en: string; cls: string }> = {
  received: { th: "รับออเดอร์", en: "Received", cls: "bg-aqua/15 text-teal-deep" },
  cooking: { th: "กำลังปรุง", en: "Cooking", cls: "bg-coral/15 text-[#b23a1e]" },
  serving: { th: "กำลังเสิร์ฟ", en: "Serving", cls: "bg-gold/25 text-[#5b4708]" },
  done: { th: "เสร็จสิ้น", en: "Done", cls: "bg-success/15 text-[#0f7a47]" },
  cancelled: { th: "ยกเลิกแล้ว", en: "Cancelled", cls: "bg-ink/10 text-ink/60" },
};
const NEXT: Record<OrderStatus, OrderStatus | null> = {
  received: "cooking",
  cooking: "serving",
  serving: "done",
  done: null,
  cancelled: null,
};
const PREV: Record<OrderStatus, OrderStatus | null> = {
  received: null,
  cooking: "received",
  serving: "cooking",
  done: "serving",
  cancelled: null,
};
const ORDER_RANK: Record<OrderStatus, number> = { received: 0, cooking: 1, serving: 2, done: 3, cancelled: 4 };

export default function OrdersPage() {
  const { lang, tr } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const orders = useShop((s) => s.orders);
  const setStatus = useShop((s) => s.setOrderStatus);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  const active = orders.filter((o) => o.status !== "done" && o.status !== "cancelled").length;
  const shown = orders
    .filter((o) => filter === "all" || o.status === filter)
    .slice()
    .sort((a, b) => ORDER_RANK[a.status] - ORDER_RANK[b.status] || (b.ts ?? "").localeCompare(a.ts ?? ""));

  const filters: (OrderStatus | "all")[] = ["all", "received", "cooking", "serving", "done", "cancelled"];

  const cancel = (id: string) => {
    if (window.confirm(L("ยกเลิกออเดอร์นี้? (ยอดจะไม่ถูกนับเป็นยอดขาย)", "Cancel this order? (it won't count toward sales)"))) {
      setStatus(id, "cancelled");
    }
  };

  return (
    <div>
      <PageTitle
        title={L("ออเดอร์", "Orders")}
        subtitle={L(`กำลังดำเนินการ ${active} ออเดอร์`, `${active} active orders`)}
      />

      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              filter === f ? "bg-teal text-white shadow-card" : "bg-surface text-muted ring-1 ring-line"
            }`}
          >
            {f === "all" ? L("ทั้งหมด", "All") : L(META[f].th, META[f].en)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {shown.map((o) => {
          const id = o.id ?? o.no;
          const next = NEXT[o.status];
          const prev = PREV[o.status];
          const cancelled = o.status === "cancelled";
          return (
            <Card key={o.id ?? o.no} className={`!p-4 ${cancelled ? "opacity-60" : ""}`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-display text-base font-extrabold">{o.no}</span>
                  <span className="ml-2 text-sm text-muted">· {L("โต๊ะ", "Table")} {o.table}</span>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${META[o.status].cls}`}>
                  {L(META[o.status].th, META[o.status].en)}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-muted">{o.placedAt}{L(" น.", "")}</p>

              <ul className="mt-3 space-y-1 border-t border-dashed border-line pt-3 text-sm">
                {o.items.map((i, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span><span className="text-muted">{i.qty}× </span>{tr(i.name)}</span>
                    <span className="text-muted">{baht(i.price * i.qty)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                <span className={`font-display font-extrabold ${cancelled ? "text-muted line-through" : "text-teal-deep"}`}>{baht(o.total)}</span>
                <div className="flex flex-wrap items-center gap-2">
                  {cancelled ? (
                    <button
                      onClick={() => setStatus(id, "received")}
                      className="rounded-xl bg-bg px-3 py-2 text-sm font-bold text-teal-deep ring-1 ring-line active:scale-95"
                    >
                      ↩ {L("กู้คืนออเดอร์", "Restore")}
                    </button>
                  ) : (
                    <>
                      {prev && (
                        <button
                          onClick={() => setStatus(id, prev)}
                          aria-label={L("ย้อนสถานะ", "Step back")}
                          title={L("ย้อนกลับ", "Step back")}
                          className="rounded-xl bg-bg px-3 py-2 text-sm font-bold text-ink/70 ring-1 ring-line active:scale-95"
                        >
                          ↩
                        </button>
                      )}
                      {next ? (
                        <button
                          onClick={() => setStatus(id, next)}
                          className="rounded-xl bg-teal px-4 py-2 text-sm font-bold text-white shadow-card active:scale-95"
                        >
                          → {L(META[next].th, META[next].en)}
                        </button>
                      ) : (
                        <span className="text-sm font-bold text-success">✓ {L("เสร็จแล้ว", "Done")}</span>
                      )}
                      {o.status !== "done" && (
                        <button
                          onClick={() => cancel(id)}
                          className="rounded-xl bg-coral/10 px-3 py-2 text-sm font-bold text-[#b23a1e] active:scale-95"
                        >
                          ✕ {L("ยกเลิก", "Cancel")}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
