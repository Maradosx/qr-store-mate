"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import {
  useCart,
  cartNow,
  cartWas,
  cartDiscount,
  lineNow,
  lineWas,
  type CartLine,
} from "@/lib/cart";
import { baht } from "@/lib/format";
import { DishImage } from "./DishImage";
import { AddonSheet } from "./AddonSheet";
import { QtyStepper } from "./QtyStepper";
import { ChevronLeft, Trash } from "./icons";

export function CheckoutScreen({ slug, table }: { slug: string; table: string }) {
  const { t, tr, lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const router = useRouter();
  const hydrateBySlug = useShop((s) => s.hydrateBySlug);
  const profile = useShop((s) => s.profile);
  useEffect(() => {
    void hydrateBySlug(slug);
  }, [slug, hydrateBySlug]);
  const menu = useShop((s) => s.menu);
  const ensureCtx = useCart((s) => s.ensureCtx);
  // reconcile the cart to THIS shop/table even if the customer deep-linked straight to checkout
  useEffect(() => {
    ensureCtx(`${slug}/${table}`);
  }, [slug, table, ensureCtx]);
  const lines = useCart((s) => s.lines);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const placeOrder = useCart((s) => s.placeOrder);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const [editLine, setEditLine] = useState<CartLine | null>(null);

  const now = cartNow(lines);
  const was = cartWas(lines);
  const discount = cartDiscount(lines);
  const service = profile.serviceCharge ? Math.round(now * 0.07) : 0;
  const grand = Math.round(now) + service;

  if (lines.length === 0) {
    return (
      <div className="mx-auto grid min-h-dvh max-w-md place-items-center bg-bg px-6 text-center">
        <div>
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-surface shadow-card">🛒</div>
          <p className="font-display text-lg font-bold">{t("common.empty")}</p>
          <Link href={`/r/${slug}/t/${table}`} className="mt-5 inline-block rounded-2xl bg-teal px-6 py-3 font-display font-bold text-white shadow-card">
            {t("checkout.back")}
          </Link>
        </div>
      </div>
    );
  }

  // ordering only SENDS the items to the kitchen — no payment here. Everyone at the table keeps
  // ordering into one combined bill, and pays once at the end on the table-bill screen.
  const send = async () => {
    if (busy) return; // guard against double-tap
    setBusy(true);
    setErr(false);
    const no = await placeOrder(table, ""); // payment deferred to the combined bill
    if (no) {
      router.push(`/r/${slug}/t/${table}/order`);
    } else {
      setBusy(false);
      setErr(true); // failed — cart preserved, let them retry
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-bg pb-36">
      {/* header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur">
        <Link
          href={`/r/${slug}/t/${table}`}
          aria-label={t("nav.back")}
          className="grid h-10 w-10 place-items-center rounded-full bg-surface ring-1 ring-line active:scale-95"
        >
          <ChevronLeft />
        </Link>
        <div>
          <h1 className="font-display text-lg font-extrabold leading-none">{t("checkout.title")}</h1>
          <p className="mt-1 text-xs text-muted">
            {tr(profile.name)} · {t("table")} {table}
          </p>
        </div>
      </header>

      {/* items */}
      <section className="space-y-3 px-4 pt-4">
        {lines.map((l) => (
          <div key={l.key} className="flex gap-3 rounded-3xl bg-surface p-3 shadow-card ring-1 ring-line">
            <DishImage tone={l.tone} emoji={l.emoji} emojiSize={28} className="h-20 w-20 shrink-0 rounded-2xl" />
            <div className="flex min-w-0 flex-1 flex-col">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-sm font-bold leading-snug">{tr(l.name)}</h3>
                <div className="flex shrink-0 items-center gap-1">
                  {menu.some((m) => m.id === l.itemId) && (
                    <button
                      onClick={() => setEditLine(l)}
                      className="rounded-lg px-2.5 py-1.5 text-xs font-bold text-teal-deep ring-1 ring-line active:scale-90"
                      aria-label={t("checkout.edit")}
                    >
                      ✎ {t("checkout.edit")}
                    </button>
                  )}
                  <button onClick={() => remove(l.key)} className="grid h-9 w-9 place-items-center rounded-lg text-muted active:scale-90" aria-label="remove">
                    <Trash size={18} />
                  </button>
                </div>
              </div>
              {(l.addonLabel.th || l.spiceKey || l.note) && (
                <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted">
                  {[tr(l.addonLabel), l.spiceKey ? t("spice.title") + ": " + t(l.spiceKey as never) : "", l.note]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <div className="mt-auto flex items-end justify-between pt-1.5">
                <div className="flex items-baseline gap-1.5">
                  {lineWas(l) > lineNow(l) && (
                    <span className="text-[11px] text-muted line-through">{baht(lineWas(l))}</span>
                  )}
                  <span className="font-display text-base font-extrabold text-teal-deep">{baht(lineNow(l))}</span>
                </div>
                <QtyStepper
                  value={l.qty}
                  onDec={() => setQty(l.key, l.qty - 1)}
                  onInc={() => setQty(l.key, l.qty + 1)}
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* dine-in note: order now, pay together at the end */}
      <div className="mx-4 mt-5 flex items-start gap-2.5 rounded-2xl bg-aqua/10 px-4 py-3 ring-1 ring-aqua/30">
        <span className="text-lg">🧾</span>
        <p className="text-xs leading-relaxed text-ink/80">
          {L(
            "กดส่งแล้วครัวจะเริ่มทำทันที — สั่งเพิ่มได้เรื่อยๆ ทุกคนในโต๊ะ รายการจะรวมเป็นบิลเดียว แล้วค่อยจ่ายทีเดียวตอนท้าย",
            "Tap send and the kitchen starts right away — keep ordering; everyone at the table shares one bill and pays once at the end.",
          )}
        </p>
      </div>

      {/* summary (this order) */}
      <section className="mx-4 mt-4 rounded-3xl bg-surface p-4 shadow-card ring-1 ring-line">
        <p className="mb-2 text-xs font-semibold text-muted">{L("รายการนี้", "This order")}</p>
        <Row label={t("common.subtotal")} value={baht(was)} />
        {discount > 0 && <Row label={t("common.discount")} value={`-${baht(discount)}`} accent />}
        {profile.serviceCharge && <Row label={t("common.serviceCharge")} value={baht(service)} muted />}
        <div className="my-2 border-t border-dashed border-line" />
        <div className="flex items-center justify-between">
          <span className="font-display font-extrabold">{t("common.total")}</span>
          <span className="font-display text-xl font-extrabold text-teal-deep">{baht(grand)}</span>
        </div>
      </section>

      {/* send to kitchen */}
      <div className="fixed inset-x-0 bottom-0 z-30">
        <div className="mx-auto max-w-md px-4 pb-4">
          {err && (
            <p className="mb-2 rounded-xl bg-coral/10 px-3 py-2 text-center text-xs font-semibold text-[#b23a1e]">
              {t("checkout.failed")}
            </p>
          )}
          <button
            onClick={send}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-4 font-display text-base font-extrabold text-white shadow-pop transition active:scale-[.99] disabled:opacity-70 disabled:active:scale-100"
          >
            {busy ? (
              <>
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                {t("checkout.placing")}
              </>
            ) : (
              <>👨‍🍳 {L("ส่งเข้าครัว", "Send to kitchen")} • {baht(grand)}</>
            )}
          </button>
        </div>
      </div>

      {editLine && (
        <AddonSheet
          item={menu.find((m) => m.id === editLine.itemId) ?? null}
          edit={{ key: editLine.key, qty: editLine.qty, sel: editLine.sel, spice: editLine.spiceKey, note: editLine.note }}
          onClose={() => setEditLine(null)}
        />
      )}
    </div>
  );
}

function Row({ label, value, accent, muted }: { label: string; value: string; accent?: boolean; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className={muted ? "text-muted" : "text-ink/80"}>{label}</span>
      <span className={`font-semibold ${accent ? "text-success" : muted ? "text-muted" : "text-ink"}`}>{value}</span>
    </div>
  );
}
