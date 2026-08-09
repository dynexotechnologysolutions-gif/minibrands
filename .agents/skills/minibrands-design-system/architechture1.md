# MiniBrands — Guest Checkout & Post-Purchase Account Linking Architecture

**Document Type:** Technical Architecture Specification
**Feature:** Guest Checkout + Post-Purchase Account Linking
**Platform:** MiniBrands Marketplace
**Status:** Architecture Proposal
**Primary Goal:** Allow first-time visitors to purchase without creating an account, then optionally create/login to an account after purchase and automatically associate the guest order with that account.

---

# 1. Feature Overview

MiniBrands will support two purchasing modes:

```text
                    MINI BRANDS CHECKOUT
                           │
             ┌─────────────┴─────────────┐
             │                           │
       Authenticated Buyer          Guest Visitor
             │                           │
             ▼                           ▼
       Normal Checkout             Guest Checkout
             │                           │
             ▼                           ▼
        Create Order             Create Guest Order
             │                           │
             ▼                           ▼
        User Account          Guest Order + Guest Identity
                                         │
                                         ▼
                                  Payment Successful
                                         │
                                         ▼
                                  Order Confirmation
                                         │
                                         ▼
                            "Track Your Order" Prompt
                                         │
                              ┌──────────┴──────────┐
                              │                     │
                           Login                 Continue
                              │                     │
                              ▼                     │
                    Verify Existing Email         │
                              │                     │
                              ▼                     │
                     Claim Guest Order             │
                              │                     │
                              ▼                     │
                       Account Orders              │
                                                   
```

The important principle is:

> **Guest checkout must create a real order without requiring a user account, but the order must retain enough verified identity information to be safely claimed later.**

---

# 2. Business Objective

The feature should reduce checkout friction while preserving account-based functionality.

### Current problem

A new visitor may:

1. Find a product.
2. Add it to cart.
3. Reach checkout.
4. Be forced to register/login.
5. Abandon the purchase.

### Proposed experience

A new visitor can:

1. Browse products.
2. Add products to cart.
3. Checkout without login.
4. Enter required delivery/contact information.
5. Complete payment.
6. Receive order confirmation.
7. See a prompt:

> **Want to track your order easily? Create an account or sign in.**

8. Login using the same email used during checkout.
9. MiniBrands automatically associates the guest order with that account.

---

# 3. Core Design Principle

The system should NOT create a temporary fake buyer account merely to process the order.

Instead:

```text
Guest Checkout
      │
      ▼
Guest Order
      │
      ├── email
      ├── phone
      ├── shipping information
      ├── payment information/reference
      └── guest identity token
```

After authentication:

```text
Guest Order
      │
      ▼
Authenticated User
      │
      ▼
Order.userId = User.id
```

This keeps account creation separate from purchasing.

---

# 4. Identity Model

The guest checkout identity should be based primarily on the verified checkout email.

Example:

```text
Guest Identity

email:
customer@example.com

phone:
+91XXXXXXXXXX

guestOrderToken:
secure-random-token

orderId:
ORD-XXXXXXXX
```

The email is the primary account-linking identifier.

However:

> Never automatically attach orders to an account using an unverified email alone.

The user must prove ownership of the email through the existing Better Auth OTP flow.

---

# 5. Database Architecture

The existing `Order` model should be extended rather than creating a completely separate guest-order system.

## Recommended Order fields

```prisma
model Order {
  id              String   @id @default(cuid())

  userId          String?
  user            User?    @relation(fields: [userId], references: [id])

  guestEmail      String?
  guestPhone      String?

  guestOrderToken String?  @unique

  status          OrderStatus
  paymentStatus   PaymentStatus

  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Existing order fields...
}
```

### Important

`userId` must become nullable.

```text
Authenticated Order:

userId = user_123
guestEmail = null
```

Guest Order:

```text
userId = null
guestEmail = customer@example.com
guestOrderToken = secure-token
```

Claimed Guest Order:

```text
userId = user_123
guestEmail = customer@example.com
guestOrderToken = secure-token
```

The original guest information can be retained for auditing.

---

# 6. Guest Checkout Identity

Create a dedicated guest checkout identity concept if the existing architecture requires more robust guest lifecycle management.

Recommended structure:

