"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { BrandMark } from "@/components/BrandMark";

// Brand "sales card": print this and hand it to shop owners — scanning the QR opens our website.
const SITE = "https://qrstoremate.com";

export default function CardPage() {
  const [qr, setQr] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(SITE, { width: 520, margin: 1, color: { dark: "#0E7C86", light: "#FFFFFF" } })
      .then((d) => alive && setQr(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // compose a clean printable PNG: logo + wordmark on top, QR below (mirrors the table-QR download)
  const download = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await (document.fonts?.ready ?? Promise.resolve());
      const qrData = await QRCode.toDataURL(SITE, { width: 760, margin: 1, color: { dark: "#0E7C86", light: "#FFFFFF" } });
      const W = 800, H = 1120;
      const c = document.createElement("canvas");
      c.width = W; c.height = H;
      const ctx = c.getContext("2d");
      if (!ctx) return;
      const rr = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, w, h, r);
        else ctx.rect(x, y, w, h);
      };
      ctx.fillStyle = "#FFFFFF"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#FFFFFF"; rr(18, 18, W - 36, H - 36, 40); ctx.fill();
      ctx.strokeStyle = "#E4ECEA"; ctx.lineWidth = 4; rr(18, 18, W - 36, H - 36, 40); ctx.stroke();

      // logo + wordmark (centered group)
      const logo = new Image();
      logo.src = "/icon.svg";
      try { await logo.decode(); } catch { /* keep going without the badge */ }
      ctx.textBaseline = "middle";
      ctx.font = "800 66px Sora, sans-serif";
      const qrW = ctx.measureText("QR").width;
      const restW = ctx.measureText(" Store Mate").width;
      const logoSize = 110, gap = 22;
      const groupW = logoSize + gap + qrW + restW;
      const sx = (W - groupW) / 2, hy = 120;
      ctx.drawImage(logo, sx, hy - logoSize / 2, logoSize, logoSize);
      ctx.textAlign = "left";
      let tx = sx + logoSize + gap;
      ctx.fillStyle = "#E8B84B"; ctx.fillText("QR", tx, hy); tx += qrW;
      ctx.fillStyle = "#0E7C86"; ctx.fillText(" Store Mate", tx, hy);

      // tagline (Thai → Niramit)
      ctx.textAlign = "center";
      ctx.fillStyle = "#16282B"; ctx.font = "600 29px Niramit, sans-serif";
      ctx.fillText("ระบบสั่งอาหารผ่าน QR ที่โต๊ะ • สั่งง่ายแค่สแกน", W / 2, 218);

      // QR with a teal frame
      const qrImg = new Image();
      qrImg.src = qrData;
      try { await qrImg.decode(); } catch { /* */ }
      const QRS = 520, qx = (W - QRS) / 2, qy = 290;
      ctx.fillStyle = "#0E7C86"; rr(qx - 22, qy - 22, QRS + 44, QRS + 44, 30); ctx.fill();
      ctx.fillStyle = "#FFFFFF"; rr(qx - 10, qy - 10, QRS + 20, QRS + 20, 22); ctx.fill();
      ctx.drawImage(qrImg, qx, qy, QRS, QRS);

      // CTA under QR
      ctx.fillStyle = "#0E7C86"; ctx.font = "700 38px Niramit, sans-serif";
      ctx.fillText("สแกนเปิดเว็บ — เปิดร้านฟรี 30 วัน", W / 2, qy + QRS + 78);
      ctx.fillStyle = "#5B6B6E"; ctx.font = "500 26px Niramit, sans-serif";
      ctx.fillText("ไม่ต้องมีเครื่อง POS · ตั้งเอง 10 นาที · เริ่ม ฿299/เดือน", W / 2, qy + QRS + 124);
      ctx.fillStyle = "#16282B"; ctx.font = "800 32px Sora, sans-serif";
      ctx.fillText("qrstoremate.com", W / 2, H - 66);

      const a = document.createElement("a");
      a.href = c.toDataURL("image/png");
      a.download = "qrstoremate-card.png";
      document.body.appendChild(a); a.click(); a.remove();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-bg px-4 py-8">
      {/* the printable card */}
      <div id="card" className="mx-auto flex max-w-sm flex-col items-center rounded-[34px] bg-surface px-7 py-9 text-center shadow-pop ring-1 ring-line">
        <div className="flex items-center gap-2.5">
          <BrandMark size={56} />
          <span className="font-display text-3xl font-extrabold tracking-tight">
            <span style={{ color: "#E8B84B" }}>QR</span>{" "}
            <span className="text-teal-deep">Store Mate</span>
          </span>
        </div>
        <p className="mt-2.5 text-sm font-semibold text-muted">ระบบสั่งอาหารผ่าน QR ที่โต๊ะ • สั่งง่ายแค่สแกน</p>

        <div className="mt-6 rounded-3xl bg-teal-deep p-3 shadow-card">
          <div className="rounded-2xl bg-white p-2">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={qr} alt="QR Store Mate website" className="h-60 w-60" />
            ) : (
              <div className="grid h-60 w-60 place-items-center text-sm font-bold text-muted">QR…</div>
            )}
          </div>
        </div>

        <p className="mt-6 font-display text-lg font-extrabold text-teal-deep">สแกนเปิดเว็บ — เปิดร้านฟรี 30 วัน</p>
        <p className="mt-1 text-xs font-semibold text-muted">ไม่ต้องมีเครื่อง POS · ตั้งเอง 10 นาที · เริ่ม ฿299/เดือน</p>
        <p className="mt-4 font-display text-base font-extrabold">qrstoremate.com</p>
      </div>

      {/* controls (hidden when printing) */}
      <div className="no-print mx-auto mt-6 flex max-w-sm flex-col gap-2">
        <button
          onClick={download}
          disabled={downloading}
          className="rounded-2xl bg-teal py-3.5 font-display font-bold text-white shadow-card active:scale-[.99] disabled:opacity-60"
        >
          {downloading ? "กำลังสร้างรูป…" : "⬇︎ ดาวน์โหลดรูป (PNG)"}
        </button>
        <button
          onClick={() => window.print()}
          className="rounded-2xl bg-surface py-3.5 font-display font-bold text-teal-deep ring-1 ring-line active:scale-[.99]"
        >
          🖨 ปริ้นการ์ดนี้
        </button>
        <Link href="/" className="mt-1 text-center text-xs text-muted underline">← กลับหน้าแรก</Link>
      </div>

      <style>{`@media print { body { background:#fff } .no-print { display:none } #card { box-shadow:none; border:none } }`}</style>
    </div>
  );
}
