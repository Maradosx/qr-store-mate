type P = { size?: number; className?: string; strokeWidth?: number };

const base = (size: number, className: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none" as const,
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
});

export const Plus = ({ size = 20, className = "", strokeWidth = 2.4 }: P) => (
  <svg {...base(size, className)} strokeWidth={strokeWidth}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const Minus = ({ size = 20, className = "", strokeWidth = 2.4 }: P) => (
  <svg {...base(size, className)} strokeWidth={strokeWidth}>
    <path d="M5 12h14" />
  </svg>
);
export const Trash = ({ size = 18, className = "", strokeWidth = 2 }: P) => (
  <svg {...base(size, className)} strokeWidth={strokeWidth}>
    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
  </svg>
);
export const ChevronLeft = ({ size = 22, className = "", strokeWidth = 2.2 }: P) => (
  <svg {...base(size, className)} strokeWidth={strokeWidth}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
export const ChevronRight = ({ size = 18, className = "", strokeWidth = 2.2 }: P) => (
  <svg {...base(size, className)} strokeWidth={strokeWidth}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);
export const Clock = ({ size = 16, className = "", strokeWidth = 2 }: P) => (
  <svg {...base(size, className)} strokeWidth={strokeWidth}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const Star = ({ size = 16, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2l2.9 6.26L21.6 9.2l-4.8 4.49 1.2 6.61L12 17.1 6 20.3l1.2-6.61L2.4 9.2l6.7-.94L12 2z" />
  </svg>
);
export const Check = ({ size = 18, className = "", strokeWidth = 3 }: P) => (
  <svg {...base(size, className)} strokeWidth={strokeWidth}>
    <path d="M5 12.5l5 5 9-11" />
  </svg>
);
export const Bell = ({ size = 18, className = "", strokeWidth = 2 }: P) => (
  <svg {...base(size, className)} strokeWidth={strokeWidth}>
    <path d="M6 9a6 6 0 1112 0c0 5 2 6 2 6H4s2-1 2-6" />
    <path d="M10 20a2 2 0 004 0" />
  </svg>
);
export const QrGlyph = ({ size = 16, className = "" }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zm9-2h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zm9 0h2v2h-2v-2zm4 0h3v2h-3v-2zm-4 4h2v3h-2v-3zm4-2h3v5h-3v-2h1v-1h-1v-2zm-1-2h3v-2h-3v2z" />
  </svg>
);
