"use client";

import { useState } from "react";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { baht } from "@/lib/format";
import type { AddonGroup } from "@/lib/mock";
import { Trash } from "@/components/icons";

const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `tmp_${Math.random().toString(36).slice(2)}`;

const cloneGroups = (gs: AddonGroup[]): AddonGroup[] =>
  gs.map((g) => ({
    ...g,
    name: { ...g.name },
    options: g.options.map((o) => ({ ...o, name: { ...o.name } })),
  }));

// trim names, drop nameless options, drop groups with no name or no usable options —
// keeps what's saved (and shown after save) in sync with what the customer will actually see.
const cleanGroups = (gs: AddonGroup[]): AddonGroup[] =>
  gs
    .map((g) => ({
      ...g,
      name: { th: g.name.th.trim(), en: g.name.en.trim() },
      options: g.options
        .filter((o) => o.name.th.trim() || o.name.en.trim())
        .map((o) => ({ ...o, name: { th: o.name.th.trim(), en: o.name.en.trim() }, price: Math.max(0, Math.round(o.price) || 0) })),
    }))
    .filter((g) => (g.name.th || g.name.en) && g.options.length > 0);

/**
 * Per-item add-on editor. Lets the shop owner build option groups
 * (e.g. "พิเศษ / Size", "เพิ่มข้าว / Add-ons") with a price per option.
 * The customer then sees these on the dish sheet and the price updates after picking.
 * Mobile-first: everything stacks full-width with finger-sized controls on a phone.
 */
