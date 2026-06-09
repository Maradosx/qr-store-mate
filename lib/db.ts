import { supabase } from "./supabase";
import type { MenuItem, AddonGroup, Store, ShopOrder, OrderStatus, Category } from "./mock";
import { DEFAULT_CATEGORIES } from "./mock";

// data-mapping layer: rows are dynamic Supabase shapes
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (ts: string) => {
  const d = new Date(ts);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
// local calendar date — must use the SAME local tz as hhmm, else a late-evening order's date (UTC-sliced)
// disagrees with its time (local) and reads off-by-one in the history list / CSV export
const ymd = (ts: string) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function mapStore(r: Row): Store {
  return {
    name: { th: r.name_th, en: r.name_en },
    tagline: { th: r.tagline_th ?? "", en: r.tagline_en ?? "" },
    hours: r.hours ?? "",
    address: r.address ?? "",
    phone: r.phone ?? "",
    rating: Number(r.rating ?? 5),
    reviews: r.reviews ?? 0,
    promptpayName: r.promptpay_name ?? "",
    promptpayId: r.promptpay_id ?? "",
    bankName: r.bank_name ?? undefined,
    bankAccount: r.bank_account ?? undefined,
    bankAccountName: r.bank_account_name ?? undefined,
    payQrUrl: r.pay_qr_url ?? undefined,
    ownerName: r.owner_name ?? undefined,
    ownerPhone: r.owner_phone ?? undefined,
    qrColor: r.qr_color ?? undefined,
    serviceCharge: r.service_charge ?? false,
    coPay: r.accept_co_pay ?? false,
    acceptingOrders: r.accepting_orders ?? true,
    openTime: r.open_time ?? null,
    closeTime: r.close_time ?? null,
    cover: r.cover_url ?? undefined,
    logo: r.logo_url ?? undefined,
  };
}

function mapGroup(g: Row): AddonGroup {
  return {
    id: g.id,
    name: { th: g.name_th, en: g.name_en },
    type: g.type,
    required: g.required,
    options: (g.addon_options ?? [])
      .slice()
      .sort((a: Row, b: Row) => a.sort - b.sort)
      .map((o: Row) => ({ id: o.id, name: { th: o.name_th, en: o.name_en }, price: o.price })),
  };
}

function mapItem(r: Row): MenuItem {
  return {
    id: r.id,
    name: { th: r.name_th, en: r.name_en },
    desc: { th: r.desc_th ?? "", en: r.desc_en ?? "" },
    price: r.price,
    oldPrice: r.old_price ?? undefined,
    cat: (r.cat ?? "main") as string,
    emoji: r.emoji ?? "🍽️",
    tone: r.tone ?? "default",
    img: r.img_url ?? undefined,
    hidden: r.hidden ?? false,
    soldout: r.soldout ?? false,
    signature: r.signature ?? false,
    bestseller: r.bestseller ?? false,
    spicy: r.spicy ?? false,
    addonGroups: (r.addon_groups ?? [])
      .slice()
      .sort((a: Row, b: Row) => a.sort - b.sort)
      .map(mapGroup),
  };
}

function mapOrder(o: Row): ShopOrder {
  return {
    id: o.id,
    no: o.order_no,
    table: o.table_no,
    status: o.status as OrderStatus,
    total: o.total,
    placedAt: hhmm(o.placed_at),
    ts: String(o.placed_at),
    date: ymd(o.placed_at),
    paidAt: o.paid_at ?? null,
    items: (o.order_items ?? []).map((i: Row) => ({
      name: { th: i.name_th, en: i.name_en },
      qty: i.qty,
      price: i.unit_price,
      emoji: i.emoji ?? "🍽️",
      tone: i.tone ?? "default",
      addonLabel: i.addon_label_th || i.addon_label_en ? { th: i.addon_label_th ?? "", en: i.addon_label_en ?? "" } : undefined,
      spice: i.spice ?? null,
      note: i.note ?? null,
    })),
  };
}

export type Billing = {
  plan: string; // 'starter' | 'pro' | 'business'
  trialEndsAt: string | null;
  paidUntil: string | null;
};

export type MemberRole = "owner" | "manager" | "staff";

export type ShopData = {
  restaurantId: string;
  slug: string;
  status: string; // 'pending' | 'approved' | 'rejected' | 'suspended'
  billing: Billing;
  categories: Category[];
  profile: Store;
  menu: MenuItem[];
  tables: { id: string; no: string }[];
  orders: ShopOrder[];
  role: MemberRole; // the signed-in member's role for this shop (customer/admin-view default 'owner')
  memberName?: string | null; // a staff sub-account's display name (for the in-app greeting)
};

// columns safe to expose to the public/customer (anon) — excludes owner PII, plan & billing/stripe state
const PUBLIC_SHOP_COLS =
  "id, slug, status, name_th, name_en, tagline_th, tagline_en, hours, address, phone, rating, reviews, " +
  "promptpay_name, promptpay_id, bank_name, bank_account, bank_account_name, pay_qr_url, qr_color, service_charge, accept_co_pay, " +
  "accepting_orders, open_time, close_time, cover_url, logo_url, categories";
// columns the authenticated role may read (public + owner_id/created_at + plan tier). `plan` is read
// directly (not via RPC) so the owner's tier is STABLE — a get_my_billing blip can no longer fall back to
// 'starter' and flip the UI. The genuinely sensitive billing/PII (owner_name, owner_phone, trial_ends_at,
// paid_until, stripe_*) stay revoked from authenticated and are read by the owner only via get_my_billing().
const AUTH_SHOP_COLS = PUBLIC_SHOP_COLS + ", owner_id, created_at, plan";

async function loadShop(rest: Row, role: MemberRole = "owner", publicOnly = false): Promise<ShopData> {
  const restaurantId = rest.id as string;
  let itemsQuery = supabase
    .from("menu_items")
    .select("*, addon_groups(*, addon_options(*))")
    .eq("restaurant_id", restaurantId);
  if (publicOnly) itemsQuery = itemsQuery.eq("hidden", false); // never ship hidden/draft items to customers
  const [{ data: items }, { data: tbls }] = await Promise.all([
    itemsQuery.order("sort"),
    supabase.from("tables").select("*").eq("restaurant_id", restaurantId).order("no"),
  ]);
  // customers never need the order history (it's owner/staff-only) — skip the wasted fetch on the public path
  let ords: Row[] = [];
  if (!publicOnly) {
    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("restaurant_id", restaurantId)
      .order("placed_at", { ascending: false });
    ords = (data ?? []) as Row[];
  }
  return {
    restaurantId,
    slug: rest.slug,
    status: rest.status ?? "pending",
    billing: {
      plan: rest.plan ?? "starter", // fail-CLOSED: unknown plan → most restrictive (gated features stay locked)
      trialEndsAt: rest.trial_ends_at ?? null,
      paidUntil: rest.paid_until ?? null,
    },
    categories: Array.isArray(rest.categories) && rest.categories.length ? (rest.categories as Category[]) : DEFAULT_CATEGORIES,
    profile: mapStore(rest),
    menu: (items ?? []).map(mapItem),
    tables: (tbls ?? []).map((t: Row) => ({ id: t.id, no: t.no })),
    orders: (ords ?? []).map(mapOrder),
    role,
  };
}

/** Load a restaurant + its data by public slug (customer side). */
export async function fetchShopBySlug(slug: string): Promise<ShopData> {
  const { data: rest, error } = await supabase
    .from("restaurants")
    .select(PUBLIC_SHOP_COLS)
    .eq("slug", slug)
    .single();
  if (error || !rest) throw error ?? new Error("restaurant not found");
  return loadShop(rest as Row, "owner", true);
}

/** Load a restaurant + its data by id (platform-admin "view as" — RLS lets admins read all). */
export async function fetchShopById(id: string): Promise<ShopData> {
  const { data: rest, error } = await supabase
    .from("restaurants")
    .select(AUTH_SHOP_COLS)
    .eq("id", id)
    .single();
  if (error || !rest) throw error ?? new Error("restaurant not found");
  return loadShop(rest as Row);
}

/** Owner-only: pull sensitive billing/PII (revoked from the broad authenticated grant) for the caller's own shop. */
async function mergeOwnerBilling(data: ShopData): Promise<ShopData> {
  const { data: b } = await supabase.rpc("get_my_billing");
  const row = (Array.isArray(b) ? b[0] : b) as Row | null;
  if (row) {
    data.billing = { plan: row.plan ?? data.billing.plan, trialEndsAt: row.trial_ends_at ?? null, paidUntil: row.paid_until ?? null };
    data.profile.ownerName = row.owner_name ?? undefined;
    data.profile.ownerPhone = row.owner_phone ?? undefined;
  }
  return data;
}

/** Load the signed-in member's restaurant (admin side): owner first, else staff membership. Null if none. */
export async function fetchShopForOwner(): Promise<ShopData | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  // 1) owner of a restaurant
  const { data: ownerRest } = await supabase
    .from("restaurants")
    .select(AUTH_SHOP_COLS)
    .eq("owner_id", user.id)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (ownerRest) return mergeOwnerBilling(await loadShop(ownerRest as Row, "owner"));
  // 2) staff member of a restaurant
  const { data: membership } = await supabase
    .from("restaurant_staff")
    .select("restaurant_id, role, name")
    .eq("user_id", user.id)
    .order("created_at") // deterministic: a multi-shop staffer always lands on the same (oldest) shop
    .limit(1)
    .maybeSingle();
  if (!membership) return null;
  const { data: staffRest } = await supabase
    .from("restaurants")
    .select(PUBLIC_SHOP_COLS) // staff never need owner PII / billing — load only public fields
    .eq("id", (membership as Row).restaurant_id)
    .maybeSingle();
  if (!staffRest) return null;
  const staffData = await loadShop(staffRest as Row, ((membership as Row).role as MemberRole) ?? "staff");
  staffData.memberName = ((membership as Row).name as string | null) ?? null;
  // staff load via PUBLIC_SHOP_COLS (no plan column), so resolve the shop's real plan for correct caps (e.g. kitchen)
  const { data: plan } = await supabase.rpc("my_shop_plan");
  if (plan) staffData.billing = { ...staffData.billing, plan: plan as string };
  return staffData;
}

