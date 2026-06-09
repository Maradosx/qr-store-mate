"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { billingState, planPrice, fetchPlatformSettings, type PlatformSettings } from "@/lib/db";
import { promptPayPayload, isValidPromptPay } from "@/lib/promptpay";
import { baht } from "@/lib/format";
import { Card, PageTitle } from "@/components/admin/ui";

const PLANS = [
  { id: "starter", th: "Starter", en: "Starter", feat_th: "≤8 โต๊ะ • กราฟยอดขายรายวัน", feat_en: "≤8 tables • daily sales chart" },
  { id: "pro", th: "Pro", en: "Pro", feat_th: "≤25 โต๊ะ • จอครัว • โปรโมชั่น • วิเคราะห์", feat_en: "≤25 tables • kitchen • promos • analytics" },
  { id: "business", th: "Business", en: "Business", feat_th: "โต๊ะไม่จำกัด • พนักงานหลายคน • CSV • ซัพพอร์ตด่วน", feat_en: "Unlimited tables • staff accounts • CSV • priority support" },
];

export default function BillingPage() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const billing = useShop((s) => s.billing);
  const restaurantId = useShop((s) => s.restaurantId);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchPlatformSettings().then((s) => alive && setSettings(s));
    return () => {
      alive = false;
    };
  }, []);

  if (!restaurantId) {
    return (
      <div className="py-20 text-center text-sm text-muted">
        {L("เข้าสู่ระบบร้านเพื่อดูค่าสมาชิก", "Sign in as a shop to view billing")}
      </div>
    );
  }

  const bs = billingState(billing.trialEndsAt, billing.paidUntil);
  const amount = settings ? planPrice(billing.plan, settings) : 0;
  const planMeta = PLANS.find((p) => p.id === billing.plan) ?? PLANS[1];
  const fmtDate = (d: string | null) =>
    d ? new Date(d).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

  const STATE: Record<string, { icon: string; cls: string; label: string }> = {
    active: { icon: "✓", cls: "bg-success/15 text-success", label: L("ใช้งานอยู่", "Active") },
    trialing: { icon: "🎁", cls: "bg-aqua/15 text-teal-deep", label: L("ทดลองใช้ฟรี", "Free trial") },
    past_due: { icon: "⏰", cls: "bg-coral/15 text-[#b23a1e]", label: L("เลยกำหนดชำระ", "Payment due") },
  };
  const st = STATE[bs.state];

  return (
    <div>
      <PageTitle
        title={L("ค่าสมาชิก", "Billing")}
        subtitle={L("แพ็กเกจ & การชำระเงินรายเดือน", "Your plan & monthly payment")}
      />

      {bs.state === "past_due" && (
        <div className="mb-4 flex items-start gap-3 rounded-2xl bg-coral/10 px-4 py-3 ring-1 ring-coral/40">
          <span className="text-xl">⏰</span>
          <div>
            <p className="font-display text-sm font-extrabold text-[#b23a1e]">
              {L("ถึงกำหนดชำระค่าสมาชิกแล้ว", "Your subscription payment is due")}
            </p>
            <p className="mt-0.5 text-xs text-ink/70">
              {L(
                "ร้านยังเปิดใช้งานได้ตามปกติ — กรุณาชำระเพื่อใช้งานต่อเนื่อง",
                "Your shop stays active — please pay to keep it running smoothly.",
              )}
            </p>
          </div>
        </div>
      )}

      {/* current plan + status */}
      <Card className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted">{L("แพ็กเกจปัจจุบัน", "Current plan")}</p>
            <p className="font-display text-2xl font-extrabold text-teal-deep">{L(planMeta.th, planMeta.en)}</p>
            <p className="text-sm text-muted">{settings ? `${baht(amount)} / ${L("เดือน", "mo")}` : "…"}</p>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${st.cls}`}>
            {st.icon} {st.label}
          </span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-3 text-sm">
          <div>
            <p className="text-xs text-muted">{L("ทดลองฟรีถึง", "Trial ends")}</p>
            <p className="font-semibold">{fmtDate(billing.trialEndsAt)}</p>
          </div>
          <div>
            <p className="text-xs text-muted">{L("ชำระแล้วถึง", "Paid until")}</p>
            <p className="font-semibold">{fmtDate(billing.paidUntil)}</p>
          </div>
        </div>
      </Card>

      {/* pay */}
      <Card className="mb-5">
        <h2 className="mb-1 font-display text-base font-extrabold">💸 {L("ชำระค่าสมาชิก", "Pay your subscription")}</h2>
        <p className="mb-4 text-xs text-muted">
          {L(
            "สแกน QR ด้วยแอปธนาคารเพื่อโอนค่าสมาชิก แล้วแจ้งทีมงาน — ระบบจะอัปเดตสถานะให้",
            "Scan with your banking app to pay, then notify the team — we'll update your status.",
          )}
        </p>
        {settings && isValidPromptPay(settings.promptpay_id) ? (
          <div className="flex flex-wrap items-center gap-5 rounded-2xl bg-bg p-4 ring-1 ring-line">
            <PromptPayQR id={settings.promptpay_id} amount={amount} />
            <div className="text-sm">
              <p className="text-xs text-muted">{L("โอนเข้าบัญชี", "Pay to")}</p>
              <p className="font-display font-bold">{settings.promptpay_name || settings.promptpay_id}</p>
              <p className="text-muted">{settings.promptpay_id}</p>
              <p className="mt-1 font-display text-2xl font-extrabold text-teal-deep">{baht(amount)}</p>
              <p className="mt-1 text-xs text-muted">{L(planMeta.th, planMeta.en)} · {L("รายเดือน", "monthly")}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl bg-bg p-4 text-sm text-muted ring-1 ring-line">
            {L("ยังไม่ได้ตั้งช่องทางรับเงิน — กรุณาติดต่อทีมงาน", "Payment channel not set up yet — please contact the team.")}
          </div>
        )}

        {/* Stripe (card) — coming once connected */}
        <button
          disabled
          className="mt-3 w-full rounded-2xl border border-dashed border-line py-3 text-sm font-bold text-muted"
        >
          💳 {L("จ่ายด้วยบัตรเครดิต (เร็ว ๆ นี้)", "Pay by card (coming soon)")}
        </button>
      </Card>

      {/* plans */}
      <Card>
        <h2 className="mb-3 font-display text-base font-extrabold">📦 {L("แพ็กเกจทั้งหมด", "All plans")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {PLANS.map((p) => {
            const active = p.id === billing.plan;
            const price = settings
              ? planPrice(p.id, settings)
              : { starter: 299, pro: 599, business: 1290 }[p.id]!;
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-4 ring-1 ${active ? "bg-teal/5 ring-teal" : "bg-surface ring-line"}`}
              >
                <p className="font-display text-lg font-extrabold">{L(p.th, p.en)}</p>
                <p className="font-display text-xl font-extrabold text-teal-deep">
                  {baht(price)}<span className="text-xs font-normal text-muted"> / {L("เดือน", "mo")}</span>
                </p>
                <p className="text-[11px] text-muted">{L(`หรือ ฿${(price * 10).toLocaleString()}/ปี (ฟรี 2 เดือน)`, `or ฿${(price * 10).toLocaleString()}/yr (2 mo free)`)}</p>
                <p className="mt-1 text-xs text-muted">{L(p.feat_th, p.feat_en)}</p>
                {active && (
                  <span className="mt-2 inline-block rounded-full bg-teal px-2.5 py-0.5 text-[11px] font-bold text-white">
                    {L("แพ็กเกจของคุณ", "Your plan")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted">
          {L("ต้องการเปลี่ยนแพ็กเกจ? ติดต่อทีมงานได้เลย", "Want to change plans? Just contact the team.")}
        </p>
      </Card>
    </div>
  );
}

function PromptPayQR({ id, amount }: { id: string; amount: number }) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    if (!isValidPromptPay(id) || amount <= 0) return;
    let alive = true;
    QRCode.toDataURL(promptPayPayload(id, amount), {
      width: 360,
      margin: 1,
      color: { dark: "#16282B", light: "#FFFFFF" },
    })
      .then((d) => alive && setQr(d))
      .catch(() => alive && setQr(""));
    return () => {
      alive = false;
    };
  }, [id, amount]);

  if (!qr) {
    return (
      <div className="grid h-[140px] w-[140px] shrink-0 place-items-center rounded-xl bg-white text-xs font-bold text-muted ring-1 ring-line">
        QR
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={qr} alt="PromptPay QR" className="h-[140px] w-[140px] shrink-0 rounded-xl bg-white p-2 ring-1 ring-line" />
  );
}
