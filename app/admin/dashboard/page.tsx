"use client";

import { useMemo, useState } from "react";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { useCaps } from "@/lib/plan";
import { baht } from "@/lib/format";
import { DishImage } from "@/components/DishImage";
import { Card, PageTitle } from "@/components/admin/ui";
import { UpgradeCard } from "@/components/admin/UpgradeCard";
import type { ShopOrder } from "@/lib/mock";

type Pt = { th: string; en: string; v: number };
type RangeKey = "hour" | "day" | "week" | "month" | "year";
type Range = { th: string; en: string; unitTh: string; unitEn: string; data: Pt[] };

const DOW = { th: ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
const MON = {
  th: ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
const dayStart = (d: Date) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
};
// module-level (keep Date.now()/new Date() out of render per the React-19 purity rule)
const todayStart = () => dayStart(new Date());
const pad2 = (n: number) => String(n).padStart(2, "0");
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
// parse a YYYY-MM-DD picked day → local noon Date (noon dodges any tz/DST edge at the midnight boundary)
const parseDay = (iso: string) => new Date(`${iso}T12:00:00`);
const isToday = (d: Date) => dayStart(d) === todayStart();
// compact money label for chart bars: 1,200 → "1.2k", 161 → "161"
const abbr = (n: number) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "k" : String(n));