export type StaffMember = { user_id: string; email: string | null; name: string | null; role: MemberRole; created_at: string };

/** Owner: list staff members of the restaurant. */
export async function fetchStaff(restaurantId: string): Promise<StaffMember[]> {
  const { data } = await supabase
    .from("restaurant_staff")
    .select("user_id, email, name, role, created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at");
  return (data ?? []) as StaffMember[];
}

async function invokeStaffFn(body: Record<string, unknown>): Promise<Row> {
  const { data, error } = await supabase.functions.invoke("staff-invite", { body });
  if (error) {
    let msg = error.message;
    try {
      const j = await (error as unknown as { context: Response }).context.json();
      if (j?.error) msg = j.error as string;
    } catch {
      /* keep generic message */
    }
    throw new Error(msg);
  }
  if ((data as Row)?.error) throw new Error((data as Row).error as string);
  return data as Row;
}

/**
 * Owner: add a staff member by email. The edge function creates their login with a generated
 * temporary password (NO email is sent — avoids Supabase's auth-email rate limit) and returns it
 * so the owner can hand it to the on-site staff. `tempPassword` is null when the account already existed.
 */
export async function inviteStaff(
  restaurantId: string,
  email: string,
  name: string,
  role: "staff" | "manager" = "staff",
): Promise<{ invited: boolean; existing: boolean; tempPassword: string | null }> {
  const d = await invokeStaffFn({ action: "invite", restaurant_id: restaurantId, email, name, role });
  return {
    invited: Boolean(d?.invited),
    existing: Boolean(d?.existing),
    tempPassword: (d?.tempPassword as string | null) ?? null,
  };
}

