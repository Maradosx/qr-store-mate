// Single source of truth for legal / contact details.
// Edit here to update the Privacy, Terms and Contact pages everywhere at once.
export const SITE = {
  brand: "QR Store Mate",
  url: "https://qrstoremate.com",
  entityType: { th: "บุคคลธรรมดา", en: "Sole proprietor (individual)" },
  ownerName: { th: "อาทิตย์ บุญพินิจ", en: "Athit Boonpinit" },
  email: "athit.boonpinit@gmail.com",
  line: "", // LINE Official Account id — add later
  phone: "090-569-0267",
  address: "247/5 หมู่ 5 ต.โพรงอากาศ อ.บางน้ำเปรี้ยว จ.ฉะเชิงเทรา 24150",
  dbdNumber: "", // DBD e-commerce reg. no. — fill after registering
  taxId: "", // tax ID — fill if/when registered for VAT
} as const;
