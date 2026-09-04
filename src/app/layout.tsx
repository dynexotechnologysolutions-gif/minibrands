import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import Footer from "@/components/Footer";

import { getSiteUrl } from "@/lib/seo/url";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MiniBrands | Fashion-Forward Local Marketplace",
    template: "%s | MiniBrands",
  },
  description:
    "Connect with verified independent fashion sellers and boutique designers in Chennai. Trust-first commerce with escrow-protected payments.",
  applicationName: "MiniBrands",
  keywords: [
    "fashion",
    "local designers",
    "boutiques",
    "independent fashion labels",
    "chennai fashion",
    "ethnic wear",
    "streetwear",
    "handloom",
    "escrow shopping",
  ],
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "MiniBrands",
    title: "MiniBrands | Fashion-Forward Local Marketplace",
    description:
      "Connect with verified independent fashion sellers and boutique designers in Chennai. Trust-first commerce with escrow-protected payments.",
  },
  twitter: {
    card: "summary_large_image",
    title: "MiniBrands | Fashion-Forward Local Marketplace",
    description:
      "Connect with verified independent fashion sellers and boutique designers in Chennai. Trust-first commerce with escrow-protected payments.",
  },
  verification: {
    google: "1PsXLcbI_29j1sR5rCwVaLoTSVoBcCTHwoBzDSVZ4z8",
  },
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