/** Owner: remove a staff member. */
export async function removeStaff(restaurantId: string, userId: string): Promise<void> {
  await invokeStaffFn({ action: "remove", restaurant_id: restaurantId, user_id: userId });
}

/** Owner: generate a fresh temporary password for a staff member (the old one can't be shown again). */
export async function resetStaffPassword(restaurantId: string, userId: string): Promise<{ tempPassword: string | null; email: string | null; name: string | null }> {
  const d = await invokeStaffFn({ action: "reset_password", restaurant_id: restaurantId, user_id: userId });
  return {
    tempPassword: (d?.tempPassword as string | null) ?? null,
    email: (d?.email as string | null) ?? null,
    name: (d?.name as string | null) ?? null,
  };
}

/** Sign up a new owner, create their restaurant + starter data. Returns the new slug. */
export async function signUpOwner(
  name: string,
  email: string,
  password: string,
  ownerName = "",
  phone = "",
  plan = "pro"
): Promise<string> {
  const { error: suErr } = await supabase.auth.signUp({ email, password });
  if (suErr) {
    // reject duplicate emails outright — don't fall through to sign-in + create a second shop on an existing account
    if (/already.?(registered|exists)|user.*exists/i.test(suErr.message)) {
      throw new Error("อีเมลนี้มีบัญชีอยู่แล้ว — ถ้าเป็นของคุณ กรุณาเข้าสู่ระบบแทน / This email already has an account — please sign in instead.");
    }
    throw suErr;
  }
  const { error: siErr } = await supabase.auth.signInWithPassword({ email, password });
  if (siErr) throw siErr;
  const { data, error } = await supabase.rpc("create_my_restaurant", {
    p_name: name,
    p_owner_name: ownerName,
    p_phone: phone,
    p_plan: plan,
  });
  if (error) throw error;
  return data as string;
}

