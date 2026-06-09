"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { type MenuItem } from "@/lib/mock";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { useCart, cartCount, cartNow } from "@/lib/cart";
import { baht } from "@/lib/format";
import { BrandMark } from "./BrandMark";
import { LangToggle } from "./LangToggle";
import { DishImage } from "./DishImage";
import { AddonSheet } from "./AddonSheet";
import { OnboardingPopup } from "./OnboardingPopup";
import { ReviewsSheet } from "./ReviewsSheet";
import { useOpenState } from "@/lib/hours";
import { Star, Clock, Plus, QrGlyph, ChevronRight } from "./icons";

export function MenuScreen({ slug, table }: { slug: string; table: string }) {
  const { t, tr, lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const profile = useShop((s) => s.profile);
  const allMenu = useShop((s) => s.menu);
  const shopCats = useShop((s) => s.categories);
  const loaded = useShop((s) => s.loaded);
  const loadError = useShop((s) => s.loadError);
  const restaurantId = useShop((s) => s.restaurantId);
  const hydrateBySlug = useShop((s) => s.hydrateBySlug);
  const ensureCtx = useCart((s) => s.ensureCtx);
  const menu = allMenu.filter((m) => !m.hidden);
  useEffect(() => {
    void hydrateBySlug(slug);
  }, [slug, hydrateBySlug]);
  // a cart belongs to one shop + table — reset it if either changes
  useEffect(() => {
    ensureCtx(slug + "/" + table);
  }, [slug, table, ensureCtx]);
  const [cat, setCat] = useState<string>("recommended");
  const [open, setOpen] = useState<MenuItem | null>(null);
  const [zoom, setZoom] = useState<string | null>(null); // tap-to-view: logo / cover lightbox
  const [reviewsOpen, setReviewsOpen] = useState(false);
  // live open/closed state (owner's switch + opening hours, Asia/Bangkok) — refreshes on the
  // shop realtime channel + a 30s clock tick so it flips at the boundary
  const openState = useOpenState(slug);
  const isOpen = openState.open;
  const lines = useCart((s) => s.lines);
  const count = cartCount(lines);
  const total = cartNow(lines);
  // if this table already has a live order, offer a way back to its status + review page
  // (otherwise tapping "สั่งเพิ่ม" from the order screen strands the customer on the menu)
  const lastOrder = useCart((s) => s.lastOrder);
  const hasOrder = !!lastOrder && lastOrder.ctx === `${slug}/${table}`;

  if (!loaded) {
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center bg-bg">
        <div className="flex flex-col items-center gap-3 text-muted">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-teal" />
          <span className="text-sm">{t("brand.tagline")}</span>
        </div>
      </div>
    );
  }

  // bad slug / load failure → don't fall back to demo data, show a clear screen
  if (loadError || !restaurantId) {
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center bg-bg px-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="text-5xl">🔍</div>
          <h1 className="font-display text-xl font-extrabold">{t("notfound.title")}</h1>
          <p className="text-sm text-muted">{t("notfound.sub")}</p>
          <Link href="/" className="mt-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-bold text-white shadow-card">
            QR Store Mate
          </Link>
        </div>
      </div>
    );
  }

  const signature = menu.filter((m) => m.signature && !m.soldout);
  const list =
    cat === "recommended"
      ? menu.filter((m) => m.signature || m.bestseller || m.oldPrice)
      : menu.filter((m) => m.cat === cat);
  // tabs: "recommended" + the shop's categories that actually have visible items
  const tabs = [
    { id: "recommended", label: t("cat.recommended") },
    ...shopCats.filter((c) => menu.some((m) => m.cat === c.id)).map((c) => ({ id: c.id, label: tr(c) })),
  ];

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-bg pb-28">
      {/* Cover */}
      <header className="relative overflow-hidden rounded-b-[28px] bg-teal text-white">
        <div
          className="absolute inset-0 dotgrid opacity-60"
          style={{ background: "linear-gradient(150deg,#0E7C86,#0A5963 70%)" }}
        />
        {profile.cover ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={profile.cover} alt="" className="absolute inset-0 h-full w-full object-cover" />
            {/* scrim: stays light over the photo up top, ramps dark behind the logo/name/badges so text
                reads cleanly on ANY cover — no font change, no cheap outline, just contrast */}
            <div
              className="absolute inset-0"
              style={{ background: "linear-gradient(180deg,rgba(8,40,43,.12) 0%,rgba(8,40,43,.45) 42%,rgba(8,40,43,.88) 100%)" }}
            />
          </>
        ) : (
          <>
            <div className="dotgrid absolute inset-0 opacity-40" />
            <div className="pointer-events-none absolute -right-6 top-6 select-none text-[120px] opacity-20 rotate-6">
              🦐
            </div>
          </>
        )}

        {/* tap anywhere on the cover photo (except the pills/logo) to view it full-size */}
        {profile.cover && (
          <button
            onClick={() => setZoom(profile.cover!)}
            aria-label={L("ดูรูปหน้าร้าน", "View cover photo")}
            className="absolute inset-0 z-0"
          />
        )}

        <div className="pointer-events-none relative z-10 px-5 pt-5">
          <div className="pointer-events-auto flex items-center justify-between">
            <LangToggle onCover />
            <div className="flex flex-wrap items-center justify-end gap-2">
              {hasOrder && (
                <Link
                  href={`/r/${slug}/t/${table}/order`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold ring-1 ring-white/25 backdrop-blur active:scale-95"
                >
                  🍽️ {t("status.waiting")}
                </Link>
              )}
              <Link
                href={`/r/${slug}/t/${table}/bill`}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold ring-1 ring-white/25 backdrop-blur active:scale-95"
              >
                🧾 {t("bill.table")}
              </Link>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold ring-1 ring-white/25 backdrop-blur">
                <QrGlyph size={15} /> {t("table")} {table}
              </span>
            </div>
          </div>

          <div className="mt-6 flex items-end gap-3.5">
            {profile.logo ? (
              <button
                onClick={() => setZoom(profile.logo!)}
                aria-label={L("ดูโลโก้ร้าน", "View shop logo")}
                className="pointer-events-auto grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-2 shadow-card active:scale-95"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={profile.logo} alt="logo" className="h-full w-full rounded-xl object-cover" />
              </button>
            ) : (
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white p-2 shadow-card">
                <BrandMark size={48} />
              </div>
            )}
            <div className="pb-0.5">
              <h1
                className="font-display text-2xl font-extrabold leading-none tracking-tight"
                style={{ textShadow: "0 2px 10px rgba(0,0,0,.45), 0 1px 2px rgba(0,0,0,.55)" }}
              >
                {tr(profile.name)}
              </h1>
              <p className="mt-1 text-[13px] text-white/90" style={{ textShadow: "0 1px 6px rgba(0,0,0,.5)" }}>
                {tr(profile.tagline)}
              </p>
            </div>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2 pb-5">
            {isOpen ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-teal-deep">
                <span className="h-2 w-2 rounded-full bg-success" style={{ animation: "pulse-ring 1.8s infinite" }} />
                {t("common.open")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-coral px-3 py-1.5 text-xs font-bold text-white shadow">
                ⏸ {openState.reason === "paused" ? L("ปิดรับออเดอร์", "Not taking orders") : L("ปิดแล้ว", "Closed")}
              </span>
            )}
            {/* tap to read what other customers said */}
            <button
              onClick={() => setReviewsOpen(true)}
              aria-label={L("อ่านรีวิว", "Read reviews")}
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold ring-1 ring-white/20 active:scale-95"
            >
              {profile.reviews > 0 ? (
                <>
                  <Star size={13} className="text-gold" /> {profile.rating}
                  <span className="text-white/70">({profile.reviews.toLocaleString()})</span>
                </>
              ) : (
                <>⭐ {L("อ่าน/เขียนรีวิว", "Reviews")}</>
              )}
              <span className="text-white/70">›</span>
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold ring-1 ring-white/20">
              <Clock size={13} /> {profile.hours || (profile.openTime && profile.closeTime ? `${profile.openTime}–${profile.closeTime}` : "")}
            </span>
          </div>
        </div>
      </header>

      {/* shop closed → can browse, but ordering is blocked (mirrors the server's place_order guard) */}
      {!isOpen && (
        <div className="mx-4 mt-4 flex items-start gap-3 rounded-2xl bg-coral/10 px-4 py-3.5 ring-1 ring-coral/30">
          <span className="text-xl">{openState.reason === "paused" ? "⏸️" : "🌙"}</span>
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-[#b23a1e]">
              {openState.reason === "paused"
                ? L("ร้านปิดรับออเดอร์ชั่วคราว", "Temporarily not taking orders")
                : L("ขณะนี้อยู่นอกเวลาทำการ", "Outside opening hours right now")}
            </p>
            <p className="mt-0.5 text-xs text-ink/70">
              {openState.reason === "paused"
                ? L("ดูเมนูได้ แต่ยังสั่งอาหารไม่ได้ตอนนี้", "You can browse the menu, but ordering is paused")
                : profile.hours || (profile.openTime && profile.closeTime)
                  ? L(`เปิดบริการ ${profile.hours || `${profile.openTime}–${profile.closeTime}`} น.`, `Open ${profile.hours || `${profile.openTime}–${profile.closeTime}`}`)
                  : L("กลับมาสั่งได้เมื่อร้านเปิด", "Please come back when the shop is open")}
            </p>
          </div>
        </div>
      )}

      {/* Signature */}
      <section className="px-5 pt-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold">
            <span className="text-gold">★</span> {t("menu.signature")}
          </h2>
          <span className="text-xs font-semibold text-muted">{t("menu.searchHint")}</span>
        </div>
        <div className="no-scrollbar -mx-5 flex gap-3.5 overflow-x-auto px-5 pb-1">
          {signature.map((m, i) => (
            <button
              key={m.id}
              onClick={() => isOpen && setOpen(m)}
              disabled={!isOpen}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`anim-rise w-44 shrink-0 overflow-hidden rounded-3xl bg-surface text-left shadow-card ring-1 ring-line ${isOpen ? "" : "opacity-60"}`}
            >
              <div className="relative">
                <DishImage tone={m.tone} emoji={m.emoji} img={m.img} emojiSize={52} className="h-28 w-full" />
                <span className="absolute left-2 top-2 rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-ink shadow">
                  ★ {t("common.signature")}
                </span>
              </div>
              <div className="p-3">
                <p className="line-clamp-1 font-display text-sm font-bold">{tr(m.name)}</p>
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">{tr(m.desc)}</p>
                <p className="mt-2 font-display text-base font-extrabold text-teal-deep">{baht(m.price)}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Category chips */}
      <nav className="sticky top-0 z-20 mt-4 border-b border-line bg-bg/90 backdrop-blur">
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-3">
          {tabs.map((c) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                cat === c.id
                  ? "bg-teal text-white shadow-card"
                  : "bg-surface text-muted ring-1 ring-line"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Menu list */}
      <section className="space-y-3 px-5 pt-4">
        {list.map((m, i) => (
          <MenuRow key={m.id} item={m} index={i} closed={!isOpen} onOpen={() => isOpen && !m.soldout && setOpen(m)} />
        ))}
        {list.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">{t("menu.empty")}</p>
        )}
      </section>

      {/* growth loop: every scan is a tiny ad */}
      <Link href="/" className="mt-7 block px-5 text-center text-xs text-muted">
        ⚡ {t("poweredBy")} <span className="font-bold text-teal-deep">QR Store Mate</span>
      </Link>

      {/* Cart bar */}
      {count > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30">
          <div className="mx-auto max-w-md px-4 pb-4">
            <Link
              href={`/r/${slug}/t/${table}/checkout`}
              className="flex items-center justify-between rounded-2xl bg-teal-deep px-5 py-3.5 text-white shadow-pop active:scale-[.99]"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-7 min-w-7 place-items-center rounded-full bg-white px-2 font-display text-sm font-extrabold text-teal-deep">
                  {count}
                </span>
                <span className="font-display font-bold">{t("common.viewCart")}</span>
              </span>
              <span className="flex items-center gap-1 font-display text-lg font-extrabold">
                {baht(total)} <ChevronRight size={18} />
              </span>
            </Link>
          </div>
        </div>
      )}

      <AddonSheet item={open} onClose={() => setOpen(null)} />
      {reviewsOpen && (
        <ReviewsSheet
          onClose={() => setReviewsOpen(false)}
          restaurantId={restaurantId}
          rating={profile.rating}
          count={profile.reviews}
        />
      )}
      <OnboardingPopup tableKey={`${slug}/${table}`} />

      {/* image lightbox — tap the logo or cover to view it full-size */}
      {zoom && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink/85 p-6 fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={L("ดูรูป", "View image")}
          onClick={() => setZoom(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={zoom}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-h-[82dvh] max-w-full rounded-3xl object-contain shadow-pop ring-1 ring-white/15"
          />
          <button
            onClick={() => setZoom(null)}
            aria-label={L("ปิด", "Close")}
            className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full bg-white/15 text-lg text-white ring-1 ring-white/30 backdrop-blur active:scale-90"
          >
            ✕
          </button>
          <p className="absolute bottom-7 left-0 right-0 text-center text-xs text-white/70">{L("แตะเพื่อปิด", "Tap to close")}</p>
        </div>
      )}
    </div>
  );
}

function MenuRow({
  item,
  index,
  closed,
  onOpen,
}: {
  item: MenuItem;
  index: number;
  closed?: boolean;
  onOpen: () => void;
}) {
  const { t, tr } = useI18n();
  const pct = item.oldPrice
    ? Math.round((1 - item.price / item.oldPrice) * 100)
    : 0;
  const blocked = item.soldout || !!closed;

  return (
    <button
      onClick={onOpen}
      disabled={blocked}
      style={{ animationDelay: `${index * 45}ms` }}
      className={`anim-rise flex w-full items-stretch gap-3 rounded-3xl bg-surface p-3 text-left shadow-card ring-1 ring-line ${
        blocked ? "opacity-60" : "active:scale-[.99]"
      } transition`}
    >
      <div className="relative shrink-0">
        <DishImage tone={item.tone} emoji={item.emoji} img={item.img} emojiSize={34} className="h-24 w-24 rounded-2xl" dim={item.soldout} />
        {item.bestseller && !item.soldout && (
          <span className="absolute -left-1 top-2 rounded-r-full bg-coral px-2 py-0.5 text-[10px] font-bold text-white shadow">
            🔥 {t("common.bestseller")}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start gap-2">
          <h3 className="font-display text-[15px] font-bold leading-snug">{tr(item.name)}</h3>
          {item.signature && (
            <span className="mt-0.5 shrink-0 rounded-full bg-gold/25 px-2 py-0.5 text-[10px] font-bold text-[#5b4708]">
              ★
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-muted">{tr(item.desc)}</p>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div className="flex items-baseline gap-2">
            {item.oldPrice && (
              <span className="text-xs text-muted line-through">{baht(item.oldPrice)}</span>
            )}
            <span className={`font-display text-lg font-extrabold ${item.oldPrice ? "text-[#b23a1e]" : "text-teal-deep"}`}>
              {baht(item.price)}
            </span>
            {pct > 0 && (
              <span className="rounded-md bg-coral/15 px-1.5 py-0.5 text-[10px] font-bold text-[#b23a1e]">
                -{pct}%
              </span>
            )}
          </div>

          {item.soldout ? (
            <span className="rounded-xl bg-bg px-3 py-2 text-xs font-bold text-muted ring-1 ring-line">
              {t("common.soldout")}
            </span>
          ) : (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-teal text-white shadow-card">
              <Plus size={18} />
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
