import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface LegacyAddressesPageProps {
  searchParams: Promise<Record<string, string>>;
}

export default async function LegacyAddressesPage({ searchParams }: LegacyAddressesPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams(params).toString();
  redirect(`/account/addresses${query ? `?${query}` : ""}`);
}
