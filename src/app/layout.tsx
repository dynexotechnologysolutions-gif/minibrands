import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "ShopHub | Many Stores. One Trusted Place.",
  description: "Connect with verified independent fashion sellers and designers. Trust-first commerce with escrow-protected payments.",
  keywords: ["fashion", "local designers", "boutiques", "independent fashion labels", "social commerce"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.css" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-sans pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
        <Providers>{children}</Providers>
        <div className="hidden md:block"><Footer /></div>
      </body>
    </html>
  );
}