```prisma
model GuestCheckout {
  id          String   @id @default(cuid())

  email       String
  phone       String?

  tokenHash   String   @unique

  createdAt   DateTime @default(now())
  expiresAt   DateTime?

  orders      Order[]
}
```

However, if MiniBrands only needs simple guest checkout initially, this additional model is optional.

### MVP recommendation

Use:

```text
Order
 ├── guestEmail
 ├── guestPhone
 └── guestOrderToken
```

Avoid introducing unnecessary infrastructure.

---

# 7. Guest Cart Architecture

The cart must support users who are not authenticated.

Recommended architecture:

```text
Authenticated User
      │
      ▼
Database Cart
      │
      ▼
User ID


Guest Visitor
      │
      ▼
Browser Cart ID
      │
      ▼
Cookie / Local Storage
```

Example:

```text
guest_cart_id = gc_abc123
```

The cart identifier should NOT contain sensitive information.

---

# 8. Checkout Flow

## Step 1 — Guest adds product

```text
Visitor
  ↓
Product
  ↓
Add to Cart
  ↓
Guest Cart
```

No login required.

---

# 9. Checkout Information

The checkout page should request only information required to fulfill the order.

### Required

```text
Full Name
Email
Phone Number
Address
City
State
Postal Code
Country
```

Depending on the existing payment/shipping requirements, additional fields may be required.

### Optional

```text
Company
Landmark
Delivery Instructions
```

Avoid asking for:

```text
Password
Username
Account creation
```

during initial guest checkout.

---

# 10. Checkout UI

The checkout should clearly communicate:

```text
Checkout

Contact Information
-------------------
Email
Phone

Delivery Address
----------------
Name
Address
City
State
PIN Code

Payment
-------
Razorpay

[ Place Order ]
```

Do NOT make account creation mandatory.

Optional microcopy:

> You can create an account after purchase to easily track your orders.

---

# 11. Order Creation

The order should be created server-side.

Never trust:

```text
price
discount
total
seller
product availability
```

from the client.

The server should recalculate everything.

```text
Client Checkout Data
        ↓
Server Validation
        ↓
Product Validation
        ↓
Price Calculation
        ↓
Inventory Validation
        ↓
Order Creation
        ↓
Payment Creation
        ↓
Payment Verification
        ↓
Order Confirmation
```

---

# 12. Payment Flow

For Razorpay:

```text
Guest Checkout
      ↓
Create Order
      ↓
Create Razorpay Payment Order
      ↓
Open Razorpay Checkout
      ↓
Customer Pays
      ↓
Razorpay Response
      ↓
Server-side Signature Verification
      ↓
Payment Verified
      ↓
Order = PAID
```

The guest user does not need a MiniBrands account to complete payment.

---

# 13. Guest Order Confirmation

After successful payment:

```text
Payment Successful ✓

Thank you for your order!

Order #MB-123456

Estimated Delivery
...

[Track Order]

[Continue Shopping]
```

Below the order confirmation:

```text
Want easier order tracking?

Create an account or sign in using:

customer@example.com

[Track My Order]
```

---

# 14. Post-Purchase Login Flow

When the visitor clicks:

```text
Track My Order
```

MiniBrands should open the authentication flow.

Because Better Auth already uses email OTP:

```text
Track Order
    ↓
Login / Create Account
    ↓
Email
    ↓
Send OTP
    ↓
Verify OTP
    ↓
Better Auth Session
    ↓
Identify User
    ↓
Find Eligible Guest Orders
    ↓
Claim Orders
    ↓
Redirect /account/orders
```

---

# 15. Existing Email Detection

If the checkout email already belongs to a MiniBrands account:

```text
customer@example.com
        ↓
Existing User?
        ↓
      YES
        ↓
Send OTP
        ↓
Verify
        ↓
Login
        ↓
Claim eligible guest order
```

If the email does not exist:

```text
customer@example.com
        ↓
Existing User?
        ↓
       NO
        ↓
Create account after OTP verification
        ↓
Claim guest order
```

The user should not have to manually recreate the order.

---

# 16. Account Creation

After successful OTP verification:

```text
Email verified
      ↓
Does User exist?
      │
 ┌────┴────┐
 │         │
YES       NO
 │         │
Login    Create User
 │         │
 └────┬────┘
      ▼
Claim Guest Orders
```