export async function fetchOrders(restaurantId: string): Promise<ShopOrder[]> {
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("restaurant_id", restaurantId)
    .order("placed_at", { ascending: false });
  return (data ?? []).map(mapOrder);
}

// ---- mutations (write-through) ----
export async function dbUpdateRestaurant(id: string, patch: Partial<Store>) {
  const c: Row = {};
  if (patch.name) { c.name_th = patch.name.th; c.name_en = patch.name.en; }
  if (patch.tagline) { c.tagline_th = patch.tagline.th; c.tagline_en = patch.tagline.en; }
  if (patch.hours !== undefined) c.hours = patch.hours;
  if (patch.address !== undefined) c.address = patch.address;
  if (patch.phone !== undefined) c.phone = patch.phone;
  if ("cover" in patch) c.cover_url = patch.cover ?? null;
  if ("logo" in patch) c.logo_url = patch.logo ?? null;
  if (patch.promptpayName !== undefined) c.promptpay_name = patch.promptpayName;
  if (patch.promptpayId !== undefined) c.promptpay_id = patch.promptpayId;
  if ("bankName" in patch) c.bank_name = patch.bankName || null;
  if ("bankAccount" in patch) c.bank_account = patch.bankAccount || null;
  if ("bankAccountName" in patch) c.bank_account_name = patch.bankAccountName || null;
  if ("payQrUrl" in patch) c.pay_qr_url = patch.payQrUrl ?? null;
  if ("ownerName" in patch) c.owner_name = patch.ownerName || null;
  if ("ownerPhone" in patch) c.owner_phone = patch.ownerPhone || null;
  if ("qrColor" in patch) c.qr_color = patch.qrColor || null;
  if (patch.serviceCharge !== undefined) c.service_charge = patch.serviceCharge;
  if (patch.coPay !== undefined) c.accept_co_pay = patch.coPay;
  if (patch.acceptingOrders !== undefined) c.accepting_orders = patch.acceptingOrders;
  if ("openTime" in patch) c.open_time = patch.openTime || null;
  if ("closeTime" in patch) c.close_time = patch.closeTime || null;
  if (Object.keys(c).length) await supabase.from("restaurants").update(c).eq("id", id);
}

export async function dbUpdateMenuItem(id: string, patch: Partial<MenuItem>) {
  const c: Row = {};
  if (patch.name) { c.name_th = patch.name.th; c.name_en = patch.name.en; }
  if (patch.desc) { c.desc_th = patch.desc.th; c.desc_en = patch.desc.en; }
  if (patch.price !== undefined) c.price = patch.price;
  if ("oldPrice" in patch) c.old_price = patch.oldPrice ?? null;
  if (patch.cat !== undefined) c.cat = patch.cat;
  if ("img" in patch) c.img_url = patch.img ?? null;
  if (patch.hidden !== undefined) c.hidden = patch.hidden;
  if (patch.soldout !== undefined) c.soldout = patch.soldout;
  if (patch.signature !== undefined) c.signature = patch.signature;
  if (patch.bestseller !== undefined) c.bestseller = patch.bestseller;
  if (patch.spicy !== undefined) c.spicy = patch.spicy;
  if (patch.emoji !== undefined) c.emoji = patch.emoji;
  if (Object.keys(c).length) await supabase.from("menu_items").update(c).eq("id", id);
}

/** Owner/admin: replace ALL add-on groups (+options) for a menu item (atomic, server-authorized). */
export async function saveAddonGroups(menuItemId: string, groups: AddonGroup[]): Promise<void> {
  const payload = groups.map((g) => ({
    name_th: g.name.th,
    name_en: g.name.en,
    type: g.type,
    required: !!g.required,
    options: g.options.map((o) => ({ name_th: o.name.th, name_en: o.name.en, price: o.price })),
  }));
  const { error } = await supabase.rpc("save_addon_groups", { p_menu_item: menuItemId, p_groups: payload });
  if (error) throw error;
}

