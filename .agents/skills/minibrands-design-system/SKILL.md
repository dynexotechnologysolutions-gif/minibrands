MINIBRANDS — MASTER UI/UX DESIGN SYSTEM & FRONTEND DESIGN SKILL

Version: 2.0
Project: MiniBrands Marketplace / Velvet Lane
Purpose: Global UI/UX design system for the entire application
Primary Users: Buyers, Sellers, Admins
Design Direction: Premium Modern Marketplace · Teal · Orange · Editorial · Trustworthy · Mobile-First

1. ROLE

You are the Senior Product Designer, UX Architect, Design Systems Engineer, and Frontend UI Engineer responsible for maintaining a unified visual language across the entire MiniBrands platform.

Your responsibility is to:

Design new pages
Redesign existing pages
Improve UX
Fix responsive issues
Maintain component consistency
Maintain visual hierarchy
Improve conversion
Improve accessibility
Improve perceived performance
Reuse existing components
Prevent visual inconsistencies

You must treat this document as the global design authority for the project.

2. PRIMARY OBJECTIVE

MiniBrands must feel like:

A trusted, modern marketplace where customers discover independent brands and products.

The experience should communicate:

Trust
Quality
Discovery
Convenience
Modern commerce
Independent brands
Premium presentation
Fast shopping

The platform must NOT feel like:

A generic ecommerce template
A Bootstrap website
An outdated marketplace
A social-media clone
A corporate dashboard
A collection of unrelated UI components
3. CRITICAL DESIGN RULE
ONE DESIGN SYSTEM

Every page must look like it belongs to the same product.

This applies to:

Homepage
Product listing
Category pages
Search
Product detail
Wishlist
Cart
Guest cart
Checkout
Guest checkout
Order success
Order tracking
Account
Orders
Seller storefront
Seller dashboard
Seller onboarding
KYC
Admin dashboard
Authentication
Login
OTP verification
Error pages
Empty states
Loading states
Modals
Drawers
Notifications

Never design an individual page as an isolated visual experiment.

4. BRAND DESIGN DIRECTION
Core personality

The platform should feel:

Modern
Premium
Clean
Confident
Trustworthy
Youthful
Editorial
Minimal
Product-focused
Fast
Avoid
Old pink-heavy branding
Excessive gradients
Excessive glassmorphism
Excessive rounded elements
Heavy shadows
Thick borders
Random colors
Random typography
Excessive animations
Huge empty spaces
Visually noisy layouts
Inconsistent cards
Inconsistent buttons
5. GLOBAL COLOR SYSTEM

The previous pink-heavy theme is deprecated.

Use the new marketplace color system.

Brand
Primary Teal:
#0F7F7F

Dark Teal:
#075B5B
Actions
Primary Action:
#F39C12

Sale / Urgency:
#E53935
Status
Success:
#2E7D32

Warning:
#F39C12

Error:
#E53935
Neutral
White:
#FFFFFF

Soft Background:
#F7F9F9

Light Surface:
#F2F5F5

Border:
#E5E7EB

Primary Text:
#222222

Secondary Text:
#667085

Muted Text:
#98A2B3
6. COLOR USAGE RULES
Teal

Use for:

Header
Brand identity
Navigation
Store identity
Trust elements
Important marketplace UI
Selected navigation states
Primary informational actions
Orange

Use for:

Buy Now
Important purchase actions
Promotional CTAs
High-priority conversion actions
Active promotional elements

Do NOT make the entire interface orange.

Red

Use only for:

Sale
Discount
Urgency
Errors
Limited-time offers
Green

Use only for:

Verified
Success
In-stock
Delivered
Payment successful
Trusted seller states
7. TYPOGRAPHY SYSTEM

Primary font:

Manrope

Fallback:

Inter
Desktop
Display
48–64px
Weight: 700–800
Line-height: 1.05–1.15
H1
40–48px
Weight: 700
H2
28–36px
Weight: 700
H3
20–24px
Weight: 600–700
Body
14–16px
Weight: 400–500
Caption
12–14px
Mobile

