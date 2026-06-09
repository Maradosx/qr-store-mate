import type { MetadataRoute } from "next";

/** Let search engines index the marketing/legal pages; keep admin + per-shop pages out. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/r/", "/t/", "/reset"],
    },
  };
}
