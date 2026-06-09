"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { fetchServiceCalls } from "@/lib/db";
import { subscribeCalls } from "@/lib/realtime";
import { BrandLockup, BrandMark } from "@/components/BrandMark";
import { LangToggle } from "@/components/LangToggle";
import { Toaster } from "@/components/admin/Toaster";

const NAV = [
  { href: "/admin/dashboard", icon: "📊", th: "ภาพรวม", en: "Dashboard", primary: true },
  { href: "/admin/floor", icon: "🗺️", th: "ผังโต๊ะ", en: "Floor", primary: true },
  { href: "/admin/orders", icon: "🧾", th: "ออเดอร์", en: "Orders", primary: true },
  { href: "/admin/kitchen", icon: "👨‍🍳", th: "จอครัว", en: "Kitchen", primary: false },
  { href: "/admin/menu", icon: "🍽️", th: "เมนู", en: "Menu", primary: true },
  { href: "/admin/tables", icon: "🪑", th: "โต๊ะ / QR", en: "Tables / QR", primary: false },
  { href: "/admin/history", icon: "📜", th: "ประวัติ", en: "History", primary: false },
  { href: "/admin/reviews", icon: "⭐", th: "รีวิว", en: "Reviews", primary: false },
  { href: "/admin/billing", icon: "💳", th: "ค่าสมาชิก", en: "Billing", primary: false },
  { href: "/admin/support", icon: "💬", th: "ติดต่อทีมงาน", en: "Support", primary: false },
  { href: "/admin/profile", icon: "🏪", th: "ร้านของฉัน", en: "My Shop", primary: true },
];
const PLATFORM_NAV = { href: "/admin/platform", icon: "🛡️", th: "แพลตฟอร์ม", en: "Platform", primary: false };
const MESSAGES_NAV = { href: "/admin/messages", icon: "💬", th: "ข้อความ", en: "Messages", primary: false };
const STAFF_NAV = { href: "/admin/staff", icon: "👥", th: "พนักงาน", en: "Staff", primary: false };
// pages a 'staff' member may reach (operational + customer feedback — no money/menu/settings)
const STAFF_ALLOWED = ["/admin/orders", "/admin/kitchen", "/admin/floor", "/admin/reviews"];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { lang } = useI18n();
  const authed = useShop((s) => s.authed);
  const loaded = useShop((s) => s.loaded);
  const slug = useShop((s) => s.slug);
  const status = useShop((s) => s.status);
  const restaurantId = useShop((s) => s.restaurantId);
  const isPlatformAdmin = useShop((s) => s.isPlatformAdmin);
  const viewingAsAdmin = useShop((s) => s.viewingAsAdmin);
  const myRole = useShop((s) => s.myRole);
  const myName = useShop((s) => s.myName);
  const billing = useShop((s) => s.billing);
  const exitViewing = useShop((s) => s.exitViewing);
  const profile = useShop((s) => s.profile);
  const pendingCount = useShop((s) => s.pendingCount);
  const chatUnread = useShop((s) => s.chatUnread);
  const logout = useShop((s) => s.logout);
  const refreshOrders = useShop((s) => s.refreshOrders);
  const router = useRouter();
  const pathname = usePathname();
  const custHref = slug ? `/r/${slug}/t/1` : "/t/1";
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  // any non-owner member (staff/manager sub-account) is operational-only: no money/menu/settings
  const isStaff = myRole !== "owner" && !viewingAsAdmin && !isPlatformAdmin;
  const nav =
    isPlatformAdmin && !viewingAsAdmin
      ? [PLATFORM_NAV, MESSAGES_NAV] // pure super-admin: platform console + shop messages
      : isPlatformAdmin && viewingAsAdmin
        ? [...NAV.filter((n) => n.href !== "/admin/support"), STAFF_NAV, PLATFORM_NAV, MESSAGES_NAV] // managing a shop
        : isStaff
          ? NAV.filter((n) => STAFF_ALLOWED.includes(n.href)) // staff: orders / kitchen / floor only
          : [...NAV, STAFF_NAV]; // normal shop owner (Staff page upsells if not on Business)
  // mobile bottom bar = the primary tabs (or the platform tab for a pure super-admin);
  // everything else in `nav` lives behind a "More" sheet so NOTHING is unreachable on a phone.
  const primaryTabs = nav.filter((n) => n.primary);
  const tabs = isStaff ? nav : primaryTabs.length ? primaryTabs : nav.filter((n) => n.href === "/admin/platform");
  const moreItems = nav.filter((n) => !tabs.some((t) => t.href === n.href));
  const [moreOpen, setMoreOpen] = useState(false);
  const chatHref = isPlatformAdmin ? "/admin/messages" : "/admin/support";
  const navBadge = (href: string) =>
    href === "/admin/platform" ? pendingCount : href === "/admin/messages" || href === "/admin/support" ? chatUnread : 0;
  const moreActive = moreItems.some((n) => pathname.startsWith(n.href));
  const moreBadge = moreItems.reduce((s, n) => s + navBadge(n.href), 0);

  // close the More sheet on Escape (links close it via onClick before navigating)
  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMoreOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [moreOpen]);

  // a super-admin with no shop of their own belongs on the Platform console
  // (but must still be able to reach their cross-shop Messages inbox)
  useEffect(() => {
    const allowed = pathname === "/admin/platform" || pathname === "/admin/messages";
    if (loaded && authed && isPlatformAdmin && !restaurantId && !viewingAsAdmin && !allowed) {
      router.replace("/admin/platform");
    }
  }, [loaded, authed, isPlatformAdmin, restaurantId, viewingAsAdmin, pathname, router]);

  // a 'staff' member may only reach operational pages — bounce them to Orders otherwise
  const staffPathOk = STAFF_ALLOWED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  useEffect(() => {
    if (loaded && authed && isStaff && !staffPathOk) router.replace("/admin/orders");
  }, [loaded, authed, isStaff, staffPathOk, router]);

  // orders are pushed LIVE by the realtime subscription in Providers.tsx (postgres_changes);
  // this is just a slow safety-net poll so a dropped socket still self-heals.
  useEffect(() => {
    if (!authed || !restaurantId) return;
    const id = setInterval(() => {
      void refreshOrders();
    }, 30000);
    return () => clearInterval(id);
  }, [authed, restaurantId, refreshOrders]);

  if (!authed) return <LoginGate />;

  if (!loaded)
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-teal" />
      </div>
    );

  // a shop that isn't approved cannot use the dashboard — show a clear status screen instead
  // (a super-admin managing a shop, or the platform admin, bypasses this)
  if (restaurantId && !viewingAsAdmin && !isPlatformAdmin && status !== "approved") {
    return <ApprovalGate status={status} L={L} onLogout={logout} />;
  }

  // staff sub-accounts only work on Business (RLS gates their reads on the plan); if the shop is no longer
  // Business, show a clear message instead of a silent, empty dashboard
  if (isStaff && billing.plan !== "business") {
    return <StaffPlanGate L={L} onLogout={logout} />;
  }

  // staff on a non-operational page: show a spinner while the redirect effect runs (prevents flashing revenue data)
  if (isStaff && !staffPathOk) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-teal" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-line bg-surface px-4 py-6 md:flex">
        <div className="px-2">
          <BrandLockup height={26} />
        </div>
        <nav className="mt-8 flex-1 space-y-1">
          {nav.map((n) => (
            <NavLink key={n.href} {...n} label={L(n.th, n.en)} badge={navBadge(n.href)} />
          ))}
        </nav>
        <BottomActions L={L} />
      </aside>

      {/* Topbar (mobile) */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-3 backdrop-blur md:hidden">
        <BrandLockup height={24} />
        <div className="flex items-center gap-2">
          <LangToggle />
          {restaurantId && <SoundToggle />}
          <Link
            href={custHref}
            aria-label={L("ดูหน้าลูกค้า", "Customer view")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-teal text-base text-white active:scale-95"
          >
            🍽️
          </Link>
          {!isStaff && (
            <Link
              href={chatHref}
              aria-label={L("ข้อความ", "Messages")}
              className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bg text-base ring-1 ring-line active:scale-95"
            >
              💬
              {chatUnread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                  {chatUnread}
                </span>
              )}
            </Link>
          )}
          {isPlatformAdmin && (
            <Link
              href="/admin/platform"
              aria-label={L("แพลตฟอร์ม", "Platform")}
              className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bg text-base ring-1 ring-line active:scale-95"
            >
              🛡️
              {pendingCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </Link>
          )}
          <button
            onClick={logout}
            aria-label={L("ออกจากระบบ", "Log out")}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bg text-base ring-1 ring-line active:scale-95"
          >
            🚪
          </button>
        </div>
      </header>

      {/* Topbar (desktop) */}
      <div className="sticky top-0 z-20 hidden items-center justify-end gap-3 border-b border-line bg-bg/80 px-8 py-3 backdrop-blur md:flex md:pl-[16rem]">
        <LangToggle />
        {restaurantId && <SoundToggle />}
        <Link href={custHref} className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-white shadow-card">
          {L("ดูหน้าลูกค้า ↗", "View customer app ↗")}
        </Link>
      </div>

      {/* Main */}
      <main className="px-4 pb-28 pt-5 md:pb-10 md:pl-[16rem] md:pr-8">
        <div className="mx-auto max-w-5xl">
          <NewOrderAlerter />
          <ServiceCallAlerter />
          <Toaster />
          {viewingAsAdmin && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-ink px-4 py-3 text-white">
              <span className="text-sm font-bold">
                🛠️ {L("กำลังจัดการร้าน", "Managing shop")}: {profile.name.th || profile.name.en || slug} <span className="opacity-70">· {L("ในนามผู้ดูแล — แก้ไขได้", "as admin — you can edit")}</span>
              </span>
              <button
                onClick={() => {
                  void exitViewing();
                  router.push("/admin/platform");
                }}
                className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-ink active:scale-95"
              >
                {L("ออกจากโหมดดู", "Exit view")}
              </button>
            </div>
          )}
          {isStaff && (
            <div className="relative mb-4 overflow-hidden rounded-3xl bg-teal text-white shadow-card">
              {profile.cover && (
                <>
                  {/* the shop's real cover photo as the banner background */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={profile.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-ink/55" />
                </>
              )}
              <div className="relative flex items-center gap-3 p-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white text-2xl shadow">
                  {profile.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.logo} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span aria-hidden>🏪</span>
                  )}
                </div>
                <div className="min-w-0" style={{ textShadow: "0 1px 6px rgba(0,0,0,.55)" }}>
                  <p className="font-display text-base font-extrabold leading-tight">
                    {myName ? L(`สวัสดี คุณ${myName} 👋`, `Hi ${myName} 👋`) : L("สวัสดี 👋", "Hi 👋")}
                  </p>
                  <p className="truncate text-sm text-white/90">
                    {(lang === "th" ? profile.name.th : profile.name.en) || profile.name.th || profile.name.en}
                  </p>
                </div>
              </div>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Bottom tab bar (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface/95 backdrop-blur md:hidden">
        {tabs.map((n) => (
          <TabLink key={n.href} {...n} label={L(n.th, n.en)} badge={navBadge(n.href)} />
        ))}
        {moreItems.length > 0 && (
          <button
            onClick={() => setMoreOpen(true)}
            aria-label={L("เพิ่มเติม", "More")}
            className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5"
          >
            <span className={`text-lg ${moreActive || moreOpen ? "" : "opacity-50 grayscale"}`}>☰</span>
            <span className={`text-[10px] font-semibold ${moreActive || moreOpen ? "text-teal-deep" : "text-muted"}`}>{L("เพิ่มเติม", "More")}</span>
            {moreBadge > 0 && (
              <span className="absolute right-1/2 top-1 ml-3 grid h-4 min-w-4 translate-x-4 place-items-center rounded-full bg-coral px-1 text-[9px] font-bold text-white">
                {moreBadge}
              </span>
            )}
          </button>
        )}
      </nav>

      {/* "More" sheet (mobile) — every page that isn't a bottom tab, so nothing is unreachable */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true" aria-label={L("เมนูทั้งหมด", "All pages")}>
          <div className="absolute inset-0 bg-ink/45 fade-in" onClick={() => setMoreOpen(false)} />
          <div className="sheet-up absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface p-4 pb-8 shadow-pop">
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-line" />
            <p className="mb-3 px-1 font-display text-base font-extrabold">{L("เมนูทั้งหมด", "All pages")}</p>
            <div className="grid grid-cols-3 gap-2">
              {moreItems.map((n) => {
                const active = pathname.startsWith(n.href);
                const badge = navBadge(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    onClick={() => setMoreOpen(false)}
                    className={`relative flex flex-col items-center gap-1 rounded-2xl px-2 py-3.5 text-center ${
                      active ? "bg-teal text-white shadow-card" : "bg-bg text-ink ring-1 ring-line"
                    }`}
                  >
                    <span className="text-2xl">{n.icon}</span>
                    <span className="text-[11px] font-semibold leading-tight">{L(n.th, n.en)}</span>
                    {badge > 0 && (
                      <span className="absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[9px] font-bold text-white">
                        {badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
            <button
              onClick={() => setMoreOpen(false)}
              className="mt-4 w-full rounded-2xl bg-bg py-2.5 text-sm font-bold text-muted ring-1 ring-line active:scale-[.99]"
            >
              {L("ปิด", "Close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NavLink({ href, icon, label, badge = 0 }: { href: string; icon: string; label: string; badge?: number }) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition ${
        active ? "bg-teal text-white shadow-card" : "text-muted hover:bg-bg"
      }`}
    >
      <span className="text-lg">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge > 0 && (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1.5 text-[11px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function TabLink({ href, icon, label, badge = 0 }: { href: string; icon: string; label: string; badge?: number }) {
  const pathname = usePathname();
  const active = pathname.startsWith(href);
  return (
    <Link href={href} className="relative flex flex-1 flex-col items-center gap-0.5 py-2.5">
      <span className={`text-lg ${active ? "" : "opacity-50 grayscale"}`}>{icon}</span>
      <span className={`text-[10px] font-semibold ${active ? "text-teal-deep" : "text-muted"}`}>{label}</span>
      {badge > 0 && (
        <span className="absolute right-1/2 top-1 ml-3 grid h-4 min-w-4 translate-x-4 place-items-center rounded-full bg-coral px-1 text-[9px] font-bold text-white">
          {badge}
        </span>
      )}
    </Link>
  );
}

function BottomActions({ L }: { L: (th: string, en: string) => string }) {
  const logout = useShop((s) => s.logout);
  const slug = useShop((s) => s.slug);
  const custHref = slug ? `/r/${slug}/t/1` : "/t/1";
  return (
    <div className="space-y-1 border-t border-line pt-3">
      <Link href={custHref} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-bg">
        <span className="text-lg">👁️</span> {L("ดูหน้าลูกค้า", "Customer app")}
      </Link>
      <button onClick={logout} className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold text-muted hover:bg-bg">
        <span className="text-lg">🚪</span> {L("ออกจากระบบ", "Log out")}
      </button>
    </div>
  );
}

function NewOrderAlerter() {
  const { lang } = useI18n();
  const orders = useShop((s) => s.orders);
  const restaurantId = useShop((s) => s.restaurantId);
  const seen = useRef<Set<string> | null>(null);
  const lastRid = useRef<string>("");
  const audioRef = useRef<AudioContext | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // unlock + reuse a WebAudio context on the first user interaction (autoplay policy)
  useEffect(() => {
    const unlock = () => {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioRef.current = audioRef.current ?? new Ctx();
        if (audioRef.current.state === "suspended") void audioRef.current.resume();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    const ids = new Set(orders.map((o) => o.id ?? o.no));
    // (re)baseline when the loaded shop changes (login / switch / exit view) — never alert on a switch
    if (seen.current === null || restaurantId !== lastRid.current) {
      lastRid.current = restaurantId;
      seen.current = ids;
      return;
    }
    const fresh = orders.filter((o) => o.status === "received" && !seen.current!.has(o.id ?? o.no));
    seen.current = ids;
    if (fresh.length === 0) return;
    const tables = fresh.map((f) => f.table).join(", ");
    if (useShop.getState().soundOn) {
      try {
        const ctx = audioRef.current;
        if (ctx) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.value = 880;
          gain.gain.setValueAtTime(0.0001, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);
          osc.start();
          osc.stop(ctx.currentTime + 0.46);
        }
      } catch {
        /* ignore */
      }
      speakTH(`โต๊ะ ${tables} มีออเดอร์ใหม่`);
    }
    setToast(lang === "th" ? `ออเดอร์ใหม่! โต๊ะ ${tables}` : `New order! Table ${tables}`);
    const timer = window.setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(timer);
  }, [orders, restaurantId, lang]);

  if (!toast) return null;
  return (
    <button
      onClick={() => setToast(null)}
      className="fixed left-1/2 top-16 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white shadow-pop"
      style={{ animation: "rise .3s both" }}
    >
      🔔 {toast}
    </button>
  );
}

// speak a short Thai line for hands-free alerts (kitchen/floor) — e.g. "โต๊ะ 3 มีออเดอร์ใหม่".
// Best-effort: stays silent if the device has no Thai TTS voice / no Web Speech support.
function speakTH(text: string) {
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "th-TH";
    u.rate = 1;
    const th = synth.getVoices().find((v) => v.lang === "th-TH" || v.lang?.toLowerCase().startsWith("th"));
    if (th) u.voice = th;
    synth.cancel(); // drop any backlog so alerts stay timely
    synth.speak(u);
  } catch {
    /* no TTS available */
  }
}

// header button to mute/unmute all admin alert sounds (beep + chime + Thai voice)
function SoundToggle() {
  const { lang } = useI18n();
  const soundOn = useShop((s) => s.soundOn);
  const setSoundOn = useShop((s) => s.setSoundOn);
  return (
    <button
      onClick={() => setSoundOn(!soundOn)}
      aria-pressed={soundOn}
      aria-label={lang === "th" ? "เปิด/ปิดเสียงแจ้งเตือน" : "Toggle alert sound"}
      title={soundOn ? (lang === "th" ? "เสียงแจ้งเตือน: เปิด" : "Alerts: on") : (lang === "th" ? "เสียงแจ้งเตือน: ปิด" : "Alerts: off")}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bg text-base ring-1 ring-line active:scale-95"
    >
      {soundOn ? "🔊" : "🔇"}
    </button>
  );
}

// a distinct two-note "ding-dong" — clearly different from the single 880Hz new-order beep,
// so staff can tell a customer CALL apart from a new ORDER by ear alone
function callChime(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    for (const n of [{ f: 988, t: 0 }, { f: 1319, t: 0.18 }]) { // B5 → E6
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.value = n.f;
      const t0 = ctx.currentTime + n.t;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.35, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
      osc.start(t0);
      osc.stop(t0 + 0.24);
    }
  } catch {
    /* ignore */
  }
}

// a 3-note RISING arpeggio for "call for the bill" — clearly different from the 2-note service ding-dong
function billChime(ctx: AudioContext | null) {
  if (!ctx) return;
  try {
    for (const n of [{ f: 659, t: 0 }, { f: 988, t: 0.12 }, { f: 1319, t: 0.24 }]) { // E5 → B5 → E6
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = n.f;
      const t0 = ctx.currentTime + n.t;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.32, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      osc.start(t0);
      osc.stop(t0 + 0.18);
    }
  } catch {
    /* ignore */
  }
}

// App-wide customer-call alert: an audible chime + a banner on EVERY admin page (incl. the Kitchen
// Display). "call staff" and "call for the bill" get DIFFERENT chimes + voice lines. The Floor page
// already surfaces calls richly (table rings + sheet), so the banner is suppressed there.
function ServiceCallAlerter() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const restaurantId = useShop((s) => s.restaurantId);
  const pathname = usePathname();
  const [calls, setCalls] = useState<{ table: string; reason: "service" | "bill" }[]>([]);
  const seen = useRef<Set<string> | null>(null);
  const lastRid = useRef<string>("");
  const audioRef = useRef<AudioContext | null>(null);

  // unlock + reuse a WebAudio context on the first user interaction (autoplay policy)
  useEffect(() => {
    const unlock = () => {
      try {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioRef.current = audioRef.current ?? new Ctx();
        if (audioRef.current.state === "suspended") void audioRef.current.resume();
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!restaurantId) {
        if (alive) setCalls([]);
        return;
      }
      let rows;
      try {
        rows = await fetchServiceCalls(restaurantId);
      } catch {
        return; // transient failure: keep the baseline + banner, never wipe → no phantom chime
      }
      if (!alive) return;
      // one entry per (table, reason) — a table can have both a service call and a bill call
      const uniq = [...new Map(rows.map((r) => [`${r.table_no}|${r.reason}`, { table: r.table_no, reason: r.reason }])).values()];
      const ids = new Set(uniq.map((c) => `${c.table}|${c.reason}`));
      // (re)baseline on first load / shop switch so we never chime for pre-existing or switched-in calls
      if (seen.current === null || restaurantId !== lastRid.current) {
        lastRid.current = restaurantId;
        seen.current = ids;
      } else {
        const fresh = uniq.filter((c) => !seen.current!.has(`${c.table}|${c.reason}`));
        seen.current = ids;
        if (fresh.length && useShop.getState().soundOn) {
          const newService = fresh.filter((c) => c.reason === "service").map((c) => c.table);
          const newBill = fresh.filter((c) => c.reason === "bill").map((c) => c.table);
          if (newService.length) callChime(audioRef.current);
          if (newBill.length) billChime(audioRef.current);
          const parts: string[] = [];
          if (newService.length) parts.push(`โต๊ะ ${newService.join(", ")} เรียกพนักงาน`);
          if (newBill.length) parts.push(`โต๊ะ ${newBill.join(", ")} เรียกเก็บเงิน`);
          if (parts.length) speakTH(parts.join(", "));
        }
      }
      setCalls(uniq);
    };
    void load();
    if (!restaurantId) return;
    const unsub = subscribeCalls(restaurantId, () => void load()); // instant push on call-staff
    const id = setInterval(load, 30000); // safety-net fallback
    return () => {
      alive = false;
      unsub();
      clearInterval(id);
    };
  }, [restaurantId]);

  const serviceT = calls.filter((c) => c.reason === "service").map((c) => c.table);
  const billT = calls.filter((c) => c.reason === "bill").map((c) => c.table);
  if (calls.length === 0 || pathname === "/admin/floor") return null;
  return (
    <Link
      href="/admin/floor"
      className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-coral px-4 py-3 text-white shadow-pop"
      style={{ animation: "pulse-ring 1.8s infinite" }}
    >
      <span className="min-w-0 space-y-0.5 text-sm font-bold">
        {serviceT.length > 0 && <span className="block">🔔 {L("เรียกพนักงาน", "Calling staff")} · {L("โต๊ะ", "Table")} {serviceT.join(", ")}</span>}
        {billT.length > 0 && <span className="block">💰 {L("เรียกเก็บเงิน", "Bill, please")} · {L("โต๊ะ", "Table")} {billT.join(", ")}</span>}
      </span>
      <span className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-xs font-bold ring-1 ring-white/30">
        {L("ไปที่ผังโต๊ะ →", "Go to floor →")}
      </span>
    </Link>
  );
}

function StaffPlanGate({ L, onLogout }: { L: (th: string, en: string) => string; onLogout: () => void }) {
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-teal px-6 text-white">
      <div className="dotgrid absolute inset-0 opacity-30" />
      <div className="relative w-full max-w-sm rounded-3xl bg-surface p-8 text-center text-ink shadow-pop">
        <div className="flex justify-center"><BrandMark size={52} /></div>
        <div className="mt-5 text-5xl">🔒</div>
        <h1 className="mt-3 font-display text-xl font-extrabold">{L("บัญชีพนักงานต้องใช้แพ็กเกจ Business", "Staff accounts need the Business plan")}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {L(
            "ตอนนี้ร้านไม่ได้อยู่บนแพ็กเกจ Business — แจ้งเจ้าของร้านให้อัปเกรด แล้วพนักงานจะเข้าใช้งานได้อีกครั้ง",
            "This shop isn't on the Business plan right now — ask the owner to upgrade and staff can sign in again.",
          )}
        </p>
        <button onClick={onLogout} className="mt-6 w-full rounded-2xl bg-bg py-3 text-sm font-bold text-muted ring-1 ring-line active:scale-[.98]">
          {L("ออกจากระบบ", "Log out")}
        </button>
      </div>
    </div>
  );
}

function ApprovalGate({ status, L, onLogout }: { status: string; L: (th: string, en: string) => string; onLogout: () => void }) {
  const map: Record<string, { icon: string; title: string; sub: string }> = {
    pending: {
      icon: "⏳",
      title: L("ร้านของคุณกำลังรอการอนุมัติ", "Your shop is awaiting approval"),
      sub: L(
        "ทีมงานกำลังตรวจสอบร้านของคุณ โดยปกติภายใน 24 ชม. เมื่ออนุมัติแล้วคุณจะเข้าจัดการร้านได้ทันที",
        "Our team is reviewing your shop — usually within 24 hours. You'll get full access the moment it's approved.",
      ),
    },
    rejected: {
      icon: "🚫",
      title: L("ร้านนี้ไม่ผ่านการอนุมัติ", "This shop was not approved"),
      sub: L("กรุณาติดต่อทีมงานเพื่อขอข้อมูลเพิ่มเติม", "Please contact the team for more details."),
    },
    suspended: {
      icon: "⛔",
      title: L("ร้านนี้ถูกระงับการใช้งานชั่วคราว", "This shop is temporarily suspended"),
      sub: L("กรุณาติดต่อทีมงานเพื่อเปิดใช้งานอีกครั้ง", "Please contact the team to reactivate it."),
    },
  };
  const m = map[status] ?? map.pending;
  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-teal px-6 text-white">
      <div className="dotgrid absolute inset-0 opacity-30" />
      <div className="relative w-full max-w-sm rounded-3xl bg-surface p-8 text-center text-ink shadow-pop">
        <div className="flex justify-center"><BrandMark size={52} /></div>
        <div className="mt-5 text-5xl">{m.icon}</div>
        <h1 className="mt-3 font-display text-xl font-extrabold">{m.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{m.sub}</p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/contact" className="rounded-2xl bg-teal py-3 font-display text-sm font-bold text-white active:scale-[.98]">
            {L("ติดต่อทีมงาน", "Contact us")}
          </Link>
          <button onClick={onLogout} className="rounded-2xl bg-bg py-3 text-sm font-bold text-muted ring-1 ring-line active:scale-[.98]">
            {L("ออกจากระบบ", "Log out")}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginGate() {
  const { lang } = useI18n();
  const login = useShop((s) => s.login);
  const signup = useShop((s) => s.signup);
  const resetPassword = useShop((s) => s.resetPassword);
  const [notice, setNotice] = useState<string | null>(null);
  const L = (th: string, en: string) => (lang === "th" ? th : en);

  const doReset = async () => {
    if (!email.trim()) {
      setErr(L("กรอกอีเมลก่อน แล้วกด ‘ลืมรหัสผ่าน’", "Enter your email first, then tap ‘Forgot password’"));
      return;
    }
    setErr(null);
    setNotice(null);
    const msg = await resetPassword(email.trim());
    if (msg) setErr(msg);
    else setNotice(L("ส่งลิงก์รีเซ็ตรหัสผ่านไปที่อีเมลแล้ว — เช็คกล่องจดหมาย (รวมสแปม)", "Password-reset link sent — check your email (incl. spam)"));
  };
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [plan, setPlan] = useState<"starter" | "pro" | "business">("pro"); // plan the owner is interested in
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(false);
  const isSignup = mode === "signup";

  // deep-link ?signup=1 → start in signup mode (client-only, avoids SSR hydration mismatch)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!new URLSearchParams(window.location.search).get("signup")) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setMode("signup");
    setEmail("");
    setPassword("");
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignup && !agree) {
      setErr(L("กรุณายอมรับข้อตกลงและนโยบายความเป็นส่วนตัวก่อน", "Please accept the Terms and Privacy Policy first."));
      return;
    }
    setLoading(true);
    setErr(null);
    const msg = isSignup
      ? await signup(shopName.trim() || (lang === "th" ? "ร้านของฉัน" : "My Shop"), email.trim(), password, ownerName.trim(), phone.trim(), plan)
      : await login(email.trim(), password);
    if (msg) setErr(msg);
    setLoading(false);
  };
  const switchMode = () => {
    setErr(null);
    if (!isSignup) { setEmail(""); setPassword(""); }
    setMode(isSignup ? "login" : "signup");
  };

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-teal px-6 text-white">
      <div className="dotgrid absolute inset-0 opacity-30" />
      <form onSubmit={submit} className="relative w-full max-w-sm rounded-3xl bg-surface p-7 text-ink shadow-pop">
        <div className="flex justify-center">
          <BrandMark size={56} />
        </div>
        <h1 className="mt-4 text-center font-display text-xl font-extrabold">
          {isSignup ? L("สมัครร้านใหม่ (ฟรี)", "Create your shop (free)") : L("เข้าสู่ระบบร้านค้า", "Restaurant login")}
        </h1>
        <p className="mt-1 text-center text-sm text-muted">
          {isSignup ? L("เปิดร้านบน QR Store Mate ใน 1 นาที", "Open your shop in a minute") : L("จัดการร้านของคุณ", "Manage your shop")}
        </p>

        <div className="mt-6 space-y-3">
          {isSignup && (
            <>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder={L("ชื่อร้านของคุณ", "Your shop name")}
                className="w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-teal"
              />
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder={L("ชื่อผู้ติดต่อ (เจ้าของร้าน)", "Contact name (owner)")}
                className="w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-teal"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={L("เบอร์โทรติดต่อ", "Contact phone")}
                className="w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-teal"
              />
              <div>
                <p className="mb-1.5 text-xs font-semibold text-muted">{L("สนใจแพ็กเกจไหน?", "Which plan interests you?")}</p>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { k: "starter", name: "Starter", price: "฿299", hot: false },
                    { k: "pro", name: "Pro", price: "฿599", hot: true },
                    { k: "business", name: "Business", price: "฿1,290", hot: false },
                  ] as const).map((p) => (
                    <button
                      type="button"
                      key={p.k}
                      onClick={() => setPlan(p.k)}
                      aria-pressed={plan === p.k}
                      className={`relative rounded-2xl border px-2 py-2.5 text-center transition active:scale-95 ${
                        plan === p.k ? "border-teal bg-teal/10 ring-1 ring-teal" : "border-line bg-bg"
                      }`}
                    >
                      {p.hot && (
                        <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-coral px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {L("แนะนำ", "Top")}
                        </span>
                      )}
                      <span className="block font-display text-sm font-extrabold">{p.name}</span>
                      <span className="block text-[11px] text-muted">{p.price}/{L("ด.", "mo")}</span>
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted">{L("ทดลองฟรี 30 วัน • เปลี่ยนภายหลังได้", "Free 30-day trial • change anytime")}</p>
              </div>
            </>
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="username"
            className="w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-teal"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-teal"
          />
          {!isSignup && (
            <button type="button" onClick={doReset} className="block w-full text-right text-xs font-semibold text-teal-deep">
              {L("ลืมรหัสผ่าน?", "Forgot password?")}
            </button>
          )}
        </div>

        {isSignup && (
          <label className="mt-4 flex items-start gap-2 text-xs text-muted">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-teal"
            />
            <span>
              {L("ฉันยอมรับ", "I accept the")}{" "}
              <Link href="/terms" target="_blank" className="font-semibold text-teal-deep underline">{L("ข้อตกลงการใช้งาน", "Terms")}</Link>
              {" "}{L("และ", "and")}{" "}
              <Link href="/privacy" target="_blank" className="font-semibold text-teal-deep underline">{L("นโยบายความเป็นส่วนตัว", "Privacy Policy")}</Link>
              {" "}{L("รวมถึงการจัดเก็บข้อมูลในสิงคโปร์", "incl. data storage in Singapore")}
            </span>
          </label>
        )}

        {err && <p className="mt-3 text-center text-sm font-semibold text-[#b23a1e]">{err}</p>}
        {notice && <p className="mt-3 text-center text-sm font-semibold text-success">{notice}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-5 w-full rounded-2xl bg-teal py-3.5 font-display font-bold text-white shadow-card transition active:scale-[.99] disabled:opacity-60"
        >
          {loading ? "…" : isSignup ? L("สมัคร & เริ่มเลย", "Create & start") : L("เข้าสู่ระบบ", "Sign in")}
        </button>
        <button type="button" onClick={switchMode} className="mt-3 block w-full text-center text-xs font-semibold text-teal-deep underline">
          {isSignup ? L("มีบัญชีแล้ว? เข้าสู่ระบบ", "Have an account? Sign in") : L("ยังไม่มีร้าน? สมัครเปิดร้านฟรี", "New here? Create your shop — free")}
        </button>
        <Link href="/" className="mt-2 block text-center text-xs text-muted underline">
          {L("← กลับหน้าแรก", "← Back home")}
        </Link>
      </form>
    </div>
  );
}
