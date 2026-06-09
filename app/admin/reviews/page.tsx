"use client";

import { useCallback, useEffect, useState } from "react";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { fetchReviews, type Review } from "@/lib/db";
import { Card, PageTitle } from "@/components/admin/ui";

function Stars({ n }: { n: number }) {
  return (
    <span className="text-sm leading-none">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ filter: i <= n ? "none" : "grayscale(1)", opacity: i <= n ? 1 : 0.3 }}>⭐</span>
      ))}
    </span>
  );
}

export default function ReviewsPage() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const restaurantId = useShop((s) => s.restaurantId);
  const profile = useShop((s) => s.profile);
  const [reviews, setReviews] = useState<Review[] | null>(null);

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setReviews(await fetchReviews(restaurantId));
  }, [restaurantId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const count = profile.reviews ?? 0;

  return (
    <div>
      <PageTitle
        title={L("รีวิวจากลูกค้า", "Customer reviews")}
        subtitle={L("อ่านความเห็นจริงจากลูกค้า เพื่อนำไปปรับปรุงร้าน", "Real customer feedback to help you improve")}
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="rounded-2xl bg-teal px-5 py-3 text-white shadow-card">
          <p className="text-xs text-white/80">{L("คะแนนเฉลี่ย", "Average")}</p>
          <p className="font-display text-2xl font-extrabold">⭐ {count > 0 ? profile.rating : "—"}</p>
        </div>
        <div className="rounded-2xl bg-surface px-5 py-3 ring-1 ring-line">
          <p className="text-xs text-muted">{L("จำนวนรีวิว", "Reviews")}</p>
          <p className="font-display text-2xl font-extrabold">{count}</p>
        </div>
      </div>

      {reviews === null ? (
        <div className="grid place-items-center py-20">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-teal" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="grid place-items-center py-20 text-center">
          <div>
            <div className="text-5xl">💬</div>
            <p className="mt-3 font-display text-lg font-bold">{L("ยังไม่มีรีวิว", "No reviews yet")}</p>
            <p className="text-sm text-muted">{L("ลูกค้าให้คะแนนได้หลังสั่งอาหารเสร็จ", "Customers can rate after they order")}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {reviews.map((r) => (
            <Card key={r.id} className="!p-4">
              <div className="flex items-center justify-between">
                <Stars n={r.rating} />
                <span className="text-xs text-muted">
                  {r.table_no ? `${L("โต๊ะ", "Table")} ${r.table_no} · ` : ""}
                  {new Date(r.created_at).toLocaleDateString(lang === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              {r.comment && <p className="mt-2 text-sm">{r.comment}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
