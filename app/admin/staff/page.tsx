"use client";

import { useCallback, useEffect, useState } from "react";
import { useShop } from "@/lib/shop";
import { useI18n } from "@/lib/i18n";
import { useCaps } from "@/lib/plan";
import { fetchStaff, inviteStaff, removeStaff, resetStaffPassword, type StaffMember } from "@/lib/db";
import { Card, PageTitle } from "@/components/admin/ui";
import { UpgradeCard } from "@/components/admin/UpgradeCard";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function StaffPage() {
  const { lang } = useI18n();
  const L = (th: string, en: string) => (lang === "th" ? th : en);
  const caps = useCaps();
  const restaurantId = useShop((s) => s.restaurantId);

  const [list, setList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [cred, setCred] = useState<{ email: string; name: string; password: string } | null>(null); // temp login to hand to new staff

  // reused by the invite/remove handlers (event handlers — safe to setState)
  const reload = useCallback(async () => {
    if (!restaurantId) return;
    const data = await fetchStaff(restaurantId);
    setList(data);
    setLoading(false);
  }, [restaurantId]);

  // initial load — setState happens in the promise callback (not synchronously in the effect)
  useEffect(() => {
    if (!restaurantId) return;
    let alive = true;
    void fetchStaff(restaurantId).then((d) => {
      if (alive) {
        setList(d);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [restaurantId]);

  if (!caps.staffAccounts) {
    return (
      <div>
        <PageTitle title={L("พนักงาน", "Staff")} subtitle={L("ให้พนักงานมีบัญชีเข้าระบบของตัวเอง", "Give staff their own logins")} />
        <UpgradeCard title={{ th: "บัญชีพนักงานหลายคน (แยกสิทธิ์)", en: "Multiple staff accounts (roles)" }} need="Business" />
      </div>
    );
  }

  const mapError = (e: string): string => {
    if (e === "staff_requires_business") return L("บัญชีพนักงานใช้ได้เฉพาะแพ็กเกจ Business", "Staff accounts are a Business-plan feature");
    if (e === "owner_is_self") return L("นี่คืออีเมลเจ้าของร้าน เพิ่มเป็นพนักงานไม่ได้", "That's the owner's email — can't add as staff");
    if (e === "email_in_use") return L("อีเมลนี้มีบัญชีอยู่ในระบบแล้ว — ใช้เป็นพนักงานใหม่ไม่ได้ กรุณาใช้อีเมลอื่น", "This email already has an account — can't add as new staff. Use a different email.");
    if (/invalid.?email/i.test(e)) return L("อีเมลไม่ถูกต้อง", "Invalid email");
    if (/not the owner/i.test(e)) return L("เฉพาะเจ้าของร้านเท่านั้นที่เพิ่มพนักงานได้", "Only the shop owner can add staff");
    if (/already.?(registered|exists)/i.test(e)) return L("อีเมลนี้มีบัญชีอยู่แล้ว — ใช้รหัสผ่านเดิมเข้าได้เลย", "This email already has an account — they sign in with their existing password");
    return e;
  };

  const invite = async () => {
    const v = email.trim().toLowerCase();
    if (!EMAIL_RE.test(v)) {
      setMsg({ kind: "err", text: L("กรอกอีเมลให้ถูกต้อง", "Enter a valid email") });
      return;
    }
    setBusy(true);
    setMsg(null);
    setCred(null);
    try {
      const nm = name.trim();
      const { invited, tempPassword } = await inviteStaff(restaurantId, v, nm, "staff");
      setEmail("");
      setName("");
      await reload();
      if (invited && tempPassword) {
        // new login created — show the credentials so the owner can hand them to the staff member
        setCred({ email: v, name: nm, password: tempPassword });
        setMsg(null);
      } else {
        setMsg({
          kind: "ok",
          text: L("เพิ่มพนักงานแล้ว (บัญชีนี้มีอยู่แล้ว ใช้รหัสเดิมเข้าได้เลย)", "Staff added (existing account — they sign in with their current password)"),
        });
      }
    } catch (e) {
      setMsg({ kind: "err", text: mapError(e instanceof Error ? e.message : String(e)) });
    } finally {
      setBusy(false);
    }
  };

  const copyCred = async () => {
    if (!cred) return;
    const who = cred.name ? `${L("ชื่อ", "Name")}: ${cred.name}\n` : "";
    const text = `${who}${L("เข้าสู่ระบบที่", "Sign in at")}: ${location.origin}/admin\n${L("อีเมล", "Email")}: ${cred.email}\n${L("รหัสผ่าน", "Password")}: ${cred.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setMsg({ kind: "ok", text: L("คัดลอกข้อมูลเข้าระบบแล้ว", "Login details copied") });
    } catch {
      setMsg({ kind: "err", text: L("คัดลอกไม่สำเร็จ — จดด้วยตนเอง", "Couldn't copy — note it manually") });
    }
  };

  const resetPw = async (m: StaffMember) => {
    setCred(null);
    setMsg(null);
    if (!window.confirm(L(`สร้างรหัสผ่านใหม่ให้ ${m.name || m.email || "พนักงานคนนี้"}? (รหัสเดิมจะใช้ไม่ได้)`, `Generate a new password for ${m.name || m.email || "this staff member"}? (the old one stops working)`))) return;
    try {
      const { tempPassword } = await resetStaffPassword(restaurantId, m.user_id);
      if (tempPassword) setCred({ email: m.email ?? "", name: m.name ?? "", password: tempPassword });
      else setMsg({ kind: "err", text: L("รีเซ็ตไม่สำเร็จ ลองอีกครั้ง", "Reset failed, try again") });
    } catch (e) {
      setMsg({ kind: "err", text: mapError(e instanceof Error ? e.message : String(e)) });
    }
  };

  const remove = async (m: StaffMember) => {
    setCred(null);
    if (!window.confirm(L(`นำ ${m.email ?? "พนักงานคนนี้"} ออกจากร้าน?`, `Remove ${m.email ?? "this staff member"}?`))) return;
    try {
      await removeStaff(restaurantId, m.user_id);
      await reload();
    } catch (e) {
      setMsg({ kind: "err", text: mapError(e instanceof Error ? e.message : String(e)) });
    }
  };

  return (
    <div>
      <PageTitle
        title={L("พนักงาน", "Staff")}
        subtitle={L("ให้พนักงานเข้าระบบด้วยบัญชีของตัวเอง — เห็นเฉพาะออเดอร์ ครัว และผังโต๊ะ", "Staff get their own login — they see only Orders, Kitchen & Floor")}
      />

      {/* invite */}
      <Card className="mb-5">
        <h2 className="mb-1 font-display text-base font-extrabold">➕ {L("เพิ่มพนักงาน", "Add a staff member")}</h2>
        <p className="mb-4 text-xs text-muted">
          {L(
            "กรอกอีเมลพนักงาน — ระบบจะสร้างรหัสผ่านให้ทันที (ไม่ต้องส่งเมล) เอาไปให้พนักงานเข้าระบบได้เลย เขาจะเห็นเฉพาะงานหน้าร้าน/ครัว ไม่เห็นยอดขาย ราคา หรือการตั้งค่า",
            "Enter their email — we create a password instantly (no email needed). Hand it to your staff to sign in. They see only front/kitchen work, never sales, prices, or settings.",
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && invite()}
            placeholder={L("ชื่อพนักงาน (เช่น หมิว)", "Staff name (e.g. Miu)")}
            className="min-w-[140px] flex-1 rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !busy && invite()}
            placeholder={L("อีเมลพนักงาน", "Staff email")}
            className="min-w-[200px] flex-1 rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
          />
          <button
            onClick={invite}
            disabled={busy}
            className="rounded-full bg-teal px-5 py-2.5 text-sm font-bold text-white shadow-card active:scale-95 disabled:opacity-60"
          >
            {busy ? L("กำลังเพิ่ม…", "Adding…") : L("เพิ่มพนักงาน", "Add staff")}
          </button>
        </div>

        {/* new login to hand to the staff member */}
        {cred && (
          <div className="mt-3 rounded-2xl bg-success/10 p-4 ring-1 ring-success/30">
            <p className="font-display text-sm font-extrabold text-[#0f7a47]">✅ {L("ข้อมูลเข้าสู่ระบบของพนักงาน — ส่งให้พนักงาน", "Staff login details — share with them")}</p>
            <div className="mt-2 space-y-1.5 rounded-xl bg-surface p-3 text-sm ring-1 ring-line">
              {cred.name && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-muted">{L("ชื่อ", "Name")}</span>
                  <span className="font-bold">{cred.name}</span>
                </div>
              )}
              <div className={`flex items-center justify-between gap-3 ${cred.name ? "border-t border-dashed border-line pt-1.5" : ""}`}>
                <span className="text-muted">{L("อีเมล", "Email")}</span>
                <span className="font-mono font-bold">{cred.email}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-dashed border-line pt-1.5">
                <span className="text-muted">{L("รหัสผ่าน", "Password")}</span>
                <span className="select-all font-mono text-base font-extrabold tracking-wider text-teal-deep">{cred.password}</span>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <button onClick={copyCred} className="rounded-full bg-teal px-4 py-2 text-xs font-bold text-white active:scale-95">
                📋 {L("คัดลอกข้อมูลเข้าระบบ", "Copy login")}
              </button>
              <button onClick={() => setCred(null)} className="rounded-full bg-surface px-4 py-2 text-xs font-bold text-muted ring-1 ring-line active:scale-95">
                {L("ปิด", "Done")}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              {L("พนักงานเข้าที่หน้าเข้าสู่ระบบด้วยอีเมล + รหัสนี้ (เปลี่ยนรหัสภายหลังได้) — รหัสนี้จะไม่แสดงอีก จดไว้ก่อนปิด", "Staff sign in with this email + password (changeable later). It won't be shown again — note it before closing.")}
            </p>
          </div>
        )}
        {msg && (
          <p className={`mt-3 rounded-xl px-3 py-2 text-xs font-semibold ${msg.kind === "ok" ? "bg-success/10 text-success" : "bg-coral/10 text-[#b23a1e]"}`}>
            {msg.text}
          </p>
        )}
      </Card>

      {/* list */}
      <Card>
        <h2 className="mb-3 font-display text-base font-extrabold">👥 {L("พนักงานในร้าน", "Your team")}</h2>
        {loading ? (
          <div className="py-8 text-center text-sm text-muted">…</div>
        ) : list.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">{L("ยังไม่มีพนักงาน — เพิ่มคนแรกได้เลย", "No staff yet — add your first above")}</p>
        ) : (
          <div className="space-y-2.5">
            {list.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 rounded-2xl bg-bg px-4 py-3 ring-1 ring-line">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-teal/10 text-teal-deep">👤</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-bold">{m.name || m.email || m.user_id}</p>
                  <p className="truncate text-xs text-muted">{m.name ? `${m.email} · ` : ""}{L("พนักงาน • เห็นออเดอร์/ครัว/ผังโต๊ะ/รีวิว", "Staff • Orders/Kitchen/Floor/Reviews")}</p>
                </div>
                <button
                  onClick={() => resetPw(m)}
                  className="shrink-0 rounded-xl bg-surface px-3 py-1.5 text-xs font-bold text-teal-deep ring-1 ring-line active:scale-95"
                >
                  🔑 {L("รหัสผ่านใหม่", "New password")}
                </button>
                <button
                  onClick={() => remove(m)}
                  className="shrink-0 rounded-xl bg-surface px-3 py-1.5 text-xs font-bold text-[#b23a1e] ring-1 ring-line active:scale-95"
                >
                  {L("นำออก", "Remove")}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
