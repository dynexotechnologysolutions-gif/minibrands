import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/admin/",
          "/seller/",
          "/account/",
          "/cart",
          "/checkout",
          "/orders/",
          "/order/",
          "/claim-order",
          "/session-expired",
          "/verify-email",
          "/reset-password",
          "/forgot-password",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
