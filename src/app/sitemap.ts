import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getCanonicalUrl } from "@/lib/seo/url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 1. Core static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: getCanonicalUrl(""),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: getCanonicalUrl("/products"),
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: getCanonicalUrl("/stores"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: getCanonicalUrl("/categories"),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: getCanonicalUrl("/about"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: getCanonicalUrl("/contact"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: getCanonicalUrl("/faqs"),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: getCanonicalUrl("/terms"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: getCanonicalUrl("/privacy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: getCanonicalUrl("/returns-policy"),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // 2. Category pages
  const categories = [
    "Women's Ethnic Wear",
    "Streetwear",
    "Accessories",
    "Handloom",
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: getCanonicalUrl(`/category/${encodeURIComponent(cat)}`),
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  // 3. Dynamic published products
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await prisma.product.findMany({
      where: {
        isPublished: true,
        isDeleted: false,
        status: "PUBLISHED",
        seller: {
          verification: {
            kycStatus: { in: ["auto_approved", "approved"] },
            bankVerified: true,
          },
        },
      },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 40000,
    });

    productRoutes = products.map((p) => ({
      url: getCanonicalUrl(`/products/${p.id}`),
      lastModified: p.updatedAt || now,
      changeFrequency: "daily",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[SITEMAP] Failed to fetch products:", error);
  }

  // 4. Dynamic verified sellers storefronts
  let sellerRoutes: MetadataRoute.Sitemap = [];
  try {
    const sellers = await prisma.seller.findMany({
      where: {
        verification: {
          kycStatus: { in: ["auto_approved", "approved"] },
          bankVerified: true,
        },
        products: {
          some: {
            isPublished: true,
            isDeleted: false,
          },
        },
      },
      select: {
        id: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 10000,
    });

    sellerRoutes = sellers.map((s) => ({
      url: getCanonicalUrl(`/sellers/${s.id}`),
      lastModified: s.updatedAt || now,
      changeFrequency: "daily",
      priority: 0.7,
    }));
  } catch (error) {
    console.error("[SITEMAP] Failed to fetch sellers:", error);
  }

  return [...staticRoutes, ...categoryRoutes, ...productRoutes, ...sellerRoutes];
}