export async function dbAddMenuItem(restaurantId: string, cat: string): Promise<MenuItem> {
  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      restaurant_id: restaurantId,
      name_th: "เมนูใหม่",
      name_en: "New item",
      desc_th: "คำอธิบายเมนู",
      desc_en: "Item description",
      price: 0,
      cat,
      emoji: "🍽️",
      tone: "default",
      sort: -1,
    })
    .select("*, addon_groups(*, addon_options(*))")
    .single();
  if (error || !data) throw error ?? new Error("could not add menu item");
  return mapItem(data as Row);
}

export async function dbRemoveMenuItem(id: string) {
  await supabase.from("menu_items").delete().eq("id", id);
}

/** Save the shop's category list (jsonb on restaurants). */
export async function dbSetCategories(restaurantId: string, categories: Category[]) {
  const { error } = await supabase.from("restaurants").update({ categories }).eq("id", restaurantId);
  if (error) throw error;
}

export async function dbAddTable(restaurantId: string, no: string): Promise<{ id: string; no: string }> {
  const { data, error } = await supabase
    .from("tables")
    .insert({ restaurant_id: restaurantId, no })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("could not add table");
  return { id: (data as Row).id, no: (data as Row).no };
}

export async function dbRemoveTable(id: string) {
  await supabase.from("tables").delete().eq("id", id);
}

export async function dbSetOrderStatus(restaurantId: string, orderId: string, status: OrderStatus) {
  // scope by restaurant_id too (defense-in-depth alongside RLS) so an order id alone can't touch another shop
  await supabase.from("orders").update({ status }).eq("restaurant_id", restaurantId).eq("id", orderId);
}

/** Customer-side: read just this order's live status (anon-safe via RPC; needs restaurant id + order no). */
export async function fetchOrderStatus(restaurantId: string, orderNo: string): Promise<OrderStatus | null> {
  const { data, error } = await supabase.rpc("order_status", { p_restaurant: restaurantId, p_order_no: orderNo });
  if (error) return null;
  return (data as OrderStatus) ?? null;
}

export type Review = { id: string; rating: number; comment: string | null; table_no: string | null; created_at: string };

/** Customer (anon): leave a star rating + optional comment (null when blank). */
export async function addReview(restaurantId: string, rating: number, comment: string | null, table: string): Promise<void> {
  const { error } = await supabase.rpc("add_review", { p_restaurant: restaurantId, p_rating: rating, p_comment: comment, p_table: table });
  if (error) throw error;
}

export type PublicReview = { rating: number; comment: string | null; created_at: string };

/** Customer (anon): read a shop's recent reviews via the public RPC (the table itself is owner/staff-only). */
export async function fetchPublicReviews(restaurantId: string): Promise<PublicReview[]> {
  const { data, error } = await supabase.rpc("get_reviews", { p_restaurant: restaurantId });
  if (error) throw error;
  return (data ?? []) as PublicReview[];
}

/** Customer (anon): re-read just the shop's public profile (for live open/closed + info updates). */
export async function fetchPublicProfile(slug: string): Promise<Store | null> {
  const { data } = await supabase.from("restaurants").select(PUBLIC_SHOP_COLS).eq("slug", slug).maybeSingle();
  return data ? mapStore(data as Row) : null;
}