export function AddonEditor({ itemId, initial }: { itemId: string; initial: AddonGroup[] }) {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const save = useShop((s) => s.setItemAddons);

  const [open, setOpen] = useState(false);
  const [groups, setGroups] = useState<AddonGroup[]>(() => cloneGroups(initial));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<"ok" | "err" | null>(null);
  const [note, setNote] = useState<string | null>(null); // validation message (incomplete group/option)

  const mutate = (fn: (gs: AddonGroup[]) => AddonGroup[]) => {
    setGroups((gs) => fn(cloneGroups(gs)));
    setDirty(true);
    setResult(null);
    setNote(null);
  };

  const addGroup = () =>
    mutate((gs) => [...gs, { id: uid(), name: { th: "", en: "" }, type: "multi", required: false, options: [{ id: uid(), name: { th: "", en: "" }, price: 0 }] }]);
  const removeGroup = (gi: number) => mutate((gs) => gs.filter((_, i) => i !== gi));
  const patchGroup = (gi: number, patch: Partial<AddonGroup>) => mutate((gs) => gs.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const addOption = (gi: number) =>
    mutate((gs) => gs.map((g, i) => (i === gi ? { ...g, options: [...g.options, { id: uid(), name: { th: "", en: "" }, price: 0 }] } : g)));
  const removeOption = (gi: number, oi: number) =>
    mutate((gs) => gs.map((g, i) => (i === gi ? { ...g, options: g.options.filter((_, j) => j !== oi) } : g)));
  const patchOption = (gi: number, oi: number, patch: Partial<AddonGroup["options"][number]>) =>
    mutate((gs) => gs.map((g, i) => (i === gi ? { ...g, options: g.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)) } : g)));

  const onSave = async () => {
    // block on incomplete groups (has a name but no named option, or named options but no group name)
    // so the owner gets a clear message instead of cleanGroups silently dropping their work
    for (const g of groups) {
      const gName = g.name.th.trim() || g.name.en.trim();
      const named = g.options.filter((o) => o.name.th.trim() || o.name.en.trim());
      if (gName && named.length === 0) {
        setNote(L(`กลุ่ม “${gName}” ต้องมีตัวเลือกอย่างน้อย 1 รายการ`, `Group “${gName}” needs at least one option`));
        return;
      }
      if (!gName && named.length > 0) {
        setNote(L("มีกลุ่มที่ยังไม่ได้ตั้งชื่อ", "An option group still needs a name"));
        return;
      }
    }
    setNote(null);
    const cleaned = cleanGroups(groups);
    setSaving(true);
    setResult(null);
    const ok = await save(itemId, cleaned);
    setSaving(false);
    if (ok) {
      // reflect exactly what was persisted (empty/nameless rows were dropped)
      setGroups(cloneGroups(cleaned));
      setDirty(false);
      setResult("ok");
    } else {
      // save() already rolled the store back — resync the editor to it so the UI never lies
      const current = useShop.getState().menu.find((m) => m.id === itemId)?.addonGroups ?? [];
      setGroups(cloneGroups(current));
      setDirty(false);
      setResult("err");
    }
  };

  const groupCount = groups.length;

  return (
    <div className="mt-2 rounded-2xl border border-dashed border-line bg-bg/60">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left active:scale-[.99]"
      >
        <span className="text-sm font-bold text-teal-deep">
          ⚙️ {L("ตัวเลือกเสริม", "Add-ons & options")}
          {groupCount > 0 && <span className="ml-1 text-muted">• {groupCount} {L("กลุ่ม", "groups")}</span>}
        </span>
        <span className="text-sm text-muted">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-3 px-3 pb-3">
          <p className="text-[11px] leading-relaxed text-muted">
            {L(
              "สร้างตัวเลือกให้ลูกค้ากดเพิ่มได้ เช่น “พิเศษ”, “เพิ่มข้าว”, “เพิ่มไข่ดาว” พร้อมตั้งราคาต่อรายการ • ราคาจะบวกเพิ่มให้อัตโนมัติตอนลูกค้าเลือก",
              "Build options customers can add — e.g. “Extra”, “Add rice”, “Fried egg” — each with its own price. The price is added automatically when picked.",
            )}
          </p>

          {groups.map((g, gi) => (
            <div key={g.id} className="rounded-2xl border border-line bg-surface p-3">
              {/* group header */}
              <div className="flex items-center gap-2">
                <input
                  value={g.name.th}
                  onChange={(e) => patchGroup(gi, { name: { ...g.name, th: e.target.value } })}
                  placeholder={L("ชื่อกลุ่ม เช่น พิเศษ", "Group name e.g. Extras")}
                  className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2.5 text-sm font-bold outline-none focus:border-teal"
                />
                <button
                  onClick={() => removeGroup(gi)}
                  aria-label="delete group"
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-muted hover:bg-danger/10 hover:text-[#b23a1e] active:scale-90"
                >
                  <Trash size={18} />
                </button>
              </div>
              <input
                value={g.name.en}
                onChange={(e) => patchGroup(gi, { name: { ...g.name, en: e.target.value } })}
                placeholder={L("ชื่อกลุ่ม (อังกฤษ — ไม่บังคับ)", "Group name (English — optional)")}
                className="mt-2 w-full rounded-xl border border-line bg-bg px-3 py-2 text-xs text-muted outline-none focus:border-teal"
              />

              {/* group settings */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <select
                  value={g.type}
                  onChange={(e) => patchGroup(gi, { type: e.target.value as AddonGroup["type"] })}
                  className="rounded-xl border border-line bg-bg px-2.5 py-2.5 text-xs font-semibold outline-none focus:border-teal"
                >
                  <option value="multi">{L("เลือกได้หลายอย่าง", "Pick many")}</option>
                  <option value="single">{L("เลือกได้ 1 อย่าง", "Pick one")}</option>
                </select>
                <button
                  onClick={() => patchGroup(gi, { required: !g.required })}
                  className={`rounded-xl px-3 py-2.5 text-xs font-bold ring-1 transition active:scale-95 ${
                    g.required ? "bg-coral/15 text-[#b23a1e] ring-coral/30" : "bg-bg text-muted ring-line"
                  }`}
                >
                  {g.required ? L("✓ ต้องเลือก", "✓ Required") : L("ไม่บังคับ", "Optional")}
                </button>
              </div>

              {/* options */}
              <div className="mt-3 space-y-2">
                {g.options.map((o, oi) => (
                  <div key={`${g.id}|${o.id}`} className="rounded-xl bg-bg p-2 ring-1 ring-line">
                    <div className="flex items-center gap-2">
                      <input
                        value={o.name.th}
                        onChange={(e) => patchOption(gi, oi, { name: { ...o.name, th: e.target.value } })}
                        placeholder={L("ชื่อ เช่น เพิ่มไข่ดาว", "Name e.g. Fried egg")}
                        className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 py-2 text-sm outline-none focus:border-teal"
                      />
                      <label className="flex shrink-0 items-center rounded-lg border border-line bg-surface pl-2" title={L("ราคาเพิ่ม", "Add-on price")}>
                        <span className="text-xs font-bold text-teal-deep">+฿</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={o.price}
                          onChange={(e) => patchOption(gi, oi, { price: Math.max(0, Number(e.target.value) || 0) })}
                          className="w-16 bg-transparent px-1.5 py-2 text-sm font-bold outline-none"
                        />
                      </label>
                      <button
                        onClick={() => removeOption(gi, oi)}
                        aria-label="delete option"
                        className="grid h-10 w-9 shrink-0 place-items-center rounded-lg text-base text-muted hover:bg-danger/10 hover:text-[#b23a1e] active:scale-90"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      value={o.name.en}
                      onChange={(e) => patchOption(gi, oi, { name: { ...o.name, en: e.target.value } })}
                      placeholder={L("ชื่อ (อังกฤษ — ไม่บังคับ)", "Name (English — optional)")}
                      className="mt-1.5 w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs text-muted outline-none focus:border-teal"
                    />
                  </div>
                ))}
                <button
                  onClick={() => addOption(gi)}
                  className="w-full rounded-xl bg-teal/10 py-2.5 text-xs font-bold text-teal-deep ring-1 ring-teal/30 active:scale-[.99]"
                >
                  + {L("เพิ่มตัวเลือก", "Add option")}
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addGroup}
            className="w-full rounded-2xl border border-dashed border-teal/40 bg-teal/5 py-3 text-sm font-bold text-teal-deep active:scale-[.99]"
          >
            + {L("เพิ่มกลุ่มตัวเลือก", "Add a group")}
          </button>

          {/* save bar */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <span className="text-xs font-semibold">
              {note ? (
                <span className="text-[#b23a1e]">⚠ {note}</span>
              ) : (
                <>
                  {result === "ok" && <span className="text-success">{L("บันทึกแล้ว ✓", "Saved ✓")}</span>}
                  {result === "err" && <span className="text-[#b23a1e]">{L("บันทึกไม่สำเร็จ ลองใหม่", "Save failed, try again")}</span>}
                  {result === null && dirty && <span className="text-muted">{L("มีการแก้ไขที่ยังไม่บันทึก", "Unsaved changes")}</span>}
                </>
              )}
            </span>
            <button
              onClick={onSave}
              disabled={saving || !dirty}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-teal px-5 py-2.5 text-sm font-bold text-white shadow-card active:scale-95 disabled:opacity-50"
            >
              {saving && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {saving ? L("กำลังบันทึก", "Saving") : L("บันทึกตัวเลือก", "Save options")}
            </button>
          </div>

          {/* tiny preview of the customer-facing prices */}
          {groups.some((g) => g.options.some((o) => o.price > 0)) && (
            <p className="text-[11px] text-muted">
              {L("ลูกค้าจะเห็น:", "Customers will see:")}{" "}
              {groups
                .flatMap((g) => g.options.filter((o) => o.price > 0).map((o) => `${o.name.th || o.name.en} +${baht(o.price)}`))
                .slice(0, 4)
                .join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
