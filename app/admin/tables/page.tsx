"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { useShop, type Table } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { useCaps } from "@/lib/plan";
import { Card, PageTitle } from "@/components/admin/ui";
import { Trash } from "@/components/icons";

const DEFAULT_QR = "#0E7C86";
const PRESETS = ["#0E7C86", "#16282B", "#D24A33", "#1D4ED8", "#6D28D9", "#15803D"];

export default function TablesPage() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const tables = useShop((s) => s.tables);
  const slug = useShop((s) => s.slug);
  const profile = useShop((s) => s.profile);
  const update = useShop((s) => s.updateProfile);
  const addTable = useShop((s) => s.addTable);
  const removeTable = useShop((s) => s.removeTable);
  const caps = useCaps();
  const color = profile.qrColor || DEFAULT_QR;

  const [nudge, setNudge] = useState(false);
  const capped = caps.maxTables !== Infinity;
  const limitLabel = capped ? String(caps.maxTables) : L("ไม่จำกัด", "unlimited");
  const atLimit = tables.length >= caps.maxTables;
  const approaching = capped && !atLimit && tables.length >= caps.maxTables - 1;
  const nextPlan = caps.id === "starter" ? "Pro" : "Business";
  const tryAdd = () => {
    if (atLimit) {
      // soft cap: don't block with a harsh alert — surface the upgrade milestone
      setNudge(true);
      if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    void addTable();
  };

  return (
    <div>
      <PageTitle
        title={L("โต๊ะ & QR", "Tables & QR")}
        subtitle={L(`${tables.length} โต๊ะ • ลิมิต ${limitLabel} • เพิ่มโต๊ะแล้วได้ QR ใหม่อัตโนมัติ`, `${tables.length} tables • limit ${limitLabel} • add a table to auto-generate its QR`)}
        action={
          <button
            onClick={tryAdd}
            className={`rounded-full px-4 py-2 text-sm font-bold text-white shadow-card active:scale-95 ${atLimit ? "bg-muted/60" : "bg-teal"}`}
          >
            + {L("เพิ่มโต๊ะ", "Add table")}
          </button>
        }
      />

      {/* soft-cap milestone — shown when the plan's table limit is reached */}
      {atLimit && capped && (
        <Card className={`mb-4 border-2 bg-gold/5 ${nudge ? "border-gold" : "border-gold/40"}`}>
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎉</span>
            <div className="flex-1">
              <p className="font-display text-base font-extrabold">{L("ร้านโตขึ้นแล้ว!", "Your shop is growing!")}</p>
              <p className="mt-0.5 text-sm text-muted">
                {L(
                  `แพ็กเกจ ${caps.label} เพิ่มได้สูงสุด ${caps.maxTables} โต๊ะ — อัปเป็น ${nextPlan} เพื่อเพิ่มโต๊ะ${caps.id === "starter" ? " พร้อมจอครัว โปรโมชั่น และกราฟยอดขายเต็ม" : ""}`,
                  `The ${caps.label} plan allows up to ${caps.maxTables} tables — upgrade to ${nextPlan} to add more${caps.id === "starter" ? ", plus kitchen display, promotions & full analytics" : ""}.`,
                )}
              </p>
              <Link
                href="/admin/billing"
                className="mt-2.5 inline-block rounded-full bg-teal px-4 py-2 text-sm font-bold text-white shadow-card active:scale-95"
              >
                {L(`อัปเกรดเป็น ${nextPlan} ↗`, `Upgrade to ${nextPlan} ↗`)}
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* gentle heads-up one table before the limit */}
      {approaching && (
        <p className="mb-4 rounded-xl bg-gold/10 px-3 py-2 text-xs font-semibold text-[#8a6d12]">
          {L(`เหลืออีก 1 โต๊ะก็เต็มแพ็กเกจ ${caps.label} แล้ว`, `1 more table and you'll reach the ${caps.label} limit`)}
        </p>
      )}

      {/* QR color picker */}
      <Card className="mb-4 !p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold">🎨 {L("สีของ QR", "QR color")}</span>
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => update({ qrColor: c })}
                aria-label={c}
                className={`grid h-8 w-8 place-items-center rounded-full ring-2 transition active:scale-90 ${
                  color.toLowerCase() === c.toLowerCase() ? "ring-ink" : "ring-line"
                }`}
                style={{ background: c }}
              >
                {color.toLowerCase() === c.toLowerCase() && <span className="text-xs font-bold text-white">✓</span>}
              </button>
            ))}
            <label className="grid h-8 w-8 cursor-pointer place-items-center overflow-hidden rounded-full ring-2 ring-line" title={L("สีเอง", "Custom")}>
              <input
                type="color"
                value={color}
                onChange={(e) => update({ qrColor: e.target.value })}
                className="h-10 w-10 cursor-pointer border-0 bg-transparent p-0"
              />
            </label>
          </div>
        </div>
        <p className="mt-2 text-xs text-muted">
          {L("เลือกสีเข้มเพื่อให้สแกนติดง่าย • ใช้กับ QR ทุกโต๊ะ", "Pick a dark shade so it scans easily • applies to every table's QR")}
        </p>
      </Card>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {tables.map((tb) => (
          <TableCard
            key={tb.id}
            table={tb}
            slug={slug}
            color={color}
            L={L}
            onRemove={() => {
              if (window.confirm(L(`ลบโต๊ะ ${tb.no} และ QR ของโต๊ะนี้?`, `Delete table ${tb.no} and its QR?`))) removeTable(tb.id);
            }}
          />
        ))}
      </div>
    </div>
  );
}

