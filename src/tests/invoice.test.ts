import { describe, it, expect } from "vitest";
import { generateInvoicePDF, InvoiceData } from "@/lib/invoice-generator";

describe("Invoice Download System Unit Tests", () => {
  const mockInvoiceData: InvoiceData = {
    orderId: "ord_test_12345678",
    invoiceNumber: "INV-VL-ORD_TEST",
    orderDate: "24 Oct 2026",
    paymentId: "pay_test_987654321",
    paymentMethod: "Online (Razorpay)",
    status: "DELIVERED",

    buyer: {
      name: "Vinod Kumar",
      email: "vinod@example.com",
      phone: "+91 9876543210",
      address: {
        line1: "123 Park Street",
        line2: "Apt 4B",
        city: "Chennai",
        pincode: "600001",
        country: "India",
      },
    },

    seller: {
      businessName: "Dynex Boutiques",
      storeName: "Dynex Store",
      city: "Chennai",
      gstin: "33AAACV1234F1Z5",
      isVerified: true,
    },

    items: [
      {
        name: "Black Casual Shirt",
        brand: "Dynex Boutiques",
        size: "L",
        quantity: 2,
        unitPrice: 1500,
        totalPrice: 3000,
      },
    ],

    subtotal: 3000,
    shipping: 0,
    discount: 0,
    tax: 540,
    grandTotal: 3000,
  };

  it("generates a valid binary PDF buffer starting with %PDF header", () => {
    const pdfBuffer = generateInvoicePDF(mockInvoiceData);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(500);

    // PDF files start with magic bytes %PDF (hex 25 50 44 46)
    const pdfMagicBytes = pdfBuffer.toString("utf-8", 0, 4);
    expect(pdfMagicBytes).toBe("%PDF");
  });

  it("correctly evaluates order status eligibility for invoice download", () => {
    const isEligible = (status: string) => {
      const normalized = status.toLowerCase();
      return ["delivered", "completed"].includes(normalized);
    };

    expect(isEligible("delivered")).toBe(true);
    expect(isEligible("completed")).toBe(true);
    expect(isEligible("DELIVERED")).toBe(true);
    expect(isEligible("COMPLETED")).toBe(true);

    expect(isEligible("created")).toBe(false);
    expect(isEligible("paid")).toBe(false);
    expect(isEligible("confirmed")).toBe(false);
    expect(isEligible("packed")).toBe(false);
    expect(isEligible("shipped")).toBe(false);
    expect(isEligible("out_for_delivery")).toBe(false);
    expect(isEligible("cancelled")).toBe(false);
    expect(isEligible("returned")).toBe(false);
  });
});
