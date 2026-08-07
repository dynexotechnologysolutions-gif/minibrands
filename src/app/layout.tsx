import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Velvet Lane | Chennai's Fashion-Forward Local Marketplace",
  description: "Connect with verified independent fashion sellers and designers in Chennai. Trust-first commerce with escrow-protected payments.",
  keywords: ["fashion", "local designers", "chennai boutiques", "independent fashion labels", "social commerce"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-sans pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
        <Providers>{children}</Providers>
        <div className="hidden md:block"><Footer /></div>
      </body>
    </html>
  );
}
