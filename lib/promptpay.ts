// PromptPay (Thai) EMVCo QR payload generator — real, scannable, pays to the shop's account.
// Supports mobile number, national/tax ID, and e-wallet ID, with a dynamic amount.

function tlv(id: string, value: string): string {
  return id + value.length.toString().padStart(2, "0") + value;
}

function crc16(input: string): string {
  let crc = 0xffff;
  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Returns true if a PromptPay target string looks usable. */
export function isValidPromptPay(target: string | undefined | null): boolean {
  if (!target) return false;
  const d = target.replace(/[^0-9]/g, "");
  return d.length === 10 || d.length === 13 || d.length === 15;
}

/**
 * Build an EMVCo PromptPay payload.
 * @param target mobile (10 digits) | national/tax id (13) | e-wallet (15)
 * @param amount THB amount (omit/null for a static QR with no amount)
 */
export function promptPayPayload(target: string, amount?: number | null): string {
  const d = target.replace(/[^0-9]/g, "");
  let acc: string;
  if (d.length >= 15) acc = tlv("03", d); // e-wallet
  else if (d.length >= 13) acc = tlv("02", d); // national / tax id
  else acc = tlv("01", "0066" + d.replace(/^0/, "")); // mobile → 0066 + number w/o leading 0

  const merchant = tlv("29", tlv("00", "A000000677010111") + acc);
  const hasAmount = amount != null && amount > 0;

  let payload =
    tlv("00", "01") + // payload format indicator
    tlv("01", hasAmount ? "12" : "11") + // 12 = dynamic (one-time), 11 = static
    merchant +
    tlv("53", "764") + // currency THB
    (hasAmount ? tlv("54", Number(amount).toFixed(2)) : "") +
    tlv("58", "TH"); // country

  payload += "6304"; // CRC tag + length placeholder
  return payload + crc16(payload);
}
