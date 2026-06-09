// Hands-free Thai voice alerts via PRE-RENDERED audio clips played through Web Audio.
//
// Why not the Web Speech API (speechSynthesis)? On iOS/iPadOS Safari, speak() is gated
// behind a *live* user gesture on essentially every call and has no "unlock once and reuse"
// — so utterances fired from realtime/poll callbacks (our alerts) are silently dropped. The
// chime works because Web Audio only needs a ONE-TIME unlock (resume the AudioContext inside
// a tap, then any later callback can play). So we render the Thai lines to short AAC clips
// (voice "Kanya") and play them through that same already-unlocked context — inheriting the
// chime's proven reliability on iPad. Clips live in /public/voice/*.m4a.

type Ctx = AudioContext;

let ctx: Ctx | null = null;
const buffers = new Map<string, AudioBuffer>();
const inflight = new Map<string, Promise<AudioBuffer | null>>();
let scheduledUntil = 0; // ctx time the current announcement queue runs until (so calls don't overlap)
let preloaded = false;

function makeCtx(): Ctx | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    return Ctor ? new Ctor() : null;
  } catch {
    return null;
  }
}

function getCtx(): Ctx | null {
  if (!ctx) ctx = makeCtx();
  return ctx;
}

// Call from a real user gesture (pointerdown) — creates + resumes the shared context so later
// clip playback from realtime callbacks is allowed to make sound, exactly like the chime.
export function unlockVoiceAudio() {
  const c = getCtx();
  if (!c) return;
  try {
    if (c.state === "suspended") void c.resume();
  } catch {
    /* ignore */
  }
}

// decodeAudioData with the promise form + a callback fallback (older Safari only has callbacks)
function decode(c: Ctx, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    try {
      const p = c.decodeAudioData(data, resolve, reject) as unknown as Promise<AudioBuffer> | undefined;
      if (p && typeof p.then === "function") p.then(resolve, reject);
    } catch (e) {
      reject(e);
    }
  });
}

function getBuffer(key: string): Promise<AudioBuffer | null> {
  const cached = buffers.get(key);
  if (cached) return Promise.resolve(cached);
  const pending = inflight.get(key);
  if (pending) return pending;
  const c = getCtx();
  if (!c) return Promise.resolve(null);
  const job = fetch(`/voice/${key}.m4a`)
    .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(String(r.status)))))
    .then((ab) => decode(c, ab))
    .then((buf) => {
      buffers.set(key, buf);
      inflight.delete(key);
      return buf;
    })
    .catch(() => {
      inflight.delete(key);
      return null;
    });
  inflight.set(key, job);
  return job;
}

// Warm the most-used clips after the first tap (fixed phrases + low table numbers).
export function preloadVoice() {
  if (preloaded) return;
  preloaded = true;
  const keys = ["table", "staff", "bill", "neworder", "pm_cash", "pm_promptpay", "pm_bank", "pm_copay"];
  for (let n = 1; n <= 50; n++) keys.push(`n${n}`);
  for (const k of keys) void getBuffer(k);
}

type Kind = "new" | "staff" | "bill";
export type VoicePayMethod = "promptpay" | "bank" | "copay" | "cash";

function clipKeysFor(kind: Kind, tables: string[], method?: VoicePayMethod | null): string[] {
  const keys = ["table"];
  for (const tb of tables) {
    const n = parseInt(String(tb), 10);
    if (Number.isInteger(n) && n >= 1 && n <= 99) keys.push(`n${n}`);
  }
  keys.push(kind === "new" ? "neworder" : kind); // "staff" | "bill"
  if (kind === "bill" && method) keys.push(`pm_${method}`); // e.g. "โต๊ะ ห้า เรียกเก็บเงิน เงินสด"
  return keys;
}

// Speak e.g. "โต๊ะ ห้า เรียกเก็บเงิน เงินสด" by sequencing the matching clips on the shared context.
// Concurrent calls queue (no overlap). Best-effort & silent on failure.
export async function announce(kind: Kind, tables: string[], method?: VoicePayMethod | null) {
  const c = getCtx();
  if (!c) return;
  try {
    if (c.state === "suspended") await c.resume();
  } catch {
    /* ignore — same gesture limitation as the chime */
  }
  const keys = clipKeysFor(kind, tables, method);
  const seq: AudioBuffer[] = [];
  for (const k of keys) {
    const b = await getBuffer(k);
    if (b) seq.push(b);
  }
  if (!seq.length) return;
  const GAP = 0.06; // small breath between words
  // lead ~0.5s so the spoken line follows the chime's tail instead of overlapping it
  let cursor = Math.max(c.currentTime + 0.5, scheduledUntil);
  for (const b of seq) {
    try {
      const src = c.createBufferSource();
      src.buffer = b;
      src.connect(c.destination);
      src.start(cursor);
    } catch {
      /* ignore a single failed clip */
    }
    cursor += b.duration + GAP;
  }
  scheduledUntil = cursor;
}
