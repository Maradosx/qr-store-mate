/** Format a number as Thai Baht, e.g. 1290 -> "฿1,290". */
export function baht(n: number): string {
  if (!Number.isFinite(n)) return "฿0";
  return "฿" + Math.round(n).toLocaleString("en-US");
}