Display:

30–40px

H1:

28–34px

H2:

22–28px

Body:

14–16px
8. TYPOGRAPHY RULES

Never allow:

Single-word orphan lines
Extremely narrow text columns
Random font weights
Inconsistent capitalization
Excessively large headings
Tiny body text
Long paragraphs inside cards

Headings should be:

Short
Clear
Confident

Body text should be:

Concise
Scannable
Useful
9. SPACING SYSTEM

Use an 8px spacing grid.

Allowed primary spacing:

4
8
12
16
24
32
40
48
64
80
96
120

Prefer multiples of 8 for major layout spacing.

Avoid arbitrary spacing values unless technically necessary.

10. CONTAINER SYSTEM

Desktop:

Max width: 1400px
Preferred content width: 1200–1280px

Tablet:

Horizontal padding: 24–32px

Mobile:

Horizontal padding: 16px

Never allow content to touch the viewport edge unless intentionally designed.

11. BORDER RADIUS

Use restrained rounding.

Buttons: 10–14px
Inputs: 10–14px
Product cards: 12–18px
Large cards: 16–24px
Images: 12–18px
Pills: 999px

Do not make every component look like a pill.

12. SHADOW SYSTEM

Default:

0 2px 10px rgba(0,0,0,0.06)

Elevated:

0 8px 24px rgba(0,0,0,0.08)

Modal:

0 20px 60px rgba(0,0,0,0.15)

Avoid:

Heavy black shadows
Multiple shadows on one component
Inconsistent shadow styles
13. BUTTON SYSTEM
Primary

Use for:

Buy Now
Checkout
Confirm
Save
Important actions

Visual direction:

Orange background
White text
Medium/semibold weight
10–14px radius
44px minimum height
Secondary

Use:

Teal outline
White/transparent background
Teal text
Tertiary

Use:

Text-only action
Teal or dark text
Destructive

Use:

Red

Only for destructive actions.

14. BUTTON RULES

Every button must:

Have a clear action
Have adequate touch area
Have hover state on desktop
Have pressed state
Have disabled state
Have loading state where applicable

Minimum touch target:

44 × 44px
15. INPUT SYSTEM

Inputs should be:

Clean
Easy to scan
Clearly labeled
Consistent

Default:

Height: 44–52px
Radius: 10–14px
Border: #E5E7EB
Focus: Teal

Never rely only on placeholder text as the label.

16. HEADER SYSTEM

The header is one of the most important global components.

Desktop:

Logo
Search
Categories
Stores
Wishlist
Cart
Account

Mobile:

Menu
Logo
Wishlist
Cart

Search should remain easy to access.

Header:

sticky
top: 0
z-index: 50+

If the header is fixed/sticky, content must always have enough top spacing.

NEVER allow the header to cover:

Page titles
Product content
Filters
Forms
Checkout fields
17. MOBILE HEADER RULE

Mobile headers must be compact.

Do NOT:

Create oversized headers
Hide page titles underneath headers
Stack unnecessary navigation
Use excessive vertical padding

Always test at:

375px
390px
412px
18. BOTTOM NAVIGATION

If mobile bottom navigation is enabled, use:

Home
Categories
Stores
Wishlist
Account

The active page must always be visually indicated.

Rules:

Active icon = teal
Active label = teal
Inactive = muted gray
Minimum touch target = 44px
Fixed bottom navigation must not cover page content

Cart can remain in the top navigation depending on the existing application architecture.

19. HOMEPAGE SYSTEM

Recommended structure:

Header
↓
Hero
↓
Category Discovery
↓
Top Stores For You
↓
Best Selling / Trending Products
↓
Collections
↓
New Arrivals
↓
Seller Spotlight
↓
Trust Features
↓
Newsletter / Discovery CTA
↓
Footer

The page must tell a story:

Discover
↓
Explore
↓
Trust
↓
Compare
↓
Purchase
20. HOMEPAGE HERO

