import type { MetadataRoute } from "next";

/** PWA manifest — lets owners "Add to Home Screen" and run the dashboard like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "QR Store Mate",
    short_name: "QR Store Mate",
    description: "ระบบสั่งอาหารผ่าน QR ที่โต๊ะ · QR table-ordering for restaurants",
    start_url: "/admin",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0E7C86",
    theme_color: "#0E7C86",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
