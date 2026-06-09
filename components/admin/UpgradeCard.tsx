"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

/** Shown where a feature is locked behind a higher plan. */
export function UpgradeCard({ title, need = "Pro" }: { title: { th: string; en: string }; need?: string }) {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  return (
    <div className="rounded-3xl border border-dashed border-teal/40 bg-teal/5 p-8 text-center">
      <div className="text-4xl">🔒</div>
      <h3 className="mt-3 font-display text-lg font-extrabold">{L(title.th, title.en)}</h3>
      <p className="mt-1.5 text-sm text-muted">
        {L(`ฟีเจอร์นี้อยู่ในแพ็กเกจ ${need} ขึ้นไป`, `Available on the ${need} plan and up`)}
      </p>
      <Link
        href="/admin/billing"
        className="mt-5 inline-block rounded-2xl bg-teal px-6 py-3 font-display text-sm font-bold text-white shadow-card active:scale-95"
      >
        {L(`อัปเกรดเป็น ${need}`, `Upgrade to ${need}`)}
      </Link>
    </div>
  );
}