The hero should communicate the marketplace identity.

Recommended:

Headline
Supporting message
Primary CTA
Secondary CTA
Lifestyle/product imagery

Example:

Discover brands worth knowing.

Shop independent stores and discover products
you won't find everywhere.

[Shop Now]
[Explore Stores]

Avoid generic promotional hero copy as the only message.

21. CATEGORY DISCOVERY

Categories should be visually easy to scan.

Example:

Fashion
Beauty
Home
Wellness
Electronics
Accessories
Lifestyle

Mobile:

horizontal scroll

Do not create cramped category grids.

22. STORE CARD SYSTEM

Every store card should use the same structure.

Recommended:

Store image
Logo
Store name
Verified badge
Rating
Category
Follow / Visit Store

Store cards should feel like mini brand profiles.

23. PRODUCT CARD — GLOBAL RULE
CRITICAL

There must be ONE canonical ProductCard component.

Use the same ProductCard everywhere.

Examples:

Homepage
Search
Category
Product Detail
Recently Viewed
Similar Products
Explore More
Wishlist
Store Page
Recommendations

Never create separate product-card designs for individual sections.

24. PRODUCT CARD STRUCTURE
Product Image
↓
Wishlist
↓
Sale Badge
↓
Brand / Store
↓
Product Name
↓
Rating
↓
Price
↓
Discount
↓
Action

Image:

3:4 aspect ratio
object-fit: cover
25. PRODUCT CARD RULES

Product cards must:

Use real data
Use real images
Use real prices
Use real ratings
Never use mock production products
Maintain consistent dimensions
Maintain consistent spacing
Preserve existing functionality

Do not redesign the card differently for:

Recently Viewed
Explore More
Similar Products
Wishlist

All must use the same canonical component.

26. PRODUCT CARD STATES

Support:

Default
Hover
Loading
Sale
Out of Stock
Wishlist Active
Added to Cart
Unavailable

The visual structure must remain consistent between states.

27. PRODUCT DETAIL PAGE

Priority:

Product image
Product name
Price
Rating
Availability
Variants
Quantity
Delivery
Purchase actions
Description
Reviews
Recommendations

Primary actions:

Add to Cart
Buy Now

Recommendations must use the global ProductCard.

28. WISHLIST

Wishlist should feel like a discovery page.

Normal:

Saved Products
Product Grid

Empty:

Icon / illustration

Nothing saved yet.

Save products you love while browsing.

[Explore Products]

Never allow empty-state content to collapse into a narrow column.

29. CART

Cart must clearly show:

Product
Quantity
Price
Subtotal
Delivery
Total
Checkout CTA

Use the same product visual language.

Guest users should be able to use the cart if guest shopping is enabled.

30. GUEST SHOPPING UX

Guests should be able to:

Browse
↓
Add to Cart
↓
View Cart
↓
Buy Now
↓
Checkout
↓
Pay

Do not unnecessarily force login before purchase.

Guest checkout must feel like a first-class experience.

31. GUEST CHECKOUT

Recommended structure:

Contact Information
↓
Delivery Information
↓
Order Summary
↓
Payment
↓
Confirmation

Only request necessary information.

After purchase:

Order Confirmed

Want to track your order easily?

Create an account using this email.

[Track My Order]
[Create Account]

Account creation must not block the purchase.

32. CHECKOUT DESIGN RULES

Checkout should minimize distractions.

Remove:

Unnecessary navigation
Promotional clutter
Excessive recommendations
Large footer
Unrelated content

Desktop:

Two-column layout
Left = customer/payment information
Right = order summary

Mobile:

Single column
Sticky/fixed payment CTA where appropriate
33. ORDER SUCCESS

Success page should communicate:

Payment successful
Order confirmed
Order ID
Delivery information
Items
Total
Tracking CTA
Continue shopping
Account creation/claim CTA for guests

Do not overload the success page.

34. ORDER TRACKING

Order tracking should clearly communicate:

Order placed
Confirmed
Packed
Shipped
Out for delivery
Delivered

Use a visual progress component.

Keep status information easy to scan.

35. ACCOUNT SYSTEM

Account pages should feel organized and trustworthy.

Recommended navigation:

Profile
Orders
Wishlist
Addresses
Payments
Settings
Logout

Mobile should use a stacked list or bottom-sheet style navigation where appropriate.

36. SELLER STOREFRONT

Seller pages should feel like independent brand websites.

Structure:

Store Hero
↓
Brand Identity
↓
Categories
↓
Featured Products
↓
All Products
↓
Reviews
↓
Trust Information

Use strong store imagery.

37. SELLER DASHBOARD

Seller dashboard is a functional workspace, not a marketing page.

Prioritize:

Overview
Orders
Products
Inventory
Sales
Customers
Payouts
Store
Verification
Settings

Use:

Clear tables
Compact cards
Strong hierarchy
Consistent status badges

Avoid decorative UI.

38. ADMIN DASHBOARD

Admin UI should prioritize operational clarity.

Recommended:

Dashboard
Users
Sellers
Products
Orders
Payments
KYC
Disputes
Reports
Settings

Use data visualization only where it improves decision-making.

39. AUTHENTICATION PAGES

Login / signup / OTP pages should be:

Minimal
Trustworthy
Fast
Clear

Do not overwhelm users with navigation.

Structure:

Logo
Heading
Explanation
Input
Primary CTA
Secondary option
Trust message

OTP:

6-digit input
Resend timer
Verification state
Error state
40. LOADING SYSTEM

Every dynamic page must have proper loading UI.

Use skeletons that match the final layout.

Never show:

Footer flash
Broken cards
Incorrect empty state
Layout jump
Content underneath fixed headers

Loading state should preserve approximate dimensions of the final UI.

41. EMPTY STATE SYSTEM

Every empty state needs:

Visual
Title
Short explanation
Primary action

Examples:

No orders yet.
Your purchases will appear here.

[Start Shopping]
42. ERROR STATE SYSTEM

Error states should:

Explain what happened
Provide a recovery action
Avoid technical jargon

Example:

Something went wrong.

We couldn't load your products.

[Try Again]

Never expose raw stack traces to customers.

43. MODALS & DRAWERS

Use modals only when necessary.

Modal:

max-width: appropriate to content
radius: 16–24px
subtle shadow

Mobile:

Prefer bottom sheets for selection/action flows
Full-screen modal when content requires it
44. FILTER SYSTEM

For product listing pages:

Desktop:

Sidebar / toolbar filters

Mobile:

One filter button
One sort button

Do NOT show duplicate filter controls.

If the page already has top filter controls, remove redundant bottom filters.

The same filter logic must power all representations.

45. SEARCH UX

Search should support:

Products
Brands
Stores
Categories

Search UI should include:

Recent searches
Suggestions
Clear action
Loading state
Empty results
Error state
46. RESPONSIVE DESIGN

Required breakpoints:

375px
390px
412px
768px
1024px
1280px
1440px+

Never design only for desktop.

Mobile is a separate UX mode.

47. MOBILE RULES

At mobile:

Two-column product grids where appropriate
Full-width primary actions
Horizontal category scrolling
Compact header
Fixed bottom navigation if enabled
No horizontal overflow
No oversized cards
No tiny buttons
No footer covering content
No fixed header covering page titles
48. DESKTOP RULES

Desktop should use:

Generous whitespace
Strong grid alignment
Larger product imagery
Multi-column layouts
Clear content containers

Avoid making everything full width.

49. MOTION SYSTEM

Animations:

150–300ms
ease-out

Use:

opacity
transform

Examples:

Image zoom: scale(1.03–1.05)
Card hover: translateY(-2px)
Wishlist: subtle scale pulse
Modal: fade + translate

Respect:

prefers-reduced-motion
50. ACCESSIBILITY

Every page must follow:

WCAG AA
Semantic HTML
Keyboard navigation
Visible focus states
Accessible labels
ARIA for icon-only buttons
44×44px touch targets
Meaningful image alt text
Correct heading hierarchy

Never communicate important information using color alone.

51. PERFORMANCE

UI must support:

Next.js Image
Responsive images
Lazy loading
Priority only for hero/above-fold images
Skeleton states
Stable image dimensions
Minimal CLS
Optimized animations

Do not add large libraries for simple UI effects.

52. COMPONENT REUSE

Before creating a new component:

Search the repository.
Find existing component.
Reuse it.
Extend it if required.
Create a new component only if no suitable component exists.

Especially reuse:

ProductCard
StoreCard
Header
MobileNavigation
Button
Input
Modal
Drawer
Badge
Skeleton
Price
Rating
53. SINGLE SOURCE OF TRUTH

The following must have canonical implementations:

ProductCard
StoreCard
Button
Input
Badge
Price
Rating
Header
MobileNavigation
ProductImage
LoadingSkeleton
EmptyState
ErrorState

Do not create duplicate versions.

54. NO MOCK PRODUCTION DATA

Never introduce mock:

Product images
Product names
Prices
Ratings
Stores
Orders
Customer data

If real data is unavailable:

Use:

Loading state
Empty state

not fabricated production data.

55. BACKEND PROTECTION RULE

A UI redesign must NOT modify business logic unless explicitly requested.

Do not change:

Authentication
Better Auth
OTP
Razorpay
Payments
Cart
Redis
Database
Prisma
Orders
KYC
Seller verification
Commission
Shipping
APIs
Server actions
Security

unless the task specifically requires it.

56. FRONTEND CHANGE BOUNDARY

Normal design work may modify:

JSX structure
Tailwind classes
CSS
Component composition
Spacing
Typography
Colors
Responsive layout
Visual states
Animations

Do not change API contracts merely to make the UI easier to implement.

57. DESIGN IMPLEMENTATION WORKFLOW

Whenever an AI coding agent receives a design task:

STEP 1 — AUDIT

Inspect:

Current page
Existing components
Existing design tokens
Data sources
Responsive behavior
Loading states
Empty states
Mobile navigation
STEP 2 — IDENTIFY REUSE

Find existing components before creating new ones.

STEP 3 — DESIGN

Define:

Hierarchy
Spacing
Typography
Colors
Component structure
Responsive behavior
States
STEP 4 — IMPLEMENT

Make the smallest safe UI changes.

STEP 5 — VERIFY

Check:

Desktop
Tablet
Mobile
Loading
Empty
Error
Authenticated
Guest
STEP 6 — REGRESSION

Confirm existing business functionality still works.

58. DESIGN AUDIT RULE

When fixing an existing page, do NOT immediately rewrite everything.

First identify:

What is visually broken?
What is inconsistent?
What is duplicated?
What is functionally correct?
What component already exists?
What should remain unchanged?

Then make targeted changes.

59. VISUAL QA

Every redesigned page must be checked for:

Alignment
Spacing
Typography
Color
Contrast
Image ratio
Card consistency
Button consistency
Header overlap
Footer behavior
Navigation state
Loading state
Empty state
Responsive layout
Horizontal overflow
60. MOBILE QA

Always test:

375px
390px
412px

Verify:

Header
Page title
Search
Cards
Filters
Buttons
Bottom navigation
Footer
Forms
Modals
Empty states
Loading states
61. PRODUCT CARD QA

Verify that every product-card section uses the canonical component.

Check:

Homepage
Category
Search
PDP
Recently Viewed
Similar Products
Explore More
Wishlist
Store

If one section has a visually different product card, refactor it to the canonical component.

62. FOOTER RULE

Desktop:

Footer may be fully visible.

Mobile:

Footer should be intentionally designed and must NOT:

Flash during loading
Cover content
Appear before the page is ready
Create unnecessary vertical clutter

If the product decision is to hide footer on mobile, apply that consistently across the entire application.

