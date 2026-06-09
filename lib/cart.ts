"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TL } from "./mock";
import { useShop } from "./shop";
import { dbCreateOrder, type NewOrderItem } from "./db";
import { pingShop } from "./realtime";

const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

export type CartLine = {
  key: string; // unique per item + addons + spice
  itemId: string;
  name: TL;
  emoji: string;
  tone: string;
  unitBase: number; // discounted base price (per unit)
  unitOld: number; // original price (>= unitBase) for promo display
  addonTotal: number; // sum of selected add-on prices (per unit)
  addonLabel: TL; // e.g. "ไข่ดาว, ข้าวพิเศษ"
  spiceKey?: string; // 'spice.mild' | 'spice.medium' | 'spice.hot'
  note?: string;
  sel?: { multi: Record<string, string[]>; single: Record<string, string> }; // raw picks, for re-editing
  qty: number;
};

export type CartOrder = { no: string; lines: CartLine[]; total: number; ctx: string };

type CartState = {
  lines: CartLine[];
  lastOrder: CartOrder | null;
  ctx: string | null; // "slug/table" the current cart belongs to
  ensureCtx: (key: string) => void;
  add: (line: Omit<CartLine, "qty">, qty: number) => void;
  replace: (oldKey: string, line: Omit<CartLine, "qty">, qty: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  placeOrder: (tableNo: string, payment: string) => Promise<string | null>;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
  lines: [],
  lastOrder: null,
  ctx: null,
  // reset the cart (and any previous success order) when it now belongs to a different restaurant/table
  ensureCtx: (key) => {
    if (get().ctx !== key) set({ lines: [], lastOrder: null, ctx: key });
  },
  add: (line, qty) =>
    set((s) => {
      const existing = s.lines.find((l) => l.key === line.key);
      if (existing) {
        return {
          lines: s.lines.map((l) =>
            l.key === line.key ? { ...l, qty: l.qty + qty } : l
          ),
        };
      }
      return { lines: [...s.lines, { ...line, qty }] };
    }),
  // re-editing a line: drop the old entry, then add the edited one (merging if it now matches another)
  replace: (oldKey, line, qty) =>
    set((s) => {
      const without = s.lines.filter((l) => l.key !== oldKey);
      const existing = without.find((l) => l.key === line.key);
      if (existing) {
        return { lines: without.map((l) => (l.key === line.key ? { ...l, qty: l.qty + qty } : l)) };
      }
      return { lines: [...without, { ...line, qty }] };
    }),
  setQty: (key, qty) =>
    set((s) => ({
      lines:
        qty <= 0
          ? s.lines.filter((l) => l.key !== key)
          : s.lines.map((l) => (l.key === key ? { ...l, qty } : l)),
    })),
  remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
  clear: () => set({ lines: [] }),
  placeOrder: async (tableNo, payment) => {
    const lines = get().lines;
    if (!lines.length) return null;
    const restaurantId = useShop.getState().restaurantId;
    if (!restaurantId) return null;
    const ctx = useShop.getState().slug + "/" + tableNo; // bind the success order to this shop/table
    const now = cartNow(lines);
    // server adds 7% only when the shop enabled it — mirror that here so the
    // success screen total matches the stored order
    const svc = useShop.getState().profile.serviceCharge ? Math.round(now * 0.07) : 0;
    const total = Math.round(now) + svc; // integer baht

    const items: NewOrderItem[] = lines.map((l) => ({
      item_id: l.itemId,
      name_th: l.name.th,
      name_en: l.name.en,
      emoji: l.emoji,
      tone: l.tone,
      qty: l.qty,
      unit_price: l.unitBase + l.addonTotal, // advisory only — server recomputes from the menu + addon ids
      addon_option_ids: l.sel
        ? [...Object.values(l.sel.multi).flat(), ...Object.values(l.sel.single)].filter(Boolean)
        : [],
      addon_label_th: l.addonLabel.th,
      addon_label_en: l.addonLabel.en,
      spice: l.spiceKey ?? null,
      note: l.note ?? null,
    }));

    let no: string;
    try {
      // server recomputes total, generates a unique order_no, inserts atomically
      no = await dbCreateOrder(restaurantId, { table_no: tableNo, payment_method: payment, items });
    } catch {
      return null; // keep the cart; caller shows an error and does NOT navigate to success
    }
    set({ lastOrder: { no, lines: [...lines], total, ctx }, lines: [] });
    pingShop(restaurantId); // wake the table's other diners' bill view (admin gets it via DB realtime)
    return no;
  },
    }),
    {
      name: "qsm-cart",
      // rehydrate manually after mount (Providers) to avoid SSR hydration mismatch
      skipHydration: true,
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? window.localStorage : noopStorage
      ),
    }
  )
);

// ---- selectors (pure helpers) ----
export const lineNow = (l: CartLine) => (l.unitBase + l.addonTotal) * l.qty;
export const lineWas = (l: CartLine) => (l.unitOld + l.addonTotal) * l.qty;

export const cartCount = (lines: CartLine[]) =>
  lines.reduce((s, l) => s + l.qty, 0);
export const cartNow = (lines: CartLine[]) =>
  lines.reduce((s, l) => s + lineNow(l), 0);
export const cartWas = (lines: CartLine[]) =>
  lines.reduce((s, l) => s + lineWas(l), 0);
export const cartDiscount = (lines: CartLine[]) =>
  cartWas(lines) - cartNow(lines);
