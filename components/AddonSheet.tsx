"use client";

import { useMemo, useState } from "react";
import type { MenuItem } from "@/lib/mock";
import { useI18n } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { baht } from "@/lib/format";
import { DishImage } from "./DishImage";
import { QtyStepper } from "./QtyStepper";
import { Check } from "./icons";

const SPICE = [
  { key: "spice.mild", id: "mild" },
  { key: "spice.medium", id: "medium" },
  { key: "spice.hot", id: "hot" },
] as const;

/** When editing an existing cart line, prefill the sheet with its picks and replace it on save. */
export type AddonEdit = {
  key: string;
  qty: number;
  sel?: { multi: Record<string, string[]>; single: Record<string, string> };
  spice?: string;
  note?: string;
};

export function AddonSheet({
  item,
  onClose,
  edit,
}: {
  item: MenuItem | null;
  onClose: () => void;
  edit?: AddonEdit;
}) {
  if (!item) return null;
  return <Sheet item={item} onClose={onClose} edit={edit} />;
}

function Sheet({ item, onClose, edit }: { item: MenuItem; onClose: () => void; edit?: AddonEdit }) {
  const { t, tr } = useI18n();
  const add = useCart((s) => s.add);
  const replace = useCart((s) => s.replace);

  const groups = useMemo(() => item.addonGroups ?? [], [item]);
  const [multi, setMulti] = useState<Record<string, Set<string>>>(() => {
    const init: Record<string, Set<string>> = {};
    for (const [gid, ids] of Object.entries(edit?.sel?.multi ?? {})) init[gid] = new Set(ids);
    return init;
  });
  const [single, setSingle] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    // only a REQUIRED single-choice group gets a default pick. An optional one starts with NOTHING
    // selected so the customer can leave it blank (and can un-tick whatever they tapped).
    for (const g of groups) if (g.type === "single" && g.required && g.options.length) init[g.id] = g.options[0].id;
    return { ...init, ...(edit?.sel?.single ?? {}) }; // overlay saved picks when editing
  });
  const [spice, setSpice] = useState<string>(edit?.spice ?? "spice.medium");
  const [note, setNote] = useState(edit?.note ?? "");
  const [qty, setQty] = useState(edit?.qty ?? 1);

  const chosen = useMemo(() => {
    const list: { id: string; price: number; name: { th: string; en: string } }[] = [];
    for (const g of groups) {
      if (g.type === "multi") {
        const set = multi[g.id];
        if (set) for (const o of g.options) if (set.has(o.id)) list.push(o);
      } else {
        const id = single[g.id];
        const o = g.options.find((x) => x.id === id);
        if (o) list.push(o);
      }
    }
    return list;
  }, [groups, multi, single]);

  // required groups must have a selection before adding to cart
  const missingRequired = useMemo(
    () =>
      groups.some((g) =>
        g.required && g.options.length > 0 ? (g.type === "multi" ? !(multi[g.id]?.size) : !single[g.id]) : false
      ),
    [groups, multi, single]
  );

  const addonTotal = chosen.reduce((s, o) => s + o.price, 0);
  const unitNow = item.price + addonTotal;
  // include every chosen option (free ones too — e.g. size/sweetness) so the
  // kitchen and the customer's bill see exactly what was selected.
  const addonLabel = {
    th: chosen.map((o) => o.name.th).join(", "),
    en: chosen.map((o) => o.name.en).join(", "),
  };

  const toggleMulti = (gid: string, oid: string) =>
    setMulti((m) => {
      const set = new Set(m[gid] ?? []);
      if (set.has(oid)) set.delete(oid);
      else set.add(oid);
      return { ...m, [gid]: set };
    });

  const addToCart = () => {
    if (missingRequired) return;
    const spiceKey = item.spicy ? spice : undefined;
    const optIds = chosen.map((o) => o.id).sort().join("+"); // stable, unique per option (labels can collide)
    const key = `${item.id}|${optIds}|${spiceKey ?? ""}|${note.trim()}`;
    const sel = {
      multi: Object.fromEntries(
        Object.entries(multi)
          .filter(([, set]) => set.size > 0)
          .map(([k, set]) => [k, Array.from(set)]),
      ) as Record<string, string[]>,
      single: { ...single },
    };
    const line = {
      key,
      itemId: item.id,
      name: item.name,
      emoji: item.emoji,
      tone: item.tone,
      unitBase: item.price,
      unitOld: item.oldPrice ?? item.price,
      addonTotal,
      addonLabel,
      spiceKey,
      note: note.trim() || undefined,
      sel,
    };
    if (edit) replace(edit.key, line, qty);
    else add(line, qty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-ink/45 fade-in" onClick={onClose} />
      <div className="sheet-up relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-surface shadow-pop">
        {/* hero */}
        <div className="relative">
          <DishImage tone={item.tone} emoji={item.emoji} img={item.img} emojiSize={88} className="h-44 w-full" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-ink shadow-sm active:scale-90"
            aria-label="close"
          >
            ✕
          </button>
          <span className="absolute left-3 top-3 h-1.5 w-12 -translate-x-0 rounded-full bg-white/70 sm:hidden" />
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-extrabold leading-tight">{tr(item.name)}</h2>
              <p className="mt-1 text-sm text-muted">{tr(item.desc)}</p>
            </div>
            <div className="text-right shrink-0">
              {item.oldPrice && (
                <div className="text-xs text-muted line-through">{baht(item.oldPrice)}</div>
              )}
              <div className="font-display text-xl font-extrabold text-teal-deep">{baht(item.price)}</div>
            </div>
          </div>

          {/* add-on groups (skip any group that has no options) */}
          {groups.filter((g) => g.options.length > 0).map((g) => (
            <div key={g.id} className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-sm font-bold">{tr(g.name)}</h3>
                <span className="text-[11px] font-semibold text-muted">
                  {g.required ? t("common.required") : t("common.optional")}
                </span>
              </div>
              <div className="space-y-2">
                {g.options.map((o) => {
                  const active =
                    g.type === "multi"
                      ? (multi[g.id]?.has(o.id) ?? false)
                      : single[g.id] === o.id;
                  return (
                    <button
                      key={`${g.id}|${o.id}`}
                      onClick={() =>
                        g.type === "multi"
                          ? toggleMulti(g.id, o.id)
                          : setSingle((s) => {
                              // optional single-choice: tapping the already-selected option un-picks it
                              if (s[g.id] === o.id && !g.required) {
                                const next = { ...s };
                                delete next[g.id];
                                return next;
                              }
                              return { ...s, [g.id]: o.id };
                            })
                      }
                      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                        active ? "border-teal bg-teal/5" : "border-line bg-surface"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={`grid h-5 w-5 place-items-center border-2 ${
                            g.type === "multi" ? "rounded-md" : "rounded-full"
                          } ${
                            active ? "border-teal bg-teal text-white" : "border-line text-transparent"
                          }`}
                        >
                          <Check size={13} />
                        </span>
                        <span className="line-clamp-1 text-sm font-medium">{tr(o.name)}</span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-muted">
                        {o.price > 0 ? `+${baht(o.price)}` : t("common.free")}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* spice */}
          {item.spicy && (
            <div className="mt-5">
              <h3 className="mb-2 font-display text-sm font-bold">{t("spice.title")}</h3>
              <div className="grid grid-cols-3 gap-2">
                {SPICE.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSpice(s.key)}
                    className={`rounded-2xl border py-2.5 text-sm font-semibold transition ${
                      spice === s.key
                        ? "border-coral bg-coral text-white"
                        : "border-line text-ink"
                    }`}
                  >
                    {t(s.key)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* note */}
          <div className="mt-5">
            <h3 className="mb-2 font-display text-sm font-bold">{t("common.note")}</h3>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("common.notePh")}
              rows={2}
              className="w-full resize-none rounded-2xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-teal"
            />
          </div>

          {/* qty + add */}
          <div className="mt-5 flex items-center justify-between">
            <span className="font-display text-sm font-bold">{t("qty.title")}</span>
            <QtyStepper value={qty} onDec={() => setQty((q) => Math.max(1, q - 1))} onInc={() => setQty((q) => q + 1)} />
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-line bg-surface/95 p-4 backdrop-blur">
          <button
            onClick={addToCart}
            disabled={missingRequired}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-teal py-3.5 font-display text-base font-bold text-white shadow-card transition active:scale-[.99] disabled:opacity-50 disabled:active:scale-100"
          >
            {missingRequired ? t("common.required") : `${edit ? t("common.saveChanges") : t("common.addToCart")} • ${baht(unitNow * qty)}`}
          </button>
        </div>
      </div>
    </div>
  );
}
