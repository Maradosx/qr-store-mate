"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import { BrandLockup } from "./BrandMark";
import { LangToggle } from "./LangToggle";

export function LegalShell({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  return (
    <div className="min-h-dvh bg-bg text-ink">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-surface/90 px-5 py-3 backdrop-blur">
        <Link href="/">
          <BrandLockup height={24} />
        </Link>
        <LangToggle />
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10">
        <Link href="/" className="text-sm font-semibold text-teal-deep">← {L("กลับหน้าแรก", "Back home")}</Link>
        <h1 className="mt-4 font-display text-3xl font-extrabold">{title}</h1>
        <p className="mt-1 text-sm text-muted">{L("อัปเดตล่าสุด", "Last updated")}: {updated}</p>

        <div className="legal mt-8 space-y-6 text-[15px] leading-relaxed text-ink/90">{children}</div>

        <div className="mt-12 flex flex-wrap gap-4 border-t border-line pt-6 text-sm font-semibold text-teal-deep">
          <Link href="/privacy">{L("นโยบายความเป็นส่วนตัว", "Privacy Policy")}</Link>
          <Link href="/terms">{L("ข้อตกลงการใช้งาน", "Terms of Service")}</Link>
          <Link href="/contact">{L("ติดต่อเรา", "Contact")}</Link>
        </div>

        <p className="mt-6 rounded-2xl bg-gold/10 px-4 py-3 text-xs text-ink/70 ring-1 ring-gold/30">
          {L(
            "ผู้ให้บริการดำเนินการในนามบุคคลธรรมดา และอยู่ระหว่างจดทะเบียนพาณิชย์อิเล็กทรอนิกส์ (DBD) เอกสารนี้เป็นแม่แบบเพื่อความโปร่งใส ไม่ใช่คำแนะนำทางกฎหมาย แนะนำให้ทนาย/ที่ปรึกษาตรวจทานก่อนใช้อ้างอิงจริง",
            "The service is operated by an individual (sole proprietor); DBD e-commerce registration is in progress. This document is a transparency template, not legal advice — have a lawyer review it before relying on it.",
          )}
        </p>
      </main>
    </div>
  );
}

/** Small section helper. */
export function Sec({ h, children }: { h: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-lg font-extrabold text-ink">{h}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
