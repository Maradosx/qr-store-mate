"use client";

import { useEffect } from "react";
import { useShop } from "@/lib/shop";

/** Transient toast for owner-facing errors (failed saves, etc.). Auto-dismisses. */
export function Toaster() {
  const toast = useShop((s) => s.toast);
  const clearToast = useShop((s) => s.clearToast);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(clearToast, 4500);
    return () => clearTimeout(id);
  }, [toast, clearToast]);

  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex justify-center px-4 md:bottom-8">
      <div className="pointer-events-auto flex items-center gap-2.5 rounded-2xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-pop">
        <span className="text-base leading-none">⚠️</span>
        <span>{toast.msg}</span>
        <button onClick={clearToast} aria-label="close" className="ml-1 text-white/60 hover:text-white">✕</button>
      </div>
    </div>
  );
}
