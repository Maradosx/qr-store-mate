/**
 * "Mate" — the QR Store Mate mascot. An original, brand-built cute character
 * (Ocean Teal, glossy kawaii eyes, rosy cheeks, a waving hand + spoon, and a little
 * QR "tummy screen"). Pure inline SVG with soft gradients/highlights for a 3D look,
 * gently bobbing with a squashing ground shadow. Replaces the plain 🦐 emoji.
 */
export function Mascot({ size = 96, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 124"
      role="img"
      aria-label="Mate the QR Store Mate mascot"
      className={className}
    >
      <defs>
        <radialGradient id="mateBody" cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="#7FE3D6" />
          <stop offset="38%" stopColor="#28B6A6" />
          <stop offset="78%" stopColor="#0E7C86" />
          <stop offset="100%" stopColor="#0A5963" />
        </radialGradient>
        <radialGradient id="mateSheen" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="mateHand" cx="40%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#3FC9BA" />
          <stop offset="100%" stopColor="#0C6B74" />
        </radialGradient>
        <linearGradient id="mateSpoon" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#F0DEB8" />
        </linearGradient>
      </defs>

      {/* ground shadow (squashes as Mate lifts) */}
      <ellipse className="mascot-shadow" cx="60" cy="115" rx="30" ry="6" fill="#0A3B40" />

      <g className="mascot-bob">
        {/* left arm + spoon (behind body) */}
        <g>
          <rect x="58" y="78" width="6.5" height="26" rx="3.2" transform="rotate(34 60 88)" fill="url(#mateSpoon)" stroke="#E4Cfa0" strokeWidth="0.6" />
          <ellipse cx="84" cy="96" rx="7" ry="9" transform="rotate(34 84 96)" fill="url(#mateSpoon)" stroke="#E4Cfa0" strokeWidth="0.6" />
          <ellipse cx="29" cy="74" rx="9" ry="8.5" fill="url(#mateHand)" />
        </g>

        {/* body */}
        <ellipse cx="60" cy="60" rx="37" ry="39" fill="url(#mateBody)" />
        {/* bottom ambient occlusion for volume */}
        <ellipse cx="60" cy="84" rx="30" ry="14" fill="#063e44" opacity="0.28" />
        {/* glossy top sheen */}
        <ellipse cx="46" cy="36" rx="20" ry="13" fill="url(#mateSheen)" transform="rotate(-18 46 36)" />
        {/* rim light */}
        <path d="M26 46 A37 39 0 0 1 70 24" fill="none" stroke="#BFF6EC" strokeWidth="2.4" strokeLinecap="round" opacity="0.55" />

        {/* tummy QR screen (brand cue) */}
        <g transform="translate(60 78)">
          <rect x="-9" y="-9" width="18" height="18" rx="4.5" fill="#FFF7E9" opacity="0.95" />
          <g fill="#0A5963">
            <rect x="-6" y="-6" width="4.5" height="4.5" rx="1" />
            <rect x="1.5" y="-6" width="4.5" height="4.5" rx="1" />
            <rect x="-6" y="1.5" width="4.5" height="4.5" rx="1" />
            <rect x="2.6" y="2.6" width="2.4" height="2.4" rx="0.6" />
          </g>
        </g>

        {/* eyes */}
        <g>
          <ellipse cx="49" cy="52" rx="8" ry="10" fill="#FFFFFF" />
          <ellipse cx="71" cy="52" rx="8" ry="10" fill="#FFFFFF" />
          <circle cx="50.5" cy="54" r="4.7" fill="#15333A" />
          <circle cx="72.5" cy="54" r="4.7" fill="#15333A" />
          <circle cx="52.4" cy="51.6" r="1.8" fill="#FFFFFF" />
          <circle cx="74.4" cy="51.6" r="1.8" fill="#FFFFFF" />
          <circle cx="48.6" cy="56" r="0.9" fill="#FFFFFF" opacity="0.8" />
          <circle cx="70.6" cy="56" r="0.9" fill="#FFFFFF" opacity="0.8" />
        </g>

        {/* cheeks */}
        <ellipse cx="39" cy="64" rx="5.4" ry="4" fill="#FF7A59" opacity="0.5" />
        <ellipse cx="81" cy="64" rx="5.4" ry="4" fill="#FF7A59" opacity="0.5" />

        {/* happy open smile + tongue */}
        <path d="M52 64 Q60 75 68 64 Z" fill="#123036" />
        <path d="M55.5 66.5 Q60 71.5 64.5 66.5 Z" fill="#FF9E86" />

        {/* right waving hand */}
        <g className="mascot-wave">
          <ellipse cx="93" cy="44" rx="9" ry="8.5" fill="url(#mateHand)" />
          <ellipse cx="90" cy="40" rx="2.6" ry="3.4" fill="#BFF6EC" opacity="0.5" />
        </g>
      </g>

      {/* little sparkles for life */}
      <g fill="#FFE08A">
        <path d="M101 64 l1.4 3.2 3.2 1.4 -3.2 1.4 -1.4 3.2 -1.4 -3.2 -3.2 -1.4 3.2 -1.4 z" opacity="0.9" />
        <circle cx="20" cy="50" r="1.6" opacity="0.8" />
      </g>
    </svg>
  );
}
