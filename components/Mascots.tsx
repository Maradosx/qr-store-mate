import type { ReactElement } from "react";
import { Mascot as Mate } from "./Mascot";

type MascotProps = { size?: number; className?: string };

// shared kawaii eyes (two glossy eyes + catchlights)
function Eyes({ lx, rx, y, r = 4.7 }: { lx: number; rx: number; y: number; r?: number }) {
  return (
    <g>
      <circle cx={lx} cy={y} r={r} fill="#15333A" />
      <circle cx={rx} cy={y} r={r} fill="#15333A" />
      <circle cx={lx + 1.6} cy={y - 1.8} r={r * 0.38} fill="#FFFFFF" />
      <circle cx={rx + 1.6} cy={y - 1.8} r={r * 0.38} fill="#FFFFFF" />
    </g>
  );
}

/** "Bao" — a cute steamed bun */
export function Bao({ size = 96, className = "" }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 124" role="img" aria-label="Bao mascot" className={className}>
      <defs>
        <radialGradient id="baoBody" cx="40%" cy="32%" r="75%">
          <stop offset="0%" stopColor="#FFFDF7" />
          <stop offset="70%" stopColor="#FBEFD6" />
          <stop offset="100%" stopColor="#EAD3A6" />
        </radialGradient>
      </defs>
      <ellipse className="mascot-shadow" cx="60" cy="115" rx="30" ry="6" fill="#0A3B40" />
      <g className="mascot-bob">
        {/* steam */}
        <g stroke="#CFEFEA" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7">
          <path d="M48 18 q5 -6 0 -12" />
          <path d="M72 18 q-5 -6 0 -12" />
        </g>
        {/* body */}
        <ellipse cx="60" cy="64" rx="38" ry="34" fill="url(#baoBody)" />
        <ellipse cx="60" cy="84" rx="30" ry="12" fill="#D8B987" opacity="0.25" />
        {/* top pleats */}
        <g stroke="#E7Cfa0" strokeWidth="2.4" fill="none" strokeLinecap="round" opacity="0.8">
          <path d="M44 40 q6 8 0 14" />
          <path d="M60 36 q0 9 0 16" />
          <path d="M76 40 q-6 8 0 14" />
        </g>
        <circle cx="60" cy="36" r="4" fill="#FBEFD6" stroke="#E7CFA0" strokeWidth="1.5" />
        {/* arms */}
        <ellipse cx="26" cy="70" rx="7" ry="6.5" fill="#F3E1BC" />
        <ellipse cx="94" cy="70" rx="7" ry="6.5" fill="#F3E1BC" />
        {/* face */}
        <Eyes lx={50} rx={70} y={62} />
        <ellipse cx="40" cy="72" rx="5" ry="3.6" fill="#FF7A59" opacity="0.5" />
        <ellipse cx="80" cy="72" rx="5" ry="3.6" fill="#FF7A59" opacity="0.5" />
        <path d="M53 72 Q60 80 67 72" fill="none" stroke="#123036" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** "Bowl" — a happy noodle bowl */
export function Bowl({ size = 96, className = "" }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 124" role="img" aria-label="Bowl mascot" className={className}>
      <defs>
        <linearGradient id="bowlBody" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#17A89A" />
          <stop offset="100%" stopColor="#0A5963" />
        </linearGradient>
      </defs>
      <ellipse className="mascot-shadow" cx="60" cy="116" rx="30" ry="6" fill="#0A3B40" />
      <g className="mascot-bob">
        {/* steam */}
        <g stroke="#CFEFEA" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7">
          <path d="M48 26 q5 -6 0 -12" />
          <path d="M72 26 q-5 -6 0 -12" />
        </g>
        {/* chopsticks */}
        <g stroke="#E7C9A0" strokeWidth="3.4" strokeLinecap="round">
          <line x1="74" y1="20" x2="92" y2="62" />
          <line x1="82" y1="18" x2="98" y2="60" />
        </g>
        {/* food mound */}
        <ellipse cx="60" cy="56" rx="30" ry="13" fill="#FBEAD0" />
        <circle cx="50" cy="52" r="4.5" fill="#FF8A66" />
        <circle cx="68" cy="53" r="3.6" fill="#1FB16B" />
        <circle cx="60" cy="49" r="3.2" fill="#E8B84B" />
        {/* bowl */}
        <path d="M26 58 H94 a4 4 0 0 1 4 4 a38 30 0 0 1 -76 0 a4 4 0 0 1 4 -4 Z" fill="url(#bowlBody)" />
        <ellipse cx="60" cy="60" rx="34" ry="6.5" fill="#0C6B74" />
        {/* face on the bowl */}
        <Eyes lx={50} rx={70} y={74} r={4.4} />
        <ellipse cx="40" cy="82" rx="4.6" ry="3.4" fill="#FF7A59" opacity="0.45" />
        <ellipse cx="80" cy="82" rx="4.6" ry="3.4" fill="#FF7A59" opacity="0.45" />
        <path d="M54 82 Q60 89 66 82" fill="none" stroke="#FFF7E9" strokeWidth="2.6" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** "Boba" — a bubble-tea cup */
export function Boba({ size = 96, className = "" }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 124" role="img" aria-label="Boba mascot" className={className}>
      <defs>
        <linearGradient id="bobaTea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#F3DDB8" />
          <stop offset="100%" stopColor="#E3C091" />
        </linearGradient>
      </defs>
      <ellipse className="mascot-shadow" cx="60" cy="116" rx="26" ry="5.5" fill="#0A3B40" />
      <g className="mascot-bob">
        {/* straw */}
        <rect x="66" y="6" width="7" height="46" rx="3.5" transform="rotate(12 69 30)" fill="#FF7A59" />
        {/* cup body */}
        <path d="M36 40 H84 L80 104 a6 6 0 0 1 -6 5 H46 a6 6 0 0 1 -6 -5 Z" fill="#FFFFFF" opacity="0.92" stroke="#CFE6E3" strokeWidth="2" />
        {/* tea */}
        <path d="M38.5 60 H81.5 L78 100 a5 5 0 0 1 -5 4 H47 a5 5 0 0 1 -5 -4 Z" fill="url(#bobaTea)" />
        {/* lid */}
        <rect x="33" y="34" width="54" height="10" rx="5" fill="#17A89A" />
        <path d="M40 34 q20 -10 40 0 Z" fill="#0E7C86" />
        {/* pearls */}
        <g fill="#3A2A22">
          <circle cx="48" cy="98" r="3.4" /><circle cx="57" cy="100" r="3.4" /><circle cx="66" cy="98" r="3.4" /><circle cx="72" cy="96" r="3" /><circle cx="52" cy="94" r="3" />
        </g>
        {/* face */}
        <Eyes lx={51} rx={69} y={74} r={4.4} />
        <ellipse cx="42" cy="82" rx="4.4" ry="3.2" fill="#FF7A59" opacity="0.5" />
        <ellipse cx="78" cy="82" rx="4.4" ry="3.2" fill="#FF7A59" opacity="0.5" />
        <path d="M54 82 Q60 88 66 82" fill="none" stroke="#123036" strokeWidth="2.4" strokeLinecap="round" />
        {/* condensation */}
        <circle cx="44" cy="70" r="1.4" fill="#FFFFFF" opacity="0.7" />
        <circle cx="76" cy="92" r="1.6" fill="#FFFFFF" opacity="0.6" />
      </g>
    </svg>
  );
}

/** "ServBot" — a friendly waiter robot */
export function ServBot({ size = 96, className = "" }: MascotProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 124" role="img" aria-label="ServBot mascot" className={className}>
      <defs>
        <radialGradient id="botBody" cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#3FC9BA" />
          <stop offset="60%" stopColor="#0E7C86" />
          <stop offset="100%" stopColor="#0A5963" />
        </radialGradient>
      </defs>
      <ellipse className="mascot-shadow" cx="60" cy="116" rx="28" ry="6" fill="#0A3B40" />
      <g className="mascot-bob">
        {/* antenna */}
        <line x1="60" y1="18" x2="60" y2="30" stroke="#0C6B74" strokeWidth="3" strokeLinecap="round" />
        <circle cx="60" cy="15" r="4.5" fill="#E8B84B" />
        {/* body */}
        <rect x="26" y="28" width="68" height="60" rx="24" fill="url(#botBody)" />
        <ellipse cx="46" cy="44" rx="14" ry="9" fill="#FFFFFF" opacity="0.18" />
        {/* screen face */}
        <rect x="36" y="42" width="48" height="30" rx="12" fill="#0A2E33" />
        <g fill="#5FE6D6">
          <circle cx="50" cy="55" r="4.2" /><circle cx="70" cy="55" r="4.2" />
          <path d="M52 63 Q60 69 68 63" fill="none" stroke="#5FE6D6" strokeWidth="2.6" strokeLinecap="round" />
        </g>
        <ellipse cx="42" cy="52" rx="3.6" ry="2.6" fill="#FF7A59" opacity="0.5" />
        <ellipse cx="78" cy="52" rx="3.6" ry="2.6" fill="#FF7A59" opacity="0.5" />
        {/* arms + tray */}
        <rect x="14" y="74" width="14" height="6" rx="3" fill="#0C6B74" />
        <rect x="92" y="74" width="14" height="6" rx="3" fill="#0C6B74" />
        <ellipse cx="60" cy="92" rx="26" ry="5.5" fill="#FFF4E0" stroke="#E4CFA0" strokeWidth="1" />
        <path d="M50 90 a10 8 0 0 1 20 0 Z" fill="#17A89A" />
        <circle cx="60" cy="80" r="1.8" fill="#E8B84B" />
      </g>
    </svg>
  );
}

export type MascotId = "mate" | "bao" | "bowl" | "boba" | "servbot";

export const MASCOTS: { id: MascotId; th: string; en: string; Comp: (p: MascotProps) => ReactElement }[] = [
  { id: "mate", th: "เมท (เจ้าหน้าที่จิ๋ว)", en: "Mate", Comp: Mate },
  { id: "bao", th: "เปา (ซาลาเปาน้อย)", en: "Bao", Comp: Bao },
  { id: "bowl", th: "โบลว์ (ชามยิ้ม)", en: "Bowl", Comp: Bowl },
  { id: "boba", th: "โบบ้า (ชานมไข่มุก)", en: "Boba", Comp: Boba },
  { id: "servbot", th: "เสิร์ฟบอท (หุ่นเสิร์ฟ)", en: "ServBot", Comp: ServBot },
];

/** The mascot currently shown in the onboarding popup. Change this id to switch. */
export const ACTIVE_MASCOT: MascotId = "mate";

export function ActiveMascot(props: MascotProps) {
  const m = MASCOTS.find((x) => x.id === ACTIVE_MASCOT) ?? MASCOTS[0];
  const C = m.Comp;
  return <C {...props} />;
}
