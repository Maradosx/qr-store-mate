"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { BrandMark } from "@/components/BrandMark";

type Phase = "checking" | "ready" | "invalid" | "done";

export default function ResetPasswordPage() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("checking");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // the recovery email link lands here with the session tokens in the URL hash
  useEffect(() => {
    const apply = async () => {
      const h = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const at = h.get("access_token");
      const rt = h.get("refresh_token");
      const type = h.get("type");
      // recovery = forgot-password link; invite = new staff member setting their first password
      if (at && rt && (type === "recovery" || type === "invite")) {
        const { error } = await supabase.auth.setSession({ access_token: at, refresh_token: rt });
        setPhase(error ? "invalid" : "ready");
        // clean the tokens out of the URL bar
        window.history.replaceState(null, "", window.location.pathname);
        return;
      }
      const { data } = await supabase.auth.getSession();
      setPhase(data.session ? "ready" : "invalid");
    };
    void apply();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) {
      setErr(L("รหัสผ่านอย่างน้อย 6 ตัวอักษร", "Password must be at least 6 characters"));
      return;
    }
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) setErr(error.message);
    else {
      setPhase("done");
      window.setTimeout(() => router.push("/admin"), 1600);
    }
  };

  return (
    <div className="relative grid min-h-dvh place-items-center overflow-hidden bg-teal px-6 text-white">
      <div className="dotgrid absolute inset-0 opacity-30" />
      <div className="relative w-full max-w-sm rounded-3xl bg-surface p-7 text-center text-ink shadow-pop">
        <div className="flex justify-center"><BrandMark size={52} /></div>

        {phase === "checking" && (
          <p className="mt-6 text-sm text-muted">{L("กำลังตรวจสอบลิงก์…", "Checking link…")}</p>
        )}

        {phase === "invalid" && (
          <>
            <div className="mt-5 text-4xl">⚠️</div>
            <h1 className="mt-3 font-display text-lg font-extrabold">{L("ลิงก์หมดอายุหรือไม่ถูกต้อง", "Link expired or invalid")}</h1>
            <p className="mt-2 text-sm text-muted">{L("กรุณาขอลิงก์รีเซ็ตรหัสผ่านใหม่อีกครั้ง", "Please request a new reset link.")}</p>
            <Link href="/admin" className="mt-6 inline-block rounded-2xl bg-teal px-6 py-3 text-sm font-bold text-white active:scale-95">
              {L("ไปหน้าเข้าสู่ระบบ", "Go to sign in")}
            </Link>
          </>
        )}

        {phase === "ready" && (
          <form onSubmit={submit}>
            <h1 className="mt-4 font-display text-xl font-extrabold">{L("ตั้งรหัสผ่านใหม่", "Set a new password")}</h1>
            <p className="mt-1 text-sm text-muted">{L("กรอกรหัสผ่านใหม่สำหรับร้านของคุณ", "Enter a new password for your shop")}</p>
            <input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder={L("รหัสผ่านใหม่", "New password")}
              autoComplete="new-password"
              className="mt-5 w-full rounded-2xl border border-line bg-bg px-4 py-3 text-sm outline-none focus:border-teal"
            />
            {err && <p className="mt-3 text-sm font-semibold text-[#b23a1e]">{err}</p>}
            <button
              type="submit"
              disabled={busy}
              className="mt-5 w-full rounded-2xl bg-teal py-3.5 font-display font-bold text-white shadow-card active:scale-[.99] disabled:opacity-60"
            >
              {busy ? "…" : L("บันทึกรหัสผ่านใหม่", "Save new password")}
            </button>
          </form>
        )}

        {phase === "done" && (
          <>
            <div className="mt-5 text-4xl">✅</div>
            <h1 className="mt-3 font-display text-lg font-extrabold">{L("เปลี่ยนรหัสผ่านแล้ว!", "Password updated!")}</h1>
            <p className="mt-2 text-sm text-muted">{L("กำลังพาเข้าสู่ระบบ…", "Signing you in…")}</p>
          </>
        )}
      </div>
    </div>
  );
}
