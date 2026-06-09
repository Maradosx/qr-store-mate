"use client";

import { useEffect, useState } from "react";
import { useShop } from "./shop";
import { subscribeShop } from "./realtime";
import type { Store } from "./mock";

export type OpenReason = "open" | "paused" | "after_hours";
export type OpenState = { open: boolean; reason: OpenReason };

// current wall-clock "HH:MM" in Asia/Bangkok regardless of the device's timezone —
// so a customer's phone set to another tz still sees the shop's real local hours,
// and it matches the server's shop_accepting() check exactly.
export function bangkokHHMM(d: Date = new Date()): string {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
  } catch {
    // fallback stays tz-correct: Asia/Bangkok is a fixed UTC+7 (no DST), so shift then read UTC parts
    const b = new Date(d.getTime() + 7 * 3600 * 1000);
    const p = (n: number) => String(n).padStart(2, "0");
    return `${p(b.getUTCHours())}:${p(b.getUTCMinutes())}`;
  }
}

// pure: is the shop accepting orders right now? mirrors the DB shop_accepting() logic.
export function isShopOpen(
  p: Pick<Store, "acceptingOrders" | "openTime" | "closeTime">,
  now: Date = new Date(),
): OpenState {
  if (p.acceptingOrders === false) return { open: false, reason: "paused" };
  const o = (p.openTime ?? "").trim();
  const c = (p.closeTime ?? "").trim();
  if (!o || !c || o === c) return { open: true, reason: "open" }; // no time gate / 24h
  const cur = bangkokHHMM(now);
  const within = o < c ? cur >= o && cur < c : cur >= o || cur < c; // overnight when close < open
  return within ? { open: true, reason: "open" } : { open: false, reason: "after_hours" };
}

// React hook: live open-state for the customer screens.
// Re-evaluates every 30s (so it flips at the open/close boundary) and refreshes the
// shop profile on the realtime shop channel (so an owner's pause/hours change shows live).
export function useOpenState(slug: string): OpenState {
  const profile = useShop((s) => s.profile);
  const restaurantId = useShop((s) => s.restaurantId);
  const refreshProfile = useShop((s) => s.refreshProfile);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    void refreshProfile(slug); // catch up on the authoritative state at (re)subscribe — not just at hydrate
    const unsub = subscribeShop(restaurantId, () => void refreshProfile(slug)); // instant push on owner change
    const id = setInterval(() => void refreshProfile(slug), 60000); // safety-net self-heal for a missed broadcast
    return () => {
      unsub();
      clearInterval(id);
    };
  }, [restaurantId, slug, refreshProfile]);

  return isShopOpen(profile);
}
