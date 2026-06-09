"use client";

import { useCallback, useEffect, useState } from "react";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { adminListRestaurants, type PlatformRestaurant } from "@/lib/db";
import { PageTitle } from "@/components/admin/ui";
import { ChatThread } from "@/components/ChatThread";

export default function MessagesPage() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const isPlatformAdmin = useShop((s) => s.isPlatformAdmin);
  const loaded = useShop((s) => s.loaded);
  const [rows, setRows] = useState<PlatformRestaurant[] | null>(null);
  const [sel, setSel] = useState<PlatformRestaurant | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await adminListRestaurants());
    } catch {
      setRows([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isPlatformAdmin) void load();
  }, [isPlatformAdmin, load]);

  if (loaded && !isPlatformAdmin) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <div>
          <div className="text-5xl">🔒</div>
          <p className="mt-3 font-display text-lg font-bold">{L("เฉพาะผู้ดูแลแพลตฟอร์ม", "Platform admins only")}</p>
        </div>
      </div>
    );
  }

  const shops = (rows ?? []).slice().sort((a, b) => b.unread - a.unread);

  if (sel) {
    return (
      <div>
        <button onClick={() => { setSel(null); void load(); }} className="text-sm font-semibold text-teal-deep">
          ← {L("กลับรายชื่อร้าน", "Back to shops")}
        </button>
        <div className="mb-3 mt-2">
          <h1 className="font-display text-xl font-extrabold">{sel.name_th || sel.slug}</h1>
          <p className="text-sm text-muted">
            {sel.owner_name || "—"} · {sel.owner_phone || L("ไม่มีเบอร์", "no phone")} · {sel.owner_email}
          </p>
        </div>
        <ChatThread restaurantId={sel.id} meIsAdmin={true} />
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        title={L("ข้อความจากร้าน", "Shop messages")}
        subtitle={L("แชตกับเจ้าของร้านแต่ละร้าน", "Chat with each shop owner")}
      />
      {rows === null ? (
        <div className="grid place-items-center py-20">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-teal" />
        </div>
      ) : shops.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted">{L("ยังไม่มีร้าน", "No shops yet")}</p>
      ) : (
        <div className="space-y-2.5">
          {shops.map((s) => (
            <button
              key={s.id}
              onClick={() => setSel(s)}
              className="flex w-full items-center justify-between rounded-2xl bg-surface p-4 text-left shadow-card ring-1 ring-line active:scale-[.99]"
            >
              <div className="min-w-0">
                <p className="font-display font-bold">{s.name_th || s.slug}</p>
                <p className="truncate text-xs text-muted">
                  {s.owner_name || s.owner_email} · {s.owner_phone || L("ไม่มีเบอร์", "no phone")}
                </p>
              </div>
              {s.unread > 0 ? (
                <span className="ml-3 grid h-6 min-w-6 shrink-0 place-items-center rounded-full bg-coral px-2 text-xs font-bold text-white">
                  {s.unread}
                </span>
              ) : (
                <span className="ml-3 shrink-0 text-muted">›</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
