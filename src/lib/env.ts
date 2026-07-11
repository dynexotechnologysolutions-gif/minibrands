import { z } from 'zod';

/**
 * Environment variable validation schema
 * Validates all required environment variables at application startup
 * Ensures configuration is complete before any code runs
 */

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().url('NEXT_PUBLIC_APP_URL must be a valid URL'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection string'),
  DB_POOL_MIN: z.coerce.number().int().min(1).default(2),
  DB_POOL_MAX: z.coerce.number().int().min(1).default(10),
  DB_CONNECTION_TIMEOUT: z.coerce.number().int().min(1000).default(30000),
  DB_STATEMENT_TIMEOUT: z.coerce.number().int().min(1000).default(30000),

  // Redis
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis connection string'),
  REDIS_TOKEN: z.string().optional(),

  // Razorpay Payment Processing
  RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required'),
  RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required'),
  RAZORPAY_WEBHOOK_SECRET: z.string().min(1, 'RAZORPAY_WEBHOOK_SECRET is required'),

  // Signzy KYC
  SIGNZY_API_KEY: z.string().min(1, 'SIGNZY_API_KEY is required'),
  SIGNZY_BASE_URL: z
    .string()
    .url('SIGNZY_BASE_URL must be a valid URL')
    .default('https://api.signzy.tech/api/v2'),
  SIGNZY_WEBHOOK_SECRET: z.string().min(1, 'SIGNZY_WEBHOOK_SECRET is required'),

  // Email Service
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  EMAIL_FROM: z.string().email('EMAIL_FROM must be a valid email'),

  // AI Services (Optional)
  GROQ_API_KEY: z.string().optional(),
  CLAUDE_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  AI_MODEL_NAME: z.string().default('meta-llama/llama-3-70b-instruct'),

  // Sentry Error Tracking
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().default('production'),
  SENTRY_RELEASE: z.string().optional(),

  // Cloudinary Image Hosting
  NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // PostHog Analytics
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  NEXT_PUBLIC_POSTHOG_HOST: z.string().url().optional(),

  // Business Configuration
  COMMISSION_RATE_PERCENT: z.coerce.number().min(0).max(100).default(8),
  SELLER_VERIFICATION_KYC_ENABLED: z.coerce.boolean().default(true),
  SELLER_VERIFICATION_BANK_ENABLED: z.coerce.boolean().default(true),
  ESCROW_RELEASE_DAYS: z.coerce.number().int().min(0).default(3),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  STRUCTURED_LOGS_ENABLED: z.coerce.boolean().default(true),

  // Security
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  SESSION_TIMEOUT_MINUTES: z.coerce.number().int().min(1).default(1440),
  ENABLE_RATE_LIMITING: z.coerce.boolean().default(true),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(600000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(100),

  // Infrastructure
  ENABLE_HEALTH_CHECKS: z.coerce.boolean().default(true),
  ENABLE_METRICS: z.coerce.boolean().default(true),
  METRICS_PORT: z.coerce.number().int().min(1024).default(9090),
  ENABLE_STRUCTURED_LOGGING: z.coerce.boolean().default(true),

  // Monitoring
  HEALTH_CHECK_INTERVAL_MS: z.coerce.number().int().min(1000).default(30000),
  READINESS_CHECK_INTERVAL_MS: z.coerce.number().int().min(1000).default(10000),
  LIVENESS_CHECK_INTERVAL_MS: z.coerce.number().int().min(1000).default(30000),

  // Feature Flags
  ENABLE_KYC_VERIFICATION: z.coerce.boolean().default(true),
  ENABLE_BANK_VERIFICATION: z.coerce.boolean().default(true),
  ENABLE_PAYMENT_PROCESSING: z.coerce.boolean().default(true),
  ENABLE_SELLER_ONBOARDING: z.coerce.boolean().default(true),

  // Deployment
  DEPLOYMENT_ENVIRONMENT: z.string().default('production'),
  DEPLOYMENT_REGION: z.string().default('us-east-1'),
  DEPLOYMENT_VERSION: z.string().default('1.0.0'),
});

type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

/**
 * Validates and returns environment variables
 * Throws error if validation fails - prevents silent misconfiguration
 */
export function getEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    console.error(
      `\n❌ FATAL: Environment variable validation failed!\n\nMissing or invalid variables:\n${errors}\n\nPlease check your .env file and ensure all required variables are set.\n`
    );

    process.exit(1);
  }

  validatedEnv = parsed.data;
  return validatedEnv;
}

/**
 * Get a specific environment variable with type safety
 */
export function getEnvVar<K extends keyof Env>(key: K): Env[K] {
  return getEnv()[key];
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvVar('NODE_ENV') === 'production';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvVar('NODE_ENV') === 'development';
}

/**
 * Check if running in test
 */
export function isTest(): boolean {
  return getEnvVar('NODE_ENV') === 'test';
}

/**
 * Export all env vars as singleton
 */
export const env = getEnv();