/** Owner/admin: read the shop's reviews (newest first). */
export async function fetchReviews(restaurantId: string): Promise<Review[]> {
  const { data } = await supabase
    .from("reviews")
    .select("id, rating, comment, table_no, created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Review[];
}

export type CallReason = "service" | "bill";
export type PayMethod = "promptpay" | "bank" | "copay" | "cash";
export type ServiceCall = { id: string; table_no: string; reason: CallReason; pay_method: PayMethod | null; created_at: string };

// how a "call for the bill" payment method reads in each language (for the admin views)
export const payMethodTH: Record<PayMethod, string> = { promptpay: "พร้อมเพย์", bank: "โอน/สแกน QR", copay: "คนละครึ่ง", cash: "เงินสด" };
export const payMethodEN: Record<PayMethod, string> = { promptpay: "PromptPay", bank: "Bank / QR", copay: "Co-pay", cash: "Cash" };

/** Customer (anon): raise a "call staff" (service) or "call for the bill" (bill, w/ intended pay method). */
export async function callStaff(restaurantId: string, table: string, reason: CallReason = "service", payMethod?: PayMethod | null): Promise<void> {
  const { error } = await supabase.rpc("call_staff", { p_restaurant: restaurantId, p_table: table, p_reason: reason, p_pay_method: payMethod ?? null });
  if (error) throw error;
}

/** Owner/admin: open (unresolved) service calls for the shop. */
export async function fetchServiceCalls(restaurantId: string): Promise<ServiceCall[]> {
  const { data, error } = await supabase
    .from("service_calls")
    .select("id, table_no, reason, pay_method, created_at")
    .eq("restaurant_id", restaurantId)
    .eq("resolved", false)
    .order("created_at");
  if (error) throw error; // surface failures so callers can tell "no calls" from "fetch failed" (no phantom chime)
  return (data ?? []) as ServiceCall[];
}

/** Owner/admin: clear a table's open service calls. */
export async function resolveTableCalls(restaurantId: string, table: string): Promise<void> {
  await supabase.from("service_calls").update({ resolved: true }).eq("restaurant_id", restaurantId).eq("table_no", table).eq("resolved", false);
}

export type BillItem = { name_th: string; name_en: string; qty: number; unit_price: number; emoji: string; tone: string; addon_label_th?: string | null; addon_label_en?: string | null; spice?: string | null; note?: string | null };
export type BillOrder = { order_no: string; status: OrderStatus; total: number; placed_at: string; items: BillItem[] };
export type TableBill = { total: number; count: number; orders: BillOrder[] };

/** Customer-side: the whole table's OPEN bill (all unpaid orders + items + live statuses). Anon-safe. */
export async function fetchTableBill(restaurantId: string, table: string): Promise<TableBill> {
  const { data, error } = await supabase.rpc("table_bill", { p_restaurant: restaurantId, p_table: table });
  if (error || !data) return { total: 0, count: 0, orders: [] };
  return data as TableBill;
}

/** Owner/admin: close a table's open bill (mark paid). */
export async function payTable(restaurantId: string, table: string): Promise<void> {
  const { error } = await supabase.rpc("pay_table", { p_restaurant: restaurantId, p_table: table });
  if (error) throw error;
}

/** Owner/admin: undo the most recent payment on a table (mis-tap recovery). */
export async function unpayTable(restaurantId: string, table: string): Promise<void> {
  const { error } = await supabase.rpc("unpay_table", { p_restaurant: restaurantId, p_table: table });
  if (error) throw error;
}

export type NewOrderItem = {
  item_id: string | null;
  name_th: string;
  name_en: string;
  emoji: string;
  tone: string;
  qty: number;
  unit_price: number;
  addon_option_ids: string[]; // selected add-on option ids — server recomputes the authoritative price from these
  addon_label_th: string;
  addon_label_en: string;
  spice: string | null;
  note: string | null;
};

/**
 * Create an order via the secure `place_order` RPC: the server recomputes the
 * total (and clamps unit prices to the menu), generates a unique order_no, and
 * inserts atomically. Returns the server-generated order number.
 */
export async function dbCreateOrder(
  restaurantId: string,
  order: { table_no: string; payment_method: string | null; items: NewOrderItem[] }
): Promise<string> {
  const { data, error } = await supabase.rpc("place_order", {
    p_restaurant: restaurantId,
    p_table: order.table_no,
    p_payment: order.payment_method,
    p_items: order.items,
  });
  if (error) throw error;
  return data as string;
}

// ---- platform admin (super-admin oversight) ----
export type PlatformRestaurant = {
  id: string;
  slug: string;
  name_th: string;
  name_en: string;
  status: string;
  owner_email: string | null;
  owner_name: string | null;
  owner_phone: string | null;
  created_at: string;
  items: number;
  orders: number;
  plan: string;
  trial_ends_at: string | null;
  paid_until: string | null;
  revenue: number;
  unread: number;
};

export type Message = {
  id: string;
  restaurant_id: string;
  sender: "owner" | "admin";
  body: string;
  created_at: string;
};

/** Fetch the message thread for a restaurant (owner sees own; admin sees any). */
export async function fetchMessages(restaurantId: string): Promise<Message[]> {
  const { data } = await supabase
    .from("messages")
    .select("id, restaurant_id, sender, body, created_at")
    .eq("restaurant_id", restaurantId)
    .order("created_at");
  return (data ?? []) as Message[];
}

/** Send a message (sender role is decided server-side). */
export async function sendMessage(restaurantId: string, body: string): Promise<void> {
  const { error } = await supabase.rpc("send_message", { p_restaurant: restaurantId, p_body: body });
  if (error) throw error;
}

/** Mark the thread read for the caller's role. */
export async function markMessagesRead(restaurantId: string): Promise<void> {
  await supabase.rpc("mark_messages_read", { p_restaurant: restaurantId });
}

/** Owner's unread count (messages from admin not yet read). */
export async function fetchOwnerUnread(restaurantId: string): Promise<number> {
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurantId)
    .eq("sender", "admin")
    .eq("read_by_owner", false);
  return count ?? 0;
}

