"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { BrandLockup, BrandMark } from "@/components/BrandMark";
import { LangToggle } from "@/components/LangToggle";
import { Check, QrGlyph, ChevronRight } from "@/components/icons";

export default function Landing() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const [yearly, setYearly] = useState(false);

  return (
    <div className="min-h-dvh bg-bg text-ink">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <BrandLockup height={26} />
          <div className="flex items-center gap-2 sm:gap-3">
            <LangToggle />
            <Link href="/admin" className="hidden rounded-full px-4 py-2 text-sm font-bold text-teal-deep hover:bg-black/5 sm:inline-block">
              {L("เข้าสู่ระบบ", "Sign in")}
            </Link>
            <Link href="/admin?signup=1" className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-white shadow-card active:scale-95">
              {L("เปิดร้านฟรี", "Start free")}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 dotgrid opacity-30" style={{ background: "linear-gradient(160deg,#0E7C86,#0A5963 75%)" }} />
        <div className="absolute inset-0" style={{ background: "radial-gradient(900px 420px at 88% -5%, rgba(232,184,75,.22), transparent 55%)" }} />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 text-white md:grid-cols-2 md:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-bold ring-1 ring-white/25">
              🇹🇭 {L("ทำมาเพื่อร้านอาหารไทย", "Built for Thai restaurants")}
            </span>
            <h1 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              {L("ลูกค้าสแกน QR ที่โต๊ะ", "Guests scan a QR")}
              <br />
              <span className="text-gold">{L("สั่งเอง จ่ายเอง", "Order & pay themselves")}</span>
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-white/85">
              {L(
                "เปิดร้านบนระบบสั่งอาหารผ่าน QR ได้ใน 1 นาที — ไม่ต้องซื้อเครื่อง POS เห็นออเดอร์เรียลไทม์ พร้อม dashboard ยอดขาย",
                "Launch QR table-ordering in a minute — no POS hardware, live orders, and a sales dashboard."
              )}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/admin?signup=1" className="inline-flex items-center gap-2 rounded-2xl bg-coral px-6 py-3.5 font-display text-base font-extrabold text-white shadow-pop active:scale-[.98]">
                {L("เปิดร้านฟรี 30 วัน", "Start free — 30 days")} <ChevronRight />
              </Link>
              <Link href="/r/khrua-khun-nai/t/12" className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-6 py-3.5 font-display text-base font-bold text-white ring-1 ring-white/30 backdrop-blur active:scale-[.98]">
                {L("ดูตัวอย่างลูกค้า", "See customer demo")}
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-white/80">
              {[L("ไม่ต้องมีฮาร์ดแวร์", "No hardware"), L("ตั้งเอง 10 นาที", "Set up in 10 min"), L("เริ่ม ฿299/เดือน", "From ฿299/mo")].map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><Check size={16} className="text-gold" /> {t}</span>
              ))}
            </div>
          </div>

          {/* phone mockup */}
          <div className="relative mx-auto hidden w-[280px] md:block">
            <div className="rotate-2 rounded-[2.2rem] border-[6px] border-ink/80 bg-ink/80 p-1 shadow-pop">
              <div className="overflow-hidden rounded-[1.8rem] bg-bg">
                <div className="relative px-4 pb-4 pt-5 text-white" style={{ background: "linear-gradient(150deg,#0E7C86,#0A5963)" }}>
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="rounded-full bg-white/20 px-2 py-0.5">TH · EN</span>
                    <span className="rounded-full bg-white/20 px-2 py-0.5">โต๊ะ 12</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2.5">
                    <div className="grid h-11 w-11 place-items-center rounded-xl bg-white"><BrandMark size={34} /></div>
                    <div>
                      <p className="font-display text-base font-extrabold leading-none">ครัวคุณนาย</p>
                      <p className="mt-1 text-[10px] text-white/85">อาหารไทย • สตรีทฟู้ด</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 p-3">
                  {[["🦐", "กุ้งเผาซอสซีฟู้ด", "฿320"], ["🍜", "ผัดไทยกุ้งสด", "฿129"], ["🧋", "ชาไทยเย็น", "฿45"]].map(([e, n, p]) => (
                    <div key={n} className="flex items-center gap-2.5 rounded-2xl bg-surface p-2 ring-1 ring-line">
                      <div className="grid h-12 w-12 place-items-center rounded-xl text-2xl" style={{ background: "linear-gradient(135deg,#ffb27a,#ff7a4d 60%,#c23b1e)" }}>{e}</div>
                      <span className="flex-1 text-xs font-bold text-ink">{n}</span>
                      <span className="text-sm font-extrabold text-teal-deep">{p}</span>
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-teal text-sm font-bold text-white">+</span>
                    </div>
                  ))}
                </div>
                <div className="mx-3 mb-3 flex items-center justify-between rounded-2xl bg-teal-deep px-4 py-2.5 text-white">
                  <span className="text-xs font-bold">ดูตะกร้า</span>
                  <span className="text-sm font-extrabold">฿494 ›</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center font-display text-3xl font-extrabold tracking-tight">{L("ทำไมร้านถึงเลือกเรา", "Why restaurants choose us")}</h2>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["💸", L("ไม่ต้องลงทุนเครื่อง", "No hardware cost"), L("ใช้มือถือลูกค้าสแกน ไม่ต้องซื้อเครื่อง POS แพง ๆ", "Customers use their own phones — no POS to buy")],
            ["⏱️", L("ตั้งเองใน 10 นาที", "Live in 10 minutes"), L("เพิ่มเมนู เพิ่มโต๊ะ ปริ้น QR แล้วเปิดขายได้เลย", "Add menu, add tables, print QR — done")],
            ["⚡", L("ออเดอร์เรียลไทม์", "Realtime orders"), L("ลูกค้าสั่งปุ๊บ ครัวเห็นปั๊บ พร้อมจอครัว", "Orders hit the kitchen instantly")],
            ["📊", L("รู้ยอดขายทุกมุม", "Know your sales"), L("dashboard ราย ชม./วัน/สัปดาห์/เดือน + เมนูขายดี", "Dashboard by hour/day/week/month")],
          ].map(([icon, title, desc]) => (
            <div key={title} className="rounded-3xl bg-surface p-6 shadow-card ring-1 ring-line">
              <div className="text-3xl">{icon}</div>
              <h3 className="mt-3 font-display text-lg font-extrabold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center font-display text-3xl font-extrabold tracking-tight">{L("ลูกค้าใช้ง่ายใน 3 ขั้นตอน", "3 steps for guests")}</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              ["1", L("สแกน QR ที่โต๊ะ", "Scan the table QR"), L("ไม่ต้องโหลดแอป เปิดเมนูร้านได้ทันที", "No app needed — menu opens instantly")],
              ["2", L("เลือกเมนู & ท็อปปิ้ง", "Pick dishes & add-ons"), L("ปรับจำนวน ความเผ็ด ใส่หมายเหตุได้", "Quantity, spice level, notes")],
              ["3", L("จ่าย & ติดตามสถานะ", "Pay & track"), L("เงินสด / สแกน PromptPay / คนละครึ่ง", "Cash / PromptPay / co-pay")],
            ].map(([n, title, desc]) => (
              <div key={n} className="relative rounded-3xl bg-bg p-7 ring-1 ring-line">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-teal font-display text-lg font-extrabold text-white">{n}</span>
                <h3 className="mt-4 font-display text-lg font-extrabold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center font-display text-3xl font-extrabold tracking-tight">{L("ครบทุกอย่างที่ร้านต้องใช้", "Everything your shop needs")}</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "จัดการเมนู เปลี่ยนรูป/ราคา ปิดเมนู ตั้งหมด",
            "เพิ่มโต๊ะ → สร้าง QR ให้อัตโนมัติ",
            "โปรโมชั่นลดราคา + เมนูเด่น Signature",
            "จอครัว (Kitchen Display) เรียลไทม์",
            "ประวัติย้อนหลัง กรองตามวัน/โต๊ะ",
            "จ่าย 3 แบบ: เงินสด / PromptPay / คนละครึ่ง",
            "สลับภาษา ไทย/อังกฤษ ทั้งระบบ",
            "อัปรูปร้าน/โลโก้/อาหารได้เอง",
            "ปลอดภัย แยกข้อมูลแต่ละร้าน",
          ].map((f, i) => {
            const en = [
              "Menu management — photos, prices, hide, sold-out",
              "Add a table → auto-generate its QR",
              "Promotions & Signature highlights",
              "Realtime Kitchen Display",
              "Order history with date/table filters",
              "3 ways to pay: cash / PromptPay / co-pay",
              "Full Thai / English toggle",
              "Upload your cover, logo & dish photos",
              "Secure — each shop's data is isolated",
            ][i];
            return (
              <div key={i} className="flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-teal/10 text-teal-deep"><Check size={14} /></span>
                <span className="text-sm font-medium">{lang === "th" ? f : en}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-surface py-16">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-center font-display text-3xl font-extrabold tracking-tight">{L("ราคาที่ร้านเล็กก็ไหว", "Pricing small shops can afford")}</h2>
          <p className="mt-2 text-center text-muted">{L("ทดลองฟรี 30 วัน • ยกเลิกเมื่อไหร่ก็ได้", "Free 30-day trial • cancel anytime")}</p>

          {/* monthly / yearly toggle */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex rounded-full bg-bg p-1 ring-1 ring-line">
              <button onClick={() => setYearly(false)} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${!yearly ? "bg-teal text-white shadow-card" : "text-muted"}`}>{L("รายเดือน", "Monthly")}</button>
              <button onClick={() => setYearly(true)} className={`rounded-full px-4 py-1.5 text-sm font-bold transition ${yearly ? "bg-teal text-white shadow-card" : "text-muted"}`}>{L("รายปี", "Yearly")}</button>
            </div>
            <span className="rounded-full bg-gold/25 px-2.5 py-1 text-xs font-extrabold text-[#5b4708]">{L("จ่ายรายปี ฟรี 2 เดือน", "Yearly = 2 months free")}</span>
          </div>

          <div className="mt-8 grid items-stretch gap-5 md:grid-cols-3">
            {[
              { name: "Starter", m: 299, tables: L("สูงสุด 8 โต๊ะ", "Up to 8 tables"), feats: [L("เมนู/ออเดอร์/บิล ไม่จำกัด", "Unlimited menu, orders & bills"), L("QR ทุกโต๊ะ + ออเดอร์สด + รีวิว", "QR per table + live orders + reviews"), L("แดชบอร์ด + กราฟยอดขายรายวัน", "Dashboard + daily sales chart")], hot: false },
              { name: "Pro", m: 599, tables: L("สูงสุด 25 โต๊ะ", "Up to 25 tables"), feats: [L("ทุกอย่างใน Starter", "Everything in Starter"), L("จอครัว + โปรโมชั่นลดราคา", "Kitchen display + promotions"), L("วิเคราะห์เชิงลึก + เมนูขายดี", "Deep analytics + best sellers")], hot: true },
              { name: "Business", m: 1290, tables: L("ไม่จำกัดโต๊ะ", "Unlimited tables"), feats: [L("ทุกอย่างใน Pro", "Everything in Pro"), L("บัญชีพนักงานหลายคน (แยกสิทธิ์)", "Multiple staff accounts (roles)"), L("โต๊ะไม่จำกัด + ส่งออก CSV + ซัพพอร์ตด่วน", "Unlimited tables + CSV + priority support")], hot: false },
            ].map((p) => (
              <div key={p.name} className={`relative flex flex-col rounded-3xl p-7 ${p.hot ? "bg-teal text-white shadow-pop ring-2 ring-gold" : "bg-bg text-ink ring-1 ring-line"}`}>
                {p.hot && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-3 py-1 text-xs font-extrabold text-ink">{L("แนะนำ", "Popular")}</span>}
                <h3 className="font-display text-xl font-extrabold">{p.name}</h3>
                <p className={`mt-1 text-sm ${p.hot ? "text-white/80" : "text-muted"}`}>{p.tables}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold">฿{(yearly ? p.m * 10 : p.m).toLocaleString()}</span>
                  <span className={p.hot ? "text-white/80" : "text-muted"}>/{yearly ? L("ปี", "yr") : L("เดือน", "mo")}</span>
                </div>
                <p className={`mt-0.5 text-xs ${p.hot ? "text-white/70" : "text-muted"}`}>
                  {yearly ? L(`≈ ฿${Math.round((p.m * 10) / 12).toLocaleString()}/เดือน · ประหยัด 2 เดือน`, `≈ ฿${Math.round((p.m * 10) / 12).toLocaleString()}/mo · save 2 months`) : " "}
                </p>
                <ul className="mt-4 flex-1 space-y-2.5 text-sm">
                  {p.feats.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check size={16} className={p.hot ? "mt-0.5 text-gold" : "mt-0.5 text-teal"} /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/admin?signup=1" className={`mt-6 rounded-2xl py-3 text-center font-display font-bold active:scale-[.98] ${p.hot ? "bg-white text-teal-deep" : "bg-teal text-white"}`}>
                  {L("เริ่มเลย", "Get started")}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="relative overflow-hidden rounded-[2rem] px-8 py-14 text-center text-white" style={{ background: "linear-gradient(150deg,#0E7C86,#0A5963)" }}>
          <div className="absolute inset-0 dotgrid opacity-30" />
          <div className="relative">
            <h2 className="font-display text-3xl font-extrabold sm:text-4xl">{L("พร้อมเปิดร้านหรือยัง?", "Ready to open your shop?")}</h2>
            <p className="mx-auto mt-3 max-w-md text-white/85">{L("สมัครฟรี ใส่เมนู ปริ้น QR แล้วเริ่มรับออเดอร์ได้วันนี้", "Sign up free, add your menu, print QR, start taking orders today")}</p>
            <Link href="/admin?signup=1" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gold px-8 py-4 font-display text-lg font-extrabold text-ink shadow-pop active:scale-[.98]">
              <QrGlyph size={20} /> {L("เปิดร้านฟรีเลย", "Start free now")}
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm text-muted sm:flex-row">
          <BrandLockup height={22} />
          <p>© 2026 QR Store Mate · {L("สั่งง่ายแค่สแกน", "Just scan to order")}</p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
            <Link href="/admin" className="hover:text-teal-deep">{L("เข้าสู่ระบบ", "Sign in")}</Link>
            <Link href="/r/khrua-khun-nai/t/12" className="hover:text-teal-deep">{L("เดโม", "Demo")}</Link>
            <Link href="/privacy" className="hover:text-teal-deep">{L("ความเป็นส่วนตัว", "Privacy")}</Link>
            <Link href="/terms" className="hover:text-teal-deep">{L("ข้อตกลง", "Terms")}</Link>
            <Link href="/contact" className="hover:text-teal-deep">{L("ติดต่อ", "Contact")}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
