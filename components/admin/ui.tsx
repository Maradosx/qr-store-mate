"use client";

import { useRef, useState } from "react";
import { uploadImage } from "@/lib/db";

/** Card section wrapper */
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl bg-surface p-5 shadow-card ring-1 ring-line ${className}`}>
      {children}
    </div>
  );
}

export function PageTitle({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** iOS-style toggle */
export function Toggle({
  on,
  onChange,
  color = "teal",
}: {
  on: boolean;
  onChange: (v: boolean) => void;
  color?: "teal" | "coral" | "danger";
}) {
  const bg = on
    ? color === "coral"
      ? "bg-coral"
      : color === "danger"
      ? "bg-danger"
      : "bg-teal"
    : "bg-line";
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition ${bg}`}
      aria-pressed={on}
    >
      <span
        className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

/** Labeled text field */
export function Field({
  label,
  value,
  onChange,
  type = "text",
  prefix,
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  prefix?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-muted">{label}</span>
      <span className="flex items-center rounded-2xl border border-line bg-bg focus-within:border-teal">
        {prefix && <span className="pl-3 text-sm font-semibold text-muted">{prefix}</span>}
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent px-3 py-2.5 text-sm outline-none"
        />
      </span>
    </label>
  );
}

/** Upload button: uploads the chosen image to Supabase Storage, returns its public URL */
export function UploadButton({
  label,
  onPick,
  folder = "uploads",
  className = "",
}: {
  label: string;
  onPick: (url: string) => void;
  folder?: string;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button
        onClick={() => ref.current?.click()}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-xl bg-teal px-4 py-2 text-sm font-bold text-white shadow-card transition active:scale-95 disabled:opacity-60 ${className}`}
      >
        {busy ? "⏳ กำลังอัป…" : `📷 ${label}`}
      </button>
      <input
        ref={ref}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          setBusy(true);
          try {
            const url = await uploadImage(f, folder);
            onPick(url);
          } catch (err) {
            alert("อัปโหลดรูปไม่สำเร็จ: " + (err instanceof Error ? err.message : String(err)));
          } finally {
            setBusy(false);
          }
        }}
      />
    </>
  );
}
