import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/url";

const title = "Contact Us & Customer Support | MiniBrands";
const description =
  "Get in touch with MiniBrands support for order inquiries, seller onboarding assistance, and escrow payment questions.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: getCanonicalUrl("/contact"),
  },
  openGraph: {
    title,
    description,
    url: getCanonicalUrl("/contact"),
    siteName: "MiniBrands",
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
