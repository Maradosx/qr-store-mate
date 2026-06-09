export type TL = { th: string; en: string };

export type CatId =
  | "recommended"
  | "appetizer"
  | "main"
  | "drink"
  | "dessert";

export type AddonOption = { id: string; name: TL; price: number };
export type AddonGroup = {
  id: string;
  name: TL;
  type: "single" | "multi";
  required?: boolean;
  options: AddonOption[];
};

export type Category = { id: string; th: string; en: string };
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "appetizer", th: "ของทานเล่น", en: "Appetizers" },
  { id: "main", th: "จานหลัก", en: "Main dishes" },
  { id: "drink", th: "เครื่องดื่ม", en: "Drinks" },
  { id: "dessert", th: "ของหวาน", en: "Desserts" },
];

export type MenuItem = {
  id: string;
  name: TL;
  desc: TL;
  price: number;
  oldPrice?: number;
  cat: string;
  emoji: string;
  tone: string;
  img?: string; // uploaded photo (data URL) — overrides the gradient when set
  hidden?: boolean; // hidden from the customer menu
  signature?: boolean;
  bestseller?: boolean;
  soldout?: boolean;
  spicy?: boolean;
  addonGroups?: AddonGroup[];
};

export type Store = {
  name: TL;
  tagline: TL;
  rating: number;
  reviews: number;
  hours: string;
  promptpayName: string;
  promptpayId: string;
  bankName?: string; // optional bank-transfer channel
  bankAccount?: string;
  bankAccountName?: string;
  payQrUrl?: string; // shop's own uploaded QR (any bank app / e-wallet)
  ownerName?: string; // contact name of the shop owner (for the platform admin)
  ownerPhone?: string; // contact phone of the shop owner
  qrColor?: string; // owner-chosen color for table QR codes (default brand teal)
  serviceCharge?: boolean; // add 7% VAT/service to bills (default off — most small shops don't)
  coPay?: boolean; // accept "คนละครึ่ง / ไทยช่วยไทย" gov co-pay — shown as a bill payment option (default off)
  acceptingOrders?: boolean; // master "open now" switch — off = closed, customers can't order (default on)
  openTime?: string | null; // "HH:MM" Asia/Bangkok — daily open; null/"" = no time gate (24h)
  closeTime?: string | null; // "HH:MM" Asia/Bangkok — daily close (close < open = overnight)
  address: string;
  phone: string;
  cover?: string; // uploaded cover photo (data URL)
  logo?: string; // uploaded logo (data URL)
};

export const store: Store = {
  name: { th: "ครัวคุณนาย", en: "Khrua Khun Nai" },
  tagline: { th: "อาหารไทยต้นตำรับ • สตรีทฟู้ด", en: "Authentic Thai Kitchen • Street food" },
  rating: 4.9,
  reviews: 1284,
  hours: "10:00–22:00",
  acceptingOrders: true,
  openTime: null,
  closeTime: null,
  promptpayName: "ครัวคุณนาย จำกัด",
  promptpayId: "081-234-5678",
  address: "123 ถ.สุขุมวิท แขวงคลองเตย กรุงเทพฯ 10110",
  phone: "02-123-4567",
};

export const categories: { id: CatId; key: string }[] = [
  { id: "recommended", key: "cat.recommended" },
  { id: "appetizer", key: "cat.appetizer" },
  { id: "main", key: "cat.main" },
  { id: "drink", key: "cat.drink" },
  { id: "dessert", key: "cat.dessert" },
];

// Reusable add-on groups
const extras: AddonGroup = {
  id: "extras",
  name: { th: "เพิ่มเติม", en: "Add-ons" },
  type: "multi",
  options: [
    { id: "egg", name: { th: "เพิ่มไข่ดาว", en: "Fried egg" }, price: 10 },
    { id: "rice", name: { th: "ข้าวสวยพิเศษ", en: "Extra rice" }, price: 15 },
    { id: "cheese", name: { th: "เพิ่มชีส", en: "Add cheese" }, price: 20 },
  ],
};
const size: AddonGroup = {
  id: "size",
  name: { th: "ขนาด", en: "Size" },
  type: "single",
  required: true,
  options: [
    { id: "regular", name: { th: "ธรรมดา", en: "Regular" }, price: 0 },
    { id: "large", name: { th: "พิเศษ", en: "Large" }, price: 20 },
  ],
};
const sweetness: AddonGroup = {
  id: "sweet",
  name: { th: "ระดับความหวาน", en: "Sweetness" },
  type: "single",
  required: true,
  options: [
    { id: "0", name: { th: "ไม่หวาน", en: "0%" }, price: 0 },
    { id: "50", name: { th: "หวานน้อย", en: "50%" }, price: 0 },
    { id: "100", name: { th: "หวานปกติ", en: "100%" }, price: 0 },
  ],
};

