"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { fetchPublicReviews, type PublicReview } from "@/lib/db";
import { Star } from "./icons";

function Stars({ n, size = 14 }: { n: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} className={i <= Math.round(n) ? "text-gold" : "text-line"} />
      ))}
    </span>
  );
}

// Mounted only while open (parent renders it conditionally) so it fetches fresh each time.
export function ReviewsSheet({
  onClose,
  restaurantId,
  rating,
  count,
}: {
  onClose: () => void;
  restaurantId: string;
  rating: number;
  count: number;
}) {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const [err, setErr] = useState(false);
  const [nowMs, setNowMs] = useState(0);

  useEffect(() => {
    if (!restaurantId) return;
    let alive = true;
    fetchPublicReviews(restaurantId)
      .then((r) => {
        if (!alive) return;
        setNowMs(Date.now());
        setReviews(r);
      })
      .catch(() => alive && setErr(true));
    return () => {
      alive = false;
    };
  }, [restaurantId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const relTime = (iso: string): string => {
    const then = new Date(iso).getTime();
    const days = Math.floor((nowMs - then) / 86400000);
    if (days <= 0) return L("วันนี้", "Today");
    if (days === 1) return L("เมื่อวาน", "Yesterday");
    if (days < 30) return L(`${days} วันก่อน`, `${days} days ago`);
    return new Date(iso).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short" });
  };

  // shown comments first (richer), rating-only reviews after
  const sorted = reviews ? [...reviews].sort((a, b) => (b.comment ? 1 : 0) - (a.comment ? 1 : 0)) : [];

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={L("รีวิวจากลูกค้า", "Customer reviews")}>
      <div className="absolute inset-0 bg-ink/45 fade-in" onClick={onClose} />
      <div className="sheet-up absolute inset-x-0 bottom-0 mx-auto flex max-h-[82dvh] max-w-md flex-col rounded-t-3xl bg-bg shadow-pop">
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-line" />

        {/* summary header */}
        <div className="flex items-center gap-4 px-5 pb-4 pt-3">
          <div className="text-center">
            <p className="font-display text-4xl font-extrabold leading-none text-teal-deep">
              {count > 0 && Number.isFinite(rating) ? rating.toFixed(1) : "—"}
            </p>
            <div className="mt-1.5">
              <Stars n={count > 0 ? rating : 0} size={15} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-extrabold">{L("รีวิวจากลูกค้า", "Customer reviews")}</h2>
            <p className="text-sm text-muted">
              {count > 0
                ? L(`จาก ${count.toLocaleString()} รีวิว`, `from ${count.toLocaleString()} reviews`)
                : L("ยังไม่มีรีวิว", "No reviews yet")}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={L("ปิด", "Close")}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-surface text-base ring-1 ring-line active:scale-90"
          >
            ✕
          </button>
        </div>

        {/* list */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8">
          {reviews === null && !err ? (
            <div className="grid place-items-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-teal" />
            </div>
          ) : err ? (
            <p className="py-16 text-center text-sm text-muted">{L("โหลดรีวิวไม่สำเร็จ ลองใหม่อีกครั้ง", "Couldn't load reviews — try again")}</p>
          ) : sorted.length === 0 ? (
            <div className="grid place-items-center py-16 text-center">
              <div>
                <div className="text-4xl">💬</div>
                <p className="mt-3 text-sm text-muted">{L("ยังไม่มีรีวิว เป็นคนแรกที่รีวิวได้เลย!", "No reviews yet — be the first!")}</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {sorted.map((r, i) => (
                <li key={i} className="rounded-2xl bg-surface p-4 shadow-card ring-1 ring-line">
                  <div className="flex items-center justify-between">
                    <Stars n={r.rating} />
                    <span className="text-xs text-muted">{relTime(r.created_at)}</span>
                  </div>
                  {r.comment && <p className="mt-2 text-sm leading-relaxed text-ink/90">{r.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
