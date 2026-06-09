"use client";

import { create } from "zustand";
import { store as seedStore, DEFAULT_CATEGORIES, type Store, type MenuItem, type ShopOrder, type OrderStatus, type Category } from "./mock";
import * as db from "./db";
import { supabase } from "./supabase";
import { pingShop } from "./realtime";

export type Table = { id: string; no: string };

type Billing = { plan: string; trialEndsAt: string | null; paidUntil: string | null };

type ShopState = {
  restaurantId: string;
  slug: string;
  status: string; // approval status of the loaded restaurant
  billing: Billing;
  categories: Category[];
  profile: Store;
  menu: MenuItem[];
  tables: Table[];
  orders: ShopOrder[];
  authed: boolean;
  myRole: "owner" | "manager" | "staff"; // signed-in member's role for the loaded shop
  myName: string | null; // a staff sub-account's display name (for the greeting); null for owners
  soundOn: boolean; // admin alert sounds (new-order beep + call chime + Thai voice) on/off
  isPlatformAdmin: boolean;
  viewingAsAdmin: boolean; // super-admin is managing another shop
  pendingCount: number; // shops awaiting approval (platform admin only)
  chatUnread: number; // unread messages for me (owner: from admin / admin: from owners)
  loaded: boolean;
  loadError: string | null;
  loadedKey: string | null;
  toast: { n: number; msg: string } | null; // transient error/notice shown to the owner

  notify: (msg: string) => void;
  clearToast: () => void;
  hydrateBySlug: (slug: string) => Promise<void>;
  hydrateForOwner: () => Promise<void>;
  hydrateForViewing: (id: string) => Promise<void>;
  exitViewing: () => Promise<void>;
  refreshOrders: () => Promise<void>;
  refreshProfile: (slug: string) => Promise<void>; // customer side: re-read public profile (live open/closed)
  refreshPendingCount: () => Promise<void>;
  refreshChatUnread: () => Promise<void>;

  updateProfile: (patch: Partial<Store>) => void;
  updateItem: (id: string, patch: Partial<MenuItem>) => void;
  setItemAddons: (id: string, groups: MenuItem["addonGroups"]) => Promise<boolean>;
  addItem: (cat: string) => Promise<void>;
  setCategories: (cats: Category[]) => Promise<void>;
  removeItem: (id: string) => void;
  addTable: () => Promise<void>;
  removeTable: (id: string) => void;
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  payTableBill: (table: string) => Promise<boolean>;
  unpayTableBill: (table: string) => Promise<boolean>;

  setSoundOn: (v: boolean) => void;
  setAuthed: (v: boolean) => void;
  signup: (name: string, email: string, password: string, ownerName?: string, phone?: string, plan?: string) => Promise<string | null>;
  login: (email: string, password: string) => Promise<string | null>;
  resetPassword: (email: string) => Promise<string | null>;
  logout: () => Promise<void>;
};

// previous values of only the keys present in `patch` — for precise optimistic rollback
// (so a failed write reverts just those fields onto the *current* state, not a stale snapshot)
function prevOf<T>(src: T, patch: Partial<T>): Partial<T> {
  const out: Partial<T> = {};
  (Object.keys(patch) as (keyof T)[]).forEach((k) => {
    out[k] = src[k];
  });
  return out;
}

