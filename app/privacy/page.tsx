"use client";

import { useI18n } from "@/lib/i18n";
import { LegalShell, Sec } from "@/components/LegalShell";
import { SITE } from "@/lib/site";

export default function PrivacyPage() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const tr = (o: { th: string; en: string }) => (lang === "th" ? o.th : o.en);
  const dbd = SITE.dbdNumber || L("(อยู่ระหว่างจดทะเบียน)", "(registration in progress)");
  return (
    <LegalShell title={L("นโยบายความเป็นส่วนตัว", "Privacy Policy")} updated="2026-06-07">
      <p>
        {L(
          "QR Store Mate (“เรา”) ให้บริการระบบสั่งอาหารผ่าน QR สำหรับร้านอาหาร นโยบายนี้อธิบายว่าเราเก็บ ใช้ และคุ้มครองข้อมูลส่วนบุคคลอย่างไร ตาม พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)",
          "QR Store Mate (“we”) provides a QR table-ordering platform for restaurants. This policy explains how we collect, use and protect personal data under Thailand’s Personal Data Protection Act B.E. 2562 (PDPA).",
        )}
      </p>

      <Sec h={L("1. ข้อมูลที่เราเก็บ", "1. Data we collect")}>
        <p>{L("จากเจ้าของร้าน: อีเมล, รหัสผ่าน (เข้ารหัส), ชื่อร้าน/ที่อยู่/เบอร์โทร, พร้อมเพย์/บัญชีรับเงิน, รูปภาพที่อัปโหลด", "From shop owners: email, password (hashed), shop name/address/phone, PromptPay/bank payout details, uploaded images.")}</p>
        <p>{L("จากลูกค้า: ไม่มีการเก็บข้อมูลส่วนบุคคล ลูกค้าสั่งอาหารโดยอ้างอิงหมายเลขโต๊ะเท่านั้น (อาจมีหมายเหตุข้อความที่ลูกค้าพิมพ์เอง)", "From customers: no personal data is collected. Customers order by table number only (an optional free-text note may be entered by the customer).")}</p>
      </Sec>

      <Sec h={L("2. วัตถุประสงค์และฐานทางกฎหมาย", "2. Purpose & lawful basis")}>
        <p>{L("เพื่อให้บริการแพลตฟอร์ม (จัดการเมนู ออเดอร์ การชำระเงิน บัญชีสมาชิก) — ฐาน “การปฏิบัติตามสัญญา” และ “ประโยชน์อันชอบธรรม” ในการดำเนินงานและความปลอดภัย", "To operate the platform (menu, orders, payments, subscription accounts) — on the bases of “performance of a contract” and “legitimate interest” for operations and security.")}</p>
      </Sec>

      <Sec h={L("3. ที่จัดเก็บข้อมูลและการโอนข้ามประเทศ", "3. Storage & cross-border transfer")}>
        <p>{L("ข้อมูลจัดเก็บบน Supabase (ฐานข้อมูล PostgreSQL ภูมิภาคสิงคโปร์) และโฮสต์บน Vercel ซึ่งอาจอยู่นอกประเทศไทย เราใช้ผู้ให้บริการที่มีมาตรฐานความปลอดภัยและข้อตกลงประมวลผลข้อมูล (DPA) ตาม PDPA มาตรา 22", "Data is stored on Supabase (PostgreSQL, Singapore region) and hosted on Vercel, which may be outside Thailand. We use providers with security standards and Data Processing Agreements (DPA) consistent with PDPA Section 22.")}</p>
      </Sec>

      <Sec h={L("3.1 ผู้ประมวลผลข้อมูล (Sub-processors) และ DPA", "3.1 Sub-processors & DPAs")}>
        <p>{L("เราใช้ผู้ให้บริการต่อไปนี้ ซึ่งมีข้อตกลงการประมวลผลข้อมูล (DPA) มาตรฐานรองรับ:", "We use the following providers, each with a standard Data Processing Agreement (DPA):")}</p>
        <ul className="ml-4 list-disc space-y-1">
          <li>Supabase — {L("ฐานข้อมูล/ยืนยันตัวตน/จัดเก็บไฟล์ (สิงคโปร์)", "database/auth/storage (Singapore)")} · <a className="text-teal-deep underline" href="https://supabase.com/legal/dpa" target="_blank" rel="noreferrer">supabase.com/legal/dpa</a></li>
          <li>Vercel — {L("โฮสติ้งเว็บ", "web hosting")} · <a className="text-teal-deep underline" href="https://vercel.com/legal/dpa" target="_blank" rel="noreferrer">vercel.com/legal/dpa</a></li>
          <li>Resend — {L("อีเมลแจ้งเตือน (เมื่อเปิดใช้งาน)", "notification email (when enabled)")} · <a className="text-teal-deep underline" href="https://resend.com/legal/dpa" target="_blank" rel="noreferrer">resend.com/legal/dpa</a></li>
        </ul>
      </Sec>

      <Sec h={L("4. การเปิดเผยข้อมูล", "4. Disclosure")}>
        <p>{L("เราไม่ขายข้อมูลส่วนบุคคล เราแบ่งปันเฉพาะกับผู้ให้บริการที่จำเป็น (โฮสติ้ง ฐานข้อมูล อีเมล) และเมื่อกฎหมายกำหนด เราไม่ถือเงินของลูกค้า การชำระเงินโอนตรงระหว่างลูกค้ากับร้าน", "We do not sell personal data. We share it only with necessary service providers (hosting, database, email) and where required by law. We never hold customer funds; payments go directly between customer and shop.")}</p>
      </Sec>

      <Sec h={L("5. ระยะเวลาเก็บรักษา", "5. Retention")}>
        <p>{L("เก็บข้อมูลบัญชีตลอดอายุการใช้งาน เมื่อยกเลิกบัญชีจะลบภายใน 30 วัน ข้อมูลออเดอร์อาจเก็บไว้สูงสุด 2 ปีเพื่อการบัญชี/ภาษี แล้วจึงลบ", "Account data is kept for the life of the account; after cancellation it is deleted within 30 days. Order data may be kept up to 2 years for accounting/tax, then deleted.")}</p>
      </Sec>

      <Sec h={L("6. สิทธิของเจ้าของข้อมูล", "6. Your rights")}>
        <p>{L("คุณมีสิทธิเข้าถึง แก้ไข ลบ คัดค้าน ระงับการใช้ และขอโอนข้อมูลของคุณ ติดต่อเราตามช่องทางด้านล่างเพื่อใช้สิทธิ", "You may access, rectify, erase, object to, restrict, and port your data. Contact us via the details below to exercise these rights.")}</p>
      </Sec>

      <Sec h={L("7. คุกกี้/ที่จัดเก็บในเบราว์เซอร์", "7. Cookies / browser storage")}>
        <p>{L("เราใช้ localStorage เพื่อจำตะกร้าและภาษา และคุกกี้เซสชันเพื่อการเข้าสู่ระบบเท่านั้น ไม่มีคุกกี้โฆษณา/ติดตามบุคคลที่สาม", "We use localStorage for the cart and language, and session cookies only for login. No third-party advertising/tracking cookies.")}</p>
      </Sec>

      <Sec h={L("8. ติดต่อ (ผู้ควบคุมข้อมูล)", "8. Contact (Data Controller)")}>
        <p>{L("ผู้ควบคุมข้อมูล", "Data Controller")}: {tr(SITE.ownerName)} ({tr(SITE.entityType)})</p>
        <p>{L("อีเมล", "Email")}: <a className="text-teal-deep underline" href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
        <p>{L("ที่อยู่", "Address")}: {SITE.address}</p>
        <p>{L("เลขทะเบียนพาณิชย์อิเล็กทรอนิกส์ (DBD)", "DBD e-commerce reg. no.")}: {dbd}</p>
      </Sec>
    </LegalShell>
  );
}
