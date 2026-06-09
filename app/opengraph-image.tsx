import { ImageResponse } from "next/og";

export const alt = "QR Store Mate — Scan to order";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// QR Store Mate "Trusty Badge" (logo #09) — embedded as an SVG data URI
const BADGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 220">
<g transform="translate(10,10)">
<rect width="200" height="200" rx="46" fill="#0E7C86"/>
<rect x="14" y="14" width="172" height="172" rx="36" fill="none" stroke="#FFF6E6" stroke-opacity="0.22" stroke-width="3"/>
<rect x="40" y="40" width="40" height="40" rx="12" fill="none" stroke="#FFF6E6" stroke-width="8"/><rect x="55" y="55" width="10" height="10" rx="3" fill="#E8B84B"/>
<rect x="120" y="40" width="40" height="40" rx="12" fill="none" stroke="#FFF6E6" stroke-width="8"/><rect x="135" y="55" width="10" height="10" rx="3" fill="#E8B84B"/>
<rect x="40" y="120" width="40" height="40" rx="12" fill="none" stroke="#FFF6E6" stroke-width="8"/><rect x="55" y="135" width="10" height="10" rx="3" fill="#E8B84B"/>
<rect x="98" y="44" width="12" height="12" rx="3" fill="#FFF6E6"/><rect x="98" y="64" width="12" height="12" rx="3" fill="#E8B84B"/>
<rect x="44" y="98" width="12" height="12" rx="3" fill="#E8B84B"/><rect x="64" y="98" width="12" height="12" rx="3" fill="#FFF6E6"/>
<g transform="translate(132,132) rotate(45)">
<g transform="translate(-13,0)"><rect x="-9" y="-44" width="3.6" height="16" rx="1.8" fill="#FFF6E6"/><rect x="-1.8" y="-44" width="3.6" height="16" rx="1.8" fill="#FFF6E6"/><rect x="5.4" y="-44" width="3.6" height="16" rx="1.8" fill="#FFF6E6"/><path d="M-9 -29 Q-1.5 -22 -1.5 -16 L1.5 -16 Q1.5 -22 9 -29 Z" fill="#FFF6E6"/><rect x="-2" y="-18" width="4" height="44" rx="2" fill="#FFF6E6"/></g>
<g transform="translate(13,0)"><ellipse cx="0" cy="-33" rx="8.5" ry="12" fill="#FFF6E6"/><rect x="-2" y="-22" width="4" height="48" rx="2" fill="#FFF6E6"/></g>
</g>
</g>
</svg>`;

export default function OpengraphImage() {
  const badge = `data:image/svg+xml,${encodeURIComponent(BADGE_SVG)}`;
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0E7C86",
        }}
      >
        <img src={badge} width={250} height={250} alt="" />
        <div style={{ marginTop: "26px", fontSize: "78px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-1px" }}>
          QR Store Mate
        </div>
        <div style={{ marginTop: "8px", fontSize: "36px", color: "#D9F2EF" }}>Scan · Order · Pay</div>
      </div>
    ),
    { ...size }
  );
}
