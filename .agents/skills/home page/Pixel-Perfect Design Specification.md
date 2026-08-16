MiniBrands Marketplace — Pixel-Perfect Homepage Design Specification

Design Direction: Premium Modern Marketplace
Primary Target: Desktop
Responsive Target: All devices
Visual Reference: Approved ShopHub-style homepage reference image

1. Design Principle

The homepage should feel like a polished, established e-commerce marketplace.

Visual priorities:

Product discovery
Store discovery
Search
Conversion
Trust
Visual hierarchy
Consistency

Avoid:

Generic dashboard aesthetics
Excessive empty space
Oversized cards
Random spacing
Weak hierarchy
Inconsistent component sizing
Mobile layout simply stretched onto desktop
2. Design Canvas

Desktop content should use a controlled maximum width.

Recommended:

1440px → primary content width
1600px → optional ultra-wide container
1920px → centered content, never full-width stretching

The page should remain visually balanced on:

1280px
1440px
1536px
1920px

Never allow content to continuously stretch with viewport width.

3. Desktop Page Composition
Announcement Bar
        ↓
Main Header
        ↓
Category Navigation
        ↓
Hero
        ↓
Top Stores For You
        ↓
Best Selling Products
        ↓
Trust Strip
        ↓
Footer

Maintain strong visual rhythm between each section.

4. Announcement Bar

Desktop only.

Compact horizontal information strip.

Example information:

Free Delivery on Orders Above ₹499
Easy Returns
100% Secure Payments

Right side:

Sell on MiniBrands
Track Order
Help & Support

Keep it visually subtle.

Do not allow it to consume excessive vertical space.

5. Desktop Header

Header should be approximately:

72–88px

Structure:

Logo
    ↓
Category Selector
    ↓
Large Search
    ↓
Wishlist
Notifications
Cart
Account

Search should be the strongest interaction in the header.

Recommended desktop search width:

400–520px

Header elements must align vertically on a common baseline.

No floating or misaligned icons.

6. Category Navigation

Horizontal navigation below the main header.

Each category should contain:

Icon
Label

Use equal visual spacing.

Categories should remain centered inside the main content container.

Do not allow category labels to wrap unnecessarily.

7. Hero

The hero is the primary visual anchor.

Desktop target:

Width: 100% of content container
Height: approximately 400–480px
Border radius: 16–24px

Composition:

┌───────────────────────────────────────────┐
│                                           │
│  Promotional Content       Hero Image     │
│                                           │
│  Mega Sale                                │
│  Up to 60% Off                            │
│  Across all stores                        │
│                                           │
│  [ Shop Now ]                             │
│                                           │
└───────────────────────────────────────────┘

Hero image must maintain its intended composition.

Do not distort images.

Use:

object-fit: cover

where appropriate.

8. Top Stores

Section heading:

Top Stores For You                 View All Stores →

Desktop should display multiple store cards in one row.

Recommended:

5 cards at ~1440px

Cards should have:

Store logo
Store name
Rating
Store image
Follow button

All cards must have identical dimensions.

Images must have identical aspect ratios.

9. Product Section

Heading:

Best Selling Products             View All Products →

Desktop grid should scale according to available width.

Recommended:

1024px → 4 columns
1280px → 5 columns
1440px → 5–6 columns
1536px → 6 columns
1920px → 6 columns within max-width container

Do NOT continuously increase card width simply because the viewport increases.

10. Product Card

Product cards must have a consistent structure.

┌──────────────────────┐
│ Store          ♡     │
│                      │
│    PRODUCT IMAGE     │
│                      │
├──────────────────────┤
│ Product Name         │
│                      │
│ ★ 4.7 (1.2K sold)    │
│                      │
│ ₹799    ₹999         │
│                      │
│ [ Add to Cart ]      │
└──────────────────────┘

Target image ratio:

4:5

This is important.

Use:

aspect-ratio: 4 / 5

for the product image area.

Do not distort product images.

11. Product Card Dimensions

Cards must remain visually compact.

Recommended desktop range:

220–260px wide

depending on viewport.

Cards should never become extremely large on 1920px displays.

Maintain:

consistent image height
consistent content height
consistent CTA height
consistent card height
12. Product Card Spacing

Use a consistent spacing system.

Base unit:

8px

Preferred spacing:

8
16
24
32
40
48
64

Avoid arbitrary values unless necessary for pixel matching.

13. Trust Strip

Place after major product discovery.

Desktop:

6 horizontal trust items

Example:

Secure Payment
Easy Returns
Fast Delivery
COD Available
Multiple Payment
Buyer Protection

Keep this compact.

It should reinforce trust without visually competing with products.

14. Footer

Desktop footer should use a structured multi-column layout.

Columns:

Brand
Shop
Customer Service
Company
Newsletter

Include:

Social links
Payment methods
Copyright
Support links

Maintain consistent column widths.

15. Typography

Use the existing MiniBrands typography unless the project already defines another approved font.

Hierarchy:

Hero headline
    ↓
Section heading
    ↓
Product title
    ↓
Store name
    ↓
Body
    ↓
Metadata

Avoid excessive font sizes.

Desktop hero headline may be significantly larger than section headings.

Product information must remain compact.

16. Pixel-Level Alignment

Every major component must be checked for:

X position
Y position
Width
Height
Padding
Margin
Gap
Font size
Font weight
Line height
Border radius
Border
Shadow
Image ratio
Icon size
Button size

Do not approximate these casually.

Use browser inspection and screenshot comparison.

17. Responsive Rules
Mobile

Preserve the existing approved mobile design.

Do not redesign mobile merely because desktop is changing.

Tablet

Adapt:

columns
container width
hero height
header spacing
category density
Desktop

Use the new premium marketplace layout.

Ultra-wide

Never stretch the content indefinitely.

Use centered max-width containers.

18. Responsive Component Rule

Every component must have deliberate behavior at:

375
393
414
768
1024
1280
1440
1536
1920

Do not rely on one breakpoint and hope the layout works.

19. Image Rules

Product images:

4:5
object-fit: cover

Hero:

preserve original composition
avoid distortion

Store images:

consistent aspect ratio

All image containers must reserve their dimensions before loading to prevent CLS.

20. Motion

Keep motion subtle.

Allowed:

150–300ms
ease-out
image scale
button hover
card elevation

Do not introduce distracting animations.

21. Visual Quality Gate

The page is not complete if:

Cards have inconsistent widths
Cards have different image ratios
Sections have inconsistent spacing
Header elements don't align
Hero looks stretched
Desktop has excessive whitespace
Product cards become oversized
Text wraps unexpectedly
Images are distorted
Mobile changes unintentionally
Components look like separate design systems