export const menu: MenuItem[] = [
  {
    id: "prawn",
    name: { th: "กุ้งเผาซอสซีฟู้ด", en: "Grilled River Prawns" },
    desc: { th: "กุ้งแม่น้ำตัวโต ย่างเตาถ่าน ราดน้ำจิ้มซีฟู้ดสูตรเด็ด", en: "Charcoal-grilled jumbo prawns, seafood dipping sauce" },
    price: 320,
    cat: "main",
    emoji: "🦐",
    tone: "prawn",
    signature: true,
    bestseller: true,
    spicy: true,
    addonGroups: [size, extras],
  },
  {
    id: "tomyum",
    name: { th: "ต้มยำกุ้งน้ำข้น", en: "Tom Yum Goong" },
    desc: { th: "เข้มข้นกะทิสด เปรี้ยวจี๊ด หอมสมุนไพร กุ้งแน่น ๆ", en: "Rich & creamy hot-and-sour prawn soup" },
    price: 189,
    cat: "main",
    emoji: "🍲",
    tone: "tomyum",
    signature: true,
    spicy: true,
    addonGroups: [extras],
  },
  {
    id: "padthai",
    name: { th: "ผัดไทยกุ้งสด", en: "Pad Thai with Prawns" },
    desc: { th: "เส้นเหนียวนุ่ม รสกลมกล่อม กุ้งสดตัวโต โรยถั่ว", en: "Stir-fried rice noodles with fresh prawns" },
    price: 129,
    cat: "main",
    emoji: "🍜",
    tone: "noodle",
    bestseller: true,
    addonGroups: [extras],
  },
  {
    id: "kaprao",
    name: { th: "ผัดกะเพราหมูสับ ไข่ดาว", en: "Pork Basil with Fried Egg" },
    desc: { th: "กะเพราหอมฉุน รสจัดจ้าน ราดข้าวสวยร้อน ๆ", en: "Spicy holy-basil pork over hot rice" },
    price: 75,
    cat: "main",
    emoji: "🍳",
    tone: "rice",
    spicy: true,
    addonGroups: [size, extras],
  },
  {
    id: "greencurry",
    name: { th: "แกงเขียวหวานไก่", en: "Green Curry Chicken" },
    desc: { th: "กะทิสดเข้มข้น หอมพริกแกงเขียว เนื้อไก่นุ่ม", en: "Creamy green curry with tender chicken" },
    price: 96,
    oldPrice: 120,
    cat: "main",
    emoji: "🍛",
    tone: "curry",
    spicy: true,
    addonGroups: [extras],
  },
  {
    id: "somtum",
    name: { th: "ส้มตำไทย", en: "Som Tum (Papaya Salad)" },
    desc: { th: "ตำสดทุกจาน เปรี้ยว หวาน เผ็ด ครบรส", en: "Fresh-pounded spicy green papaya salad" },
    price: 60,
    cat: "appetizer",
    emoji: "🥗",
    tone: "papaya",
    spicy: true,
  },
  {
    id: "springroll",
    name: { th: "ปอเปี๊ยะทอด", en: "Fried Spring Rolls" },
    desc: { th: "กรอบนอกนุ่มใน เสิร์ฟพร้อมน้ำจิ้มบ๊วย", en: "Crispy spring rolls with plum sauce" },
    price: 55,
    cat: "appetizer",
    emoji: "🥟",
    tone: "spring",
    addonGroups: [size],
  },
  {
    id: "satay",
    name: { th: "หมูสะเต๊ะ", en: "Pork Satay" },
    desc: { th: "ย่างหอม ราดกะทิ เสิร์ฟน้ำจิ้มถั่วและอาจาด", en: "Grilled pork skewers, peanut sauce" },
    price: 89,
    cat: "appetizer",
    emoji: "🍢",
    tone: "satay",
    signature: true,
  },
  {
    id: "friedchicken",
    name: { th: "ไก่ทอดน้ำปลา", en: "Fish-sauce Fried Chicken" },
    desc: { th: "หนังกรอบ เนื้อฉ่ำ หอมกระเทียมเจียว", en: "Crispy fish-sauce fried chicken" },
    price: 90,
    cat: "appetizer",
    emoji: "🍗",
    tone: "chicken",
    soldout: true,
  },
  {
    id: "thaitea",
    name: { th: "ชาไทยเย็น", en: "Thai Iced Tea" },
    desc: { th: "ชาไทยแท้ หอมมัน เข้มข้น", en: "Authentic creamy Thai iced tea" },
    price: 45,
    cat: "drink",
    emoji: "🧋",
    tone: "tea",
    bestseller: true,
    addonGroups: [sweetness],
  },
  {
    id: "coconut",
    name: { th: "น้ำมะพร้าวสด", en: "Fresh Coconut Water" },
    desc: { th: "หวานเย็นชื่นใจ สดจากลูก", en: "Sweet & refreshing fresh coconut" },
    price: 50,
    cat: "drink",
    emoji: "🥥",
    tone: "drink",
  },
  {
    id: "mango",
    name: { th: "ข้าวเหนียวมะม่วง", en: "Mango Sticky Rice" },
    desc: { th: "มะม่วงสุกหวาน ข้าวเหนียวมูนกะทิ", en: "Sweet mango with coconut sticky rice" },
    price: 80,
    cat: "dessert",
    emoji: "🥭",
    tone: "mango",
    signature: true,
  },
];

