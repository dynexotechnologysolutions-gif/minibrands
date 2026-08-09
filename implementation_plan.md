# Guest Purchase & Checkout — New Implementation Plan

This implementation plan details the architecture, forensic audits, threat models, database structures, and validation rules required to build a secure, frictionless Guest Checkout and Post-Purchase Account Claim flow on Velvet Lane (MiniBrands).

---

## 1. Executive Summary

This plan outlines the architecture for allowing anonymous visitors to add items to an isolated guest cart, proceed to checkout without an account, calculate checkout totals server-side, complete Razorpay payments, view success pages, and optionally claim their order history to a new or existing account verified via Better Auth Email OTP. The design enforces strict server-side price validation, payment idempotency, and clean session/cart segregation to ensure zero regression impact on the existing authenticated checkout flow.

---

## 2. Current Repository Findings

### 2.1 Prisma Schema Audit
A direct audit of the active `prisma/schema.prisma` file verifies that the required guest-related fields exist exactly as follows:
- `Order.buyerId` is **optional** (`String?`), pointing to the `UserProfile` relation.
- `Order.addressId` is **optional** (`String?`), pointing to the `Address` relation.
- Guest columns are fully defined on the `Order` model:
  - `guestEmail`: `String?`
  - `guestPhone`: `String?`
  - `guestName`: `String?`
  - `guestShippingAddress`: `Json?`
  - `guestTokenHash`: `String? @unique`
  - `guestTokenCreatedAt`: `DateTime?`
  - `guestTokenExpiresAt`: `DateTime?`
  - `guestClaimedAt`: `DateTime?`
- Indexing annotations:
  - `@@index([guestEmail])`
  - `@@index([guestTokenHash])`

### 2.2 Middleware Audit
In `src/middleware.ts`, route categories are mapped statically:
- `BUYER_PROTECTED_PATHS` protects `/cart` and `/checkout`, blocking unauthenticated access.
- `/checkout/guest`, `/order/success/guest`, and `/claim-order` are public.

### 2.3 Redis Cart & Stock Locks
Authenticated cart reservations are stored under `reservation:{reservationId}` with a 15-minute TTL.

### 2.4 Checkout Sessions
`createCheckoutSession` stores checkout snapshots in Redis under `checkout-session:{sessionId}`.

---

## 3. Root Cause of Guest → Login Redirect

Forensic trace of unauthenticated visitor redirect actions:

### 3.1 Buy Now Redirect Root Cause
1. **Trigger**: Guest clicks "Buy Now" on the PDP (`ProductDetailClient.tsx`).
2. **Redirect Source**: The handler `handleBuyNow` checks `!userProfile` and redirects to `/login?redirectTo=...`.
3. **Clean Fix**: Route authenticated users to `/checkout?sessionId=...` and guests to `/checkout/guest?sessionId=...`.

### 3.2 Add to Cart Redirect Root Cause
1. **Trigger**: Guest clicks "Add to Cart" on the PDP.
2. **Redirect Source**: The handler invokes the `reserveCartItem` server action, which validates the session. Upon receiving an `UNAUTHORIZED` code, `ProductDetailClient.tsx` redirects the user to `/login`.
3. **Clean Fix**: Call `/api/guest-cart/reserve` when unauthenticated.

### 3.3 Cart Page Redirect Root Cause
1. **Trigger**: Guest navigates to `/cart`.
2. **Redirect Source**: Intercepted by `middleware.ts` since `/cart` is defined under `BUYER_PROTECTED_PATHS`.
3. **Clean Fix**: Move `/cart` to public routing and check for session context inside the page.

---

## 4. Current Authentication Architecture

Uses Better Auth cookie-based session verification (`better-auth.session_token` / `__Secure-better-auth.session_token`) mapping to `User` and `UserProfile` entities.

---

## 5. Current Cart Architecture

Stock holds are managed dynamically in Redis using Lua scripts for atomic stock checks and reservation locks.

---

## 6. Current Buy Now Flow

Stores the items to be purchased in Redis (`checkout-session:{sessionId}`) and navigates the browser to `/checkout?sessionId={sessionId}`.

---

## 7. Current Payment Architecture

- **Creation**: `/api/payments/create-order` creates a Razorpay order and caches intent variables.
- **Verification**: `/api/payments/verify` verifies HMAC signatures and persists the order.

---

## 8. Current Order Architecture

Order status management flows through standard states, integrating with iCarry for logistics and managing escrow releases.

---

## 9. Problems With Existing Guest Implementation

