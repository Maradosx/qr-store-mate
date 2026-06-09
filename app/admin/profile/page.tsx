"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { promptPayPayload, isValidPromptPay } from "@/lib/promptpay";
import { isShopOpen } from "@/lib/hours";
import { BrandMark } from "@/components/BrandMark";
import { Card, PageTitle, Field, UploadButton } from "@/components/admin/ui";

export default function ProfilePage() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const profile = useShop((s) => s.profile);
  const update = useShop((s) => s.updateProfile);
  const logout = useShop((s) => s.logout);
  const slug = useShop((s) => s.slug);
  const previewHref = slug ? `/r/${slug}/t/1` : "/t/1";

  const accepting = profile.acceptingOrders !== false; // undefined → on
  // re-derive the live status on a 30s tick so the owner's badge flips at the open/close boundary
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);
  const liveOpen = isShopOpen(profile).open;
  // setting either time also keeps the display `hours` string in sync (so the menu badge matches)
  const setHours = (open: string | null, close: string | null) =>
    update({ openTime: open, closeTime: close, hours: open && close ? `${open}–${close}` : "" });

  return (
    <div>
      <PageTitle
        title={L("ร้านของฉัน", "My Shop")}
        subtitle={L("แก้ไขข้อมูล/รูปร้าน — แสดงผลที่หน้าลูกค้าทันที", "Edit info & images — reflected on the customer app instantly")}
        action={
          <Link href={previewHref} className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-white shadow-card">
            {L("ดูหน้าลูกค้า ↗", "Preview ↗")}
          </Link>
        }
      />

      {/* Images */}
      <Card className="mb-5">
        <h2 className="mb-1 font-display text-base font-extrabold">🖼️ {L("รูปร้าน", "Shop images")}</h2>
        <p className="mb-4 text-xs text-muted">{L("รูปปก = แบนเนอร์บนสุดที่ลูกค้าเห็น • โลโก้ = วงกลมข้างชื่อร้าน", "Cover = top banner customers see • Logo = badge beside the name")}</p>

        {/* cover */}
        <div className="mb-2 text-xs font-semibold text-muted">{L("รูปปกร้าน", "Cover photo")}</div>
        <div className="relative mb-4 h-40 overflow-hidden rounded-2xl ring-1 ring-line">
          {profile.cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.cover} alt="cover" className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center text-white" style={{ background: "linear-gradient(150deg,#0E7C86,#0A5963)" }}>
              <span className="text-sm opacity-80">{L("ยังไม่มีรูปปก", "No cover yet")}</span>
            </div>
          )}
          <div className="absolute bottom-3 right-3 flex gap-2">
            {profile.cover && (
              <button onClick={() => update({ cover: undefined })} className="rounded-xl bg-white/90 px-3 py-2 text-xs font-bold text-[#b23a1e] shadow active:scale-95">
                {L("ลบรูป", "Remove")}
              </button>
            )}
            <UploadButton label={L("เปลี่ยนรูปปก", "Change cover")} folder="covers" onPick={(d) => update({ cover: d })} />
          </div>
        </div>

        {/* logo */}
        <div className="mb-2 text-xs font-semibold text-muted">{L("โลโก้ร้าน", "Logo")}</div>
        <div className="flex items-center gap-4">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl bg-bg ring-1 ring-line">
            {profile.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.logo} alt="logo" className="h-full w-full object-cover" />
            ) : (
              <BrandMark size={56} />
            )}
          </div>
          <div className="flex gap-2">
            <UploadButton label={L("เปลี่ยนโลโก้", "Change logo")} folder="logos" onPick={(d) => update({ logo: d })} />
            {profile.logo && (
              <button onClick={() => update({ logo: undefined })} className="rounded-xl bg-bg px-3 py-2 text-xs font-bold text-[#b23a1e] ring-1 ring-line active:scale-95">
                {L("ลบ", "Remove")}
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Info */}
      <Card className="mb-5">
        <h2 className="mb-4 font-display text-base font-extrabold">📝 {L("ข้อมูลร้าน", "Shop details")}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={L("ชื่อร้าน (ไทย)", "Name (TH)")} value={profile.name.th} onChange={(v) => update({ name: { ...profile.name, th: v } })} />
          <Field label={L("ชื่อร้าน (อังกฤษ)", "Name (EN)")} value={profile.name.en} onChange={(v) => update({ name: { ...profile.name, en: v } })} />
          <Field label={L("คำโปรย (ไทย)", "Tagline (TH)")} value={profile.tagline.th} onChange={(v) => update({ tagline: { ...profile.tagline, th: v } })} />
          <Field label={L("คำโปรย (อังกฤษ)", "Tagline (EN)")} value={profile.tagline.en} onChange={(v) => update({ tagline: { ...profile.tagline, en: v } })} />
          <Field label={L("เบอร์โทร", "Phone")} value={profile.phone} onChange={(v) => update({ phone: v })} />
          <div className="sm:col-span-2">
            <Field label={L("ที่อยู่", "Address")} value={profile.address} onChange={(v) => update({ address: v })} />
          </div>
        </div>
        <div className="mt-4 border-t border-line pt-4">
          <p className="mb-3 text-xs font-semibold text-muted">{L("ข้อมูลติดต่อเจ้าของร้าน (ทีมงาน QR Store Mate ใช้ติดต่อกลับ)", "Owner contact (used by the QR Store Mate team to reach you)")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={L("ชื่อผู้ติดต่อ", "Contact name")} value={profile.ownerName ?? ""} onChange={(v) => update({ ownerName: v })} />
            <Field label={L("เบอร์โทรติดต่อ", "Contact phone")} value={profile.ownerPhone ?? ""} onChange={(v) => update({ ownerPhone: v })} />
          </div>
        </div>
      </Card>

      {/* Hours & open/close — drives the customer order page in realtime */}
      <Card className="mb-5">
        <h2 className="mb-1 font-display text-base font-extrabold">🕒 {L("เวลาทำการ & เปิด-ปิดร้าน", "Hours & open/close")}</h2>
        <p className="mb-4 text-xs text-muted">
          {L(
            "ตั้งเวลาเปิด-ปิด แล้วหน้าสั่งของลูกค้าจะเปิด/ปิดอัตโนมัติตามเวลา — หรือกดสวิตช์ปิดรับออเดอร์เองได้ทันที (ลูกค้าเห็นผลทันที)",
            "Set your hours and the customer page opens/closes automatically — or flip the switch to stop orders instantly (customers see it live).",
          )}
        </p>

        {/* live status for the owner */}
        <div className={`mb-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${liveOpen ? "bg-success/15 text-[#0f7a47]" : "bg-coral/15 text-[#b23a1e]"}`}>
          <span className={`h-2 w-2 rounded-full ${liveOpen ? "bg-success" : "bg-coral"}`} style={liveOpen ? { animation: "pulse-ring 1.8s infinite" } : undefined} />
          {liveOpen ? L("ตอนนี้: รับออเดอร์อยู่", "Now: accepting orders") : L("ตอนนี้: ปิดรับออเดอร์", "Now: not accepting orders")}
        </div>

        {/* master switch */}
        <button
          onClick={() => update({ acceptingOrders: !accepting })}
          aria-pressed={accepting}
          className="flex w-full items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3.5 text-left ring-1 ring-line active:scale-[.99]"
        >
          <span className="min-w-0">
            <span className="block font-display text-sm font-bold">{L("เปิดรับออเดอร์", "Accept orders")}</span>
            <span className="block text-xs text-muted">
              {accepting
                ? L("ลูกค้าสั่งได้ (ตามเวลาทำการด้านล่าง)", "Customers can order (within hours below)")
                : L("ปิดรับออเดอร์ — ลูกค้าสั่งไม่ได้", "Closed — customers can't order")}
            </span>
          </span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${accepting ? "bg-success" : "bg-line"}`}>
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${accepting ? "left-[22px]" : "left-0.5"}`} />
          </span>
        </button>

        {/* opening hours */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{L("เวลาเปิด", "Open")}</span>
            <input
              type="time"
              value={profile.openTime ?? ""}
              onChange={(e) => setHours(e.target.value || null, profile.closeTime ?? null)}
              className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-teal"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-muted">{L("เวลาปิด", "Close")}</span>
            <input
              type="time"
              value={profile.closeTime ?? ""}
              onChange={(e) => setHours(profile.openTime ?? null, e.target.value || null)}
              className="w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-teal"
            />
          </label>
        </div>
        <p className="mt-2 text-xs text-muted">
          {profile.openTime && profile.closeTime
            ? L(`ลูกค้าสั่งได้เฉพาะช่วง ${profile.openTime}–${profile.closeTime} น. — นอกเวลานี้ปิดอัตโนมัติ`, `Customers can order only ${profile.openTime}–${profile.closeTime} — auto-closes outside this.`)
            : L("ไม่ได้ตั้งเวลา = เปิด 24 ชม. (ควบคุมด้วยสวิตช์ด้านบน)", "No hours set = open 24h (use the switch above).")}
        </p>
        {profile.openTime && profile.closeTime && profile.closeTime < profile.openTime && (
          <p className="mt-1 text-xs font-semibold text-teal-deep">{L("ℹ️ ปิดหลังเที่ยงคืน (ข้ามวัน) — รองรับแล้ว", "ℹ️ Closes after midnight (overnight) — supported")}</p>
        )}
      </Card>

      {/* Payment */}
      <Card>
        <h2 className="mb-1 font-display text-base font-extrabold">💸 {L("รับเงิน (PromptPay)", "Payout (PromptPay)")}</h2>
        <p className="mb-4 text-xs text-muted">
          {L(
            "ใส่พร้อมเพย์ของร้าน — ลูกค้าจะสแกน QR นี้จ่ายเข้าบัญชีร้านโดยตรง",
            "Enter your shop's PromptPay — customers scan this QR to pay your account directly",
          )}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={L("ชื่อบัญชี/ร้าน", "Account name")} value={profile.promptpayName} onChange={(v) => update({ promptpayName: v })} />
          <Field label={L("พร้อมเพย์ (เบอร์/เลขผู้เสียภาษี)", "PromptPay ID")} value={profile.promptpayId} onChange={(v) => update({ promptpayId: v })} />
        </div>

        {isValidPromptPay(profile.promptpayId) ? (
          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-bg p-4 ring-1 ring-line">
            <PayQRPreview id={profile.promptpayId} />
            <div className="text-sm">
              <p className="font-display font-bold">{L("QR ที่ลูกค้าจะเห็น", "The QR customers will see")}</p>
              <p className="text-muted">{profile.promptpayName || profile.promptpayId}</p>
              <p className="mt-1 text-xs font-semibold text-success">✓ {L("พร้อมเพย์ถูกต้อง", "PromptPay looks valid")}</p>
            </div>
          </div>
        ) : profile.promptpayId ? (
          <p className="mt-3 text-xs font-semibold text-[#b23a1e]">
            {L(
              "รูปแบบพร้อมเพย์ไม่ถูกต้อง — ใช้เบอร์มือถือ 10 หลัก หรือเลขบัตรประชาชน 13 หลัก",
              "Invalid PromptPay — use a 10-digit phone or 13-digit national ID",
            )}
          </p>
        ) : null}
      </Card>

      {/* Other payment channels */}
      <Card className="mt-5">
        <h2 className="mb-1 font-display text-base font-extrabold">🏦 {L("ช่องทางรับเงินอื่น (ไม่บังคับ)", "Other payment channels (optional)")}</h2>
        <p className="mb-4 text-xs text-muted">
          {L(
            "รองรับทุกธนาคาร/วอลเล็ต — ใส่บัญชีธนาคาร หรืออัปโหลด QR ของร้านจากแอปธนาคาร/ทรูมันนี่/ฯลฯ ลูกค้าจะเห็นเป็นตัวเลือกจ่ายเพิ่ม",
            "Works with any bank or e-wallet — add a bank account or upload your own QR from your banking / TrueMoney / etc. app. Customers see it as an extra payment option.",
          )}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={L("ธนาคาร", "Bank")} value={profile.bankName ?? ""} onChange={(v) => update({ bankName: v })} />
          <Field label={L("เลขที่บัญชี", "Account number")} value={profile.bankAccount ?? ""} onChange={(v) => update({ bankAccount: v })} />
          <div className="sm:col-span-2">
            <Field label={L("ชื่อบัญชี", "Account name")} value={profile.bankAccountName ?? ""} onChange={(v) => update({ bankAccountName: v })} />
          </div>
        </div>

        <div className="mt-4 mb-2 text-xs font-semibold text-muted">{L("QR รับเงินของร้าน (ธนาคารใดก็ได้)", "Your shop's payment QR (any bank)")}</div>
        <div className="flex items-center gap-4">
          <div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-bg ring-1 ring-line">
            {profile.payQrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.payQrUrl} alt="pay QR" className="h-full w-full object-contain p-1" />
            ) : (
              <span className="text-2xl opacity-40">🏦</span>
            )}
          </div>
          <div className="flex gap-2">
            <UploadButton label={L("อัปโหลด QR", "Upload QR")} folder="payqr" onPick={(d) => update({ payQrUrl: d })} />
            {profile.payQrUrl && (
              <button onClick={() => update({ payQrUrl: undefined })} className="rounded-xl bg-bg px-3 py-2 text-xs font-bold text-[#b23a1e] ring-1 ring-line active:scale-95">
                {L("ลบ", "Remove")}
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Billing options */}
      <Card className="mt-5">
        <h2 className="mb-1 font-display text-base font-extrabold">🧾 {L("ตัวเลือกการออกบิล", "Billing options")}</h2>
        <p className="mb-4 text-xs text-muted">
          {L(
            "เปิดสวิตช์นี้ถ้าร้านต้องการบวก VAT 7% เพิ่มในบิลลูกค้า — ร้านทั่วไปส่วนใหญ่ไม่ต้องเปิด",
            "Turn this on to add 7% VAT to customer bills. Most shops leave it off.",
          )}
        </p>
        <button
          onClick={() => update({ serviceCharge: !profile.serviceCharge })}
          className="flex w-full items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3.5 text-left ring-1 ring-line active:scale-[.99]"
          aria-pressed={!!profile.serviceCharge}
        >
          <span className="min-w-0">
            <span className="block font-display text-sm font-bold">{L("บวก VAT 7% ในบิล", "Add 7% VAT to bills")}</span>
            <span className="block text-xs text-muted">
              {profile.serviceCharge
                ? L("กำลังคิด VAT 7% กับลูกค้า", "Charging customers 7% VAT")
                : L("ไม่คิด VAT (ปิดอยู่)", "No VAT added (off)")}
            </span>
          </span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${profile.serviceCharge ? "bg-success" : "bg-line"}`}>
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${profile.serviceCharge ? "left-[22px]" : "left-0.5"}`} />
          </span>
        </button>

        {/* คนละครึ่ง / ไทยช่วยไทย co-pay — off by default; most shops aren't enrolled */}
        <p className="mb-3 mt-5 text-xs text-muted">
          {L(
            "เปิดถ้าร้านเข้าร่วมโครงการรัฐ (คนละครึ่ง / ไทยช่วยไทย) — จะมีตัวเลือกนี้โชว์ให้ลูกค้าเลือกในบิล",
            "Turn on if your shop joined a government co-pay scheme — it shows as a payment option on the bill.",
          )}
        </p>
        <button
          onClick={() => update({ coPay: !profile.coPay })}
          className="flex w-full items-center justify-between gap-3 rounded-2xl bg-bg px-4 py-3.5 text-left ring-1 ring-line active:scale-[.99]"
          aria-pressed={!!profile.coPay}
        >
          <span className="min-w-0">
            <span className="block font-display text-sm font-bold">🇹🇭 {L("รับ คนละครึ่ง / ไทยช่วยไทย", "Accept คนละครึ่ง / Thai co-pay")}</span>
            <span className="block text-xs text-muted">
              {profile.coPay
                ? L("แสดงเป็นตัวเลือกจ่ายในบิลลูกค้า", "Shown as a bill payment option")
                : L("ไม่แสดง (ปิดอยู่)", "Hidden (off)")}
            </span>
          </span>
          <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${profile.coPay ? "bg-success" : "bg-line"}`}>
            <span className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${profile.coPay ? "left-[22px]" : "left-0.5"}`} />
          </span>
        </button>
      </Card>

      {/* Account */}
      <div className="mt-5 flex justify-center">
        <button
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-2xl bg-bg px-5 py-2.5 text-sm font-bold text-[#b23a1e] ring-1 ring-line active:scale-95"
        >
          🚪 {L("ออกจากระบบ", "Log out")}
        </button>
      </div>
    </div>
  );
}

function PayQRPreview({ id }: { id: string }) {
  const [qr, setQr] = useState("");
  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(promptPayPayload(id), {
      width: 320,
      margin: 1,
      color: { dark: "#16282B", light: "#FFFFFF" },
    })
      .then((d) => alive && setQr(d))
      .catch(() => alive && setQr(""));
    return () => {
      alive = false;
    };
  }, [id]);

  if (!qr) {
    return (
      <div className="grid h-[110px] w-[110px] shrink-0 place-items-center rounded-xl bg-white text-xs font-bold text-muted ring-1 ring-line">
        QR
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={qr} alt="PromptPay QR" className="h-[110px] w-[110px] shrink-0 rounded-xl bg-white p-1.5 ring-1 ring-line" />
  );
}
