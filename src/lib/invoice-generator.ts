import { jsPDF } from "jspdf";

export interface InvoiceData {
  orderId: string;
  invoiceNumber: string;
  orderDate: string;
  deliveryDate?: string;
  paymentId?: string;
  paymentMethod: string;
  status: string;
  
  // Buyer Details
  buyer: {
    name: string;
    email: string;
    phone: string;
    address: {
      line1: string;
      line2?: string | null;
      city: string;
      pincode: string;
      country?: string;
    };
  };

  // Seller Details
  seller: {
    businessName: string;
    storeName?: string;
    city: string;
    gstin?: string;
    isVerified: boolean;
  };

  // Items
  items: {
    name: string;
    brand: string;
    size: string;
    quantity: number;
    unitPrice: number; // in INR
    totalPrice: number; // in INR
  }[];

  // Financial Breakdown (in INR)
  subtotal: number;
  shipping: number;
  discount: number;
  tax: number;
  grandTotal: number;
}

export function generateInvoicePDF(data: InvoiceData): Buffer {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 297mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Colors
  const primaryColor = "#0F172A"; // Slate 900
  const secondaryColor = "#475569"; // Slate 600
  const accentColor = "#16A34A"; // Emerald Green
  const borderGray = "#E2E8F0"; // Slate 200
  const lightBg = "#F8FAFC"; // Slate 50

  let y = margin;

  // 1. Header Bar (MINIBRANDS / Velvet Lane Logo & TAX INVOICE)
  doc.setFillColor(15, 23, 42); // #0F172A
  doc.rect(margin, y, contentWidth, 22, "F");

  // Logo / Title Text
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("MINIBRANDS", margin + 6, y + 10);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Velvet Lane Marketplace", margin + 6, y + 16);

  // TAX INVOICE Title (Right aligned in Header)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("TAX INVOICE", pageWidth - margin - 6, y + 11, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Original for Recipient", pageWidth - margin - 6, y + 16, { align: "right" });

  y += 26;

  // 2. Invoice Meta Info Box (Grid 2 columns)
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentWidth, 24, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, contentWidth, 24, "S");

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105); // Slate 600

  // Left meta
  doc.setFont("helvetica", "bold");
  doc.text("Invoice No:", margin + 4, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(data.invoiceNumber, margin + 24, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text("Invoice Date:", margin + 4, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(data.orderDate, margin + 26, y + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Place of Supply:", margin + 4, y + 18);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.buyer.address.city}, India`, margin + 30, y + 18);

  // Right meta
  const rightColX = margin + 100;
  doc.setFont("helvetica", "bold");
  doc.text("Order No:", rightColX, y + 6);
  doc.setFont("helvetica", "normal");
  doc.text(data.orderId, rightColX + 20, y + 6);

  doc.setFont("helvetica", "bold");
  doc.text("Payment ID:", rightColX, y + 12);
  doc.setFont("helvetica", "normal");
  doc.text(data.paymentId || "N/A", rightColX + 22, y + 12);

  doc.setFont("helvetica", "bold");
  doc.text("Payment Mode:", rightColX, y + 18);
  doc.setFont("helvetica", "normal");
  doc.text(`${data.paymentMethod} (Paid)`, rightColX + 26, y + 18);

  y += 28;

  // 3. Addresses Section (Seller & Buyer - Side by Side)
  const colWidth = (contentWidth - 6) / 2;

  // Seller Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, y, colWidth, 34, "S");

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, colWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("SOLD BY (SELLER)", margin + 4, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(data.seller.businessName, margin + 4, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`City: ${data.seller.city}, India`, margin + 4, y + 18);
  doc.text(`GSTIN: ${data.seller.gstin || "33AAACV1234F1Z5 (Marketplace)"}`, margin + 4, y + 23);
  doc.text(`Verification: ${data.seller.isVerified ? "Verified Merchant ✓" : "Standard Seller"}`, margin + 4, y + 28);

  // Buyer Box
  const buyerX = margin + colWidth + 6;
  doc.rect(buyerX, y, colWidth, 34, "S");
  doc.setFillColor(241, 245, 249);
  doc.rect(buyerX, y, colWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("BILL TO / SHIP TO (BUYER)", buyerX + 4, y + 5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(data.buyer.name, buyerX + 4, y + 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(`${data.buyer.address.line1}${data.buyer.address.line2 ? ", " + data.buyer.address.line2 : ""}`, buyerX + 4, y + 18);
  doc.text(`${data.buyer.address.city} - ${data.buyer.address.pincode}`, buyerX + 4, y + 23);
  doc.text(`Phone: ${data.buyer.phone}  |  Email: ${data.buyer.email}`, buyerX + 4, y + 28);

  y += 38;

  // 4. Items Table
  // Headers: S.No | Description & Variant | Qty | Unit Price | Tax (18%) | Amount
  const cols = [
    { name: "#", width: 10, align: "center" },
    { name: "Item Description & Details", width: 82, align: "left" },
    { name: "Qty", width: 15, align: "center" },
    { name: "Unit Price", width: 25, align: "right" },
    { name: "GST (18%)", width: 25, align: "right" },
    { name: "Total (INR)", width: 25, align: "right" },
  ];

  // Table Header Draw
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);

  let currentX = margin;
  cols.forEach((col) => {
    let textX = currentX + 2;
    if (col.align === "right") textX = currentX + col.width - 2;
    if (col.align === "center") textX = currentX + col.width / 2;
    doc.text(col.name, textX, y + 5, { align: col.align as any });
    currentX += col.width;
  });

  y += 7;

  // Table Rows Draw
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  data.items.forEach((item, idx) => {
    const rowHeight = 10;
    // Row zebra background
    if (idx % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, y, contentWidth, rowHeight, "F");
    }
    doc.setDrawColor(226, 232, 240);
    doc.rect(margin, y, contentWidth, rowHeight, "S");

    const taxAmount = Math.round((item.totalPrice * 0.18) / 1.18);
    const priceBeforeTax = item.totalPrice - taxAmount;

    let x = margin;
    // #
    doc.text(`${idx + 1}`, x + 5, y + 6, { align: "center" });
    x += cols[0].width;

    // Description
    const itemTitle = `${item.name} (${item.brand}) - Size: ${item.size}`;
    const truncatedTitle = itemTitle.length > 48 ? itemTitle.substring(0, 46) + "..." : itemTitle;
    doc.text(truncatedTitle, x + 2, y + 6);
    x += cols[1].width;

    // Qty
    doc.text(`${item.quantity}`, x + cols[2].width / 2, y + 6, { align: "center" });
    x += cols[2].width;

    // Unit Price
    doc.text(`₹${item.unitPrice.toLocaleString("en-IN")}`, x + cols[3].width - 2, y + 6, { align: "right" });
    x += cols[3].width;

    // Tax
    doc.text(`₹${taxAmount.toLocaleString("en-IN")}`, x + cols[4].width - 2, y + 6, { align: "right" });
    x += cols[4].width;

    // Amount
    doc.text(`₹${item.totalPrice.toLocaleString("en-IN")}`, x + cols[5].width - 2, y + 6, { align: "right" });

    y += rowHeight;
  });

  y += 4;

  // 5. Summary Box (Subtotal, Tax, Shipping, Grand Total)
  const summaryWidth = 90;
  const summaryX = pageWidth - margin - summaryWidth;

  doc.setFillColor(248, 250, 252);
  doc.rect(summaryX, y, summaryWidth, 32, "F");
  doc.setDrawColor(226, 232, 240);
  doc.rect(summaryX, y, summaryWidth, 32, "S");

  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);

  let sumY = y + 6;
  doc.text("Items Subtotal:", summaryX + 4, sumY);
  doc.text(`₹${data.subtotal.toLocaleString("en-IN")}`, summaryX + summaryWidth - 4, sumY, { align: "right" });

  sumY += 5;
  doc.text("Estimated GST (18% included):", summaryX + 4, sumY);
  doc.text(`₹${data.tax.toLocaleString("en-IN")}`, summaryX + summaryWidth - 4, sumY, { align: "right" });

  sumY += 5;
  doc.text("Delivery / Shipping:", summaryX + 4, sumY);
  doc.text(data.shipping === 0 ? "FREE" : `₹${data.shipping.toLocaleString("en-IN")}`, summaryX + summaryWidth - 4, sumY, { align: "right" });

  if (data.discount > 0) {
    sumY += 5;
    doc.text("Promotional Discount:", summaryX + 4, sumY);
    doc.text(`-₹${data.discount.toLocaleString("en-IN")}`, summaryX + summaryWidth - 4, sumY, { align: "right" });
  }

  sumY += 7;
  doc.setFillColor(15, 23, 42);
  doc.rect(summaryX, sumY - 4, summaryWidth, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("GRAND TOTAL (PAID):", summaryX + 4, sumY + 1.5);
  doc.text(`₹${data.grandTotal.toLocaleString("en-IN")}`, summaryX + summaryWidth - 4, sumY + 1.5, { align: "right" });

  y += 38;

  // 6. Declaration & Legal Notes
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text("DECLARATION & TERMS", margin, y);

  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("1. This is a computer-generated tax invoice and does not require a physical signature.", margin, y);
  doc.text("2. All goods sold through Velvet Lane Marketplace are subject to standard marketplace return and refund policies.", margin, y + 4);
  doc.text("3. For any billing queries, support, or invoice corrections, please contact support@minibrands.com.", margin, y + 8);

  // 7. Footer
  const footerY = pageHeight - margin - 8;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);

  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text("Thank you for shopping on MINIBRANDS Velvet Lane Marketplace!", margin, footerY);
  doc.text("www.minibrands.com | Support: support@minibrands.com | © 2026 Velvet Lane Inc.", pageWidth - margin, footerY, { align: "right" });

  // Convert arraybuffer to Node.js Buffer
  const arrayBuffer = doc.output("arraybuffer");
  return Buffer.from(arrayBuffer);
}
