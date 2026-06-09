"use client";

import { Plus, Minus } from "./icons";

export function QtyStepper({
  value,
  onDec,
  onInc,
  size = "md",
}: {
  value: number;
  onDec: () => void;
  onInc: () => void;
  size?: "sm" | "md";
}) {
  const btn =
    size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const num = size === "sm" ? "w-7 text-sm" : "w-9 text-base";
  return (
    <div className="inline-flex items-center rounded-full bg-bg ring-1 ring-line">
      <button
        onClick={onDec}
        aria-label="ลด"
        className={`${btn} grid place-items-center rounded-full text-teal-deep active:scale-90 transition`}
      >
        <Minus size={size === "sm" ? 16 : 18} />
      </button>
      <span className={`${num} text-center font-display font-bold tabular-nums`}>
        {value}
      </span>
      <button
        onClick={onInc}
        aria-label="เพิ่ม"
        className={`${btn} grid place-items-center rounded-full bg-teal text-white active:scale-90 transition`}
      >
        <Plus size={size === "sm" ? 16 : 18} />
      </button>
    </div>
  );
}