1. **Middleware Redirects**: `/cart` is locked, preventing guests from viewing cart items.
2. **Lack of Guest session support**: `/checkout/guest` only reads reservations from cookies, failing to resolve `sessionId` parameters.
3. **Redis Stock Pollution**: Standard reservation logic expects a `userProfileId`.

---

## 10. Proposed Guest Cart Architecture

### 10.1 Guest Cart Identity Lifecycle
1. **Identity Generation**: Generate a cryptographically secure 256-bit random hex string (`guestCartId`) using `crypto.randomBytes(32).toString('hex')`. Store it in an httpOnly cookie (`mb-guest-cart`) with a **30-day expiration** (`Secure`, `SameSite=Lax`, `Path=/`).
2. **Indexed Cart Structure**: To avoid using Redis `KEYS` wildcard scans in production, use a Redis Set/Hash structure to track cart contents, alongside separate reservation keys for stock holds:
   - `guest-cart:{guestCartId}`: A Redis Hash or Set listing `variantId` mapping to `quantity` and reservation parameters.
   - `guest-reservation:{guestCartId}:{variantId}`: The individual stock reservation key (15-minute TTL).
   - **Reservation Expiry**: The `guest-cart:{guestCartId}` catalog remains valid for 30 days. When the 15-minute reservation expires, the item is still listed in the cart page but is marked as "Reservation Expired / Item Unavailable" until reserved again during continues checkout.
3. **Cart Page**: `/cart` server component explicitly branches:
   - If session exists: load authenticated cart data by `userProfileId`.
   - If session does not exist: read the catalog from `guest-cart:{guestCartId}` using the `mb-guest-cart` cookie. If the cookie is missing, display an empty guest cart.
   - Never trust client-supplied user profile or guest cart IDs.
4. **Payment Success**: Verify endpoint deletes both the reservation keys and the `guest-cart:{guestCartId}` catalog, and clears the cookie.
5. **No LocalStorage Fallback**: The httpOnly cookie is the sole identity source. If cookies are disabled, show a clear warning asking the user to enable cookies to proceed.

### 10.2 Cart CRUD Operations
- **Add Product (POST `/api/guest-cart/items`)**: Validates variant existence and stock levels, generates `guestCartId` cookie if missing, and reserves item in Redis.
- **Get Cart (GET `/api/guest-cart`)**: Queries the `guest-cart:{guestCartId}` index and checks active reservation statuses.
- **Update Quantity (PATCH `/api/guest-cart/items/[variantId]`)**: Validates new quantity bounds against database stock limits.
- **Remove Product (DELETE `/api/guest-cart/items/[variantId]`)**: Deletes the variant from the catalog index and removes the Redis reservation key.
- **Clear Cart (DELETE `/api/guest-cart`)**: Deletes the catalog and all active reservations.

### 10.3 Cart Merge Rules
- **Boundary**: Triggered from a dedicated `mergeGuestCart` service boundary immediately after a user completes a successful Better Auth login/OTP event.
- **Conflict Rule**: Same variant quantity merges as `min(guestQty + userQty, availableStock)`.
- **Safety**: Do not delete guest Redis keys or clear the cookie before the authenticated cart merge succeeds.

---

## 11. Proposed Guest Buy Now Architecture

### 11.1 Authoritative Buy Now Flow
- **Session generation**: Create a dedicated guest-checkout session service `createGuestCheckoutSession()`, completely independent of the guest cart. It validates variant details and stock server-side, generates a secure random 256-bit `sessionId`, and caches details in Redis under `guest-checkout-session:{sessionId}` with a 15-minute TTL.
- **Dedicated Route**: Guest navigates directly to `/checkout/guest?sessionId={sessionId}`.
- **Session Binding**: Bind the `guest-checkout-session` in Redis to the visitor's `guestCartId` cookie. If the request cookie does not match the session payload's `guestCartId`, reject access.

---

## 12. Proposed Guest Checkout UX

### Architectural Reason for `/checkout/guest` Route Separation
1. **Security Isolation**: `/checkout` is highly protected. Separating routes prevents accidental data leaks.
2. **Frictionless UI Layout**: Renders a dedicated contact/shipping form without the overhead of saved profile selectors.
3. **Data Mapping Clarity**: Maps checkout inputs directly to guest order columns.

### UI Form Structure
- **Step 1: Contact**: Email, Phone.
- **Step 2: Delivery**: Name, Line 1, Line 2, City, State, PIN Code, Country.
- **Step 3: Summary**: Products, quantities, prices, fees, totals.
- **Step 4: Payment**: Secure Razorpay trigger.

---

