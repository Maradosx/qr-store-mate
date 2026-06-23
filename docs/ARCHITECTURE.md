# Architecture — QR Store Mate

A deeper technical companion to the [README](../README.md). This documents the
decisions, data model, security boundaries, and realtime design behind the
product.

---

## 1. Design principles

1. **The database is the security boundary.** Authorization is expressed as
   Postgres Row-Level Security (RLS) and `SECURITY DEFINER` functions, not as
   app-layer `if` checks. A bug in the frontend cannot leak another tenant's
   data or change a price.
2. **The server owns money and state transitions.** The client proposes
   (cart contents, a status change); the server disposes (recomputes totals,
   validates the transition, enforces rate limits).
3. **No hardware, no app, no middleman.** Diners use a browser; payments go
   straight to the shop's PromptPay/bank — the platform never touches funds.
4. **Fail loud, then recover.** Silent failure on a money path is worse than a
   visible error. Every live screen also self-heals from dropped realtime
   events with a slow poll.

---

## 2. Tenancy & roles

```
platform_admins ──(is_platform_admin)── super-admin: every shop, view-as, moderation
restaurants ──owner_id──────────────── owner: full shop (menu, billing, staff, ops)
restaurant_staff ──(business plan)───── staff: operational pages only (orders/kitchen/floor/reviews)
(anonymous) ─────────────────────────── customer: scan → order → pay, via RPC only
```

Authorization helpers (all `SECURITY DEFINER`, `search_path` pinned):

| Predicate | True when |
|---|---|
| `is_platform_admin()` | caller's `auth.uid()` is in `platform_admins` |
| `owns_restaurant(rid)` | platform admin **or** `restaurants.owner_id = auth.uid()` (approved/pending) |
| `is_member_of(rid)` | owner **or** an active `restaurant_staff` row on a Business-plan shop |

Folding `is_platform_admin()` into the ownership predicates is what lets the
super-admin "view as" any shop with the exact same code paths an owner uses —
no separate admin data layer.

---

## 3. The RPC API surface (34 functions)

The app talks to Postgres through functions, not raw table writes. Grouped:

**Customer (anon-callable, `SECURITY DEFINER`)**
- `place_order(restaurant, table, payment, items)` — validate + recompute + insert
- `table_bill(restaurant, table)` — the whole table's open bill (anon-safe)
- `order_status(restaurant, order_no)` — single order's live status
- `call_staff(restaurant, table, reason, pay_method)` — service / bill call
- `add_review(restaurant, rating, comment, table)` — rate-limited
- `get_reviews(restaurant)` — public reviews of an approved shop

