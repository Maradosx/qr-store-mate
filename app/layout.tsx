import type { Metadata, Viewport } from "next";
import { Sora, Niramit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const niramit = Niramit({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-niramit",
  display: "swap",
});

const SITE_URL = "https://qrstoremate.vercel.app";
const TITLE = "QR Store Mate — สั่งง่ายแค่สแกน · Scan to order";
const DESCRIPTION =
  "ระบบสั่งอาหารผ่าน QR ที่โต๊ะ สำหรับร้านอาหาร · QR table-ordering & PromptPay for restaurants.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  // favicon + apple icon are auto-detected from app/icon.svg and app/apple-icon.tsx
  openGraph: {
    type: "website",
    siteName: "QR Store Mate",
    url: SITE_URL,
    title: TITLE,
    description: DESCRIPTION,
    locale: "th_TH",
    alternateLocale: ["en_US"],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0E7C86",
  width: "device-width",
  initialScale: 1,
  // no maximumScale — allow pinch-zoom for accessibility
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${sora.variable} ${niramit.variable}`}>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
