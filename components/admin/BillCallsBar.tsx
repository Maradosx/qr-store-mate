"use client";

import { useCallback, useEffect, useState } from "react";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { fetchServiceCalls, resolveTableCalls, payMethodTH, payMethodEN, type ServiceCall } from "@/lib/db";
import { subscribeCalls } from "@/lib/realtime";
import { baht } from "@/lib/format";

// Live bar shown on Orders + Kitchen: every open customer call (🔔 staff / 💰 bill + the chosen
// pay method) with one-tap "collect & close bill" or "got it". Works for owners AND staff accounts
// (pay_table / resolve are gated by is_member_of). The Floor page has its own richer per-table UI.
export function BillCallsBar() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const restaurantId = useShop((s) => s.restaurantId);
  const orders = useShop((s) => s.orders);
  const payTableBill = useShop((s) => s.payTableBill);
  const [calls, setCalls] = useState<ServiceCall[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    try {
      setCalls(await fetchServiceCalls(restaurantId));
    } catch {
      /* transient — keep current */
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const unsub = subscribeCalls(restaurantId, () => void load()); // instant push on call / resolve / pay
    const id = setInterval(load, 30000); // safety-net fallback
    return () => {
      unsub();
      clearInterval(id);
    };
  }, [restaurantId, load]);

  // one entry per (table, reason); latest row wins → carries the freshest pay method
  const map = new Map<string, ServiceCall>();
  for (const c of calls) map.set(`${c.table_no}|${c.reason}`, c);
  const list = [...map.values()].sort((a, b) =>
    a.reason === b.reason ? a.table_no.localeCompare(b.table_no, undefined, { numeric: true }) : a.reason === "bill" ? -1 : 1,
  );

  const openTotalOf = (table: string) =>
    orders.filter((o) => o.table === table && !o.paidAt && o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
  const unservedOf = (table: string) =>
    orders.filter((o) => o.table === table && !o.paidAt && o.status !== "cancelled" && o.status !== "done").length;

  if (list.length === 0) return null;

  const resolve = async (table: string) => {
    if (!restaurantId || busy) return;
    setBusy(`r:${table}`);
    try {
      await resolveTableCalls(restaurantId, table);
    } catch {
      /* ignore */
    }
    await load();
    setBusy(null);
  };

  const pay = async (table: string) => {
    if (busy) return;
    const total = openTotalOf(table);
    if (total <= 0) {
      await resolve(table); // nothing to bill — just clear the call
      return;
    }
    const pending = unservedOf(table);
    const warn = pending > 0
      ? L(
          `⚠️ ยังมี ${pending} รายการที่ยังไม่ได้เสิร์ฟ — ปิดบิลตอนนี้รายการเหล่านั้นจะถูกปิด/หลุดจากครัวไปด้วย\n\n`,
          `⚠️ ${pending} item(s) not served yet — closing now will close them and drop them from the kitchen.\n\n`,
        )
      : "";
    if (!window.confirm(warn + L(`เก็บเงินโต๊ะ ${table} รวม ${baht(total)} และปิดบิล?`, `Bill table ${table} for ${baht(total)} and close it?`))) return;
    setBusy(`p:${table}`);
    // a new order may have landed at this table while the confirm dialog was open — re-check the
    // live total so the staffer isn't surprised by closing more (or less) than they agreed to
    const fresh = useShop.getState().orders.filter((o) => o.table === table && !o.paidAt && o.status !== "cancelled").reduce((s, o) => s + o.total, 0);
    if (fresh !== total && !window.confirm(L(`ยอดเปลี่ยนเป็น ${baht(fresh)} (มีออเดอร์ใหม่เข้ามา) — ปิดบิลตามยอดนี้?`, `Total is now ${baht(fresh)} (a new order arrived) — close at this amount?`))) {
      setBusy(null);
      return;
    }
    const ok = await payTableBill(table); // marks orders paid AND clears the table's calls server-side
    if (!ok) setErr(L("เก็บเงินไม่สำเร็จ ลองอีกครั้ง", "Couldn't take payment, try again"));
    await load();
    setBusy(null);
  };

  return (
    <div className="mb-4 space-y-2">
      {err && (
        <button onClick={() => setErr(null)} className="block w-full rounded-xl bg-coral/10 px-3 py-2 text-sm font-semibold text-[#b23a1e]">
          {err} · {L("แตะเพื่อปิด", "tap to dismiss")}
        </button>
      )}
      {list.map((c) => {
        const bill = c.reason === "bill";
        const total = bill ? openTotalOf(c.table_no) : 0;
        const method = bill && c.pay_method ? (lang === "th" ? payMethodTH[c.pay_method] : payMethodEN[c.pay_method]) : null;
        return (
          <div
            key={`${c.table_no}|${c.reason}`}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-2xl bg-coral/10 px-4 py-3 ring-1 ring-coral/40"
            style={{ animation: "pulse-ring 1.8s infinite" }}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-lg">{bill ? "💰" : "🔔"}</span>
              <span className="font-display text-sm font-extrabold">{L("โต๊ะ", "Table")} {c.table_no}</span>
              <span className="text-sm font-bold text-[#b23a1e]">{bill ? L("เรียกเก็บเงิน", "Bill, please") : L("เรียกพนักงาน", "Calling staff")}</span>
              {method && <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-teal-deep ring-1 ring-line">{method}</span>}
              {bill && total > 0 && <span className="font-display text-sm font-extrabold text-teal-deep">{baht(total)}</span>}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {bill && total > 0 && (
                <button
                  onClick={() => pay(c.table_no)}
                  disabled={!!busy}
                  className="rounded-xl bg-teal-deep px-4 py-2 text-sm font-bold text-white shadow-card active:scale-95 disabled:opacity-60"
                >
                  ✓ {L("เก็บเงิน", "Collect")} {baht(total)}
                </button>
              )}
              <button
                onClick={() => resolve(c.table_no)}
                disabled={!!busy}
                className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#b23a1e] ring-1 ring-coral/40 active:scale-95 disabled:opacity-60"
              >
                {L("รับเรื่อง", "Got it")}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
