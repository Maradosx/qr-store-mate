const TONES: Record<string, string> = {
  prawn: "linear-gradient(135deg,#ffb27a,#ff7a4d 55%,#c23b1e)",
  tomyum: "linear-gradient(135deg,#ffd08a,#ff7a59 50%,#c0392b)",
  noodle: "linear-gradient(135deg,#ffd97a,#e8821b 60%,#9a4d12)",
  rice: "linear-gradient(135deg,#ffe08a,#f0a83c 55%,#b5702a)",
  curry: "linear-gradient(135deg,#cfe26a,#4f9e3a 60%,#2e6b2a)",
  papaya: "linear-gradient(135deg,#ffd36a,#f0863c 55%,#c0432b)",
  spring: "linear-gradient(135deg,#ffd98a,#d98b3c 60%,#8a531f)",
  satay: "linear-gradient(135deg,#f4b95e,#cf7a2c 55%,#7a4516)",
  chicken: "linear-gradient(135deg,#ffce7a,#e0913c 55%,#9a5a1f)",
  tea: "linear-gradient(135deg,#f0c08a,#b5764a 55%,#6e4426)",
  drink: "linear-gradient(135deg,#bfeede,#5fc7b0 55%,#229f8c)",
  mango: "linear-gradient(135deg,#ffe07a,#ffb13c 55%,#e07a1e)",
  default: "linear-gradient(135deg,#cfeae4,#7fc3b6 60%,#2a9d8f)",
};

export function DishImage({
  tone,
  emoji,
  img,
  className = "",
  emojiSize = 40,
  dim = false,
}: {
  tone: string;
  emoji: string;
  img?: string;
  className?: string;
  emojiSize?: number;
  dim?: boolean;
}) {
  // Always render the emoji + gradient as the BASE; overlay the uploaded photo on top.
  // If the photo (data URL) fails to decode, the base shows through — no broken image.
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: TONES[tone] ?? TONES.default }}
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 22% 8%, rgba(255,255,255,.45), rgba(255,255,255,0) 45%)",
        }}
      />
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          fontSize: emojiSize,
          filter: "drop-shadow(0 6px 10px rgba(0,0,0,.22))",
          opacity: dim ? 0.55 : 1,
        }}
      >
        <span style={{ transform: "rotate(-6deg)" }}>{emoji}</span>
      </div>
      {img && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={img}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            style={{ opacity: dim ? 0.55 : 1 }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 80% at 22% 8%, rgba(255,255,255,.25), rgba(255,255,255,0) 45%)",
            }}
          />
        </>
      )}
    </div>
  );
}
