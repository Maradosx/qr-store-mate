"use client";

import { useI18n } from "@/lib/i18n";
import { LegalShell, Sec } from "@/components/LegalShell";
import { SITE } from "@/lib/site";

export default function ContactPage() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const tr = (o: { th: string; en: string }) => (lang === "th" ? o.th : o.en);
  return (
    <LegalShell title={L("ติดต่อเรา", "Contact us")} updated="2026-06-07">
      <p>
        {L(
          "มีคำถาม ต้องการความช่วยเหลือ หรือขอใช้สิทธิเกี่ยวกับข้อมูลส่วนบุคคล ติดต่อเราได้ที่:",
          "For questions, support, or to exercise your data-privacy rights, reach us at:",
        )}
      </p>

      <Sec h={L("ช่องทางติดต่อ", "Get in touch")}>
        <p>📧 {L("อีเมล", "Email")}: <a className="text-teal-deep underline" href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
        {SITE.line && <p>💬 LINE: {SITE.line}</p>}
        {SITE.phone && <p>📞 {L("โทร", "Phone")}: {SITE.phone}</p>}
        <p>🏢 {L("ผู้ให้บริการ", "Provider")}: {tr(SITE.ownerName)} ({tr(SITE.entityType)})</p>
        <p>📍 {L("ที่อยู่", "Address")}: {SITE.address}</p>
      </Sec>

      <Sec h={L("เวลาทำการ", "Hours")}>
        <p>{L("จันทร์–เสาร์ 9:00–18:00 น. (เวลาประเทศไทย) เราตอบกลับภายใน 1 วันทำการ", "Mon–Sat 9:00–18:00 (Thailand time). We reply within 1 business day.")}</p>
      </Sec>

      <Sec h={L("สำหรับร้านอาหารที่สนใจ", "For restaurants")}>
        <p>{L("อยากเปิดร้านบน QR Store Mate? สมัครฟรี 30 วันได้ที่หน้าแรก แล้วทีมงานจะช่วยตั้งค่าให้", "Want your shop on QR Store Mate? Start a free 30-day trial from the home page and our team will help you set up.")}</p>
      </Sec>
    </LegalShell>
  );
}
