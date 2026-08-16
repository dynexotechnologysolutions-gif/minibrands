MiniBrands Homepage — Frontend Structure & Component Map

Project: MiniBrands Marketplace
Purpose: Reference document for AI coding agents
Scope: Homepage UI/UX redesign only

1. Objective

Redesign the MiniBrands homepage into a premium, modern marketplace experience optimized for:

Product discovery
Store discovery
Search
Product clicks
Add-to-cart conversion
Seller discovery
Buyer trust

The existing backend, APIs, authentication, database, payments, cart, wishlist, and business logic must remain unchanged.

The redesign is primarily a presentation-layer transformation.

2. Homepage Architecture

The homepage should follow this high-level structure:

Homepage
│
├── Global/Desktop Announcement Bar
│
├── Header
│   ├── MiniBrands Logo
│   ├── Category Selector
│   ├── Search
│   ├── Wishlist
│   ├── Notifications
│   ├── Cart
│   └── Account
│
├── Category Navigation
│   ├── Home Decor
│   ├── Kitchen
│   ├── Spiritual
│   ├── Bottles
│   ├── Beauty
│   ├── Wellness
│   ├── Toys
│   ├── Electronics
│   └── More
│
├── Hero
│   ├── Promotional Content
│   ├── Hero Image
│   ├── CTA
│   └── Carousel Controls
│
├── Top Stores For You
│   ├── Section Heading
│   ├── View All
│   └── Store Cards
│       ├── Store Logo
│       ├── Store Name
│       ├── Rating
│       ├── Store Image
│       └── Follow
│
├── Best Selling Products
│   ├── Section Heading
│   ├── View All
│   └── Product Grid
│       ├── Store
│       ├── Wishlist
│       ├── Product Image
│       ├── Product Name
│       ├── Rating
│       ├── Price
│       ├── Original Price
│       └── Add To Cart
│
├── Trust Strip
│   ├── Secure Payment
│   ├── Easy Returns
│   ├── Fast Delivery
│   ├── COD Available
│   ├── Multiple Payment
│   └── Buyer Protection
│
└── Footer
    ├── Brand
    ├── Shop Categories
    ├── Customer Service
    ├── Company
    ├── Newsletter
    ├── Social Links
    └── Payment Methods
3. Existing Functionality

The redesign must preserve existing functionality.

Product
Product detail navigation
Add to cart
Wishlist
Product images
Pricing
Discount
Ratings
Seller information
Store
Store navigation
Store profile
Follow functionality
Seller verification
Store ratings
Navigation
Search
Category navigation
Cart
Wishlist
Account
Notifications
Data

Use real MiniBrands data.

Never replace production data with invented mock content.

4. Component Strategy

Before modifying anything:

Inspect existing component
        ↓
Determine whether reusable
        ↓
Preserve business logic
        ↓
Modify presentation layer
        ↓
Verify mobile
        ↓
Verify desktop

Do not duplicate functionality unnecessarily.

Prefer existing components when they can support the new presentation.

If an existing component is tightly coupled to the old visual design, create a scoped homepage presentation variant instead of breaking other pages.

5. Scope Boundary

Allowed:

Homepage layout
Homepage components
Homepage styling
Desktop responsive behavior
Homepage spacing
Homepage typography
Homepage grids
Homepage visual hierarchy
Homepage presentation

Not allowed:

Database schema
Prisma models
API contracts
Server actions
Authentication
Payments
Cart business logic
Wishlist business logic
Order logic
Seller verification
Global mobile components
Unrelated marketplace pages
6. Responsive Architecture

The homepage must work correctly at:

375px
393px
414px
768px
1024px
1280px
1440px
1536px
1920px

Mobile is already approved and must not be unnecessarily redesigned.

Desktop should receive the major visual transformation.

Responsive rules must prevent:

horizontal overflow
broken cards
stretched images
excessive whitespace
tiny text
oversized components
inconsistent section widths
layout jumps
overlapping elements
7. Data Mapping Principle

The UI is controlled by the design specification.

The content comes from MiniBrands.

Example:

Target Product Card
        ↓
Existing Product Data
        ↓
Existing Product Handler
        ↓
Existing Cart/Wishlist Logic

The visual component may change.

The business logic must not.