"use server";

import { trackEvent } from "@/lib/posthog";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function trackClientEvent(
  event: string,
  properties?: Record<string, any>
): Promise<{ success: boolean }> {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    const distinctId = session?.user?.id || "anonymous";
    trackEvent(distinctId, event, properties);
    return { success: true };
  } catch (error) {
    console.error("Failed to track client event:", error);
    return { success: false };
  }
}
