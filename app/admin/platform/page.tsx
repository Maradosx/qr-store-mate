"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import {
  adminListRestaurants,
  adminSetRestaurantStatus,
  adminSetRestaurantSlug,
  adminMarkPaid,
  adminSetPlan,
  adminDeleteRestaurant,
  fetchPlatformSettings,
  fetchPlatformStats,
  adminUpdateSettings,
  planPrice,
  billingState,
  type PlatformRestaurant,
  type PlatformSettings,
  type PlatformStats,
  type Plan,
  type RestaurantStatus,
} from "@/lib/db";
import { baht } from "@/lib/format";
import { Card, PageTitle } from "@/components/admin/ui";

type Filter = "all" | "pending" | "approved" | "rejected" | "suspended";

const ZERO_STATS: PlatformStats = {
  shops_total: 0, shops_pending: 0, shops_approved: 0, shops_suspended: 0,
  new_shops_month: 0, orders_total: 0, orders_month: 0, gmv_total: 0, gmv_month: 0,
};

const BADGE: Record<string, string> = {
  pending: "bg-gold/25 text-[#5b4708]",
  approved: "bg-success/15 text-success",
  rejected: "bg-coral/15 text-[#b23a1e]",
  suspended: "bg-ink/10 text-ink/70",
};

export default function PlatformPage() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const isPlatformAdmin = useShop((s) => s.isPlatformAdmin);
  const loaded = useShop((s) => s.loaded);
  const refreshPendingCount = useShop((s) => s.refreshPendingCount);
  const hydrateForViewing = useShop((s) => s.hydrateForViewing);
  const router = useRouter();

  const viewShop = async (id: string) => {
    await hydrateForViewing(id);
    router.push("/admin/dashboard");
  };

  const deleteShop = async (r: PlatformRestaurant) => {
    const ok = window.confirm(
      L(
        `ลบร้าน "${r.name_th || r.slug}" และข้อมูลทั้งหมด (เมนู/โต๊ะ/ออเดอร์) อย่างถาวร?\nยกเลิกไม่ได้`,
        `Permanently delete "${r.name_en || r.slug}" and ALL its data (menu/tables/orders)?\nThis cannot be undone.`,
      ),
    );
    if (!ok) return;
    setBusyId(r.id);
    try {
      await adminDeleteRestaurant(r.id);
      await reload(); // refresh rows + platform stats (GMV/orders) after removal
      void refreshPendingCount();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  const [rows, setRows] = useState<PlatformRestaurant[] | null>(null);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [stats, setStats] = useState<PlatformStats>(ZERO_STATS);
  const [filter, setFilter] = useState<Filter>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"new" | "old" | "top" | "low">("new");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setError(null);
      const [list, s, st] = await Promise.all([
        adminListRestaurants(),
        fetchPlatformSettings(),
        fetchPlatformStats(),
      ]);
      setRows(list);
      setSettings(s);
      setStats(st ?? ZERO_STATS);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setRows([]);
    }
  }, []);

  useEffect(() => {
    // one-time data fetch on mount; reload() updates state after awaiting the network
    if (isPlatformAdmin) void reload();
  }, [isPlatformAdmin, reload]);

  const setStatus = async (id: string, status: RestaurantStatus) => {
    setBusyId(id);
    try {
      await adminSetRestaurantStatus(id, status);
      setRows((rs) => (rs ? rs.map((r) => (r.id === id ? { ...r, status } : r)) : rs));
      void refreshPendingCount(); // keep the nav badge in sync
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  const markPaid = async (id: string) => {
    setBusyId(id);
    try {
      await adminMarkPaid(id, 1);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  const setPlanFor = async (id: string, plan: Plan) => {
    setBusyId(id);
    try {
      await adminSetPlan(id, plan);
      setRows((rs) => (rs ? rs.map((x) => (x.id === id ? { ...x, plan } : x)) : rs));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  const editSlug = async (r: PlatformRestaurant) => {
    const next = window.prompt(
      L("ตั้ง URL ร้าน (a-z, 0-9, ขีดกลาง):", "Set shop URL slug (a-z, 0-9, hyphen):"),
      r.slug
    );
    if (!next || next === r.slug) return;
    const slug = next.trim().toLowerCase();
    setBusyId(r.id);
    try {
      await adminSetRestaurantSlug(r.id, slug);
      setRows((rs) => (rs ? rs.map((x) => (x.id === r.id ? { ...x, slug } : x)) : rs));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  // gate: only platform admins
  if (loaded && !isPlatformAdmin) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <div>
          <div className="text-5xl">🔒</div>
          <p className="mt-3 font-display text-lg font-bold">{L("เฉพาะผู้ดูแลแพลตฟอร์ม", "Platform admins only")}</p>
          <p className="text-sm text-muted">{L("บัญชีนี้ไม่มีสิทธิ์เข้าหน้านี้", "This account isn't authorized for this page.")}</p>
        </div>
      </div>
    );
  }

  const counts = {
    all: rows?.length ?? 0,
    pending: rows?.filter((r) => r.status === "pending").length ?? 0,
    approved: rows?.filter((r) => r.status === "approved").length ?? 0,
    rejected: rows?.filter((r) => r.status === "rejected").length ?? 0,
    suspended: rows?.filter((r) => r.status === "suspended").length ?? 0,
  };
  const mrr =
    settings && rows
      ? rows
          .filter((r) => r.status === "approved" && billingState(r.trial_ends_at, r.paid_until).state === "active")
          .reduce((s, r) => s + planPrice(r.plan, settings), 0)
      : 0;
  const overdue =
    rows?.filter((r) => r.status === "approved" && billingState(r.trial_ends_at, r.paid_until).state === "past_due")
      .length ?? 0;
  const needle = q.trim().toLowerCase();
  const shown = (rows ?? [])
    .filter((r) => filter === "all" || r.status === filter)
    .filter((r) =>
      !needle ||
      [r.name_th, r.name_en, r.slug, r.owner_email, r.owner_name, r.owner_phone]
        .some((v) => (v ?? "").toLowerCase().includes(needle))
    )
    .slice()
    .sort((a, b) => {
      if (sort === "top") return b.revenue - a.revenue;
      if (sort === "low") return a.revenue - b.revenue;
      const t = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sort === "old" ? t : -t;
    });
  const filters: Filter[] = ["all", "pending", "approved", "rejected", "suspended"];
  const sorts: { id: typeof sort; th: string; en: string }[] = [
    { id: "new", th: "ล่าสุด", en: "Newest" },
    { id: "old", th: "เก่าสุด", en: "Oldest" },
    { id: "top", th: "ขายดีสุด", en: "Top sales" },
    { id: "low", th: "ขายน้อยสุด", en: "Lowest sales" },
  ];
  const fLabel: Record<Filter, string> = {
    all: L("ทั้งหมด", "All"),
    pending: L("รออนุมัติ", "Pending"),
    approved: L("อนุมัติแล้ว", "Approved"),
    rejected: L("ปฏิเสธ", "Rejected"),
    suspended: L("ระงับ", "Suspended"),
  };
  const sLabel: Record<string, string> = {
    pending: L("รออนุมัติ", "Pending"),
    approved: L("อนุมัติแล้ว", "Approved"),
    rejected: L("ปฏิเสธ", "Rejected"),
    suspended: L("ระงับ", "Suspended"),
  };

  return (
    <div>
      <PageTitle
        title={L("ผู้ดูแลแพลตฟอร์ม", "Platform admin")}
        subtitle={L(
          `ร้านทั้งหมด ${counts.all} • รออนุมัติ ${counts.pending}`,
          `${counts.all} shops • ${counts.pending} awaiting approval`,
        )}
      />

      {/* KPIs */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label={L("รายได้/เดือน (MRR)", "MRR")} value={baht(mrr)} />
        <Kpi label={L("รออนุมัติ", "Pending")} value={String(counts.pending)} accent={counts.pending > 0} />
        <Kpi label={L("เปิดใช้แล้ว", "Approved")} value={String(counts.approved)} />
        <Kpi label={L("ค้างชำระ", "Overdue")} value={String(overdue)} accent={overdue > 0} />
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi label={L("ยอดขายรวมทุกร้าน", "Total GMV")} value={baht(stats.gmv_total)} />
        <Kpi label={L("ยอดขายเดือนนี้", "GMV this month")} value={baht(stats.gmv_month)} />
        <Kpi label={L("ออเดอร์ทั้งหมด", "Total orders")} value={String(stats.orders_total)} />
        <Kpi label={L("ร้านใหม่เดือนนี้", "New shops (mo)")} value={String(stats.new_shops_month)} />
      </div>

      {settings && <SettingsCard settings={settings} onSaved={setSettings} L={L} />}

      {/* search + sort */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={L("ค้นหาร้าน / เจ้าของ / เบอร์ / URL", "Search shop / owner / phone / URL")}
          className="min-w-[200px] flex-1 rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="rounded-xl border border-line bg-bg px-3 py-2.5 text-sm font-semibold outline-none focus:border-teal"
        >
          {sorts.map((s) => (
            <option key={s.id} value={s.id}>{L(s.th, s.en)}</option>
          ))}
        </select>
      </div>

      {/* filters */}
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
              filter === f ? "bg-teal text-white shadow-card" : "bg-surface text-muted ring-1 ring-line"
            }`}
          >
            {fLabel[f]} {f !== "all" && counts[f] > 0 ? `(${counts[f]})` : ""}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-coral/10 px-3 py-2 text-sm font-semibold text-[#b23a1e]">{error}</p>
      )}

      {rows === null ? (
        <div className="grid place-items-center py-20">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-teal" />
        </div>
      ) : shown.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">{L("ไม่มีร้านในหมวดนี้", "No shops in this filter")}</p>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <Card key={r.id} className="!p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-extrabold">{r.name_th || r.slug}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${BADGE[r.status] ?? ""}`}>
                      {sLabel[r.status] ?? r.status}
                    </span>
                    {r.unread > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-coral px-2 py-0.5 text-[11px] font-bold text-white">
                        💬 {r.unread} {L("ใหม่", "new")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted">
                    {r.owner_name ? `${r.owner_name} · ` : ""}{r.owner_phone || L("ไม่มีเบอร์", "no phone")} · {r.owner_email ?? "—"}
                  </p>
                  <p className="text-xs text-muted">/{r.slug} · {L("เมนู", "menu")} {r.items} · {L("ออเดอร์", "orders")} {r.orders}</p>
                  <p className="mt-0.5 text-[11px] text-muted">{new Date(r.created_at).toLocaleString(lang === "th" ? "th-TH" : "en-GB")}</p>
                  <BillingLine r={r} settings={settings} L={L} lang={lang} />
                </div>
                <Link
                  href={`/r/${r.slug}/t/1`}
                  target="_blank"
                  className="shrink-0 rounded-xl bg-bg px-3 py-2 text-xs font-bold text-teal-deep ring-1 ring-line active:scale-95"
                >
                  {L("ดูร้าน ↗", "View ↗")}
                </Link>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
                {r.status !== "approved" && (
                  <ActionBtn busy={busyId === r.id} onClick={() => setStatus(r.id, "approved")} kind="ok">
                    ✓ {L("อนุมัติ", "Approve")}
                  </ActionBtn>
                )}
                {r.status === "pending" && (
                  <ActionBtn busy={busyId === r.id} onClick={() => setStatus(r.id, "rejected")} kind="danger">
                    ✕ {L("ปฏิเสธ", "Reject")}
                  </ActionBtn>
                )}
                {r.status === "approved" && (
                  <ActionBtn busy={busyId === r.id} onClick={() => setStatus(r.id, "suspended")} kind="muted">
                    ⛔ {L("ระงับ", "Suspend")}
                  </ActionBtn>
                )}
                {(r.status === "rejected" || r.status === "suspended") && (
                  <ActionBtn busy={busyId === r.id} onClick={() => setStatus(r.id, "pending")} kind="muted">
                    ↩ {L("กลับเป็นรออนุมัติ", "Back to pending")}
                  </ActionBtn>
                )}
                <ActionBtn busy={busyId === r.id} onClick={() => viewShop(r.id)} kind="ok">
                  🛠️ {L("จัดการร้าน", "Manage shop")}
                </ActionBtn>
                <ActionBtn busy={busyId === r.id} onClick={() => markPaid(r.id)} kind="ok">
                  💰 {L("รับเงิน +1เดือน", "Mark paid +1mo")}
                </ActionBtn>
                <select
                  value={r.plan}
                  disabled={busyId === r.id}
                  onChange={(e) => setPlanFor(r.id, e.target.value as Plan)}
                  className="rounded-xl bg-bg px-3 py-2 text-sm font-bold text-ink ring-1 ring-line outline-none focus:ring-teal disabled:opacity-50"
                >
                  <option value="starter">📦 Starter</option>
                  <option value="pro">📦 Pro</option>
                  <option value="business">📦 Business</option>
                </select>
                <ActionBtn busy={busyId === r.id} onClick={() => editSlug(r)} kind="muted">
                  ✎ {L("แก้ URL", "Edit URL")}
                </ActionBtn>
                <ActionBtn busy={busyId === r.id} onClick={() => deleteShop(r)} kind="danger">
                  🗑️ {L("ลบร้าน", "Delete")}
                </ActionBtn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BillingLine({
  r,
  settings,
  L,
  lang,
}: {
  r: PlatformRestaurant;
  settings: PlatformSettings | null;
  L: (th: string, en: string) => string;
  lang: string;
}) {
  const bs = billingState(r.trial_ends_at, r.paid_until);
  const price = settings ? planPrice(r.plan, settings) : 0;
  const meta: Record<string, { cls: string; label: string }> = {
    active: { cls: "bg-success/15 text-success", label: L("ชำระแล้ว", "Paid") },
    trialing: { cls: "bg-aqua/15 text-teal-deep", label: L("ทดลอง", "Trial") },
    past_due: { cls: "bg-coral/15 text-[#b23a1e]", label: L("ค้างชำระ", "Overdue") },
  };
  const m = meta[bs.state];
  const until = bs.until
    ? new Date(bs.until).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "—";
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className="rounded-full bg-teal/10 px-2 py-0.5 font-bold uppercase text-teal-deep">{r.plan}</span>
      {settings && <span className="font-semibold text-muted">{baht(price)}/{L("ด.", "mo")}</span>}
      <span className={`rounded-full px-2 py-0.5 font-bold ${m.cls}`}>{m.label}</span>
      <span className="text-muted">
        {bs.state === "active" ? L("ถึง", "until") : bs.state === "trialing" ? L("ทดลองถึง", "trial ends") : L("ตั้งแต่", "since")} {until}
      </span>
      <span className="rounded-full bg-success/10 px-2 py-0.5 font-bold text-success">
        {L("ยอดขาย", "sales")} {baht(r.revenue)}
      </span>
    </div>
  );
}

function SettingsCard({
  settings,
  onSaved,
  L,
}: {
  settings: PlatformSettings;
  onSaved: (s: PlatformSettings) => void;
  L: (th: string, en: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<PlatformSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setMsg(null);
    try {
      await adminUpdateSettings(draft);
      onSaved(draft);
      setMsg(L("บันทึกแล้ว ✓", "Saved ✓"));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mb-4">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between text-left">
        <span className="font-display text-sm font-extrabold">⚙️ {L("ตั้งค่ารับเงินแพลตฟอร์ม", "Platform billing settings")}</span>
        <span className="text-muted">{open ? "▲" : "▼"}</span>
      </button>
      {!open && (
        <p className="mt-1 text-xs text-muted">
          {settings.promptpay_id
            ? `${L("รับเงินที่", "Pay to")} ${settings.promptpay_name || settings.promptpay_id}`
            : L("ยังไม่ได้ตั้งพร้อมเพย์ — ร้านจะจ่ายค่าสมาชิกไม่ได้", "PromptPay not set — shops can't pay yet")}
        </p>
      )}
      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-muted">
            {L(
              "ใส่พร้อมเพย์ของคุณ (เจ้าของแพลตฟอร์ม) — ร้านสมาชิกจะสแกนจ่ายค่าบริการเข้าบัญชีนี้",
              "Enter your (platform owner) PromptPay — member shops scan this to pay their subscription.",
            )}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label={L("พร้อมเพย์ (เบอร์/เลขบัตร)", "PromptPay ID")} value={draft.promptpay_id} onChange={(v) => setDraft({ ...draft, promptpay_id: v })} />
            <Input label={L("ชื่อบัญชี", "Account name")} value={draft.promptpay_name} onChange={(v) => setDraft({ ...draft, promptpay_name: v })} />
            <Input label="Starter ฿/mo" value={String(draft.price_starter)} onChange={(v) => setDraft({ ...draft, price_starter: parseInt(v, 10) || 0 })} numeric />
            <Input label="Pro ฿/mo" value={String(draft.price_pro)} onChange={(v) => setDraft({ ...draft, price_pro: parseInt(v, 10) || 0 })} numeric />
            <Input label="Business ฿/mo" value={String(draft.price_business)} onChange={(v) => setDraft({ ...draft, price_business: parseInt(v, 10) || 0 })} numeric />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving}
              className="rounded-xl bg-teal px-5 py-2 text-sm font-bold text-white shadow-card active:scale-95 disabled:opacity-60"
            >
              {saving ? "…" : L("บันทึก", "Save")}
            </button>
            {msg && <span className="text-xs font-semibold text-muted">{msg}</span>}
          </div>
        </div>
      )}
    </Card>
  );
}

function Input({
  label,
  value,
  onChange,
  numeric,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  numeric?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      <input
        value={value}
        inputMode={numeric ? "numeric" : "text"}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
      />
    </label>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 shadow-card ring-1 ${accent ? "bg-gold/15 ring-gold/40" : "bg-surface ring-line"}`}>
      <p className="text-xs font-semibold text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold tracking-tight">{value}</p>
    </div>
  );
}

function ActionBtn({
  children,
  onClick,
  busy,
  kind,
}: {
  children: React.ReactNode;
  onClick: () => void;
  busy: boolean;
  kind: "ok" | "danger" | "muted";
}) {
  const cls =
    kind === "ok"
      ? "bg-teal text-white"
      : kind === "danger"
      ? "bg-coral text-white"
      : "bg-bg text-ink/70 ring-1 ring-line";
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`rounded-xl px-4 py-2 text-sm font-bold shadow-card transition active:scale-95 disabled:opacity-50 ${cls}`}
    >
      {children}
    </button>
  );
}
