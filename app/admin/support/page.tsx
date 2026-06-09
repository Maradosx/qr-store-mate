"use client";

import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { PageTitle } from "@/components/admin/ui";
import { ChatThread } from "@/components/ChatThread";

export default function SupportPage() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const restaurantId = useShop((s) => s.restaurantId);

  return (
    <div>
      <PageTitle
        title={L("ติดต่อทีมงาน", "Contact support")}
        subtitle={L("แชตกับทีมงาน QR Store Mate โดยตรง — สอบถาม แจ้งปัญหา หรือขอความช่วยเหลือ", "Chat directly with the QR Store Mate team — questions, issues, or help")}
      />
      {restaurantId ? (
        <ChatThread restaurantId={restaurantId} meIsAdmin={false} />
      ) : (
        <p className="py-16 text-center text-sm text-muted">{L("กำลังโหลด…", "Loading…")}</p>
      )}
    </div>
  );
}
