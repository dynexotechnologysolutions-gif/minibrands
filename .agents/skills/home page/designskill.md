MiniBrands Homepage Design Skill

Skill Name: minibrands-homepage-design-system
Version: 1.0
Scope: Homepage UI/UX only
Primary Goal: Rebuild and refine the MiniBrands homepage into a premium, modern marketplace experience while preserving existing functionality and real data.

1. ROLE

You are a Principal UI/UX Designer, Senior E-commerce Product Designer, Design Systems Architect, Responsive Web Designer, and Frontend UI Specialist.

You specialize in:

Fashion/e-commerce marketplaces
Premium marketplace interfaces
Product discovery UX
Conversion-focused layouts
Responsive desktop/tablet/mobile design
Product card systems
Store/brand discovery
Visual hierarchy
Design consistency
Pixel-level UI implementation
Next.js + Tailwind responsive interfaces

Your responsibility is to make the MiniBrands homepage visually polished, consistent, responsive, and production-ready.

2. PRIMARY DESIGN OBJECTIVE

The homepage must communicate:

A modern, trusted, premium marketplace where customers can discover products and independent stores easily.

The experience should feel:

Modern
Premium
Clean
Trustworthy
Product-focused
Highly visual
Easy to browse
Conversion-oriented
Spacious but information-dense
Professional
Consistent across every viewport

Avoid making the homepage look like:

A generic SaaS dashboard
A Bootstrap template
A basic online store
An old-fashioned marketplace
A mobile layout simply stretched onto desktop
3. DESIGN SOURCE OF TRUTH

The approved MiniBrands reference design is the single source of truth for visual direction.

Do not creatively redesign the approved visual language.

Use the reference design to determine:

Section hierarchy
Component proportions
Product presentation
Store presentation
Header hierarchy
Search placement
Category navigation
Hero proportions
Product card proportions
Typography hierarchy
CTA hierarchy
Spacing rhythm
Visual density
Trust section
Bottom navigation behavior on mobile

The desktop version should be a proper desktop adaptation of the approved design, not a completely different design.

4. CRITICAL RULE — EXISTING FUNCTIONALITY

The design work must NOT break existing functionality.

Preserve:

Product fetching
Product navigation
Store navigation
Search
Authentication
Wishlist
Cart
Add to cart
Product details
Seller/store links
API integration
Database integration
Server actions
Existing business logic

The design layer may change.

The underlying application behavior must remain intact.

5. HOMEPAGE STRUCTURE

The homepage should follow a strong marketplace discovery flow.

Desktop Structure
HEADER
│
├── Brand / Logo
├── Search
├── Categories
├── Wishlist
├── Notifications
├── Cart
└── Account
│
HERO / PROMOTIONAL BANNER
│
CATEGORY DISCOVERY
│
TOP STORES FOR YOU
│
BEST SELLING PRODUCTS
│
ADDITIONAL DISCOVERY / COLLECTION CONTENT
│
NEW ARRIVALS
│
FEATURED STORES / SELLER DISCOVERY
│
TRUST / SERVICE BENEFITS
│
FOOTER

Do not randomly reorder sections.

The hierarchy should move the user naturally through:

Discover
   ↓
Browse Categories
   ↓
Discover Stores
   ↓
Discover Products
   ↓
Evaluate
   ↓
Add to Cart
   ↓
Continue Shopping
   ↓
Trust
6. DESIGN PRINCIPLE — PRODUCT DISCOVERY FIRST

The homepage is an e-commerce marketplace.

Products must remain visually important.

Do not allow:

Excessive decorative whitespace
Oversized headings
Huge banners that push products below the fold
Excessive promotional content
Large empty areas
Decorative components that compete with products

The customer should quickly understand:

What MiniBrands is
What stores are available
What products are popular
What products are worth buying
How to continue shopping
7. HEADER DESIGN
Desktop

The desktop header should have a balanced three-zone structure:

┌───────────────────────────────────────────────────────────────┐
│ LOGO       CATEGORIES        SEARCH             ACTIONS       │
└───────────────────────────────────────────────────────────────┘
Left
MiniBrands logo
Brand identity
Optional compact tagline
Center

Search must be visually prominent.

Recommended desktop width:

420px → 560px

Search should support:

Product search
Brand/store search
Clear visual search affordance
Right

Use:

Wishlist
Notifications
Cart
Account

Icons must have:

Consistent size
Consistent spacing
Clear hover state
Proper alignment
Minimum 44px interactive area
8. MOBILE HEADER

Mobile layout is protected.

Do not redesign the approved mobile structure unless explicitly requested.

Maintain:

Hamburger
Logo
Wishlist
Notification
Cart
Search
Existing mobile interaction patterns

Desktop changes must not leak into mobile.

9. HERO DESIGN

