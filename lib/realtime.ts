"use client";

import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Realtime helpers.
 * - ADMIN (authenticated owner/staff) gets DB-driven postgres_changes via Providers.tsx (RLS-authorized,
 *   reliable, auto-reconnect). subscribeCalls below adds the same for service_calls on the Floor.
 * - CUSTOMERS are anonymous and cannot SELECT orders via RLS, so we use a lightweight broadcast channel
 *   "shop:<id>" that any client pings on a relevant change; subscribers re-fetch via anon-safe RPCs.
 * Every screen also keeps a slow fallback poll so a missed event self-heals.
 */

// ---- ADMIN service-call (call-staff) subscription: ONE channel per shop topic, ref-counted ----
// Multiple consumers now subscribe (the Floor page AND the app-wide ServiceCallAlerter in the admin
// layout). Sharing one channel per `calls-rt:<rid>` topic avoids the supabase-js topic-dedup footgun
// where two channels on the same topic collide and one removeChannel tears down the other's subscription.
type CallEntry = { ch: RealtimeChannel; subs: Set<() => void> };
const callEntries = new Map<string, CallEntry>();

/** ADMIN: live service-call (call-staff) changes for this shop. Returns an unsubscribe fn. */
export function subscribeCalls(restaurantId: string, onChange: () => void): () => void {
  if (!restaurantId) return () => {};
  let e = callEntries.get(restaurantId);
  if (!e) {
    const ch = supabase
      .channel(`calls-rt:${restaurantId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_calls", filter: `restaurant_id=eq.${restaurantId}` },
        () => callEntries.get(restaurantId)?.subs.forEach((fn) => fn()),
      )
      .subscribe();
    e = { ch, subs: new Set() };
    callEntries.set(restaurantId, e);
  }
  e.subs.add(onChange);
  return () => {
    const cur = callEntries.get(restaurantId);
    if (!cur) return;
    cur.subs.delete(onChange);
    if (cur.subs.size === 0) {
      callEntries.delete(restaurantId);
      void supabase.removeChannel(cur.ch);
    }
  };
}

// ---- customer broadcast: ONE channel per shop topic per tab, ref-counted, shared by sub + ping ----
// Sharing a single instance avoids the supabase-js topic-dedup footgun where a transient ping channel
// and a subscriber channel collide on the same topic and removeChannel tears down the live subscription.
type Entry = { ch: RealtimeChannel; subs: Set<() => void>; ready: boolean; pending: boolean; sweep?: ReturnType<typeof setTimeout>; fire?: ReturnType<typeof setTimeout> };
const entries = new Map<string, Entry>();

function ensure(restaurantId: string): Entry {
  let e = entries.get(restaurantId);
  if (e) return e;
  const ch = supabase
    .channel(`shop:${restaurantId}`, { config: { broadcast: { self: false } } })
    // debounce: coalesce a burst of pings into one re-fetch (limits any broadcast-flood amplification)
    .on("broadcast", { event: "sync" }, () => {
      const cur = entries.get(restaurantId);
      if (!cur || cur.fire) return;
      cur.fire = setTimeout(() => {
        cur.fire = undefined;
        cur.subs.forEach((fn) => fn());
      }, 500);
    });
  e = { ch, subs: new Set(), ready: false, pending: false };
  entries.set(restaurantId, e);
  ch.subscribe((status) => {
    const cur = entries.get(restaurantId);
    if (!cur || cur.ch !== ch) return;
    if (status === "SUBSCRIBED") {
      cur.ready = true;
      if (cur.pending) {
        cur.pending = false;
        void cur.ch.send({ type: "broadcast", event: "sync", payload: {} });
      }
    } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
      // tear down a dead channel so it can be recreated cleanly (no leak, no stuck "not ready")
      if (cur.subs.size === 0) drop(restaurantId);
    }
  });
  return e;
}

function drop(restaurantId: string) {
  const e = entries.get(restaurantId);
  if (!e) return;
  if (e.sweep) clearTimeout(e.sweep);
  if (e.fire) clearTimeout(e.fire);
  entries.delete(restaurantId);
  void supabase.removeChannel(e.ch);
}

/** CUSTOMER (anon-safe): re-run `onSync` whenever someone pings this shop. Returns an unsubscribe fn. */
export function subscribeShop(restaurantId: string, onSync: () => void): () => void {
  if (!restaurantId) return () => {};
  const e = ensure(restaurantId);
  if (e.sweep) {
    clearTimeout(e.sweep);
    e.sweep = undefined;
  }
  e.subs.add(onSync);
  return () => {
    const cur = entries.get(restaurantId);
    if (!cur) return;
    cur.subs.delete(onSync);
    if (cur.subs.size === 0) drop(restaurantId); // no listeners left → free the channel
  };
}

/** Fire-and-forget "something changed at this shop" ping — wakes every subscriber (incl. anon customers). */
export function pingShop(restaurantId: string): void {
  if (!restaurantId) return;
  const e = ensure(restaurantId);
  if (e.ready) {
    void e.ch.send({ type: "broadcast", event: "sync", payload: {} });
  } else {
    e.pending = true; // queued; sent on SUBSCRIBED
  }
  // a pure-sender tab (no subscribers) shouldn't keep the channel forever
  if (e.subs.size === 0) {
    if (e.sweep) clearTimeout(e.sweep);
    e.sweep = setTimeout(() => {
      const cur = entries.get(restaurantId);
      if (cur && cur.subs.size === 0) drop(restaurantId);
    }, 4000);
  }
}