The new account can initially contain:

```text
email
name
phone
avatar = null
role = BUYER
```

The name and phone can optionally be prefilled from checkout data.

---

# 17. Guest Order Claiming

This is the most important security-sensitive part of the feature.

After successful authentication:

```text
Authenticated User
       ↓
Verified Email
       ↓
Find guest orders
       ↓
guestEmail == verifiedEmail
       ↓
userId IS NULL
       ↓
Claim eligible orders
```

Example query conceptually:

```text
WHERE
  guestEmail = verifiedEmail
  AND userId IS NULL
```

Then:

```text
userId = authenticatedUser.id
```

---

# 18. Additional Claim Security

Do not blindly claim every historical guest order forever.

Recommended MVP rule:

```text
guestEmail matches verified email
AND
userId IS NULL
AND
order is within configured claim window
```

For example:

```text
Claim window = 30 days
```

This reduces unintended historical account associations.

The exact window can be configured later.

---

# 19. Guest Order Token

For stronger security, generate a cryptographically secure token after guest checkout.

Example:

```text
guestOrderToken = random 256-bit value
```

Store only a hash:

```text
guestOrderTokenHash
```

The raw token should never be stored in the database.

The confirmation page can receive:

```text
/order/success?token=...
```

The token allows the guest to access their order confirmation securely.

---

# 20. Guest Order Tracking

Before login, the user should still be able to track the order.

Possible route:

```text
/track-order/[token]
```

or:

```text
/track-order?token=...
```

The server validates the token before returning order information.

Never expose order information solely through:

```text
/order/123
```

where `123` is guessable.

---

# 21. Guest Order Access Rules

A guest can access an order only if:

```text
Valid Guest Token
```

OR:

```text
Authenticated User
AND
order.userId == authenticatedUser.id
```

This creates two access modes:

```text
Guest
 └── Secure Guest Token

Authenticated
 └── User ID ownership
```

---

# 22. Order Claiming Transaction

Order claiming must be transactional.

Conceptually:

```text
BEGIN TRANSACTION

Find eligible guest orders

For each order:
    Verify userId IS NULL
    Verify guestEmail matches verified email
    Assign userId

COMMIT
```

This prevents race conditions where the same order could potentially be claimed twice.

---

# 23. Idempotency

The claim operation must be safe to execute multiple times.

Example:

```text
User logs in
     ↓
Claim orders
     ↓
Network failure
     ↓
Client retries
     ↓
Claim orders again
```

The second execution should simply find:

```text
userId != null
```

and skip already claimed orders.

No duplicate orders should ever be created.

---

# 24. Authentication Integration

Existing Better Auth should remain the authentication authority.

Do NOT create a second authentication system.

Architecture:

```text
Better Auth
    │
    ├── Email OTP
    ├── Session
    ├── User
    └── Account
          │
          ▼
Guest Order Claim Service
```

The guest-order feature should consume the authenticated session rather than replacing Better Auth.

---

# 25. Recommended Service Boundary

Create a dedicated service:

```text
GuestOrderService
```

Responsibilities:

```text
createGuestOrder()
validateGuestOrderAccess()
generateGuestOrderToken()
findClaimableOrders()
claimGuestOrders()
```

Do NOT place all guest-order logic directly inside:

```text
CheckoutClient.tsx
```

or:

```text
ProfileClient.tsx
```

---

# 26. Suggested Folder Architecture

```text
src/
├── app/
│   ├── checkout/
│   ├── order/
│   │   └── success/
│   ├── track-order/
│   └── account/
│       └── orders/
│
├── features/
│   ├── checkout/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   ├── orders/
│   │   ├── components/
│   │   ├── services/
│   │   │   ├── OrderService.ts
│   │   │   └── GuestOrderService.ts
│   │   └── types/
│   │
│   └── auth/
│       └── ...
│
├── lib/
│   ├── auth/
│   ├── payments/
│   └── security/
│
└── prisma/
    └── schema.prisma
```

The exact structure should follow the existing MiniBrands codebase conventions.

---

# 27. API / Server Action Architecture

Recommended operations:

```text
createGuestCheckout
```

Creates a guest order/payment flow.

```text
getGuestOrder
```

Retrieves an order using a secure guest token.