The hero is the primary visual introduction to MiniBrands.

Desktop hero should feel like a premium marketplace campaign.

Recommended desktop proportions:

Width: full content width
Height: approximately 400–520px

Do not use an extremely thin hero on ultra-wide displays.

The hero should maintain a controlled aspect ratio.

Desktop composition
┌──────────────────────────────────────────────┐
│                                              │
│  TEXT / OFFER             HERO IMAGE         │
│                                              │
│  Headline                                     
│  Supporting text                              
│  CTA                                          
│                                              │
└──────────────────────────────────────────────┘

Maintain strong visual balance between:

Copy
CTA
Image
Whitespace
10. CATEGORY DESIGN

Categories should allow rapid browsing.

Desktop:

Category  Category  Category  Category  Category  Category

Use:

Consistent circular/icon containers
Equal spacing
Equal visual weight
Clear labels
Strong alignment

Avoid oversized category components.

Categories should feel like navigation, not advertisements.

11. STORE CARD DESIGN

Stores are a major MiniBrands differentiator.

Store cards should communicate:

Store identity
Store name
Store logo
Rating
Verification
Category
Follow/Visit action

Desktop store cards should have equal dimensions.

Example:

┌─────────────────────┐
│     STORE IMAGE     │
│                     │
├─────────────────────┤
│ LOGO  Store Name ✓  │
│       ★ 4.7         │
│                     │
│    Follow / Visit   │
└─────────────────────┘

Do not allow different card heights inside the same row.

12. PRODUCT CARD SYSTEM

Product cards are one of the most important components on the homepage.

Product image ratio

Always use 4:5 for the homepage product presentation.

aspect-ratio: 4 / 5

This ratio must remain consistent.

Example:

┌──────────────────┐
│                  │
│                  │
│   PRODUCT IMAGE  │
│                  │
│                  │
├──────────────────┤
│ Store / Brand    │
│ Product Name     │
│ ★ Rating         │
│ ₹ Price  ₹ MRP   │
│                  │
│   Add to Cart    │
└──────────────────┘

Do not use inconsistent product image ratios.

13. PRODUCT IMAGE RULES

Product images must:

Maintain 4:5 ratio
Use object-cover only when the source imagery requires cropping
Prefer object-contain when product visibility is more important
Never distort products
Never stretch images
Never create inconsistent image heights

The image container must remain stable to prevent layout shift.

14. PRODUCT CARD INFORMATION HIERARCHY

Use this hierarchy:

1. Product Image
2. Store / Brand
3. Product Name
4. Rating
5. Current Price
6. Original Price
7. Discount
8. Add to Cart

Do not make every element equally visually strong.

The customer's eye should naturally follow:

IMAGE
 ↓
PRODUCT
 ↓
PRICE
 ↓
CTA
15. PRODUCT CARD RESPONSIVE DENSITY

Desktop grids should scale according to available width.

Recommended:

Mobile:
2 columns

Tablet:
3 columns

Small Desktop:
4 columns

Large Desktop:
5 columns

Ultra-wide:
5–6 columns

Example:

grid-cols-2
md:grid-cols-3
lg:grid-cols-4
xl:grid-cols-5
2xl:grid-cols-6

However, never force six columns if the resulting product cards become too narrow.

Card readability takes priority over maximum density.

16. DESKTOP CONTAINER SYSTEM

Never stretch content across the entire monitor.

Use a controlled content canvas.

Recommended:

width: 100%
max-width: 1440px

For very large screens:

max-width: 1600px

The page should feel centered.

Example:

1920px viewport

        ┌────────────────────────────┐
        │                            │
        │      CONTENT CANVAS        │
        │                            │
        └────────────────────────────┘

Avoid:

full 1920px stretched content
17. RESPONSIVE CONTAINER RULE

Use responsive container behavior rather than separate designs for every viewport.

Target:

375px
393px
414px
768px
1024px
1280px
1440px
1536px
1920px

The layout must gracefully scale between these sizes.

Do not only optimize for:

375px
1440px

Intermediate widths must also look intentional.

18. SECTION WIDTH

Sections should share the same alignment system.

Example:

Header content
Hero
Categories
Stores
Products
Collections
Trust
Footer content

should generally align to the same content grid.

Avoid:

Hero starts at x=40
Products start at x=80
Stores start at x=20
Footer starts at x=100

Use a common container.

19. SECTION SPACING SYSTEM

Use a consistent vertical rhythm.

Desktop:

Major section:
72–96px

Medium section:
48–72px

Small component gap:
24–32px

Mobile spacing must remain based on the existing approved mobile design.

Do not globally replace mobile spacing.

20. SECTION HEADER SYSTEM

Every major section should follow a consistent structure:

Section Title                         View All
Supporting description
──────────────────────────────────────────────
Content

Example:

Best Selling Products                         View All
Discover products customers love

[ Product ] [ Product ] [ Product ] [ Product ]

Maintain consistent:

Title size
Weight
Alignment
View All placement
Vertical spacing
21. TYPOGRAPHY SYSTEM

Use the existing project font/theme unless the approved design specifies otherwise.

Desktop hierarchy:

Hero heading:
48–64px

Major section heading:
28–36px

Card heading:
16–18px

Body:
14–16px

Metadata:
12–14px

Do not make every heading oversized.

Typography should create hierarchy.

22. TEXT WRAPPING RULES

Never allow:

Awkward single-word lines
Product titles overflowing
Store names breaking unexpectedly
Buttons wrapping
Headings colliding with controls

Product titles:

max 2 lines

Store names:

single line where possible

Buttons:

white-space: nowrap
23. SPACING GRID

Use an 8px spacing system.

Preferred values:

8
16
24
32
40
48
64
72
80
96

Avoid arbitrary spacing such as:

13px
27px
37px
53px

unless technically required.

24. BORDER RADIUS

Maintain a coherent radius system.

Recommended:

Large cards:
16–24px

Product cards:
16–20px

Buttons:
12–16px

Inputs:
12–16px

Pills:
9999px

Do not mix many unrelated radius values.

25. SHADOW SYSTEM

Use subtle shadows.

Avoid excessive floating-card effects.

Recommended hierarchy:

Default:
subtle shadow

Hover:
slightly stronger shadow

Modal:
stronger elevation

Cards should still feel premium without appearing like floating boxes everywhere.

26. INTERACTION DESIGN

Desktop interactions should include subtle feedback:

Hover
Focus
Active
Loading
Disabled

Recommended motion:

150–300ms

Use:

transform
opacity

for lightweight transitions.

Avoid excessive animation.

27. PRODUCT HOVER EXPERIENCE

Desktop product cards may reveal additional information on hover.

Possible behavior:

Image
 ↓
subtle image zoom
 ↓
quick action / CTA

Do not let hover interactions cause layout shifts.

Mobile must not depend on hover.

28. STORE HOVER EXPERIENCE

Desktop store cards may use:

subtle lift
image zoom
Visit Store CTA

Keep the interaction restrained.

29. COLOR RULE

The existing MiniBrands brand colour system must remain unchanged unless explicitly requested.

Do not introduce random new brand colours.

Do not replace the established theme simply to make the page appear "modern".

Modernization must come from:

Layout
Spacing
Typography
Hierarchy
Component proportions
Visual density
Interaction quality
30. BACKGROUND SYSTEM

Use background variation strategically.

Possible structure:

Primary:
white

Secondary:
very light neutral

Featured:
brand-tinted background

Hero:
campaign-specific

Do not create excessive alternating backgrounds.

31. VISUAL HIERARCHY

The page must have a clear hierarchy:

LEVEL 1
Hero

LEVEL 2
Products / Stores

LEVEL 3
Categories / Collections

LEVEL 4
Supporting information

LEVEL 5
Trust / Footer

The user should never be confused about what to look at next.

32. CONVERSION UX

The homepage must naturally encourage:

Discover
→ Explore
→ Evaluate
→ Add to Cart
→ Continue Shopping

Important CTAs:

Shop Now
View All
Visit Store
Follow
Add to Cart

CTAs must be visually obvious but not overwhelming.

33. TRUST DESIGN

Trust should be communicated near the shopping journey.

Use clear benefits such as:

Secure Payment
Easy Returns
Fast Delivery
COD availability
Verified Sellers

Trust elements should feel like part of the marketplace rather than an unrelated banner.

34. DESKTOP-FIRST QUALITY CHECK

At every desktop viewport inspect:

1024px

Check:

Header compression
Product card width
Section alignment
Hero proportions
1280px

Check:

Standard desktop hierarchy
Product density
Store density
1440px

Check:

Primary target desktop experience
Container width
Typography
Spacing
1536px

Check:

Empty side space
Grid density
Hero scaling
1920px

Check:

No stretched content
No oversized cards
No excessive whitespace
Balanced content canvas
35. MOBILE PROTECTION

Mobile is considered LOCKED.

Do not intentionally redesign:

375px
393px
414px

Desktop modifications should use:

md:
lg:
xl:
2xl:

or desktop-specific conditional rendering.

Never replace base mobile classes with desktop assumptions.

Correct approach:

base = existing mobile design

md: = desktop enhancement

lg: = desktop refinement

xl: = large desktop refinement

2xl: = ultra-wide refinement

Incorrect approach:

rewrite base classes
then attempt to repair mobile
36. COMPONENT PROTECTION

Before modifying a shared component, inspect every usage.

If a component is shared across:

Homepage
PLP
PDP
Wishlist
Cart
Search
Seller pages

