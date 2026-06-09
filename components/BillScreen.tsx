"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { useShop } from "@/lib/shop";
import { fetchTableBill, callStaff, type TableBill } from "@/lib/db";
import { subscribeShop } from "@/lib/realtime";
import { promptPayPayload, isValidPromptPay } from "@/lib/promptpay";
import QRCode from "qrcode";
import { baht } from "@/lib/format";
import { DishImage } from "./DishImage";
import { ChevronLeft } from "./icons";

const ST: Record<string, { th: string; en: string; cls: string }> = {
  received: { th: "รับออเดอร์แล้ว", en: "Received", cls: "bg-aqua/15 text-teal-deep" },
  cooking: { th: "กำลังปรุง", en: "Cooking", cls: "bg-coral/15 text-[#b23a1e]" },
  serving: { th: "กำลังเสิร์ฟ", en: "Serving", cls: "bg-gold/25 text-[#5b4708]" },
  done: { th: "เสร็จแล้ว", en: "Done", cls: "bg-success/15 text-[#0f7a47]" },
  cancelled: { th: "ยกเลิก", en: "Cancelled", cls: "bg-ink/10 text-ink/60" },
};

type PayKey = "promptpay" | "bank" | "copay" | "cash";

export function BillScreen({ slug, table }: { slug: string; table: string }) {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const hydrateBySlug = useShop((s) => s.hydrateBySlug);
  const restaurantId = useShop((s) => s.restaurantId);
  const profile = useShop((s) => s.profile);
  const [bill, setBill] = useState<TableBill | null>(null);
  const [method, setMethod] = useState<PayKey | null>(null);
  const [calling, setCalling] = useState(false);
  const [called, setCalled] = useState(false);

  useEffect(() => {
    void hydrateBySlug(slug);
  }, [slug, hydrateBySlug]);

  useEffect(() => {
    if (!restaurantId) return;
    let alive = true;
    const poll = async () => {
      const b = await fetchTableBill(restaurantId, table);
      if (alive) setBill(b);
    };
    void poll();
    const unsub = subscribeShop(restaurantId, () => void poll()); // instant push on new orders / payments at this table
    const id = setInterval(poll, 15000); // safety-net fallback
    return () => {
      alive = false;
      unsub();
      clearInterval(id);
    };
  }, [restaurantId, table]);

  // payment options the shop actually offers (PromptPay / bank-or-QR / co-pay / cash). Cash is always last.
  const methods: { key: PayKey; emoji: string; label: string; sub: string }[] = [];
  if (isValidPromptPay(profile.promptpayId)) methods.push({ key: "promptpay", emoji: "📱", label: L("พร้อมเพย์", "PromptPay"), sub: L("สแกนจ่าย", "Scan to pay") });
  if (profile.payQrUrl || profile.bankAccount) methods.push({ key: "bank", emoji: "🏦", label: L("โอน / สแกน QR", "Bank / QR"), sub: L("ธนาคาร/วอลเล็ต", "Bank / wallet") });
  if (profile.coPay) methods.push({ key: "copay", emoji: "🇹🇭", label: L("คนละครึ่ง", "Co-pay"), sub: L("ไทยช่วยไทย", "Gov scheme") });
  methods.push({ key: "cash", emoji: "💵", label: L("เงินสด", "Cash"), sub: L("จ่ายที่เคาน์เตอร์", "At counter") });
  const activeMethod: PayKey = method && methods.some((m) => m.key === method) ? method : methods[0].key;

  // tapping the bottom bar pings staff (a service call) so someone comes to close the bill at the table
  const callForBill = async () => {
    if (!restaurantId || calling || called) return;
    setCalling(true);
    try {
      await callStaff(restaurantId, table, "bill"); // distinct "call for the bill" alert on the admin side
      setCalled(true);
      window.setTimeout(() => setCalled(false), 8000);
    } catch {
      /* ignore — they can retry or pay at the counter */
    } finally {
      setCalling(false);
    }
  };

  return (
    <div className="mx-auto min-h-dvh max-w-md bg-bg pb-36">
      {/* header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur">
        <Link href={`/r/${slug}/t/${table}`} aria-label={L("กลับ", "Back")} className="grid h-10 w-10 place-items-center rounded-full bg-surface ring-1 ring-line active:scale-95">
          <ChevronLeft />
        </Link>
        <div>
          <h1 className="font-display text-lg font-extrabold leading-none">🧾 {L("บิลทั้งโต๊ะ", "Table bill")}</h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-success" style={{ animation: "pulse-ring 1.8s infinite" }} />
            {L("โต๊ะ", "Table")} {table} · {L("อัปเดตสด", "live")}
          </p>
        </div>
      </header>

      {bill === null ? (
        <div className="grid place-items-center py-24">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-teal" />
        </div>
      ) : bill.orders.length === 0 ? (
        <div className="grid place-items-center px-8 py-24 text-center">
          <div>
            <div className="text-5xl">🍽️</div>
            <p className="mt-3 font-display text-lg font-bold">{L("ยังไม่มีรายการในโต๊ะนี้", "No orders on this table yet")}</p>
            <Link href={`/r/${slug}/t/${table}`} className="mt-5 inline-block rounded-2xl bg-teal px-6 py-3 font-display font-bold text-white shadow-card">
              {L("สั่งอาหาร", "Order food")}
            </Link>
          </div>
        </div>
      ) : (
        <section className="space-y-3 px-4 pt-4">
          <p className="text-xs text-muted">{L(`รวมทุกคนในโต๊ะ ${bill.count} ออเดอร์`, `${bill.count} orders from everyone at this table`)}</p>
          {bill.orders.map((o) => {
            const st = ST[o.status] ?? ST.received;
            const oSub = o.items.reduce((s, i) => s + i.unit_price * i.qty, 0); // pre-VAT sum, reconciles with the listed items
            return (
              <div key={o.order_no} className="rounded-3xl bg-surface p-4 shadow-card ring-1 ring-line">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-extrabold">{o.order_no}</span>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${st.cls}`}>{L(st.th, st.en)}</span>
                </div>
                <ul className="mt-3 space-y-2 border-t border-dashed border-line pt-3">
                  {o.items.map((i, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <DishImage tone={i.tone} emoji={i.emoji} emojiSize={18} className="h-9 w-9 shrink-0 rounded-lg" />
                      <span className="min-w-0 flex-1 truncate text-sm">
                        <span className="text-muted">{i.qty}× </span>
                        {lang === "th" ? i.name_th : i.name_en}
                      </span>
                      <span className="text-sm font-semibold text-muted">{baht(i.unit_price * i.qty)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex justify-end text-sm font-bold text-teal-deep">{baht(oSub)}</div>
              </div>
            );
          })}
        </section>
      )}

      {/* choose a payment method + totals, then pay the whole table once at the end */}
      {bill && bill.orders.length > 0 && (() => {
        const subtotal = bill.orders.reduce((s, o) => s + o.items.reduce((a, i) => a + i.unit_price * i.qty, 0), 0);
        const vat = Math.max(0, bill.total - subtotal); // 7% VAT included in bill.total when the shop enabled it
        const pending = bill.orders.filter((o) => o.status === "received" || o.status === "cooking" || o.status === "serving").length;
        return (
          <>
            {pending > 0 && (
              <section className="px-4 pt-4">
                <div className="flex items-start gap-2.5 rounded-2xl bg-gold/15 px-4 py-3 ring-1 ring-gold/40">
                  <span className="text-lg">⏳</span>
                  <p className="text-xs leading-relaxed text-ink/80">
                    {L(
                      `ยังมีอาหารกำลังทำ/กำลังเสิร์ฟอยู่ ${pending} รายการ — แนะนำให้รับให้ครบก่อนค่อยชำระเงินนะคะ`,
                      `${pending} item(s) still being prepared/served — best to wait until everything arrives before paying.`,
                    )}
                  </p>
                </div>
              </section>
            )}
            <section className="px-4 pt-5">
              <h2 className="mb-2.5 font-display text-base font-extrabold">💳 {L("เลือกวิธีชำระเงิน (ทั้งโต๊ะ)", "Choose how to pay (whole table)")}</h2>
              <div className="grid grid-cols-2 gap-2.5">
                {methods.map((m) => {
                  const on = activeMethod === m.key;
                  return (
                    <button
                      key={m.key}
                      onClick={() => setMethod(m.key)}
                      aria-pressed={on}
                      className={`flex items-center gap-2.5 rounded-2xl px-3.5 py-3 text-left ring-1 transition active:scale-[.98] ${
                        on ? "bg-teal text-white ring-teal shadow-card" : "bg-surface text-ink ring-line"
                      }`}
                    >
                      <span className="text-xl">{m.emoji}</span>
                      <span className="min-w-0">
                        <span className="block font-display text-sm font-bold leading-tight">{m.label}</span>
                        <span className={`block text-[11px] leading-tight ${on ? "text-white/80" : "text-muted"}`}>{m.sub}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* detail for the selected method */}
              <div className="mt-3 rounded-3xl bg-surface p-4 shadow-card ring-1 ring-line">
                {activeMethod === "promptpay" && (
                  <div className="flex items-center gap-4">
                    <BillPayQR id={profile.promptpayId} amount={bill.total} />
                    <div className="text-sm">
                      <p className="text-xs text-muted">{L("สแกนพร้อมเพย์เพื่อจ่าย", "Scan PromptPay to pay")}</p>
                      <p className="font-display font-bold">{profile.promptpayName || profile.promptpayId}</p>
                      <p className="mt-1 font-display text-lg font-extrabold text-teal-deep">{baht(bill.total)}</p>
                    </div>
                  </div>
                )}

                {activeMethod === "bank" && (
                  <div className="space-y-3">
                    {profile.payQrUrl && (
                      <div className="flex items-center gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={profile.payQrUrl} alt="QR" className="h-24 w-24 shrink-0 rounded-xl bg-white object-contain p-1 ring-1 ring-line" />
                        <div className="text-sm">
                          <p className="text-xs text-muted">{L("สแกน QR ของร้าน", "Scan the shop's QR")}</p>
                          {profile.bankName && <p className="font-display font-bold">{profile.bankName}</p>}
                        </div>
                      </div>
                    )}
                    {(profile.bankAccount || profile.bankAccountName) && (
                      <div className={`text-sm ${profile.payQrUrl ? "border-t border-line pt-3" : ""}`}>
                        {profile.bankName && <p className="font-display font-bold">{profile.bankName}</p>}
                        {profile.bankAccount && <p className="text-muted">{profile.bankAccount}</p>}
                        {profile.bankAccountName && <p className="text-muted">{profile.bankAccountName}</p>}
                      </div>
                    )}
                  </div>
                )}

                {activeMethod === "copay" && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">🇹🇭</span>
                    <p className="text-sm leading-relaxed text-ink/80">
                      {L(
                        "ร้านนี้รองรับ คนละครึ่ง / ไทยช่วยไทย — แจ้งพนักงานเพื่อสแกนสิทธิ์ที่โต๊ะ แล้วชำระส่วนต่างตามจริง",
                        "This shop accepts the government co-pay scheme — ask staff to scan your entitlement at the table, then pay the remainder.",
                      )}
                    </p>
                  </div>
                )}

                {activeMethod === "cash" && (
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">💵</span>
                    <p className="text-sm leading-relaxed text-ink/80">
                      {L(
                        "จ่ายเงินสดได้ที่เคาน์เตอร์ หรือกดเรียกพนักงานมาเก็บเงินที่โต๊ะด้านล่าง",
                        "Pay cash at the counter, or call staff to collect at your table below.",
                      )}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* totals */}
            <section className="px-4 pt-4">
              <div className="space-y-1 rounded-3xl bg-surface px-5 py-4 shadow-card ring-1 ring-line">
                {vat > 0 && (
                  <>
                    <div className="flex items-center justify-between text-sm"><span className="text-muted">{L("ยอดรวม", "Subtotal")}</span><span className="font-semibold">{baht(subtotal)}</span></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-muted">VAT 7%</span><span className="font-semibold">{baht(vat)}</span></div>
                    <div className="my-1 border-t border-dashed border-line" />
                  </>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-display font-extrabold">{L("ยอดรวมทั้งโต๊ะ", "Table total")}</span>
                  <span className="font-display text-2xl font-extrabold text-teal-deep">{baht(bill.total)}</span>
                </div>
              </div>
            </section>

            {/* fixed action bar — call staff to come collect / close the bill */}
            <div className="fixed inset-x-0 bottom-0 z-30">
              <div className="mx-auto max-w-md px-4 pb-4">
                <button
                  onClick={callForBill}
                  disabled={calling || called}
                  className={`flex w-full items-center justify-between rounded-2xl px-5 py-4 shadow-pop transition active:scale-[.99] disabled:active:scale-100 ${
                    called ? "bg-success text-white" : "bg-teal-deep text-white"
                  }`}
                >
                  <span className="font-display font-bold">
                    {calling
                      ? L("กำลังเรียก…", "Calling…")
                      : called
                        ? L("✓ เรียกพนักงานแล้ว — กำลังไปเก็บเงิน", "✓ Staff notified — on the way")
                        : L("🔔 กดเรียกพนักงานเก็บเงิน", "🔔 Call staff to take payment")}
                  </span>
                  {!called && <span className="font-display text-xl font-extrabold">{baht(bill.total)}</span>}
                </button>
                <p className="mt-1.5 text-center text-[11px] text-muted">
                  {L("จ่ายตามวิธีด้านบน แล้วกดเรียกพนักงานมาปิดบิล หรือจ่ายที่เคาน์เตอร์", "Pay via the method above, then call staff to close the bill — or pay at the counter")}
                </p>
              </div>
            </div>
          </>
        );
      })()}
    </div>
  );
}

function BillPayQR({ id, amount }: { id: string; amount: number }) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    if (!isValidPromptPay(id) || amount <= 0) return;
    let alive = true;
    QRCode.toDataURL(promptPayPayload(id, amount), { width: 320, margin: 1, color: { dark: "#16282B", light: "#FFFFFF" } })
      .then((d) => alive && setQr(d))
      .catch(() => alive && setQr(""));
    return () => {
      alive = false;
    };
  }, [id, amount]);
  if (!qr) {
    return <div className="grid h-[104px] w-[104px] shrink-0 place-items-center rounded-xl bg-white text-[10px] font-bold text-muted ring-1 ring-line">QR</div>;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={qr} alt="PromptPay QR" className="h-[104px] w-[104px] shrink-0 rounded-xl bg-white p-1 ring-1 ring-line" />;
}
