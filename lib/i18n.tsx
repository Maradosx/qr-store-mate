"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";

export type Lang = "th" | "en";

/** Bilingual string helper type used across mock data. */
export type TL = { th: string; en: string };

const dict = {
  th: {
    "brand.tagline": "สั่งง่ายแค่สแกน",
    "common.open": "เปิดอยู่",
    "common.closed": "ปิดอยู่",
    "common.reviews": "รีวิว",
    "common.add": "เพิ่ม",
    "common.addToCart": "เพิ่มลงตะกร้า",
    "common.saveChanges": "บันทึกการแก้ไข",
    "common.viewAll": "ดูทั้งหมด",
    "common.cart": "ตะกร้า",
    "common.viewCart": "ดูตะกร้า",
    "common.subtotal": "ยอดรวม",
    "common.discount": "ส่วนลดโปรโมชั่น",
    "common.serviceCharge": "VAT 7%",
    "common.total": "ยอดสุทธิ",
    "common.soldout": "หมด",
    "common.bestseller": "ขายดี",
    "common.signature": "เมนูเด่น",
    "common.empty": "ยังไม่มีรายการในตะกร้า",
    "common.note": "หมายเหตุถึงร้าน",
    "common.notePh": "เช่น ไม่ใส่ผัก / เผ็ดน้อย…",
    "common.optional": "เลือกได้",
    "common.required": "ต้องเลือก",
    "common.baht": "฿",
    "common.free": "ฟรี",
    "common.newShop": "ร้านใหม่",
    "menu.signature": "เมนูเด่น",
    "menu.searchHint": "แตะเมนูเพื่อดูรายละเอียดและเพิ่มท็อปปิ้ง",
    "menu.empty": "หมวดนี้ยังไม่มีเมนู",
    "bill.table": "บิลโต๊ะ",
    "notfound.title": "ไม่พบร้านนี้",
    "notfound.sub": "ลิงก์อาจไม่ถูกต้องหรือร้านปิดการใช้งานแล้ว",
    "cat.recommended": "แนะนำ",
    "cat.appetizer": "ของทานเล่น",
    "cat.main": "จานหลัก",
    "cat.drink": "เครื่องดื่ม",
    "cat.dessert": "ของหวาน",
    "spice.title": "ระดับความเผ็ด",
    "spice.mild": "น้อย",
    "spice.medium": "กลาง",
    "spice.hot": "เผ็ด",
    "qty.title": "จำนวน",
    "checkout.title": "ยืนยันออเดอร์",
    "checkout.review": "ตรวจสอบรายการ",
    "checkout.confirm": "ยืนยันสั่งซื้อ",
    "checkout.placing": "กำลังส่งออเดอร์…",
    "checkout.failed": "ส่งออเดอร์ไม่สำเร็จ กรุณาลองอีกครั้ง",
    "checkout.back": "กลับไปเลือกเมนู",
    "checkout.remove": "ลบ",
    "checkout.edit": "แก้ไข",
    "pay.title": "เลือกวิธีชำระเงิน",
    "pay.cash": "เงินสด",
    "pay.cashDesc": "จ่ายที่เคาน์เตอร์",
    "pay.promptpay": "สแกนจ่าย — PromptPay",
    "pay.promptpayDesc": "สแกน QR ด้วยแอปธนาคาร",
    "pay.bank": "โอนธนาคาร / สแกน QR ร้าน",
    "pay.bankDesc": "โอนเข้าบัญชีร้าน หรือสแกน QR ของร้าน (ทุกธนาคาร/วอลเล็ต)",
    "pay.klk": "คนละครึ่ง / ไทยช่วยไทย",
    "pay.klkDesc": "รัฐช่วยจ่าย • ผ่านแอปเป๋าตัง",
    "pay.klkNote": "หมายเหตุ: ยังไม่เชื่อมต่อระบบรัฐโดยตรง เลือกข้อนี้หากคุณจะใช้สิทธิคนละครึ่งผ่านแอปเป๋าตังด้วยตนเอง",
    "pay.scanToPay": "สแกนเพื่อจ่าย",
    "pay.noPromptPay": "ร้านยังไม่ได้ตั้งพร้อมเพย์ — กรุณาจ่ายเงินสด/ที่เคาน์เตอร์",
    "status.title": "ออเดอร์ของคุณ",
    "status.placed": "สั่งสำเร็จ!",
    "status.placedSub": "ร้านได้รับออเดอร์ของคุณแล้ว",
    "status.received": "รับออเดอร์แล้ว",
    "status.cooking": "กำลังปรุง",
    "status.serving": "กำลังเสิร์ฟ",
    "status.done": "เสร็จสิ้น",
    "status.callStaff": "เรียกพนักงาน",
    "status.called": "เรียกแล้ว ✓ พนักงานกำลังมา",
    "review.title": "ให้คะแนนร้านนี้",
    "review.placeholder": "บอกร้านหน่อย ชอบอะไร อยากให้ปรับอะไร (ไม่บังคับ)",
    "review.submit": "ส่งรีวิว",
    "review.thanks": "ขอบคุณสำหรับรีวิว! 🙏",
    "review.failed": "ส่งรีวิวไม่สำเร็จ ลองใหม่อีกครั้ง",
    "status.orderNo": "เลขออเดอร์",
    "status.backToMenu": "สั่งเพิ่ม",
    "status.none": "ยังไม่มีออเดอร์ในเครื่องนี้",
    "status.inProgress": "กำลังดำเนินการ • โดยประมาณ 1–2 นาที",
    "status.doneShort": "เสร็จแล้ว ✓",
    "status.live": "อัปเดตสดจากครัว",
    "status.waiting": "รออาหาร",
    "status.cancelledTitle": "ออเดอร์ถูกยกเลิก",
    "status.cancelledSub": "ออเดอร์นี้ถูกยกเลิก — กรุณาติดต่อพนักงานหากมีข้อสงสัย",
    "home.title": "ระบบสั่งอาหารผ่าน QR ที่โต๊ะ",
    "home.sub": "สแกนที่โต๊ะ → ดูเมนู → สั่ง → จ่าย → ติดตามสถานะ",
    "home.customer": "ฝั่งลูกค้า",
    "home.customerDesc": "จำลองการสแกน QR ที่โต๊ะ 12",
    "home.admin": "ฝั่งร้าน (Admin)",
    "home.adminDesc": "จัดการเมนู โต๊ะ ออเดอร์ และยอดขาย",
    "home.soon": "เร็ว ๆ นี้",
    "nav.back": "ย้อนกลับ",
    "table": "โต๊ะ",
    "poweredBy": "อยากให้ร้านคุณมีระบบนี้?",
  },
  en: {
    "brand.tagline": "Just scan to order",
    "common.open": "Open",
    "common.closed": "Closed",
    "common.reviews": "reviews",
    "common.add": "Add",
    "common.addToCart": "Add to cart",
    "common.saveChanges": "Save changes",
    "common.viewAll": "See all",
    "common.cart": "Cart",
    "common.viewCart": "View cart",
    "common.subtotal": "Subtotal",
    "common.discount": "Promotion discount",
    "common.serviceCharge": "VAT 7%",
    "common.total": "Total",
    "common.soldout": "Sold out",
    "common.bestseller": "Best seller",
    "common.signature": "Signature",
    "common.empty": "Your cart is empty",
    "common.note": "Note to kitchen",
    "common.notePh": "e.g. no veggies / less spicy…",
    "common.optional": "Optional",
    "common.required": "Required",
    "common.baht": "฿",
    "common.free": "Free",
    "common.newShop": "New",
    "menu.signature": "Signature",
    "menu.searchHint": "Tap a dish for details & add-ons",
    "menu.empty": "No dishes in this category yet",
    "bill.table": "Table bill",
    "notfound.title": "Restaurant not found",
    "notfound.sub": "This link may be invalid or the shop is no longer active",
    "cat.recommended": "Recommended",
    "cat.appetizer": "Appetizers",
    "cat.main": "Main dishes",
    "cat.drink": "Drinks",
    "cat.dessert": "Desserts",
    "spice.title": "Spice level",
    "spice.mild": "Mild",
    "spice.medium": "Medium",
    "spice.hot": "Hot",
    "qty.title": "Quantity",
    "checkout.title": "Confirm order",
    "checkout.review": "Review items",
    "checkout.confirm": "Place order",
    "checkout.placing": "Placing order…",
    "checkout.failed": "Couldn't place the order. Please try again.",
    "checkout.back": "Back to menu",
    "checkout.remove": "Remove",
    "checkout.edit": "Edit",
    "pay.title": "Payment method",
    "pay.cash": "Cash",
    "pay.cashDesc": "Pay at the counter",
    "pay.promptpay": "Scan to pay — PromptPay",
    "pay.promptpayDesc": "Scan the QR with your banking app",
    "pay.bank": "Bank transfer / shop QR",
    "pay.bankDesc": "Transfer to the shop or scan its QR (any bank / e-wallet)",
    "pay.klk": "Khon La Khrueng (co-pay)",
    "pay.klkDesc": "Government co-pay • via Paotang app",
    "pay.klkNote": "Note: not integrated with the government system. Choose this if you'll use your co-pay benefit via the Paotang app yourself.",
    "pay.scanToPay": "Scan to pay",
    "pay.noPromptPay": "Shop hasn't set up PromptPay yet — please pay with cash",
    "status.title": "Your order",
    "status.placed": "Order placed!",
    "status.placedSub": "The restaurant has received your order",
    "status.received": "Order received",
    "status.cooking": "Cooking",
    "status.serving": "Serving",
    "status.done": "Completed",
    "status.callStaff": "Call staff",
    "status.called": "Called ✓ staff on the way",
    "review.title": "Rate this restaurant",
    "review.placeholder": "Tell the shop what you liked or what to improve (optional)",
    "review.submit": "Submit review",
    "review.thanks": "Thanks for your review! 🙏",
    "review.failed": "Couldn't send review. Please try again.",
    "status.orderNo": "Order no.",
    "status.backToMenu": "Order more",
    "status.none": "No order on this device yet",
    "status.inProgress": "In progress • approx. 1–2 min",
    "status.doneShort": "Done ✓",
    "status.live": "Live from the kitchen",
    "status.waiting": "Order status",
    "status.cancelledTitle": "Order cancelled",
    "status.cancelledSub": "This order was cancelled — please ask staff if you have questions",
    "home.title": "QR table-ordering for restaurants",
    "home.sub": "Scan at table → browse → order → pay → track",
    "home.customer": "Customer",
    "home.customerDesc": "Simulate scanning the QR at table 12",
    "home.admin": "Restaurant (Admin)",
    "home.adminDesc": "Manage menu, tables, orders & sales",
    "home.soon": "Coming soon",
    "nav.back": "Back",
    "table": "Table",
    "poweredBy": "Want this for your shop?",
  },
} as const;

export type DictKey = keyof (typeof dict)["th"];

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (k: DictKey) => string;
  tr: (o: TL) => string;
};

const I18nCtx = createContext<Ctx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("th");

  useEffect(() => {
    const saved = (typeof window !== "undefined" &&
      window.localStorage.getItem("qsm-lang")) as Lang | null;
    // intentional: restore saved language on mount (kept out of initial state to avoid SSR hydration mismatch)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "th" || saved === "en") setLang(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") window.localStorage.setItem("qsm-lang", lang);
    if (typeof document !== "undefined") document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback((k: DictKey) => dict[lang][k] ?? k, [lang]);
  const tr = useCallback((o: TL) => o[lang], [lang]);
  const toggle = useCallback(() => setLang((l) => (l === "th" ? "en" : "th")), []);

  return (
    <I18nCtx.Provider value={{ lang, setLang, toggle, t, tr }}>
      {children}
    </I18nCtx.Provider>
  );
}

export function useI18n(): Ctx {
  const ctx = useContext(I18nCtx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
