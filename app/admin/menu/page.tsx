"use client";

import { useMemo, useState } from "react";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { useCaps } from "@/lib/plan";
import type { MenuItem, Category } from "@/lib/mock";
import { DishImage } from "@/components/DishImage";
import { Card, PageTitle, Toggle, UploadButton } from "@/components/admin/ui";
import { AddonEditor } from "@/components/admin/AddonEditor";
import { Trash } from "@/components/icons";

export default function MenuAdminPage() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const menu = useShop((s) => s.menu);
  const cats = useShop((s) => s.categories);
  const addItem = useShop((s) => s.addItem);
  const setCategories = useShop((s) => s.setCategories);

  // search / filter / sort — managing a long menu (60+ items) is painful without these
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sort, setSort] = useState<"default" | "name" | "price-asc" | "price-desc" | "cat">("default");

  const catName = (id: string) => {
    const c = cats.find((x) => x.id === id);
    return c ? (lang === "th" ? c.th : c.en) : id;
  };
  const view = useMemo(() => {
    const qq = q.trim().toLowerCase();
    let list = menu.filter(
      (m) =>
        (catFilter === "all" || m.cat === catFilter) &&
        (!qq || m.name.th.toLowerCase().includes(qq) || m.name.en.toLowerCase().includes(qq)),
    );
    const name = (m: MenuItem) => (lang === "th" ? m.name.th : m.name.en) || m.name.th || m.name.en;
    if (sort === "name") list = list.slice().sort((a, b) => name(a).localeCompare(name(b), "th"));
    else if (sort === "price-asc") list = list.slice().sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") list = list.slice().sort((a, b) => b.price - a.price);
    else if (sort === "cat") list = list.slice().sort((a, b) => catName(a.cat).localeCompare(catName(b.cat), "th") || name(a).localeCompare(name(b), "th"));
    return list;
    // catName depends on cats+lang; both are in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menu, q, catFilter, sort, cats, lang]);

  const addCategory = () => {
    const name = window.prompt(L("ชื่อประเภทอาหารใหม่ (เช่น ก๋วยเตี๋ยว, สลัด)", "New category name (e.g. Noodles, Salads)"));
    const n = name?.trim();
    if (!n) return;
    const id = "c" + Math.random().toString(36).slice(2, 8);
    void setCategories([...cats, { id, th: n, en: n }]);
  };

  const renameCategory = (c: Category) => {
    const name = window.prompt(L("เปลี่ยนชื่อประเภท", "Rename category"), lang === "th" ? c.th : c.en);
    const n = name?.trim();
    if (!n) return;
    void setCategories(cats.map((x) => (x.id === c.id ? { ...x, th: n, en: n } : x)));
  };

  const removeCategory = (id: string) => {
    if (cats.length <= 1) {
      window.alert(L("ต้องมีอย่างน้อย 1 ประเภท", "Keep at least one category"));
      return;
    }
    if (menu.some((m) => m.cat === id)) {
      window.alert(L("มีเมนูใช้ประเภทนี้อยู่ — ย้ายเมนูไปประเภทอื่นก่อนลบ", "Some items use this category — move them first"));
      return;
    }
    if (window.confirm(L("ลบประเภทนี้?", "Delete this category?"))) void setCategories(cats.filter((c) => c.id !== id));
  };

  return (
    <div>
      <PageTitle
        title={L("จัดการเมนู", "Menu")}
        subtitle={L(`${menu.length} รายการ`, `${menu.length} items`)}
        action={
          <button
            onClick={() => addItem(cats[0]?.id ?? "main")}
            className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-white shadow-card active:scale-95"
          >
            + {L("เพิ่มเมนู", "Add item")}
          </button>
        }
      />

      {/* category manager */}
      <Card className="mb-4 !p-4">
        <p className="mb-2 text-sm font-bold">🍱 {L("ประเภทอาหาร", "Food categories")}</p>
        <div className="flex flex-wrap items-center gap-2">
          {cats.map((c) => (
            <span key={c.id} className="inline-flex items-center gap-1.5 rounded-full bg-bg px-3 py-1.5 text-sm font-semibold ring-1 ring-line">
              <button onClick={() => renameCategory(c)} title={L("แตะเพื่อเปลี่ยนชื่อ", "Tap to rename")} className="hover:text-teal-deep">
                {L(c.th, c.en)}
              </button>
              <button onClick={() => removeCategory(c.id)} aria-label="delete category" className="text-muted hover:text-[#b23a1e] active:scale-90">
                ✕
              </button>
            </span>
          ))}
          <button onClick={addCategory} className="rounded-full bg-teal/10 px-3 py-1.5 text-sm font-bold text-teal-deep ring-1 ring-teal/30 active:scale-95">
            + {L("เพิ่มประเภท", "Add category")}
          </button>
        </div>
        <p className="mt-2 text-xs text-muted">{L("เพิ่มประเภทแล้วเลือกให้เมนูแต่ละจานด้านล่าง • ลูกค้าจะเห็นเป็นแท็บในเมนู", "Add categories then assign them to dishes below • customers see them as menu tabs")}</p>
      </Card>

      {/* search / filter / sort toolbar */}
      <Card className="mb-4 !p-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`🔍 ${L("ค้นหาชื่อเมนู", "Search dishes")}`}
            className="min-w-[160px] flex-1 rounded-xl border border-line bg-bg px-3.5 py-2 text-sm outline-none focus:border-teal"
          />
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="rounded-xl border border-line bg-bg px-2.5 py-2 text-sm font-semibold outline-none focus:border-teal"
          >
            <option value="all">{L("ทุกหมวด", "All categories")}</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{L(c.th, c.en)}</option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="rounded-xl border border-line bg-bg px-2.5 py-2 text-sm font-semibold outline-none focus:border-teal"
          >
            <option value="default">{L("เรียง: ตามลำดับ", "Sort: default")}</option>
            <option value="name">{L("เรียง: ชื่อ ก-ฮ", "Sort: name A–Z")}</option>
            <option value="price-asc">{L("เรียง: ราคาน้อย→มาก", "Sort: price low→high")}</option>
            <option value="price-desc">{L("เรียง: ราคามาก→น้อย", "Sort: price high→low")}</option>
            <option value="cat">{L("เรียง: หมวด", "Sort: category")}</option>
          </select>
          {(q || catFilter !== "all" || sort !== "default") && (
            <button
              onClick={() => { setQ(""); setCatFilter("all"); setSort("default"); }}
              className="rounded-xl bg-bg px-3 py-2 text-xs font-bold text-muted ring-1 ring-line active:scale-95"
            >
              {L("ล้าง", "Clear")}
            </button>
          )}
        </div>
        <p className="mt-2 text-xs text-muted">{L(`แสดง ${view.length} จาก ${menu.length} รายการ`, `Showing ${view.length} of ${menu.length}`)}</p>
      </Card>

      <div className="space-y-3">
        {view.map((m) => (
          <Row key={m.id} item={m} cats={cats} L={L} />
        ))}
        {view.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">{L("ไม่พบเมนูที่ค้นหา", "No matching items")}</p>
        )}
      </div>
    </div>
  );
}