/** Platform admin's total unread (messages from shop owners across all shops). */
export async function fetchAdminUnread(): Promise<number> {
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("sender", "owner")
    .eq("read_by_admin", false);
  return count ?? 0;
}

export type PlatformStats = {
  shops_total: number;
  shops_pending: number;
  shops_approved: number;
  shops_suspended: number;
  new_shops_month: number;
  orders_total: number;
  orders_month: number;
  gmv_total: number;
  gmv_month: number;
};

export type PlatformSettings = {
  promptpay_id: string;
  promptpay_name: string;
  price_starter: number;
  price_pro: number;
  price_business: number;
};

/** True if the signed-in user is a platform (super) admin. */
export async function fetchIsPlatformAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_platform_admin");
  if (error) return false;
  return Boolean(data);
}

/** List every restaurant on the platform (admin only). */
export async function adminListRestaurants(): Promise<PlatformRestaurant[]> {
  const { data, error } = await supabase.rpc("admin_list_restaurants");
  if (error) throw error;
  return (data ?? []) as PlatformRestaurant[];
}

export type Plan = "starter" | "pro" | "business";
export type RestaurantStatus = "pending" | "approved" | "rejected" | "suspended";

/** Approve / reject / suspend a restaurant (admin only). */
export async function adminSetRestaurantStatus(id: string, status: RestaurantStatus): Promise<void> {
  const { error } = await supabase.rpc("admin_set_restaurant_status", { p_id: id, p_status: status });
  if (error) throw error;
}

/** Change a restaurant's public URL slug (admin only). */
export async function adminSetRestaurantSlug(id: string, slug: string): Promise<void> {
  const { error } = await supabase.rpc("admin_set_restaurant_slug", { p_id: id, p_slug: slug });
  if (error) throw error;
}

/** Count restaurants awaiting approval (admin only; 0 for non-admins). */
export async function fetchPendingCount(): Promise<number> {
  const { count } = await supabase
    .from("restaurants")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

/** Mark a restaurant as paid for N more months (admin only). */
export async function adminMarkPaid(id: string, months = 1): Promise<void> {
  const { error } = await supabase.rpc("admin_mark_paid", { p_id: id, p_months: months });
  if (error) throw error;
}

/** Change a restaurant's plan (admin only). */
export async function adminSetPlan(id: string, plan: Plan): Promise<void> {
  const { error } = await supabase.rpc("admin_set_plan", { p_id: id, p_plan: plan });
  if (error) throw error;
}

/** Permanently delete a restaurant + all its data (admin only). */
export async function adminDeleteRestaurant(id: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_restaurant", { p_id: id });
  if (error) throw error;
}

/** Platform-wide stats across all shops (admin only). */
export async function fetchPlatformStats(): Promise<PlatformStats | null> {
  const { data, error } = await supabase.rpc("admin_platform_stats");
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);
  return {
    shops_total: num(row.shops_total),
    shops_pending: num(row.shops_pending),
    shops_approved: num(row.shops_approved),
    shops_suspended: num(row.shops_suspended),
    new_shops_month: num(row.new_shops_month),
    orders_total: num(row.orders_total),
    orders_month: num(row.orders_month),
    gmv_total: num(row.gmv_total),
    gmv_month: num(row.gmv_month),
  };
}

