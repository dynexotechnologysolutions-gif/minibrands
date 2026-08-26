import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

interface SearchResult {
  id: string;
  type: 'product' | 'order' | 'return' | 'inventory';
  title: string;
  subtitle: string;
  href: string;
  badge?: string;
  image?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();
    const type = searchParams.get("type") || "all";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [], totalCount: 0 });
    }

    // Get authenticated seller session
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get seller profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: { seller: true },
    });

    if (!userProfile?.seller) {
      return NextResponse.json({ error: "Seller profile not found" }, { status: 404 });
    }

    const sellerId = userProfile.seller.id;
    const results: SearchResult[] = [];

    // Search products
    if (type === "all" || type === "products") {
      const products = await prisma.product.findMany({
        where: {
          sellerId,
          isDeleted: false,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
            { description: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          variants: { select: { stockCount: true, size: true } },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      for (const product of products) {
        const stock = product.variants.reduce((sum, v) => sum + v.stockCount, 0);
        let badge: string | undefined;
        if (stock === 0) badge = "Out of Stock";
        else if (stock <= 10) badge = "Low Stock";

        results.push({
          id: product.id,
          type: "product",
          title: product.name,
          subtitle: `SKU: ${product.sku} · ${product.category} · ${stock} units`,
          href: `/seller/products/${product.id}/edit`,
          badge,
          image: product.images[0]?.url,
        });
      }
    }

    // Search orders
    if (type === "all" || type === "orders") {
      const orders = await prisma.order.findMany({
        where: {
          sellerId,
          OR: [
            { id: { contains: query, mode: "insensitive" } },
            { buyer: { user: { name: { contains: query, mode: "insensitive" } } } },
            { trackingNumber: { contains: query, mode: "insensitive" } },
            { status: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          buyer: { include: { user: true } },
          items: { include: { product: true } },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      for (const order of orders) {
        const statusBadge = order.status === "delivered" ? "Delivered" :
          order.status === "shipped" ? "Shipped" :
          order.status === "paid" ? "Paid" :
          order.status === "pending" ? "Pending" : order.status;

        results.push({
          id: order.id,
          type: "order",
          title: `Order #${order.id.slice(0, 8)}`,
          subtitle: `${order.buyer?.user?.name || "Unknown"} · ${order.items.length} item(s)`,
          href: `/seller/orders/${order.id}`,
          badge: statusBadge,
        });
      }
    }

    // Search returns
    if (type === "all" || type === "returns") {
      const returns = await prisma.returnRequest.findMany({
        where: {
          order: { sellerId },
          OR: [
            { id: { contains: query, mode: "insensitive" } },
            { reason: { contains: query, mode: "insensitive" } },
            { status: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          order: { select: { id: true, buyer: { include: { user: true } } } },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      for (const ret of returns) {
        const statusBadge = ret.status === "approved" ? "Approved" :
          ret.status === "rejected" ? "Rejected" :
          ret.status === "pending" ? "Pending" : ret.status;

        results.push({
          id: ret.id,
          type: "return",
          title: `Return #${ret.id.slice(0, 8)}`,
          subtitle: `Order #${ret.order.id.slice(0, 8)} · ${ret.order.buyer?.user?.name || "Unknown"}`,
          href: `/seller/returns/${ret.id}`,
          badge: statusBadge,
        });
      }
    }

    // Search inventory (products with variants)
    if (type === "all" || type === "inventory") {
      const products = await prisma.product.findMany({
        where: {
          sellerId,
          isDeleted: false,
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { sku: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        },
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
          variants: { select: { stockCount: true, size: true } },
        },
        take: limit,
        orderBy: { createdAt: "desc" },
      });

      for (const product of products) {
        const stock = product.variants.reduce((sum, v) => sum + v.stockCount, 0);
        let badge: string | undefined;
        if (stock === 0) badge = "Out of Stock";
        else if (stock <= 10) badge = "Low Stock";

        results.push({
          id: product.id,
          type: "inventory",
          title: product.name,
          subtitle: `SKU: ${product.sku} · ${product.category} · ${stock} units`,
          href: `/seller/inventory?search=${encodeURIComponent(query)}`,
          badge,
          image: product.images[0]?.url,
        });
      }
    }

    // Sort by relevance (exact matches first, then by creation date)
    const searchQuery = query.toLowerCase();
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(searchQuery);
      const bExact = b.title.toLowerCase().includes(searchQuery);
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return 0;
    });

    return NextResponse.json({
      results: results.slice(0, limit),
      totalCount: results.length,
    });
  } catch (error: any) {
    console.error("Seller search error:", error);
    return NextResponse.json(
      { error: error.message || "Search failed" },
      { status: 500 }
    );
  }
}