/** Aggregate real order revenue into hour/day/week/month buckets, anchored to the selected day. */
function buildSeries(orders: ShopOrder[], anchor: Date): { ranges: Record<RangeKey, Range> } {
  const evts = orders
    .filter((o) => o.ts && o.status !== "cancelled")
    .map((o) => ({ d: new Date(o.ts as string), v: o.total }));
  const aDay = dayStart(anchor); // windows end on the chosen calendar day (defaults to today)

  // hourly buckets span the FULL range of today's orders (defaults 10:00–22:00) so the hour-view
  // total always equals today's sales — no contradiction with the KPI for shops open off-hours
  const hour: Pt[] = [];
  const todayEvts = evts.filter((e) => dayStart(e.d) === aDay);
  let hMin = 10, hMax = 22;
  for (const e of todayEvts) {
    const h = e.d.getHours();
    if (h < hMin) hMin = h;
    if (h > hMax) hMax = h;
  }
  for (let h = hMin; h <= hMax; h++) {
    const v = todayEvts.filter((e) => e.d.getHours() === h).reduce((s, e) => s + e.v, 0);
    hour.push({ th: String(h), en: String(h), v });
  }

  const day: Pt[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(aDay);
    d.setDate(d.getDate() - i);
    const key = dayStart(d);
    const v = evts.filter((e) => dayStart(e.d) === key).reduce((s, e) => s + e.v, 0);
    day.push({ th: DOW.th[d.getDay()], en: DOW.en[d.getDay()], v });
  }

  const week: Pt[] = [];
  for (let i = 5; i >= 0; i--) {
    const end = new Date(aDay);
    end.setDate(end.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const s0 = dayStart(start);
    const e0 = dayStart(end);
    const v = evts.filter((e) => dayStart(e.d) >= s0 && dayStart(e.d) <= e0).reduce((s, e) => s + e.v, 0);
    const lbl = `${start.getDate()}/${start.getMonth() + 1}`;
    week.push({ th: lbl, en: lbl, v });
  }

  const month: Pt[] = [];
  const aMonth = anchor.getFullYear() * 12 + anchor.getMonth();
  for (let i = 5; i >= 0; i--) {
    const m = aMonth - i;
    const yr = Math.floor(m / 12);
    const mo = ((m % 12) + 12) % 12;
    const v = evts
      .filter((e) => e.d.getFullYear() === yr && e.d.getMonth() === mo)
      .reduce((s, e) => s + e.v, 0);
    month.push({ th: MON.th[mo], en: MON.en[mo], v });
  }

  // calendar YEAR: each of the 12 months (Jan–Dec) of the current year
  const year: Pt[] = [];
  const yr = anchor.getFullYear();
  for (let mo = 0; mo < 12; mo++) {
    const v = evts.filter((e) => e.d.getFullYear() === yr && e.d.getMonth() === mo).reduce((s, e) => s + e.v, 0);
    year.push({ th: MON.th[mo], en: MON.en[mo], v });
  }

  return {
    ranges: {
      hour: { th: "ชั่วโมง", en: "Hourly", unitTh: `${anchor.getDate()} ${MON.th[anchor.getMonth()]}`, unitEn: `${MON.en[anchor.getMonth()]} ${anchor.getDate()}`, data: hour },
      day: { th: "วัน", en: "Daily", unitTh: "7 วันล่าสุด", unitEn: "last 7 days", data: day },
      week: { th: "สัปดาห์", en: "Weekly", unitTh: "6 สัปดาห์ล่าสุด", unitEn: "last 6 weeks", data: week },
      month: { th: "เดือน", en: "Monthly", unitTh: "6 เดือนล่าสุด", unitEn: "last 6 months", data: month },
      year: { th: "ปี", en: "Yearly", unitTh: `ปี ${yr + 543}`, unitEn: `${yr}`, data: year },
    },
  };
}

export default function DashboardPage() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const orders = useShop((s) => s.orders);
  const caps = useCaps();
  const [range, setRange] = useState<RangeKey>("day");
  const [pickedISO, setPickedISO] = useState<string>(todayISO()); // calendar day in focus (defaults to today)
  const anchor = useMemo(() => parseDay(pickedISO), [pickedISO]);
  const viewingToday = isToday(anchor);

  const paid = orders.filter((o) => o.status !== "cancelled"); // cancelled orders don't count as sales
  const d0 = dayStart(anchor);
  const d1 = d0 + 86_400_000;
  const dayOrders = paid.filter((o) => { const t = o.ts ? new Date(o.ts).getTime() : 0; return t >= d0 && t < d1; }); // just the selected day
  const daySales = dayOrders.reduce((s, o) => s + o.total, 0);
  const avg = dayOrders.length ? Math.round(daySales / dayOrders.length) : 0;
  const active = orders.filter((o) => o.status !== "done" && o.status !== "cancelled").length; // live "in progress" — not day-bound

  const top = useMemo(() => {
    const map = new Map<string, { th: string; en: string; emoji: string; tone: string; qty: number; rev: number }>();
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      for (const i of o.items) {
        const k = i.name.en;
        const cur = map.get(k) ?? { th: i.name.th, en: i.name.en, emoji: i.emoji, tone: i.tone, qty: 0, rev: 0 };
        cur.qty += i.qty;
        cur.rev += i.price * i.qty;
        map.set(k, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [orders]);

  const { ranges } = useMemo(() => buildSeries(orders, anchor), [orders, anchor]);
  const effRange: RangeKey = caps.analytics ? range : "day"; // Starter = basic daily chart only
  const r = ranges[effRange];
  const max = Math.max(1, ...r.data.map((d) => d.v));
  const rangeTotal = r.data.reduce((s, d) => s + d.v, 0);
  const peak = r.data.reduce((m, d) => (d.v > m.v ? d : m), r.data[0]);
  const dateLabel = L(
    `${anchor.getDate()} ${MON.th[anchor.getMonth()]} ${anchor.getFullYear() + 543}`,
    `${MON.en[anchor.getMonth()]} ${anchor.getDate()}, ${anchor.getFullYear()}`
  );

  return (
    <div>
      <PageTitle title={L("ภาพรวมยอดขาย", "Sales overview")} subtitle={dateLabel} />

      {/* calendar day picker — review any day's sales */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 rounded-2xl bg-surface px-3.5 py-2.5 text-sm shadow-card ring-1 ring-line">
          <span aria-hidden>📅</span>
          <input
            type="date"
            value={pickedISO}
            max={todayISO()}
            onChange={(e) => setPickedISO(e.target.value || todayISO())}
            aria-label={L("เลือกวันที่", "Pick a date")}
            className="bg-transparent font-display font-bold text-ink outline-none [color-scheme:light]"
          />
        </label>
        {!viewingToday && (
          <button
            onClick={() => setPickedISO(todayISO())}
            className="rounded-2xl bg-teal px-4 py-2.5 text-sm font-bold text-white shadow-card active:scale-95"
          >
            {L("กลับมาวันนี้", "Back to today")}
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={viewingToday ? L("ยอดขายวันนี้", "Today's sales") : L("ยอดขายวันที่เลือก", "Sales (that day)")} value={baht(daySales)} accent />
        <Kpi label={viewingToday ? L("ออเดอร์วันนี้", "Orders today") : L("ออเดอร์วันที่เลือก", "Orders (that day)")} value={String(dayOrders.length)} />
        <Kpi label={L("เฉลี่ย/บิล", "Avg / order")} value={baht(avg)} />
        <Kpi label={L("กำลังทำ", "In progress")} value={String(active)} />
      </div>

      {/* Chart — basic daily for every plan; full range toggle for Pro+ */}
      <Card className="mb-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-extrabold">{L("ยอดขาย", "Revenue")}</h2>
            <p className="text-xs text-muted">{L(r.unitTh, r.unitEn)} · {baht(rangeTotal)}</p>
          </div>
          {caps.analytics && (
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-full bg-bg p-1 ring-1 ring-line">
              {(Object.keys(ranges) as RangeKey[]).map((k) => (
                <button
                  key={k}
                  onClick={() => setRange(k)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    range === k ? "bg-teal text-white shadow-card" : "text-muted"
                  }`}
                >
                  {L(ranges[k].th, ranges[k].en)}
                </button>
              ))}
            </div>
          )}
        </div>

        {peak.v > 0 && (
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gold/20 px-3 py-1 text-xs font-bold text-[#5b4708]">
            🔝 {L("ขายดีสุด", "Peak")}: {lang === "th" ? peak.th : peak.en}
            {effRange === "hour" ? L(" น.", ":00") : ""} · {baht(peak.v)}
          </p>
        )}

        <div className="flex h-44 items-stretch gap-1.5 sm:h-52 lg:h-60">
          {r.data.map((d, i) => {
            const isPeak = d.v === max && d.v > 0;
            return (
              <div key={i} className="group flex flex-1 flex-col items-center gap-1" title={baht(d.v)}>
                {/* value label per bucket — show all when few bars; only the peak when many (avoids crowding on the hourly view) */}
                <span className={`h-3.5 text-[9px] font-bold leading-none ${isPeak ? "text-[#8a6d12]" : "text-muted"}`}>
                  {d.v > 0 && (r.data.length <= 8 || isPeak) ? abbr(d.v) : ""}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{
                      height: `${Math.max(3, (d.v / max) * 100)}%`,
                      background: isPeak ? "linear-gradient(to top,#0A5963,#E8B84B)" : "linear-gradient(to top,#0E7C86,#36BFB1)",
                      animation: "rise .5s both",
                      animationDelay: `${i * 30}ms`,
                    }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-muted">{lang === "th" ? d.th : d.en}</span>
              </div>
            );
          })}
        </div>
        {effRange === "hour" && <p className="mt-2 text-center text-[10px] text-muted">{L("ตามชั่วโมง (น.)", "by hour of day")}</p>}
      </Card>

      {/* Best sellers — Pro+ (Starter sees an upgrade nudge) */}
      {!caps.analytics ? (
        <UpgradeCard title={{ th: "เมนูขายดี + ยอดขายราย ชม./สัปดาห์/เดือน", en: "Best sellers + hourly/weekly/monthly trends" }} need="Pro" />
      ) : (
      <Card>
        <h2 className="mb-4 font-display text-base font-extrabold">🔥 {L("เมนูขายดี", "Best sellers")}</h2>
        <div className="space-y-3">
          {top.map((m, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="w-5 text-center font-display text-sm font-extrabold text-muted">{i + 1}</span>
              <DishImage tone={m.tone} emoji={m.emoji} emojiSize={18} className="h-10 w-10 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{lang === "th" ? m.th : m.en}</p>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-bg">
                  <div className="h-full rounded-full bg-teal" style={{ width: `${(m.qty / top[0].qty) * 100}%` }} />
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{m.qty} {L("จาน", "sold")}</p>
                <p className="text-xs text-muted">{baht(m.rev)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
      )}
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-3xl p-4 shadow-card ring-1 ${accent ? "bg-teal text-white ring-teal" : "bg-surface ring-line"}`}>
      <p className={`text-xs font-semibold ${accent ? "text-white/80" : "text-muted"}`}>{label}</p>
      <p className="mt-1.5 font-display text-2xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}
