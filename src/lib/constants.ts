/**
 * Application-wide constants
 * Single source of truth for business logic constants
 */

export const PAYMENT_CONSTANTS = {
  // Commission rate as decimal (8%)
  COMMISSION_RATE: 0.08,

  // Payment states
  PAYMENT_STATUS: {
    PENDING: 'pending',
    CAPTURED: 'captured',
    FAILED: 'failed',
    REFUNDED: 'refunded',
  } as const,

  // Order states
  ORDER_STATUS: {
    CREATED: 'created',
    PAID: 'paid',
    CONFIRMED: 'confirmed',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    DISPUTED: 'disputed',
  } as const,

  // Transaction timeout in milliseconds
  TRANSACTION_TIMEOUT_MS: 30000,

  // Razorpay retry configuration
  RAZORPAY_RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_BACKOFF_MS: 1000,
    MAX_BACKOFF_MS: 10000,
  },
};

export const SELLER_CONSTANTS = {
  // Seller verification states
  KYC_STATUS: {
    PENDING: 'pending',
    AUTO_APPROVED: 'auto_approved',
    APPROVED: 'approved',
    REJECTED: 'rejected',
  } as const,

  // Minimum trust score for seller to go live
  MIN_TRUST_SCORE_TO_SELL: 0.5,

  // Maximum sellers to display on homepage
  HOMEPAGE_FEATURED_SELLERS: 10,
};

export const PRODUCT_CONSTANTS = {
  // Maximum product description length
  MAX_DESCRIPTION_LENGTH: 5000,

  // Maximum image uploads per product
  MAX_IMAGES_PER_PRODUCT: 10,

  // Products per page in search results
  PRODUCTS_PER_PAGE: 20,

  // Max price in paise (10M rupees)
  MAX_PRICE_PAISE: 1000000000,

  // Min price in paise (1 rupee)
  MIN_PRICE_PAISE: 100,
};

export const STOCK_CONSTANTS = {
  // Stock reservation TTL in seconds (15 minutes)
  RESERVATION_TTL_SECONDS: 900,

  // Maximum quantity per order item
  MAX_QUANTITY_PER_ITEM: 999,

  // Minimum quantity
  MIN_QUANTITY: 1,
};

export const RATE_LIMITING = {
  // Login attempts per window
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_WINDOW_MS: 600000, // 10 minutes

  // Checkout attempts per user per window
  CHECKOUT_MAX_ATTEMPTS: 20,
  CHECKOUT_WINDOW_MS: 600000, // 10 minutes

  // Payment verification attempts
  PAYMENT_VERIFY_MAX_ATTEMPTS: 10,
  PAYMENT_VERIFY_WINDOW_MS: 300000, // 5 minutes

  // KYC initiation attempts
  KYC_MAX_ATTEMPTS: 3,
  KYC_WINDOW_MS: 3600000, // 1 hour

  // General API rate limit
  API_MAX_REQUESTS: 1000,
  API_WINDOW_MS: 3600000, // 1 hour
};

export const SESSION_CONSTANTS = {
  // Session timeout in seconds (1 day)
  SESSION_TIMEOUT_SECONDS: 86400,

  // Session refresh threshold (refresh if <25% time remaining)
  SESSION_REFRESH_THRESHOLD_PERCENT: 0.25,
};

export const EMAIL_CONSTANTS = {
  // Email verification OTP expiry in seconds (5 minutes)
  OTP_EXPIRY_SECONDS: 300,

  // Maximum OTP attempts
  MAX_OTP_ATTEMPTS: 3,

  // OTP resend cooldown in seconds (60 seconds)
  OTP_RESEND_COOLDOWN_SECONDS: 60,
};

export const API_CONSTANTS = {
  // API version
  API_VERSION: 'v1',

  // Default page size for paginated responses
  DEFAULT_PAGE_SIZE: 20,

  // Maximum page size
  MAX_PAGE_SIZE: 100,

  // Cache duration in seconds for product listings
  CACHE_PRODUCT_LIST_SECONDS: 300,

  // Cache duration for seller data
  CACHE_SELLER_SECONDS: 600,
};

export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_INVALID: 'TOKEN_INVALID',

  // Authorization errors
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // Payment errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_REJECTED: 'PAYMENT_REJECTED',
  PAYMENT_TIMEOUT: 'PAYMENT_TIMEOUT',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',

  // Stock errors
  OUT_OF_STOCK: 'OUT_OF_STOCK',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  RESERVATION_EXPIRED: 'RESERVATION_EXPIRED',

  // Seller errors
  SELLER_NOT_VERIFIED: 'SELLER_NOT_VERIFIED',
  SELLER_SUSPENDED: 'SELLER_SUSPENDED',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',

  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;

export const HTTP_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  GONE: 410,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;
