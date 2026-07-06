import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoicePDF, InvoiceData } from "@/lib/invoice-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;

    // 1. Authenticate user
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Authentication required to download invoice." },
        { status: 401 }
      );
    }

    // 2. Fetch User Profile
    const userProfile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: true,
        seller: true,
      },
    });

    if (!userProfile) {
      return NextResponse.json(
        { error: "User profile not found." },
        { status: 401 }
      );
    }

    // 3. Fetch Order with all relations
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        buyer: {
          include: { user: true },
        },
        seller: {
          include: { verification: true },
        },
        address: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found." },
        { status: 404 }
      );
    }

    // 4. Authorization Check: Buyer who owns the order, Seller of the order, or Admin
    const isBuyer = order.buyerId === userProfile.id;
    const isSeller = userProfile.seller && order.sellerId === userProfile.seller.id;
    const isAdmin = userProfile.role === "ADMIN";

    if (!isBuyer && !isSeller && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to download this invoice." },
        { status: 403 }
      );
    }

    // 5. Status Gate Check: Invoice available ONLY for delivered or completed orders
    const currentStatus = (order.orderStatus || order.status || "").toLowerCase();
    const isDeliveredOrCompleted = ["delivered", "completed"].includes(currentStatus);

    if (!isDeliveredOrCompleted) {
      return NextResponse.json(
        { error: "Tax invoice is available only after the order has been delivered." },
        { status: 400 }
      );
    }

    // 6. Format Financials (Paise to INR)
    const subtotalINR = Math.round((order.subtotal || order.totalAmount) / 100);
    const shippingINR = Math.round((order.shipping || 0) / 100);
    const taxINR = Math.round((order.tax || Math.round(order.totalAmount * 0.18)) / 100);
    const grandTotalINR = Math.round(order.totalAmount / 100);

    const formattedOrderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const isSellerVerified =
      order.seller.verification &&
      (order.seller.verification.kycStatus === "auto_approved" ||
        order.seller.verification.kycStatus === "approved") &&
      order.seller.verification.bankVerified;

    // 7. Assemble Invoice Data
    const invoiceData: InvoiceData = {
      orderId: order.id,
      invoiceNumber: `INV-VL-${order.id.substring(0, 8).toUpperCase()}`,
      orderDate: formattedOrderDate,
      paymentId: order.razorpayPaymentId || undefined,
      paymentMethod: order.razorpayPaymentId ? "Online (Razorpay)" : "Prepaid",
      status: currentStatus.toUpperCase(),

      buyer: {
        name: order.address.fullName || order.buyer.user.name,
        email: order.buyer.user.email,
        phone: order.address.phone,
        address: {
          line1: order.address.line1,
          line2: order.address.line2,
          city: order.address.city,
          pincode: order.address.pincode,
          country: "India",
        },
      },

      seller: {
        businessName: order.seller.businessName,
        storeName: order.seller.storeName || order.seller.businessName,
        city: order.seller.city,
        isVerified: !!isSellerVerified,
      },

      items: order.items.map((item) => {
        const unitPriceINR = Math.round(item.unitPrice / 100);
        const totalPriceINR = unitPriceINR * item.quantity;
        return {
          name: item.product.name,
          brand: order.seller.businessName,
          size: item.variant.size,
          quantity: item.quantity,
          unitPrice: unitPriceINR,
          totalPrice: totalPriceINR,
        };
      }),

      subtotal: subtotalINR,
      shipping: shippingINR,
      discount: 0,
      tax: taxINR,
      grandTotal: grandTotalINR,
    };

    // 8. Generate PDF Buffer
    const pdfBuffer = generateInvoicePDF(invoiceData);

    // 9. Return PDF Response
    const filename = `minibrands_Invoice_${order.id.substring(0, 8).toUpperCase()}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    });
  } catch (error: any) {
    console.error("[INVOICE_API_ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error generating invoice." },
      { status: 500 }
    );
  }
}
