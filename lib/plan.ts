"use client";

import { useShop } from "./shop";

export type PlanId = "starter" | "pro" | "business";

/** What each plan can actually do — enforced across the app so plans really differ. */
export type PlanCaps = {
  id: PlanId;
  label: string;
  maxTables: number; // hard limit on tables
  kitchen: boolean; // Kitchen Display screen
  promotions: boolean; // per-item discount (old price)
  analytics: boolean; // full revenue charts (hour/week/month) + best-sellers
  dataExport: boolean; // export sales/orders to CSV
  staffAccounts: boolean; // invite staff members with their own logins + roles
};

export function planCaps(plan: string | undefined): PlanCaps {
  if (plan === "business") return { id: "business", label: "Business", maxTables: Infinity, kitchen: true, promotions: true, analytics: true, dataExport: true, staffAccounts: true };
  if (plan === "pro") return { id: "pro", label: "Pro", maxTables: 25, kitchen: true, promotions: true, analytics: true, dataExport: false, staffAccounts: false };
  return { id: "starter", label: "Starter", maxTables: 8, kitchen: false, promotions: false, analytics: false, dataExport: false, staffAccounts: false };
}

/** Capabilities for the shop currently loaded. A super-admin (own platform / managing a shop) gets everything. */
export function useCaps(): PlanCaps {
  const plan = useShop((s) => s.billing.plan);
  const god = useShop((s) => s.viewingAsAdmin || s.isPlatformAdmin);
  return god ? planCaps("business") : planCaps(plan);
}