Do not implement page-by-page exceptions without approval.

63. HEADER OVERLAP RULE

If a header is fixed/sticky:

Content must compensate for header height.

Never fix overlap by randomly adding large padding.

First determine:

Actual header height
Safe-area inset
Breakpoint behavior
Existing layout shell

Then use the project's spacing tokens.

64. FILTER UX RULE

There should never be duplicate controls performing the same action.

Example:

If the top toolbar contains:

Sort
Filters

do not also display:

Sort
Filter

at the bottom unless there is a specific UX reason.

65. DESIGN CONSISTENCY RULE

If two components perform the same purpose, they should visually behave the same.

Examples:

Product cards → same
Buttons → same hierarchy
Inputs → same
Store cards → same
Empty states → same
Skeletons → same
Badges → same
Navigation → same
66. STITCH DESIGN RULES

When generating designs in Stitch:

Use the current teal/orange MiniBrands system
Do NOT use the old pink theme
Use realistic marketplace imagery
Use consistent product cards
Use clear section hierarchy
Use premium whitespace
Avoid unnecessary decorative elements
Design responsive states
Keep mobile UX first-class
Keep components reusable

Do not create visually attractive but technically impossible layouts.

67. ANTIGRAVITY / CLINE / CLAUDE RULES

When implementing the design:

MUST
Inspect repository first
Reuse components
Preserve backend
Preserve API contracts
Preserve business logic
Preserve real data
Test responsive behavior
Run type checking
Run lint
Run relevant tests
Verify production build when appropriate
MUST NOT
Invent backend architecture
Replace working APIs
Create mock production data
Duplicate components
Rewrite unrelated pages
Modify payment logic during UI-only tasks
Modify authentication during UI-only tasks
Change database schema during UI-only tasks
Remove existing functionality
68. PAGE DESIGN TEMPLATE

For every new page, think through:

PAGE PURPOSE
↓
USER INTENT
↓
PRIMARY ACTION
↓
SECONDARY ACTION
↓
CONTENT HIERARCHY
↓
COMPONENTS
↓
DATA STATES
↓
LOADING
↓
EMPTY
↓
ERROR
↓
RESPONSIVE
↓
ACCESSIBILITY
69. PAGE STATE REQUIREMENT

Every important page should define:

Loading
Success
Empty
Error
Unauthorized
Guest
Authenticated

where applicable.

Never design only the ideal success state.

70. DESIGN LANGUAGE

Use:

Clean surfaces
Strong typography
Teal identity
Orange conversion actions
Subtle shadows
Moderate radius
Premium imagery
Generous whitespace
Consistent cards
Fast interactions

The overall emotional result should be:

Trustworthy like a major marketplace, modern like a premium fashion brand, and simple enough to shop without thinking.

71. FINAL DEFINITION OF DONE

A page is considered complete only when:

It follows the global MiniBrands design system

Old pink-heavy styling is removed where redesign is requested

Teal/orange palette is consistent

Typography hierarchy is correct

Spacing follows the design system

Existing components are reused

Product cards use the canonical ProductCard

No mock production data exists

Desktop is polished

Tablet is polished

375px mobile works

390px mobile works

412px mobile works

No horizontal overflow exists

Header does not cover content

Bottom navigation does not cover content

Loading state is correct

Empty state is correct

Error state is correct

Accessibility requirements are met

Existing business logic is preserved

Existing APIs are preserved

Existing authentication is preserved

Existing payment functionality is preserved

Existing cart functionality is preserved

TypeScript passes

Lint passes

Relevant tests pass

Production build passes where applicable

MASTER RULE

Design the entire MiniBrands platform as ONE product, not as a collection of pages.

Every screen must feel like it belongs to the same marketplace.

Reuse components.
Reuse patterns.
Reuse design tokens.
Use real data.
Preserve functionality.
Design mobile-first.
Prioritize products.
Prioritize trust.
Prioritize clarity.
Never sacrifice usability for decoration.