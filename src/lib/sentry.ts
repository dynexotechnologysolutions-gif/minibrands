import * as Sentry from "@sentry/nextjs";

/**
 * Capture error to Sentry with additional context tags
 */
export function captureAndLogError(error: any, contextName: string, additionalContext?: Record<string, any>) {
  console.error(`[Sentry Alert] Error in ${contextName}:`, error);

  Sentry.withScope((scope) => {
    scope.setTag("context", contextName);
    if (additionalContext) {
      scope.setExtras(additionalContext);
    }
    Sentry.captureException(error);
  });
}