do not change it globally unless explicitly approved.

Prefer:

Homepage-specific wrapper

or:

variant="homepage"

over breaking existing pages.

37. DATA PROTECTION

Never replace real data with fake content.

Use existing:

Products
Product images
Prices
Discounts
Ratings
Sellers
Store logos
Categories

If data is missing:

Use graceful empty state.

Do not invent fake production records.

38. PERFORMANCE

The homepage must remain fast.

Maintain:

Optimized images
Correct image sizing
Lazy loading below the fold
Priority loading for hero assets
Stable image dimensions
No layout shifts
Minimal unnecessary client-side JavaScript

For Next.js images, use appropriate responsive sizes.

39. ACCESSIBILITY

Maintain:

Semantic HTML
Keyboard navigation
Visible focus
Accessible icon labels
Correct heading hierarchy
Minimum 44px touch targets
Sufficient contrast

Do not sacrifice accessibility for visual similarity.

40. PIXEL-PERFECT IMPLEMENTATION RULE

Pixel-perfect does not mean blindly hardcoding every pixel.

Use:

Grid
Flexbox
Responsive containers
CSS variables
Tailwind responsive utilities
Consistent design tokens

The target is visual consistency across all screen sizes, not only matching one screenshot.

41. BEFORE MODIFYING CODE

The AI agent MUST first inspect:

src/app/page.tsx

src/components/home/**

src/components/product/**

src/components/mobile/**

src/components/layout/**

src/app/globals.css

tailwind configuration

existing data-fetching logic

Create an internal mapping:

CURRENT COMPONENT
        ↓
CURRENT FUNCTIONALITY
        ↓
DESIGN CHANGE REQUIRED
        ↓
DESKTOP ONLY?
        ↓
MOBILE RISK

Do not start modifying code before understanding the existing architecture.

42. IMPLEMENTATION PRIORITY

Implement in this order:

Priority 1

Homepage container/grid system

Priority 2

Header

Priority 3

Hero

Priority 4

Section headers

Priority 5

Store cards

Priority 6

Product cards

Priority 7

Category system

Priority 8

Additional discovery sections

Priority 9

Trust section

Priority 10

Footer

Priority 11

Responsive refinement

Priority 12

Visual QA

43. VALIDATION

After implementation:

npx tsc --noEmit
npm run build

Run linting if available.

Then manually inspect:

375px
393px
414px
768px
1024px
1280px
1440px
1536px
1920px
44. VISUAL QA CHECKLIST

For every section check:

Correct width

Correct height

Correct alignment

Correct spacing

Correct typography

Correct image ratio

Correct card size

Correct CTA position

Correct border radius

Correct shadow

Correct responsive behavior

No overflow

No unexpected wrapping

No layout shift

45. MOBILE REGRESSION CHECK

After every major desktop modification:

Check:

375px
393px
414px

Confirm:

Header unchanged
Search unchanged
Categories unchanged
Product cards unchanged
Store cards unchanged
Bottom navigation unchanged
Mobile spacing unchanged
Mobile functionality unchanged

If mobile changes unintentionally:

STOP and revert the mobile-impacting change.

46. FINAL DESIGN QUALITY STANDARD

The final homepage should look like a professionally designed modern marketplace rather than a collection of independent components.

The visual system must feel unified:

Header
   ↓
Hero
   ↓
Categories
   ↓
Stores
   ↓
Products
   ↓
Discovery
   ↓
Trust
   ↓
Footer

All sections must share:

Same content grid
Same spacing rhythm
Same typography hierarchy
Same radius language
Same interaction language
Same visual density
Same responsive philosophy
47. FINAL DEFINITION OF DONE

The task is complete only when:

Homepage looks premium on desktop

Desktop does not look like stretched mobile UI

4:5 product image ratio is consistent

Product cards have consistent dimensions

Store cards have consistent dimensions

Hero has balanced proportions

Header is visually balanced

Search is prominent

Product discovery is strong

Store discovery is strong

CTA hierarchy is clear

Sections align to one content grid

Section spacing is consistent

Typography is consistent

1024px works correctly

1280px works correctly

1440px works correctly

1536px works correctly

1920px works correctly

375px remains unchanged

393px remains unchanged

414px remains unchanged

Existing functionality works

Real production data is preserved

No backend changes

No authentication changes

No database changes

No API changes

No unrelated pages are redesigned

TypeScript passes

Production build passes

CORE PRINCIPLE

Improve the desktop experience without destroying the approved mobile experience.

Use the approved MiniBrands visual language as the source of truth.

Use real MiniBrands data.

Keep functionality unchanged.

Make every component intentionally sized for the viewport instead of simply stretching or shrinking the mobile layout.

The final result must look like a premium production e-commerce marketplace at every supported viewport.