**Owner / staff (RLS-gated identity, definer for writes)**
- `create_my_restaurant(...)`, `get_my_billing()`, `my_shop_plan()`, `my_member_role()`
- `pay_table` / `unpay_table` (also resolves the table's open calls)
- `save_addon_groups` (atomic replace), `shop_accepting`, `recompute_rating`
- `send_message`, `mark_messages_read`

**Platform admin (`is_platform_admin()` re-checked inside)**
- `admin_list_restaurants`, `admin_platform_stats`, `admin_set_plan`,
  `admin_set_restaurant_status`, `admin_set_restaurant_slug`, `admin_mark_paid`,
  `admin_delete_restaurant`, `admin_delete_review`, `admin_update_settings`

**Caps & triggers** — `enforce_table_cap`, `enforce_promo_cap` (plan limits in
triggers, not the UI), `notify_new_restaurant`, `auto_confirm_user`.

Edge functions: **`staff-invite`** (ownership-verified staff onboarding,
`verify_jwt`) and **`notify-signup`**.

---

## 4. `place_order` — the critical path

Pseudocode of the server-authoritative order pipeline:

```sql
1.  restaurant exists AND status = 'approved'        -- else: restaurant not available
2.  shop_accepting(restaurant)                        -- else: shop closed   (hours/manual)
3.  table_no exists in tables                         -- else: table not found
4.  items non-empty, ≤ 100
5.  every item_id belongs to this restaurant          -- else: invalid item
6.  no item is sold-out or hidden                     -- else: item not available
7.  every addon_option_id still belongs to its item   -- else: item changed
8.  < 20 non-cancelled orders for this table in 10 min -- else: rate limited
9.  unit_price := menu_items.price + Σ addon_options.price   -- RECOMPUTED, client ignored
10. insert order + order_items; total := Σ + (VAT 7% if enabled)
```

Steps 3, 5, 6, 7 each map to a typed error string the checkout UI translates
into a clear, actionable message (e.g. *"this item's add-ons changed — remove
it and add it again"*).

---

## 5. Realtime

| Audience | Transport | Why |
|---|---|---|
| Operators (authed) | Supabase `postgres_changes` on `orders`, `service_calls`, filtered by `restaurant_id` | RLS-authorized, reliable, auto-reconnect |
| Customers (anon) | Broadcast channel `shop:{id}` (ref-counted, debounced) | Anon can't read tables; clients ping + re-fetch via RPC |

Implementation details (`lib/realtime.ts`):
- **One channel per topic**, shared via a ref-count map — avoids the supabase-js
  topic-dedup footgun where two channels on one topic tear each other down.
- **Debounce** coalesces a burst of pings into a single re-fetch.
- **Self-heal poll** (15–60 s depending on screen) guarantees eventual
  consistency even if a websocket event is missed.

---

## 6. Open / closed logic

A single source of truth, expressed twice and kept identical:

- **Server:** `shop_accepting(restaurant)` — `accepting_orders` master switch
  AND (no hours set ⇒ open) OR (now within `[open_time, close_time)` in
  `Asia/Bangkok`, overnight-aware when `close < open`).
- **Client:** `lib/hours.ts → isShopOpen()` mirrors it exactly for instant UI,
  re-evaluated on a 30 s tick and on realtime profile pings.

The server is authoritative (it rejects orders when closed); the client is
purely UX so the menu can grey out before the customer even taps.

---

## 7. State management

Two Zustand stores, deliberately separate concerns:

- **`lib/shop.ts`** — shop/admin state: profile, menu, tables, orders, billing,
  role, realtime-fed order board. Optimistic updates with rollback on error.
- **`lib/cart.ts`** — the diner's cart + last order, **persisted** to
  `localStorage` (hydration-guarded — see the README's "cart that wiped itself"
  highlight).

`lib/db.ts` is the single data-access layer: it wraps every Supabase call,
maps snake_case rows to typed domain objects, and (post-audit) propagates
errors so the optimistic-rollback paths actually run.

---

## 8. Frontend

- **App Router**, mobile-first. Customer routes are dynamic
  (`/r/[slug]/t/[table]/...`); admin routes are a single authenticated layout
  with a sidebar, app-wide alerters (chime + Thai voice), and role-based nav.
- **i18n** — a small typed dictionary (`lib/i18n.tsx`), ~190 TH/EN strings, with
  per-component inline `L(th, en)` for one-off copy.
- **Design system** — hand-built Tailwind v4 teal theme, custom SVG brand mark,
  no third-party UI kit.

---

## 9. Deployment

- **Frontend:** Vercel — production at `qrstoremate.com` (apex), `www` 301→apex,
  the legacy `*.vercel.app` kept live so previously printed QR codes don't break.
- **Backend:** Supabase managed Postgres — 52 migrations, Auth, Realtime, two
  edge functions.
- **Gate before every deploy:** `tsc --noEmit` → `eslint .` → `next build`.

---

## 10. Known trade-offs / backlog

- **Images are base64 in Postgres** (cover/logo). Fine at current scale; the
  refresh path was made image-free to protect egress, but the next structural
  step is object storage / CDN — which also unblocks per-item menu photos.
- **History/analytics windowed to 30 days** on the live board to bound egress;
  full history needs server-side pagination.
- **No automated test suite yet** — verification is currently type/lint/build +
  adversarial review + production smoke tests. Playwright E2E for the
  order → kitchen → bill flow is the highest-value next addition.
- **One shared store** for customer + admin contexts; recovery guards exist, but
  splitting them would be cleaner long-term.
