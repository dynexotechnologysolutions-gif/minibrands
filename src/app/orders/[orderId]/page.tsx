import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

interface LegacyOrderDetailPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function LegacyOrderDetailPage({ params }: LegacyOrderDetailPageProps) {
  const resolvedParams = await params;
  redirect(`/account/orders/${resolvedParams.orderId}`);
}
