"use client";

import { useI18n } from "@/lib/i18n";

export function LangToggle({ onCover = false }: { onCover?: boolean }) {
  const { lang, setLang } = useI18n();
  const track = onCover
    ? "bg-white/20 ring-1 ring-white/30 backdrop-blur"
    : "bg-black/5 ring-1 ring-line";
  const activeCls = onCover
    ? "bg-white text-teal-deep shadow-sm"
    : "bg-teal text-white shadow-sm";
  const idleCls = onCover ? "text-white/85" : "text-muted";

  return (
    <div className={`inline-flex items-center rounded-full p-0.5 ${track}`}>
      {(["th", "en"] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-3 py-1 text-xs font-bold rounded-full transition ${
            lang === l ? activeCls : idleCls
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
