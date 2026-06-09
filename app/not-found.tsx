import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-6 text-center">
      <div className="flex flex-col items-center">
        <BrandMark size={56} />
        <p className="mt-5 text-5xl">🔍</p>
        <h1 className="mt-3 font-display text-2xl font-extrabold">ไม่พบหน้านี้ · Page not found</h1>
        <p className="mt-2 max-w-xs text-sm text-muted">
          ลิงก์อาจไม่ถูกต้องหรือถูกย้ายแล้ว · This link may be wrong or moved.
        </p>
        <Link
          href="/"
          className="mt-6 rounded-2xl bg-teal px-6 py-3 font-display text-sm font-bold text-white shadow-card active:scale-95"
        >
          กลับหน้าแรก · Home
        </Link>
      </div>
    </div>
  );
}