function Row({ item, cats, L }: { item: MenuItem; cats: Category[]; L: (th: string, en: string) => string }) {
  const update = useShop((s) => s.updateItem);
  const remove = useShop((s) => s.removeItem);
  const caps = useCaps();

  return (
    <Card className={`!p-3 ${item.hidden ? "opacity-60" : ""}`}>
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* image + change */}
        <div className="shrink-0">
          <div className="relative h-28 w-28 overflow-hidden rounded-2xl ring-1 ring-line">
            <DishImage tone={item.tone} emoji={item.emoji} img={item.img} emojiSize={40} className="h-full w-full" />
          </div>
          <div className="mt-2 flex justify-center">
            <UploadButton label={L("เปลี่ยนรูป", "Change photo")} folder="menu" onPick={(d) => update(item.id, { img: d })} className="!px-3 !py-1.5 !text-xs" />
          </div>
        </div>

        {/* fields */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex items-center gap-2">
            <input
              value={item.name.th}
              onChange={(e) => update(item.id, { name: { ...item.name, th: e.target.value } })}
              className="min-w-0 flex-1 rounded-xl border border-line bg-bg px-3 py-2 font-display text-sm font-bold outline-none focus:border-teal"
            />
            <button
              onClick={() => {
                if (window.confirm(L(`ลบเมนู "${item.name.th}" ?`, `Delete "${item.name.en || item.name.th}"?`))) remove(item.id);
              }}
              className="shrink-0 text-muted hover:text-[#b23a1e] active:scale-90"
              aria-label="delete"
            >
              <Trash size={18} />
            </button>
          </div>

          <input
            value={item.name.en}
            onChange={(e) => update(item.id, { name: { ...item.name, en: e.target.value } })}
            placeholder="English name"
            className="rounded-xl border border-line bg-bg px-3 py-1.5 text-xs text-muted outline-none focus:border-teal"
          />

          {/* descriptions (shown to customers) */}
          <input
            value={item.desc.th}
            onChange={(e) => update(item.id, { desc: { ...item.desc, th: e.target.value } })}
            placeholder={L("คำอธิบาย (ไทย)", "Description (TH)")}
            className="rounded-xl border border-line bg-bg px-3 py-1.5 text-xs outline-none focus:border-teal"
          />
          <input
            value={item.desc.en}
            onChange={(e) => update(item.id, { desc: { ...item.desc, en: e.target.value } })}
            placeholder={L("คำอธิบาย (อังกฤษ)", "Description (EN)")}
            className="rounded-xl border border-line bg-bg px-3 py-1.5 text-xs text-muted outline-none focus:border-teal"
          />

          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center rounded-xl border border-line bg-bg pl-2.5 focus-within:border-teal">
              <span className="text-sm font-bold text-teal-deep">฿</span>
              <input
                type="number"
                value={item.price}
                onChange={(e) => update(item.id, { price: Number(e.target.value) || 0 })}
                className="w-20 bg-transparent px-2 py-2 text-sm font-bold outline-none"
              />
            </label>
            {caps.promotions && (
              <label className="flex items-center rounded-xl border border-dashed border-line bg-bg pl-2.5 focus-within:border-coral" title={L("ราคาก่อนลด (โปรโมชั่น)", "Original price (promo)")}>
                <span className="text-xs text-muted">{L("ก่อนลด", "was")} ฿</span>
                <input
                  type="number"
                  value={item.oldPrice ?? ""}
                  placeholder="-"
                  onChange={(e) => update(item.id, { oldPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-16 bg-transparent px-2 py-2 text-sm outline-none"
                />
              </label>
            )}
            {/* category dropdown */}
            <select
              value={item.cat}
              onChange={(e) => update(item.id, { cat: e.target.value })}
              className="rounded-xl border border-line bg-bg px-2.5 py-2 text-sm font-semibold outline-none focus:border-teal"
            >
              {cats.every((c) => c.id !== item.cat) && <option value={item.cat}>{item.cat}</option>}
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{L(c.th, c.en)}</option>
              ))}
            </select>
            <input
              value={item.emoji}
              onChange={(e) => update(item.id, { emoji: e.target.value })}
              maxLength={4}
              title={L("อิโมจิ (แสดงเมื่อไม่มีรูป)", "Emoji (shown when no photo)")}
              className="w-12 rounded-xl border border-line bg-bg px-2 py-2 text-center text-base outline-none focus:border-teal"
            />
            {item.oldPrice && item.oldPrice > item.price && (
              <span className="rounded-md bg-coral/15 px-2 py-1 text-[11px] font-bold text-[#b23a1e]">
                {L("ลด", "-")}{Math.round((1 - item.price / item.oldPrice) * 100)}%
              </span>
            )}
          </div>

          {/* toggles */}
          <div className="mt-1 flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="flex items-center gap-2 text-xs font-semibold">
              <Toggle on={!item.hidden} onChange={(v) => update(item.id, { hidden: !v })} />
              {item.hidden ? L("ซ่อนอยู่", "Hidden") : L("แสดง", "Shown")}
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold">
              <Toggle on={!!item.soldout} onChange={(v) => update(item.id, { soldout: v })} color="danger" />
              {L("หมด", "Sold out")}
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold">
              <Toggle on={!!item.signature} onChange={(v) => update(item.id, { signature: v })} color="coral" />
              {L("เมนูเด่น", "Signature")}
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold">
              <Toggle on={!!item.bestseller} onChange={(v) => update(item.id, { bestseller: v })} color="coral" />
              {L("ขายดี", "Bestseller")}
            </span>
            <span className="flex items-center gap-2 text-xs font-semibold">
              <Toggle on={!!item.spicy} onChange={(v) => update(item.id, { spicy: v })} color="danger" />
              {L("เผ็ด 🌶️", "Spicy 🌶️")}
            </span>
          </div>
        </div>
      </div>

      {/* per-item add-on / option editor (e.g. พิเศษ, เพิ่มข้าว) */}
      <AddonEditor itemId={item.id} initial={item.addonGroups ?? []} />
    </Card>
  );
}
