import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Studio, auth, and API surfaces carry no public content and shouldn't
        // burn crawl budget or land in results.
        disallow: ["/studio", "/dashboard", "/sign-in", "/api/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