## 13. Proposed Payment Architecture

### 13.1 Authoritative Server-Side Checkout Validation Contract
The guest payment endpoint must validate:
- Product existence & variant-to-product relationship.
- Active status of product.
- Seller KYC and bank verification status.
- Current active price lookup (never trust browser-submitted prices).
- Current variant stock availability.
- Quantity restrictions and rate limits.
- Subtotals, taxes, shipping charges, and final payable amount.

### 13.2 Payment Verification Idempotency
To prevent duplicate order creation from repeated callbacks:
- **Lock Verification**: Perform checking and order creation inside an atomic Prisma database transaction.
- **Unique Constraint Checks**:
  - If `razorpayPaymentId` has already been processed and exists in the database, return the existing order.
  - If `razorpayOrderId` already has an order linked in the database, do not create another order.
- **Cache Invalidation**: Delete cached pending order payloads from Redis immediately after processing.

### 13.3 One Authoritative Order-Creation Path
Both `/api/payments/verify` (client-redirect handler) and `/api/webhooks/razorpay` (background webhook callback) must delegate to a single backend service helper `processSuccessfulPayment()`.
- The helper validates signature HMACs, confirms Razorpay ID parameters match the cached pending payment record, verifies payment amounts, manages stock decrement transactions, creates the `Order` record, and releases reservations.

---

## 14. Proposed Guest Order Architecture

- **Prisma Schema Mapping**:
  - `buyerId = null`, `addressId = null` for guest orders.
  - Snapshot fields populated: `guestEmail` (normalized), `guestPhone`, `guestName`, `guestShippingAddress` (structured JSON: `{ name, phone, addressLine1, addressLine2, city, state, postalCode, country: "IN" }`).
- **Secure Guest Tokens**:
  - Generate a 32-byte secure random token (`rawToken`).
  - Store only its SHA-256 hash (`guestTrackingTokenHash`).
  - Raw token is displayed once (in order success URL) and never stored.
  - Automatically expire the token after 30 days.

---

## 15. Post-Purchase Account Claim Architecture

### 15.1 OTP Account Creation & Confirmation Prompt
- On checkout success, show a non-blocking prompt: *"Want to track your order easily? Create a account using this email."*
- If the guest logs in or registers with the same email and completes Better Auth OTP verification:
  - UX presents a claim confirmation prompt: *"We found previous guest orders using this email. Would you like to add them to your account? [Claim these orders] [Not now]"*.
  - Claiming links `Order.buyerId = currentUserProfileId` and sets `guestClaimedAt = now()` inside a database transaction, while keeping `guestEmail` and `guestShippingAddress` as immutable snapshots.
- **Separate Claim from Expiration**: Expired tracking tokens prevent public tracking link lookups (`guestTrackingTokenExpiresAt`), but do NOT block account claims for order history.

---

## 16. Security Model

- **No LocalStorage Fallback**: The `mb-guest-cart` HttpOnly Secure SameSite cookie is the sole guest identity. If cookies are disabled, show a clear warning requesting cookie activation.
- **Order Tracking Isolation**: `GET /api/guest-orders/[token]` is strictly read-only, exposing only limited status information. Mutations (address updates, cancellations, or claiming) are blocked and require a verified Better Auth session.
- **Token Expiration Policies**:
  - `guestTrackingTokenExpiresAt` restricts tracking link access to 30 days.
  - Claim eligibility does not expire, letting users link historical orders to their accounts at any time.
- **Rate Limiting**: Enforce IP and cookie-based rate limits on all guest endpoints:
  - `/api/guest-cart/items`
  - `/api/payments/guest-create-order`
  - `/api/payments/verify`
  - `/api/guest-orders/[token]`
  - `/api/guest-orders/claim`

---

## 17. Route / Middleware Changes

- **Update `middleware.ts`**:
  - Move `/cart` to public access routes.
  - Add `/checkout/guest`, `/order/success/guest`, `/claim-order`, and guest APIs to `PUBLIC_PATHS`.
- **Update Navigation**: Hide bottom navigation menus on guest pages to maximize mobile screen space.

---

## 18. API / Server Action Matrix

| Operation | Guest-Capable | Authenticated | Target Endpoint | Auth Required |
|---|---|---|---|---|
| **Add to Cart** | Yes | Yes | `/api/guest-cart/items` | No |
| **Buy Now** | Yes | Yes | `createGuestCheckoutSession()` / `createCheckoutSession()` | No (for Guest Session) |
| **Create Payment** | Yes | Yes | `/api/payments/guest-create-order` / `/api/payments/create-order` | No (for Guest API) |
| **Verify Payment** | Yes | Yes | `/api/payments/verify` | No |
| **Claim Order** | No | Yes | `/api/guest-orders/claim` | Yes |

