/** QR Store Mate "Trusty Badge" icon (logo #09), self-contained vector. */
export function BrandMark({
  size = 44,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      className={className}
      aria-label="QR Store Mate"
      role="img"
    >
      <g transform="translate(10,10)">
        <rect width="200" height="200" rx="46" fill="#0E7C86" />
        <rect x="14" y="14" width="172" height="172" rx="36" fill="none" stroke="#FFF6E6" strokeOpacity="0.22" strokeWidth="3" />
        <rect x="40" y="40" width="40" height="40" rx="12" fill="none" stroke="#FFF6E6" strokeWidth="8" />
        <rect x="55" y="55" width="10" height="10" rx="3" fill="#E8B84B" />
        <rect x="120" y="40" width="40" height="40" rx="12" fill="none" stroke="#FFF6E6" strokeWidth="8" />
        <rect x="135" y="55" width="10" height="10" rx="3" fill="#E8B84B" />
        <rect x="40" y="120" width="40" height="40" rx="12" fill="none" stroke="#FFF6E6" strokeWidth="8" />
        <rect x="55" y="135" width="10" height="10" rx="3" fill="#E8B84B" />
        <rect x="98" y="44" width="12" height="12" rx="3" fill="#FFF6E6" />
        <rect x="98" y="64" width="12" height="12" rx="3" fill="#E8B84B" />
        <rect x="44" y="98" width="12" height="12" rx="3" fill="#E8B84B" />
        <rect x="64" y="98" width="12" height="12" rx="3" fill="#FFF6E6" />
        <g transform="translate(132,132) rotate(45)">
          <g transform="translate(-13,0)">
            <rect x="-9" y="-44" width="3.6" height="16" rx="1.8" fill="#FFF6E6" />
            <rect x="-1.8" y="-44" width="3.6" height="16" rx="1.8" fill="#FFF6E6" />
            <rect x="5.4" y="-44" width="3.6" height="16" rx="1.8" fill="#FFF6E6" />
            <path d="M-9 -29 Q-1.5 -22 -1.5 -16 L1.5 -16 Q1.5 -22 9 -29 Z" fill="#FFF6E6" />
            <rect x="-2" y="-18" width="4" height="44" rx="2" fill="#FFF6E6" />
          </g>
          <g transform="translate(13,0)">
            <ellipse cx="0" cy="-33" rx="8.5" ry="12" fill="#FFF6E6" />
            <rect x="-2" y="-22" width="4" height="48" rx="2" fill="#FFF6E6" />
          </g>
        </g>
      </g>
    </svg>
  );
}

/** Wordmark lockup: badge + "QR Store Mate". */
export function BrandLockup({
  height = 34,
  dark = false,
}: {
  height?: number;
  dark?: boolean;
}) {
  const store = dark ? "#FFF6E6" : "#0E7C86";
  return (
    <span className="inline-flex items-center gap-2.5">
      <BrandMark size={height * 1.08} />
      <span
        className="font-display font-extrabold leading-none tracking-tight"
        style={{ fontSize: height * 0.62 }}
      >
        <span style={{ color: "#E8B84B" }}>QR</span>{" "}
        <span style={{ color: store }}>Store Mate</span>
      </span>
    </span>
  );
}
