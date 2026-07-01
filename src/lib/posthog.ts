import { PostHog } from "posthog-node";

let posthogClient: PostHog | null = null;

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com",
    flushAt: 1,
    flushInterval: 0, // send immediately in server actions/handlers
  });
}

/**
 * Capture an analytics event to PostHog, with fallback logging when keys are absent.
 */
export function trackEvent(distinctId: string, event: string, properties?: Record<string, any>) {
  console.log(`[PostHog Track] Event: "${event}" for User: ${distinctId}`, properties || {});
  
  if (posthogClient) {
    try {
      posthogClient.capture({
        distinctId,
        event,
        properties: {
          ...properties,
          $lib: "posthog-node",
          environment: process.env.NODE_ENV,
        },
      });
    } catch (err) {
      console.error("PostHog event capture failed:", err);
    }
  }
}