function TableCard({
  table,
  slug,
  color,
  L,
  onRemove,
}: {
  table: Table;
  slug: string;
  color: string;
  L: (th: string, en: string) => string;
  onRemove: () => void;
}) {
  const [qr, setQr] = useState<string>("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let alive = true;
    QRCode.toDataURL(`${window.location.origin}/r/${slug}/t/${table.no}`, {
      width: 320,
      margin: 1,
      color: { dark: color, light: "#FFFFFF" },
    })
      .then((d) => alive && setQr(d))
      .catch(() => alive && setQr(""));
    return () => {
      alive = false;
    };
  }, [table.no, slug, color]);

  // download a composed PNG: big table number on top + the QR below.
  // Regenerate the QR at full size + await decode() so the downloaded image is never blank.
  const download = async () => {
    if (!slug || downloading) return; // guard against double-clicks while rendering
    setDownloading(true);
    try {
      const dataUrl = await QRCode.toDataURL(`${window.location.origin}/r/${slug}/t/${table.no}`, {
        width: 600,
        margin: 1,
        color: { dark: color, light: "#FFFFFF" },
      });
      const img = new Image();
      img.src = dataUrl;
      await img.decode(); // guarantees the image is ready before drawing (fixes blank QR)
      const QR = 320;
      const W = 400;
      const PAD = 26;
      const NUM_H = 100;
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = PAD + NUM_H + QR + PAD;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = "bold 80px ui-sans-serif, system-ui, -apple-system, sans-serif";
      ctx.fillText(table.no, W / 2, PAD + NUM_H / 2, W - 48); // clamp width for long table numbers
      ctx.drawImage(img, (W - QR) / 2, PAD + NUM_H, QR, QR);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `qr-table-${table.no}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      window.alert(L("ดาวน์โหลด QR ไม่สำเร็จ ลองใหม่อีกครั้ง", "Couldn't download the QR — please try again"));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="!p-4 text-center">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-extrabold">
          {L("โต๊ะ", "Table")} {table.no}
        </span>
        <button onClick={onRemove} className="text-muted hover:text-[#b23a1e] active:scale-90" aria-label="delete">
          <Trash size={16} />
        </button>
      </div>
      {/* preview: number on top + QR (matches the downloaded image) */}
      <div className="mx-auto mt-3 w-full overflow-hidden rounded-2xl bg-white p-2 ring-1 ring-line">
        <div className="font-display text-3xl font-extrabold leading-none" style={{ color }}>
          {table.no}
        </div>
        <div className="mx-auto mt-1 aspect-square w-full">
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt={`QR table ${table.no}`} className="h-full w-full object-contain" />
          ) : (
            <div className="grid h-full w-full place-items-center text-xs text-muted">…</div>
          )}
        </div>
      </div>
      <button
        onClick={download}
        disabled={!qr || downloading}
        className="mt-3 block w-full rounded-xl bg-teal py-2 text-xs font-bold text-white active:scale-95 disabled:opacity-50"
      >
        {downloading ? "…" : `⬇︎ ${L("ดาวน์โหลด QR", "Download QR")}`}
      </button>
      <p className="mt-2 truncate text-[10px] text-muted" title={`/r/${slug}/t/${table.no}`}>
        {L("สแกนเปิดเมนู โต๊ะ", "Scan → menu, table")} {table.no}
      </p>
    </Card>
  );
}