/** Read platform billing settings (public). */
export async function fetchPlatformSettings(): Promise<PlatformSettings> {
  const { data } = await supabase
    .from("platform_settings")
    .select("promptpay_id, promptpay_name, price_starter, price_pro, price_business")
    .eq("id", true)
    .maybeSingle();
  return (
    (data as PlatformSettings) ?? {
      promptpay_id: "",
      promptpay_name: "",
      price_starter: 299,
      price_pro: 599,
      price_business: 1290,
    }
  );
}

/** Update platform billing settings (admin only). */
export async function adminUpdateSettings(s: PlatformSettings): Promise<void> {
  const { error } = await supabase.rpc("admin_update_settings", {
    p_promptpay_id: s.promptpay_id,
    p_promptpay_name: s.promptpay_name,
    p_starter: s.price_starter,
    p_pro: s.price_pro,
    p_business: s.price_business,
  });
  if (error) throw error;
}

/** Plan price helper. */
export function planPrice(plan: string, s: PlatformSettings): number {
  return plan === "starter" ? s.price_starter : plan === "business" ? s.price_business : s.price_pro;
}

/** Derive billing state from trial/paid dates. */
export function billingState(trialEndsAt: string | null, paidUntil: string | null): {
  state: "active" | "trialing" | "past_due";
  until: string | null;
} {
  const now = Date.now();
  if (paidUntil && new Date(paidUntil).getTime() > now) return { state: "active", until: paidUntil };
  if (trialEndsAt && new Date(trialEndsAt).getTime() > now) return { state: "trialing", until: trialEndsAt };
  return { state: "past_due", until: paidUntil ?? trialEndsAt };
}

const ALLOWED_IMAGE = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]); // incl. iPhone HEIC; no svg/gif
const MAX_INPUT_BYTES = 30 * 1024 * 1024; // accept big phone photos — we downscale below
const MAX_OUTPUT_BYTES = 1.6 * 1024 * 1024; // safety cap on the stored image

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(blob);
  });
}

/**
 * Downscale + re-encode an image on the client. The OUTPUT FORMAT matters for cross-browser support:
 * iOS Safari's canvas.toBlob does NOT encode WebP — it silently falls back to PNG, and a large photo
 * as lossless PNG blows past our size cap (this is exactly why cover uploads failed on iPhone). So we
 * encode PHOTOS as JPEG (compact + universally supported, incl. iOS) and keep LOGOS as PNG (preserves
 * transparency; tiny at 512px). JPEG has no alpha channel, so transparent areas are flattened onto white.
 */
async function downscaleToBlob(file: File, maxDim: number, outType: "image/jpeg" | "image/png"): Promise<Blob> {
  if (typeof document === "undefined") return file;
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const big = Math.max(img.naturalWidth, img.naturalHeight);
    if (big <= maxDim && file.size < 280 * 1024 && file.type === outType) return file; // already small & right type
    const scale = Math.min(1, maxDim / big);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    if (outType === "image/jpeg") {
      ctx.fillStyle = "#ffffff"; // JPEG can't store transparency — flatten onto white so it isn't black
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = await new Promise<Blob | null>((res) => canvas.toBlob((b) => res(b), outType, 0.85));
    return out && out.size > 0 ? out : file;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * "Upload" a shop image. The image is downscaled client-side and returned as a data URL,
 * which is saved directly on the row (restaurants.cover_url/logo_url, menu_items.img_url) via
 * the normal DB write — those work reliably from the browser. (We avoid the Storage bucket:
 * this project's storage endpoint mis-handles the browser auth token and rejects uploads.)
 */
export async function uploadImage(file: File, folder: string): Promise<string> {
  if (!ALLOWED_IMAGE.has(file.type)) throw new Error("ไฟล์ต้องเป็นรูป JPG, PNG, WEBP หรือ HEIC เท่านั้น");
  if (file.size > MAX_INPUT_BYTES) throw new Error("ไฟล์ใหญ่เกินไป (สูงสุด 30MB)");
  const isLogo = folder.startsWith("logo");
  const maxDim = isLogo ? 512 : folder.startsWith("cover") ? 1600 : 1100;
  // logos → PNG (keep transparency); photos (cover/menu) → JPEG (compact + works on iOS Safari)
  const blob = await downscaleToBlob(file, maxDim, isLogo ? "image/png" : "image/jpeg");
  if (blob.size > MAX_OUTPUT_BYTES) throw new Error("รูปยังใหญ่เกินไปหลังย่อแล้ว — ลองรูปอื่น");
  return blobToDataUrl(blob);
}