export const useShop = create<ShopState>((set, get) => ({
  restaurantId: "",
  slug: "",
  status: "approved",
  billing: { plan: "pro", trialEndsAt: null, paidUntil: null },
  categories: DEFAULT_CATEGORIES,
  profile: seedStore,
  menu: [],
  tables: [],
  orders: [],
  authed: false,
  myRole: "owner",
  myName: null,
  soundOn: typeof window !== "undefined" ? localStorage.getItem("qsm-sound") !== "off" : true,
  isPlatformAdmin: false,
  viewingAsAdmin: false,
  pendingCount: 0,
  chatUnread: 0,
  loaded: false,
  loadError: null,
  loadedKey: null,
  toast: null,

  notify: (msg) => set((s) => ({ toast: { n: (s.toast?.n ?? 0) + 1, msg } })),
  clearToast: () => set({ toast: null }),

  hydrateBySlug: async (slug) => {
    if (get().loadedKey === "slug:" + slug) return;
    try {
      const d = await db.fetchShopBySlug(slug);
      set({
        restaurantId: d.restaurantId, slug: d.slug, status: d.status, billing: d.billing, categories: d.categories, profile: d.profile, menu: d.menu,
        tables: d.tables, orders: d.orders, loaded: true, loadError: null,
        loadedKey: "slug:" + slug,
      });
    } catch (e) {
      set({ loaded: true, loadError: e instanceof Error ? e.message : String(e) });
    }
  },

  hydrateForOwner: async () => {
    try {
      const [d, isAdmin] = await Promise.all([db.fetchShopForOwner(), db.fetchIsPlatformAdmin()]);
      const pendingCount = isAdmin ? await db.fetchPendingCount() : 0;
      if (!d) {
        // no own restaurant (e.g. the super-admin) — don't leave stale seed/demo data showing
        const chatUnread = isAdmin ? await db.fetchAdminUnread() : 0;
        set({
          loaded: true, myRole: "owner", myName: null, isPlatformAdmin: isAdmin, viewingAsAdmin: false, pendingCount, chatUnread, loadedKey: "owner:none",
          restaurantId: "", slug: "", status: "approved", categories: DEFAULT_CATEGORIES,
          profile: { ...seedStore, name: { th: "", en: "" }, tagline: { th: "", en: "" }, cover: undefined, logo: undefined },
          menu: [], tables: [], orders: [],
        });
        return;
      }
      const chatUnread = isAdmin ? await db.fetchAdminUnread() : await db.fetchOwnerUnread(d.restaurantId);
      set({
        restaurantId: d.restaurantId, slug: d.slug, status: d.status, billing: d.billing, categories: d.categories, profile: d.profile, menu: d.menu,
        tables: d.tables, orders: d.orders, myRole: d.role, myName: d.memberName ?? null, isPlatformAdmin: isAdmin, viewingAsAdmin: false, pendingCount, chatUnread, loaded: true, loadError: null,
        loadedKey: "owner:" + d.restaurantId,
      });
    } catch (e) {
      set({ loaded: true, loadError: e instanceof Error ? e.message : String(e) });
    }
  },

  refreshPendingCount: async () => {
    if (!get().isPlatformAdmin) return;
    try {
      set({ pendingCount: await db.fetchPendingCount() });
    } catch {
      /* keep current count */
    }
  },

  refreshChatUnread: async () => {
    try {
      const { isPlatformAdmin, restaurantId } = get();
      if (isPlatformAdmin) set({ chatUnread: await db.fetchAdminUnread() });
      else if (restaurantId) set({ chatUnread: await db.fetchOwnerUnread(restaurantId) });
    } catch {
      /* keep current count */
    }
  },

  // super-admin loads any restaurant into the store to view its dashboard (read-only)
  hydrateForViewing: async (id) => {
    if (!get().isPlatformAdmin) return;
    try {
      const d = await db.fetchShopById(id);
      set({
        restaurantId: d.restaurantId, slug: d.slug, status: d.status, billing: d.billing, categories: d.categories,
        profile: d.profile, menu: d.menu, tables: d.tables, orders: d.orders,
        myRole: "owner", viewingAsAdmin: true, loaded: true, loadError: null, loadedKey: "view:" + id,
      });
    } catch (e) {
      set({ loadError: e instanceof Error ? e.message : String(e) });
    }
  },

  exitViewing: async () => {
    // clear the viewed shop's data first so a slow/failed re-hydrate can't leave it on screen
    set({
      viewingAsAdmin: false, loadedKey: null, restaurantId: "", slug: "", status: "approved",
      menu: [], tables: [], orders: [], categories: DEFAULT_CATEGORIES,
      profile: { ...seedStore, name: { th: "", en: "" }, tagline: { th: "", en: "" }, cover: undefined, logo: undefined },
    });
    await get().hydrateForOwner();
  },

  refreshOrders: async () => {
    const id = get().restaurantId;
    if (!id) return;
    try {
      const orders = await db.fetchOrders(id);
      set({ orders });
    } catch {
      /* keep existing orders on a failed refresh */
    }
  },

  // customer side: re-pull the public profile (open/closed switch, hours, name/cover) when the
  // shop channel pings — keeps the menu's open state in sync with what the owner just changed.
  refreshProfile: async (slug) => {
    try {
      const p = await db.fetchPublicProfile(slug);
      if (p) set({ profile: p });
    } catch {
      /* keep current profile on a failed refresh */
    }
  },

  updateProfile: (patch) => {
    const revert = prevOf(get().profile, patch);
    set((s) => ({ profile: { ...s.profile, ...patch } }));
    const id = get().restaurantId;
    if (id) void db.dbUpdateRestaurant(id, patch).then(() => {
      // push open/closed + hours changes to customers' menus in realtime
      if ("acceptingOrders" in patch || "openTime" in patch || "closeTime" in patch) pingShop(id);
    }).catch(() => {
      set((s) => ({ profile: { ...s.profile, ...revert } }));
      get().notify("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง");
    });
  },

  updateItem: (id, patch) => {
    const prevItem = get().menu.find((m) => m.id === id);
    set((s) => ({ menu: s.menu.map((m) => (m.id === id ? { ...m, ...patch } : m)) }));
    void db.dbUpdateMenuItem(id, patch).catch(() => {
      if (prevItem) {
        const revert = prevOf(prevItem, patch);
        set((s) => ({ menu: s.menu.map((m) => (m.id === id ? { ...m, ...revert } : m)) }));
      }
      get().notify("บันทึกเมนูไม่สำเร็จ ลองใหม่อีกครั้ง");
    });
  },

  setItemAddons: async (id, groups) => {
    const next = groups ?? [];
    const prev = get().menu.find((m) => m.id === id)?.addonGroups;
    set((s) => ({ menu: s.menu.map((m) => (m.id === id ? { ...m, addonGroups: next } : m)) }));
    try {
      await db.saveAddonGroups(id, next);
      return true;
    } catch {
      set((s) => ({ menu: s.menu.map((m) => (m.id === id ? { ...m, addonGroups: prev } : m)) }));
      return false;
    }
  },

  addItem: async (cat) => {
    const id = get().restaurantId;
    if (!id) return;
    try {
      const item = await db.dbAddMenuItem(id, cat);
      set((s) => ({ menu: [item, ...s.menu] }));
    } catch {
      get().notify("เพิ่มเมนูไม่สำเร็จ ลองใหม่อีกครั้ง");
    }
  },

  setCategories: async (cats) => {
    const id = get().restaurantId;
    if (!id) return;
    const prev = get().categories;
    set({ categories: cats });
    try {
      await db.dbSetCategories(id, cats);
    } catch {
      set({ categories: prev });
      get().notify("บันทึกประเภทอาหารไม่สำเร็จ");
    }
  },

  removeItem: (id) => {
    const removed = get().menu.find((m) => m.id === id);
    set((s) => ({ menu: s.menu.filter((m) => m.id !== id) }));
    void db.dbRemoveMenuItem(id).catch(() => {
      if (removed) set((s) => (s.menu.some((m) => m.id === id) ? s : { menu: [removed, ...s.menu] }));
      get().notify("ลบเมนูไม่สำเร็จ ลองใหม่อีกครั้ง");
    });
  },

  addTable: async () => {
    const id = get().restaurantId;
    if (!id) return;
    const nums = get().tables.map((t) => parseInt(t.no, 10) || 0);
    const no = String((nums.length ? Math.max(...nums) : 0) + 1);
    try {
      const t = await db.dbAddTable(id, no);
      set((s) => ({ tables: [...s.tables, t] }));
    } catch {
      get().notify("เพิ่มโต๊ะไม่สำเร็จ — อาจถึงขีดจำกัดแพ็กเกจ หรือลองใหม่");
    }
  },

  removeTable: (id) => {
    const removed = get().tables.find((t) => t.id === id);
    set((s) => ({ tables: s.tables.filter((t) => t.id !== id) }));
    void db.dbRemoveTable(id).catch(() => {
      if (removed) set((s) => (s.tables.some((t) => t.id === id) ? s : { tables: [...s.tables, removed] }));
      get().notify("ลบโต๊ะไม่สำเร็จ ลองใหม่อีกครั้ง");
    });
  },

  setOrderStatus: (orderId, status) => {
    // match by id, falling back to order_no (callers pass `o.id ?? o.no`)
    const rid = get().restaurantId;
    const match = (o: ShopOrder) => (o.id ?? o.no) === orderId;
    const prevOrder = get().orders.find(match);
    set((s) => ({ orders: s.orders.map((o) => (match(o) ? { ...o, status } : o)) }));
    void db.dbSetOrderStatus(rid ?? "", orderId, status)
      .then(() => { if (rid) pingShop(rid); }) // push the new status to the customer's order/bill view
      .catch(() => {
        // revert only the status field on the still-present order (don't clobber concurrent updates)
        if (prevOrder) set((s) => ({ orders: s.orders.map((o) => (match(o) ? { ...o, status: prevOrder.status } : o)) }));
        get().notify("อัปเดตสถานะไม่สำเร็จ ลองใหม่อีกครั้ง");
      });
  },

  payTableBill: async (table) => {
    const id = get().restaurantId;
    if (!id) return false;
    try {
      await db.payTable(id, table);
      await get().refreshOrders();
      pingShop(id); // push the closed-bill update to the table's customers
      return true;
    } catch {
      return false;
    }
  },

  unpayTableBill: async (table) => {
    const id = get().restaurantId;
    if (!id) return false;
    try {
      await db.unpayTable(id, table);
      await get().refreshOrders();
      pingShop(id);
      return true;
    } catch {
      return false;
    }
  },

  setSoundOn: (v) => {
    set({ soundOn: v });
    try { localStorage.setItem("qsm-sound", v ? "on" : "off"); } catch { /* ignore */ }
  },
  setAuthed: (v) => set({ authed: v }),
  signup: async (name, email, password, ownerName = "", phone = "", plan = "pro") => {
    try {
      await db.signUpOwner(name, email, password, ownerName, phone, plan);
      set({ authed: true });
      await get().hydrateForOwner();
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  },
  login: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    set({ authed: true });
    await get().hydrateForOwner();
    return null;
  },
  resetPassword: async (email) => {
    const redirectTo = typeof window !== "undefined" ? window.location.origin + "/reset" : undefined;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    return error ? error.message : null;
  },
  logout: async () => {
    await supabase.auth.signOut();
    set({
      authed: false,
      myRole: "owner",
      myName: null,
      isPlatformAdmin: false,
      viewingAsAdmin: false,
      pendingCount: 0,
      chatUnread: 0,
      loaded: false,
      loadedKey: null,
      restaurantId: "",
      slug: "",
      status: "approved",
      billing: { plan: "pro", trialEndsAt: null, paidUntil: null },
      categories: DEFAULT_CATEGORIES,
      profile: seedStore,
      menu: [],
      tables: [],
      orders: [],
      loadError: null,
    });
  },
}));
