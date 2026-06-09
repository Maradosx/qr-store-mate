"use client";

import { useI18n } from "@/lib/i18n";
import { LegalShell, Sec } from "@/components/LegalShell";
import { SITE } from "@/lib/site";

export default function TermsPage() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const tr = (o: { th: string; en: string }) => (lang === "th" ? o.th : o.en);
  return (
    <LegalShell title={L("ข้อตกลงการใช้งาน", "Terms of Service")} updated="2026-06-07">
      <p>
        {L(
          "การสมัครและใช้งาน QR Store Mate ถือว่าคุณยอมรับข้อตกลงนี้ หากไม่ยอมรับ กรุณาหยุดใช้บริการ",
          "By signing up for and using QR Store Mate, you agree to these terms. If you do not agree, please stop using the service.",
        )}
      </p>

      <Sec h={L("1. คุณสมบัติผู้ใช้", "1. Eligibility")}>
        <p>{L("บริการสำหรับผู้ประกอบการร้านอาหารที่ถูกต้องตามกฎหมายไทย คุณรับรองว่าข้อมูลที่ให้เป็นความจริง", "The service is for lawful restaurant operators in Thailand. You warrant that the information you provide is accurate.")}</p>
      </Sec>

      <Sec h={L("2. การใช้งานที่ยอมรับได้", "2. Acceptable use")}>
        <p>{L("ห้ามขายสินค้าผิดกฎหมาย (ยาเสพติด ของปลอม สินค้าควบคุมโดยไม่มีใบอนุญาต เช่น แอลกอฮอล์) ห้ามใช้ระบบเพื่อฉ้อโกง สแปม หรือละเมิดสิทธิผู้อื่น เราขอสงวนสิทธิ์ระงับร้านที่ฝ่าฝืน", "No selling of illegal goods (narcotics, counterfeits, licensed/controlled items such as alcohol without a licence). No fraud, spam, or rights infringement. We may suspend shops that violate these terms.")}</p>
      </Sec>

      <Sec h={L("3. การอนุมัติร้าน", "3. Shop approval")}>
        <p>{L("ร้านที่สมัครใหม่จะอยู่สถานะ “รออนุมัติ” จนกว่าทีมงานตรวจสอบ ลูกค้าจะเห็นเมนูได้หลังได้รับอนุมัติ เราอาจปฏิเสธหรือระงับร้านได้ตามดุลพินิจ", "New shops are “pending” until reviewed. Customers can see the menu only after approval. We may reject or suspend shops at our discretion.")}</p>
      </Sec>

      <Sec h={L("4. ทดลองใช้ ค่าบริการ และการยกเลิก", "4. Trial, fees & cancellation")}>
        <p>{L("ทดลองใช้ฟรี 30 วัน ไม่ต้องใช้บัตร เราจะไม่ตัดเงินอัตโนมัติ ค่าบริการรายเดือนตามแพ็กเกจที่เลือก ชำระผ่าน PromptPay/โอน (หรือบัตรเมื่อเปิดให้บริการ) ยกเลิกได้ทุกเมื่อ — ค่าบริการที่ชำระแล้วของเดือนนั้นไม่คืนเงิน เว้นแต่ระบุไว้เป็นอื่น", "30-day free trial, no card required; we do not auto-charge. Monthly fees follow your chosen plan, paid via PromptPay/transfer (or card when available). Cancel anytime — fees already paid for the current month are non-refundable unless stated otherwise.")}</p>
      </Sec>

      <Sec h={L("5. การชำระเงินค่าอาหาร", "5. Food payments")}>
        <p>{L("แพลตฟอร์มไม่ถือเงินและไม่เป็นตัวกลางรับชำระ เงินค่าอาหารโอนตรงจากลูกค้าไปยังบัญชีของร้าน (PromptPay/โอน/เงินสด) ร้านรับผิดชอบบัญชีรับเงินของตนเอง ตัวเลือก “คนละครึ่ง” ยังไม่เชื่อมต่อระบบรัฐ เป็นเพียงป้ายกำกับ", "The platform holds no funds and is not a payment intermediary. Food payments go directly from customer to the shop’s account (PromptPay/transfer/cash). Shops are responsible for their own payout accounts. The “Khon La Khrueng” option is not integrated with any government system and is a label only.")}</p>
      </Sec>

      <Sec h={L("6. ทรัพย์สินทางปัญญา", "6. Intellectual property")}>
        <p>{L("ซอฟต์แวร์ แบรนด์ และดีไซน์เป็นของ QR Store Mate รูปภาพและเนื้อหาที่ร้านอัปโหลดยังเป็นของร้าน โดยร้านอนุญาตให้เราใช้เพื่อแสดงผลในบริการ", "The software, brand and design belong to QR Store Mate. Content and images you upload remain yours; you grant us a licence to display them within the service.")}</p>
      </Sec>

      <Sec h={L("7. ข้อจำกัดความรับผิด", "7. Limitation of liability")}>
        <p>{L("บริการให้ “ตามสภาพ” เราไม่รับประกันว่าจะไม่มีข้อผิดพลาดหรือหยุดชะงัก และไม่รับผิดต่อความเสียหายทางอ้อม การสูญหายของข้อมูล หรือรายได้ที่ขาดหาย เท่าที่กฎหมายอนุญาต", "The service is provided “as is”. We do not guarantee it will be error-free or uninterrupted and are not liable for indirect damages, data loss, or lost revenue to the extent permitted by law.")}</p>
      </Sec>

      <Sec h={L("8. กฎหมายที่ใช้บังคับ", "8. Governing law")}>
        <p>{L("ข้อตกลงนี้อยู่ภายใต้กฎหมายไทย ข้อพิพาทให้อยู่ในเขตอำนาจศาลไทย", "These terms are governed by Thai law; disputes are subject to the jurisdiction of the Thai courts.")}</p>
      </Sec>

      <Sec h={L("9. ผู้ให้บริการ & ติดต่อ", "9. Provider & contact")}>
        <p>{tr(SITE.ownerName)} ({tr(SITE.entityType)}) · {SITE.address}</p>
        <p>{L("อีเมล", "Email")}: <a className="text-teal-deep underline" href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
      </Sec>
    </LegalShell>
  );
}
