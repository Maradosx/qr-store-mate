"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { ActiveMascot } from "@/components/Mascots";

/** Cute themed "how to use" popup shown on first view per scan (session). Dismissable. */
export function OnboardingPopup({ tableKey }: { tableKey: string }) {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    try {
      const key = "qsm-onboard-" + tableKey;
      if (!sessionStorage.getItem(key)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [tableKey]);

  const close = () => {
    setClosing(true);
    try {
      sessionStorage.setItem("qsm-onboard-" + tableKey, "1");
    } catch {
      /* ignore */
    }
    timer.current = window.setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 200);
  };

  // close on Escape + clean up the pending close timer on unmount
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const steps = [
    { icon: "📖", th: "เปิดเมนู เลือกที่ชอบ", en: "Browse the menu", sub_th: "แตะรูปอาหารเพื่อดูรายละเอียด", sub_en: "Tap a dish for details" },
    { icon: "➕", th: "ใส่ตะกร้า", en: "Add to cart", sub_th: "เลือกจำนวน ท็อปปิ้ง ความเผ็ดได้", sub_en: "Pick quantity, add-ons, spice" },
    { icon: "✅", th: "ยืนยัน & จ่าย", en: "Confirm & pay", sub_th: "เงินสด / สแกนพร้อมเพย์ / โอน", sub_en: "Cash / PromptPay / transfer" },
    { icon: "🔔", th: "ติดตามสถานะสด", en: "Track it live", sub_th: "รู้ว่าอาหารถึงไหน + ดูบิลทั้งโต๊ะได้", sub_en: "See progress + the table bill" },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className={`absolute inset-0 bg-ink/50 ${closing ? "" : "fade-in"}`} onClick={close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        className={`relative w-full sm:max-w-sm ${closing ? "" : "sheet-up sm:anim-rise"} max-h-[92dvh] overflow-y-auto rounded-t-3xl bg-surface shadow-pop sm:rounded-3xl`}
      >
        {/* hero w/ mascot */}
        <div className="relative overflow-hidden rounded-t-3xl px-6 pb-5 pt-7 text-center text-white" style={{ background: "linear-gradient(150deg,#0E7C86,#0A5963)" }}>
          <div className="dotgrid absolute inset-0 opacity-40" />
          <button onClick={close} aria-label="close" className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/30 active:scale-90">
            ✕
          </button>
          <div className="relative">
            {/* mascot — "Mate", our own character */}
            <div className="mx-auto grid h-28 w-28 place-items-center rounded-full bg-white/15 ring-2 ring-white/30" style={{ boxShadow: "inset 0 -8px 20px rgba(0,0,0,.18)" }}>
              <ActiveMascot size={104} />
            </div>
            <h2 id="onboarding-title" className="mt-3 font-display text-xl font-extrabold">{L("สวัสดีครับ! 👋", "Hi there! 👋")}</h2>
            <p className="mt-1 text-sm text-white/85">{L("สั่งอาหารง่ายๆ ใน 4 ขั้นตอน", "Order in 4 easy steps")}</p>
          </div>
        </div>

        {/* steps */}
        <ol className="space-y-3 p-5">
          {steps.map((s, i) => (
            <li key={i} className="anim-rise flex items-start gap-3" style={{ animationDelay: `${i * 70}ms` }}>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-teal/10 text-xl">{s.icon}</span>
              <div className="pt-0.5">
                <p className="font-display text-sm font-bold">
                  <span className="mr-1 text-teal-deep">{i + 1}.</span>
                  {L(s.th, s.en)}
                </p>
                <p className="text-xs text-muted">{L(s.sub_th, s.sub_en)}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="border-t border-line p-4">
          <button
            onClick={close}
            className="w-full rounded-2xl bg-teal py-3.5 font-display text-base font-extrabold text-white shadow-card active:scale-[.99]"
          >
            {L("เริ่มสั่งเลย!", "Start ordering!")}
          </button>
        </div>
      </div>
    </div>
  );
}