---

## 19. Database Changes

No database changes are needed at this stage, as all necessary guest-related fields are already present in the SQL schema:
- `Order.buyerId` and `Order.addressId` are nullable.
- Guest columns (`guestEmail`, `guestPhone`, `guestName`, `guestShippingAddress`, `guestTokenHash`, `guestTokenCreatedAt`, `guestTokenExpiresAt`, `guestClaimedAt`) are fully defined.

---

## 20. File-by-File Change Plan

1. **`src/middleware.ts`**:
   - Move `/cart` from `BUYER_PROTECTED_PATHS` to public route matching.
   - Register guest checkout and claim routes under `PUBLIC_PATHS`.
2. **`src/app/products/[productId]/ProductDetailClient.tsx`**:
   - Update `handleAddToCart` to post to `/api/guest-cart/items` when unauthenticated.
   - Update `handleBuyNow` to call `createGuestCheckoutSession` and redirect guests to `/checkout/guest`.
3. **`src/app/checkout/guest/page.tsx`**:
   - Read `sessionId` parameters and resolve session-based products.
4. **`src/app/api/payments/guest-create-order/route.ts`**:
   - Save the extracted `mb-guest-cart` cookie into Redis payload metadata.
5. **`src/app/api/payments/verify/route.ts`**:
   - Delete cached guest cart keys in Redis upon payment success.

---

## 21. Implementation Phases

- **Phase 0 — Repository & dependency audit**: Audit middleware, cart pages, Buy Now session creators, and check database schema fields.
- **Phase 1 — Guest identity + cookie**: Set up the secure httpOnly `mb-guest-cart` cart cookie logic.
- **Phase 2 — Guest cart**: Connect APIs for adding, removing, and listing guest cart keys in Redis.
- **Phase 3 — Guest Buy Now session**: Integrate Redis-based temporary buy now checkout sessions.
- **Phase 4 — Guest checkout UX**: Build the `/checkout/guest` layout and fields.
- **Phase 5 — Payment creation**: Implement server-side verification and Razorpay order payload creation.
- **Phase 6 — Unified payment verification + webhook**: Add transaction validations preventing duplicate orders.
- **Phase 7 — Guest order creation**: Persist orders without buyer relation tags.
- **Phase 8 — Guest success/tracking**: Deploy public, read-only status checks.
- **Phase 9 — Account claim**: Link verified account profiles to matching orders.
- **Phase 10 — Cart merge**: Merge cart item quantities on post-login actions.
- **Phase 11 — Security + regression testing**: Verify rate limiting, token boundaries, and authenticated checkout flows.

---

## 22. Testing Strategy

- **Test Guest Cart holds**: Confirm guest cart reserves stock using `mb-guest-cart` cookie.
- **Test Guest Buy Now**: Confirm guest clicking "Buy Now" goes to `/checkout/guest?sessionId=...` without logging in.
- **Test Verify HMAC signature**: Assert signature verification fails if header variables are tampered with.
- **Test Atomic Claims**: Assert dual concurrent claim requests reject second caller securely.

---

## 23. Regression Strategy

- **Authenticated Checkout**: Run existing authenticated user checkout test scripts to verify `buyerId` links correctly.
- **Escrow Actions**: Verify admin financial ledgers and seller shipping dashboard routes retrieve buyer details correctly when `buyerId` exists.

---

## 24. Rollback Strategy

In case of critical failures:
1. Revert Git changes to the previous commit.
2. Rebuild the application and confirm the production bundle compiles.

---

## 25. Definition of Done

- Unauthenticated visitors can complete "Add to Cart" and "Buy Now" flows.
- Pricing, shipping, and taxes are calculated server-side.
- Payment verification validates order status and Razorpay HMAC signature.
- Claiming verified order ownership links database profiles securely and transactionally.
- Production build compilation succeeds cleanly.

---

## 26. Risks

- **Stock holding abuse**: Bots creating guest carts could lock inventory.
  - *Mitigation*: Rate limit reservation endpoints and keep TTL to 15 minutes.
- **Cookie Blockage**: If browser blocks cookies, guest carts fail.
  - *Mitigation*: Show clear browser/cookie requirement. Do not fall back to localStorage.

---

## 27. Final Recommendation

**Proceed with Phase 1 to Phase 4**. The architecture is highly secure, addresses the root cause redirection, and isolates guest workflows effectively.