```text
claimGuestOrders
```

Associates eligible guest orders with the authenticated account.

```text
getMyOrders
```

Existing authenticated order query remains unchanged.

---

# 28. Data Ownership

Before claiming:

```text
Guest
 └── Order
      ├── guestEmail
      ├── guestPhone
      └── userId = NULL
```

After claiming:

```text
User
 └── Order
      ├── guestEmail
      ├── guestPhone
      └── userId = USER_ID
```

The order itself remains unchanged.

Only ownership changes.

---

# 29. Checkout Data Preservation

The checkout information should be preserved in the order snapshot.

For example:

```text
Order
 ├── customerName
 ├── customerEmail
 ├── customerPhone
 ├── shippingAddress
 ├── city
 ├── state
 └── postalCode
```

Do not depend entirely on the User profile for historical order information.

Why?

Because a buyer may later change:

```text
Name
Phone
Address
Email
```

The historical order must still represent what was supplied at checkout.

---

# 30. Email Strategy

After successful guest purchase:

```text
Order confirmation email
```

should be sent immediately.

The email should contain:

```text
Order number
Order summary
Amount
Delivery address summary
Estimated delivery
Secure order tracking link
```

The tracking link should use the secure guest token.

---

# 31. Account Linking Email

After purchase, the confirmation UI can encourage account creation.

Example:

```text
Your order is confirmed 🎉

Want easier tracking?

Create your MiniBrands account using
customer@example.com.

You'll be able to:

✓ Track orders
✓ Manage addresses
✓ Save products
✓ View purchase history

[Create / Sign In]
```

Avoid forcing account creation.

---

# 32. Returning Guest Experience

If the same guest returns before creating an account:

```text
Visitor
  ↓
New purchase
  ↓
Checkout
```

They can continue purchasing as a guest.

No forced registration should occur.

---

# 33. Existing Account Experience

If the visitor is already authenticated:

```text
Authenticated User
      ↓
Checkout
      ↓
Existing user information
      ↓
Normal checkout
      ↓
Order.userId = authenticatedUser.id
```

The guest system should not affect authenticated checkout.

---

# 34. Guest → Account Transition

The complete transition becomes:

```text
GUEST
  │
  │ Purchase
  ▼
GUEST ORDER
  │
  │ Payment Success
  ▼
ORDER CONFIRMED
  │
  │ User chooses tracking
  ▼
EMAIL OTP
  │
  │ Verified
  ▼
ACCOUNT
  │
  │ Automatic claim
  ▼
ACCOUNT + ORDER HISTORY
```

---

# 35. Security Requirements

This feature must enforce:

### Authentication

Use Better Auth.

### Email ownership

Require OTP verification.

### Order access

Require secure guest token or authenticated ownership.

### Token security

Use cryptographically secure random tokens.

### Token storage

Prefer hashed token storage.

### Authorization

Never trust:

```text
userId
email
orderId
```

sent by the browser.

Derive authenticated identity from the server session.

### Rate limiting

Protect:

```text
Guest order tracking
OTP sending
OTP verification
Guest order claiming
```

against abuse.

---

# 36. Privacy Requirements

Do not expose:

```text
Full address
Phone
Email
Payment information
```

through public or guessable URLs.

Guest tracking responses should return only necessary order information.

Example:

```text
Order #MB-123456
Status: Shipped
Estimated delivery: Aug 12
```

---

# 37. Failure Scenarios

## Payment succeeds but order creation fails

Must use an idempotent payment/order architecture.

---

## User closes browser after payment

The order must still exist.

They can access it through the confirmation email.

---

## User creates account using checkout email

Order should automatically become visible.

---

## User logs in using another email

The guest order should NOT be claimed.

---

## User changes email after checkout

The original guest order should remain associated with the original checkout identity until explicitly claimed.

---

## User already has an account

Do not create a duplicate account.

---

## Claim request runs twice

No duplicate orders.

---

# 38. Analytics

Track the following events:

```text
guest_checkout_started
guest_checkout_completed
guest_payment_success
guest_order_created
guest_track_order_clicked
guest_login_prompt_viewed
guest_account_created
guest_account_login
guest_order_claimed
guest_order_claim_failed
```

Important funnel:

```text
Checkout Started
      ↓
Checkout Completed
      ↓
Payment Success
      ↓
Track Order Click
      ↓
Login / Signup
      ↓
Order Claimed
```

This will reveal whether the post-purchase account prompt improves account conversion.

---

# 39. UX Requirements

The account prompt should NOT interrupt checkout.

Bad:

```text
Login required before checkout
```

Preferred:

```text
Buy first.
Create an account afterward if you want easier tracking.
```

This reduces friction while still encouraging account creation.

---

# 40. Recommended MVP Scope

### Phase 1 — Guest Checkout

Implement:

```text
Guest cart
Guest checkout
Guest order
Guest email
Guest phone
Payment
Order confirmation
```

### Phase 2 — Secure Tracking

Implement:

```text
Guest order token
Guest tracking page
Secure tracking link
```

### Phase 3 — Account Linking

Implement:

```text
Better Auth OTP
Existing account detection
New account creation
Guest order claim
```

### Phase 4 — UX Optimization

Implement:

```text
Post-purchase account prompt
Order tracking CTA
Analytics
Conversion measurement
```

---

# 41. Recommended Implementation Sequence

The safest implementation order is:

```text
1. Audit existing Order + User Prisma models
        ↓
2. Audit existing checkout flow
        ↓
3. Audit existing Razorpay integration
        ↓
4. Add nullable Order.userId if required
        ↓
5. Add guest checkout fields
        ↓
6. Implement guest order creation
        ↓
7. Implement secure guest order token
        ↓
8. Implement guest tracking
        ↓
9. Integrate Better Auth OTP
        ↓
10. Implement GuestOrderService
        ↓
11. Implement automatic order claiming
        ↓
12. Add post-purchase account prompt
        ↓
13. Add analytics
        ↓
14. Security testing
        ↓
15. Production rollout
```

---

# 42. Definition of Done

The feature is complete only when:

* [ ] New visitors can purchase without creating an account.
* [ ] Authenticated users continue using the existing checkout flow.
* [ ] Guest orders are stored correctly.
* [ ] Guest order information survives browser/session termination.
* [ ] Payment verification remains server-side.
* [ ] Guest order tracking uses secure authorization.
* [ ] Better Auth remains the only authentication system.
* [ ] OTP verification is required before account linking.
* [ ] Existing accounts are not duplicated.
* [ ] New accounts can be created after purchase.
* [ ] Eligible guest orders are automatically claimed.
* [ ] Orders cannot be claimed by another user.
* [ ] Claiming is idempotent.
* [ ] Historical order data remains immutable.
* [ ] Existing backend business logic is preserved wherever possible.
* [ ] No guest order information is exposed through guessable URLs.
* [ ] Rate limiting protects OTP and tracking endpoints.
* [ ] Mobile and desktop checkout experiences remain consistent.
* [ ] Analytics measure guest-to-account conversion.

---

# 43. Final Recommended Architecture

```text
                         MINI BRANDS
                             │
                ┌────────────┴────────────┐
                │                         │
         Authenticated User          Guest Visitor
                │                         │
                ▼                         ▼
         Existing Checkout         Guest Checkout
                │                         │
                ▼                         ▼
             Order                Guest Order
                │                         │
                │                  guestEmail
                │                  guestToken
                │                         │
                └────────────┬────────────┘
                             │
                             ▼
                         Razorpay
                             │
                             ▼
                       Payment Verified
                             │
                             ▼
                      Order Confirmation
                             │
                             ▼
                    Track Your Order
                             │
                             ▼
                       Better Auth
                             │
                         Email OTP
                             │
                             ▼
                     Verified User
                             │
                             ▼
                  GuestOrderService
                             │
                  ┌──────────┴──────────┐
                  │                     │
              Existing User         New User
                  │                     │
                  └──────────┬──────────┘
                             ▼
                       Claim Orders
                             │
                             ▼
                    Account Order History
```

## Architectural principle

**Guest checkout is an order ownership state, not a separate customer account.**

That keeps the architecture simple:

```text
Guest → Order → Authentication → User → Order
```

rather than creating temporary users and later trying to merge accounts.

This approach is particularly suitable for MiniBrands because it preserves the existing **Better Auth + Prisma + PostgreSQL + Razorpay** architecture while adding guest purchasing with a relatively small and controlled ownership layer.
