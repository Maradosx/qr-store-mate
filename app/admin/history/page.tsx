"use client";

import { useMemo, useState } from "react";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { useCaps } from "@/lib/plan";
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

export default function HistoryPage() {
  const { lang, tr } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const orders = useShop((s) => s.orders);
  const tables = useShop((s) => s.tables);
  const caps = useCaps();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [table, setTable] = useState<string>("all");

  const filtered = useMemo(() => {
    return orders
      .filter((o) => (status === "all" ? true : o.status === status))
      .filter((o) => (table === "all" ? true : o.table === table))
      .filter((o) => {
        if (!q.trim()) return true;
        const t = q.trim().toLowerCase();
        return o.no.toLowerCase().includes(t) || o.table.includes(t) || o.items.some((i) => tr(i.name).toLowerCase().includes(t));
      })
      .slice()
      .sort((a, b) => (b.ts ?? "").localeCompare(a.ts ?? ""));
  }, [orders, status, table, q, tr]);

  const revenue = filtered.reduce((s, o) => s + (o.status === "cancelled" ? 0 : o.total), 0);
  const statuses: (OrderStatus | "all")[] = ["all", "received", "cooking", "serving", "done", "cancelled"];

  const exportCsv = () => {
    const head = ["order_no", "table", "date", "time", "status", "total", "items"];
    const rows = filtered.map((o) => [
      o.no, o.table, o.date, o.placedAt, o.status, String(o.total),
      o.items.map((i) => `${i.qty}x ${i.name.th}${i.addonLabel?.th ? ` (${i.addonLabel.th})` : ""}${i.note ? ` [${i.note}]` : ""}`).join(" / "),
    ]);
    const csv = "﻿" + [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qsm-orders-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageTitle
        title={L("ประวัติออเดอร์", "Order history")}
        subtitle={L("ดูย้อนหลัง • กรองตามโต๊ะ / สถานะ / ค้นหา", "Browse past orders • filter by table / status / search")}
        action={
          caps.dataExport ? (
            <button
              onClick={exportCsv}
              className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-white shadow-card active:scale-95"
            >
              ⬇︎ {L("ส่งออก CSV", "Export CSV")}
            </button>
          ) : (
            <span className="text-xs font-semibold text-muted">{L("ส่งออก CSV · Business", "CSV export · Business")}</span>
          )
        }
      />

      {/* filters */}
      <Card className="mb-4 !p-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={L("ค้นหา เลขออเดอร์ / โต๊ะ / เมนู", "Search order no / table / dish")}
            className="min-w-[200px] flex-1 rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
          />
          <select
            value={table}
            onChange={(e) => setTable(e.target.value)}
            className="rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-teal"
          >
            <option value="all">{L("ทุกโต๊ะ", "All tables")}</option>
            {tables.map((t) => (
              <option key={t.id} value={t.no}>{L("โต๊ะ", "Table")} {t.no}</option>
            ))}
          </select>
        </div>
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                status === s ? "bg-teal text-white shadow-card" : "bg-bg text-muted ring-1 ring-line"
              }`}
            >
              {s === "all" ? L("ทั้งหมด", "All") : L(META[s].th, META[s].en)}
            </button>
          ))}
        </div>
      </Card>

      {/* summary */}
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="rounded-2xl bg-teal px-5 py-3 text-white shadow-card">
          <p className="text-xs text-white/80">{L("ยอดขายที่กรอง", "Filtered revenue")}</p>
          <p className="font-display text-xl font-extrabold">{baht(revenue)}</p>
        </div>
        <div className="rounded-2xl bg-surface px-5 py-3 ring-1 ring-line">
          <p className="text-xs text-muted">{L("จำนวนออเดอร์", "Orders")}</p>
          <p className="font-display text-xl font-extrabold">{filtered.length}</p>
        </div>
      </div>

      {/* list */}
      <div className="space-y-2.5">
        {filtered.map((o) => (
          <Card key={o.id ?? o.no} className="!p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="font-display text-base font-extrabold">{o.no}</span>
              <span className="text-sm text-muted">{L("โต๊ะ", "Table")} {o.table}</span>
              <span className="text-sm text-muted">· {o.placedAt}{L(" น.", "")}</span>
              <span className={`ml-auto rounded-full px-3 py-1 text-xs font-bold ${META[o.status].cls}`}>
                {L(META[o.status].th, META[o.status].en)}
              </span>
              <span className="font-display font-extrabold text-teal-deep">{baht(o.total)}</span>
            </div>
            <p className="mt-2 text-sm text-muted">
              {o.items.map((i) => `${i.qty}× ${tr(i.name)}${i.addonLabel || i.note ? ` (${[i.addonLabel ? tr(i.addonLabel) : "", i.note ?? ""].filter(Boolean).join(", ")})` : ""}`).join("  ·  ")}
            </p>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">{L("ไม่พบออเดอร์", "No orders found")}</p>
        )}
      </div>
    </div>
  );
}
