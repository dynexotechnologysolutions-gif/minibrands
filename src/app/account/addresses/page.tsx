import React from "react";
import AddressPageContent, { AddressesPageProps } from "../../addresses/AddressPageContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Address Selection | Velvet Lane",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccountAddressesPage({ searchParams }: AddressesPageProps) {
  return <AddressPageContent searchParams={searchParams} />;
}