export const menuById = (id: string) => menu.find((m) => m.id === id);

// ---- Orders (seed for admin board / history / dashboard) ----
export type OrderStatus = "received" | "cooking" | "serving" | "done" | "cancelled";

export type ShopOrderItem = {
  name: TL;
  qty: number;
  price: number;
  emoji: string;
  tone: string;
  addonLabel?: TL; // chosen add-ons (e.g. "เพิ่มไข่ดาว, พิเศษ")
  spice?: string | null; // spice level key (e.g. "spice.medium")
  note?: string | null; // free-text note to the kitchen
};
export type ShopOrder = {
  id?: string;
  no: string;
  table: string;
  items: ShopOrderItem[];
  total: number;
  status: OrderStatus;
  placedAt: string; // "HH:MM"
  ts?: string; // raw timestamp (for correct cross-day sorting)
  date: string; // "YYYY-MM-DD"
  paidAt?: string | null; // when the table bill this order belongs to was paid (null = open bill)
};

const it = (id: string, qty: number): ShopOrderItem => {
  const m = menuById(id)!;
  return { name: m.name, qty, price: m.price, emoji: m.emoji, tone: m.tone };
};
const sum = (items: ShopOrderItem[]) =>
  items.reduce((s, i) => s + i.price * i.qty, 0);

const mkOrder = (
  no: string,
  table: string,
  status: OrderStatus,
  placedAt: string,
  date: string,
  items: ShopOrderItem[]
): ShopOrder => ({ no, table, items, total: sum(items), status, placedAt, date });

export const TODAY = "2026-06-06";

export const seedOrders: ShopOrder[] = [
  mkOrder("A1051", "12", "received", "19:58", TODAY, [it("prawn", 1), it("thaitea", 2)]),
  mkOrder("A1050", "5", "cooking", "19:52", TODAY, [it("kaprao", 2), it("greencurry", 1), it("coconut", 1)]),
  mkOrder("A1049", "8", "cooking", "19:47", TODAY, [it("padthai", 1), it("somtum", 1), it("springroll", 1)]),
  mkOrder("A1048", "3", "serving", "19:39", TODAY, [it("tomyum", 1), it("padthai", 2)]),
  mkOrder("A1047", "12", "done", "19:21", TODAY, [it("satay", 2), it("thaitea", 1), it("mango", 1)]),
  mkOrder("A1046", "1", "done", "19:02", TODAY, [it("prawn", 1), it("somtum", 1)]),
  mkOrder("A1042", "7", "done", "18:30", TODAY, [it("kaprao", 1), it("greencurry", 1), it("coconut", 2)]),
];

export const seedTables = [1, 2, 3, 5, 7, 8, 12].map((n) => ({
  id: "t" + n,
  no: String(n),
}));
