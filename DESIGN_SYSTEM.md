# MiniBrands UI/UX Design System Specification
**Version:** 1.0 | **Project:** MiniBrands Marketplace | **Style:** Modern Fashion Marketplace (Myntra-inspired, Premium Gen-Z)

---

## 1. Design Vision

**Goal:** Transform the UI into a premium fashion marketplace that feels modern, trustworthy, aspirational, and conversion-focused while preserving the entire backend architecture.

Increase: product discovery · product clicks · add-to-cart rate · wishlist engagement · seller discovery · buyer trust.

The experience should feel like a premium shopping destination, not a generic marketplace.

---

## 2. Brand Identity

| Field | Value |
|---|---|
| Brand Name | MiniBrands |
| Position | Marketplace for independent fashion brands |
| Target Audience | Women · Age 18–30 · Fashion-conscious · Mobile-first · Social-media inspired · Mid-range purchasing power |

---

## 3. Design Personality

**Communicate:** Modern · Premium · Fashion-first · Editorial · Elegant · Youthful · Confident · Minimal · Fast · Highly visual

**Avoid:** Corporate appearance · Heavy borders · Bootstrap aesthetics · Generic ecommerce layouts · Outdated UI patterns

---

## 4. Visual Direction

**Primary inspiration:** Myntra · Zara · Nike · COS · H&M · Apple

**Visual keywords:** Editorial · Lifestyle · Clean · Luxury · Fashion Magazine · Soft Shadows · Rounded Cards · Rich Photography · Airy Layout · Premium White Space

---

## 5. Color System

| Token | Hex | Usage |
|---|---|---|
| Brand Pink (Primary) | `#FF3E6C` | Logo · CTA buttons · Wishlist · Highlights · Offers |
| Deep Navy (Secondary) | `#111827` | Hero sections · Premium banners · Footer · Headlines |
| Background | `#FFFFFF` | Page background |
| Secondary Background | `#F8F8FA` | Card backgrounds · Section fills |
| Section Divider | `#F3F4F6` | Dividers · Borders |
| Text Primary | `#111827` | Headings · Primary content |
| Text Secondary | `#6B7280` | Subtext · Descriptions |
| Text Muted | `#9CA3AF` | Labels · Placeholders · Captions |
| Success | `#16A34A` | In-stock · Confirmed states |
| Sale / Error | `#EF4444` | Discounts · Errors |
| Rating | `#FBBF24` | Star ratings |

---

## 6. Typography

**Primary Font:** Manrope | **Fallback:** Inter

| Context | Size | Weight |
|---|---|---|
| Hero Headline | 56–64px | 800 |
| Section Title | 36–42px | 700–800 |
| Card Title | 18–20px | 600–700 |
| Body | 16px | 400–500 |
| Caption | 14px | 400–500 |
| Label | 12px | 500–600 |

**Rules:**
- Font weight hierarchy always maintained
- Balanced text wrapping — no single-word line breaks
- Comfortable line heights (1.5–1.7 for body, 1.1 for headlines)
- Editorial spacing between elements

---

## 7. Layout System

| Property | Value |
|---|---|
| Container Width | 1400px |
| Content Width | 1280px |
| Section Padding | 96–120px vertical |
| Card Radius | 20–24px |
| Image Radius | 20px |
| Grid Gap | 24–32px |
| Spacing Grid | 8px base unit |

---

## 8. Navigation (Sticky Header)

Components: MiniBrands Logo · Large Search Bar · Categories · Wishlist · Cart · Notifications · Profile

| Breakpoint | Search Width |
|---|---|
| Desktop | 420–500px |

- Sticky at `top-0 z-50`
- Glassmorphism backdrop blur
- 80px height on desktop

---

## 9. Homepage Section Order

1. Sticky Header
2. Hero Banner
3. Shop by Mood (categories)
4. Trending Collections
5. Featured Products
6. Featured Brands
7. New Arrivals
8. Seller Spotlight
9. Editorial Quote
10. Weekly Edit (newsletter)
11. Trust Features
12. Footer

---

## 10. Hero Banner

| Property | Value |
|---|---|
| Height | 700px desktop |
| Layout | Split — Left 45% / Right 55% |

**Left:** Headline · CTA · Description  
**Right:** Full-height fashion editorial image  
**Buttons:** "Shop Now" (primary) · "Explore Brands" (ghost)

---

## 11. Product Card Spec

**Components:**
- Product image (aspect-ratio `3:4`, `object-cover`)
- Wishlist heart icon (top-right)
- Discount badge (top-left, `#EF4444`)
- Brand name (muted, `12px`)
- Product name (`16px`, `font-semibold`, max 2 lines)
- Star rating + count
- Sale price (`#111827`, `font-bold`)
- Original price (strikethrough, muted)
- "Add to Cart" CTA

**Hover States:**
- Image zoom (`scale-105`, `300ms`)
- Shadow elevation increase
- Quick View button appears
- Wishlist heart animation (scale pulse)

---

## 12. Seller Card Spec

**Components:**
- Cover image
- Logo (overlapping, rounded)
- Brand Name (`font-bold`)
- Verified Badge (✓ `#16A34A`)
- Follower count
- Category chips
- "Visit Store" CTA button

---

## 13. Collections Section

- Large editorial cards (full-bleed photography)
- Gradient overlay (dark bottom fade)
- Category label (white, top-left)
- Hover lift animation (`-translateY-1`, shadow increase)
- Min card height: 360px desktop

---

## 14. Editorial Quote Section

- Two-column layout (50/50)
- **Left:** Large editorial pull-quote (`36–42px`, `font-bold`)
- **Right:** Portrait fashion editorial image
- Never allow narrow text or single-word wrapping
- Max quote text width: 480px

---

## 15. Weekly Edit (Newsletter)

- Editorial heading (`36px+`)
- Paragraph description (max 2 lines, max-width 440px)
- Email input + Join CTA button
- Proper balanced typography
- Adequate whitespace

---

## 16. Footer Spec

**Sections:** Brand · Shop · Categories · Help · Company · Social · Newsletter  
**Brand description max-width:** 420px — never allow broken paragraph  
**Newsletter input** in footer  
**Copyright line** at bottom

---

## 17. Responsive Breakpoints

| Breakpoint | Width |
|---|---|
| Desktop | 1400px+ |
| Laptop | 1200px |
| Tablet | 768px |
| Mobile | 375px |

**Rules:**
- Fluid grids
- Stack layouts on mobile
- Preserve spacing ratios
- Maintain readable typography at all sizes
- No layout shifts across breakpoints

---

## 18. Motion Design

| Property | Value |
|---|---|
| Duration | 150–300ms |
| Easing | `cubic-bezier(0.16, 1, 0.3, 1)` |
| Hover lift | `translateY(-2px)` + shadow increase |
| Image zoom | `scale(1.05)` |
| Fade-in | `opacity 0→1` |
| Wishlist | Scale pulse on toggle |

All animations GPU-accelerated (`transform`, `opacity` only).  
Respect `prefers-reduced-motion`.

---

## 19. Accessibility

- WCAG AA color contrast minimum
- Full keyboard navigation
- Visible focus indicators (`outline: 3px solid <brand-pink>/40`)
- Semantic HTML (`section`, `article`, `nav`, `main`, `h1–h3`)
- ARIA labels on all icon-only buttons
- Touch targets minimum `44×44px`

---

## 20. Performance

- Lazy-load all below-fold images
- `priority` on hero/above-fold images only
- Responsive `sizes` prop on all `next/image`
- Skeleton loaders for dynamic content
- Minimize Cumulative Layout Shift (CLS)
- Target Lighthouse Performance ≥ 95

---

## 21. UI Consistency Rules

- **8px spacing grid** — all margins/padding multiples of 8
- **Uniform border radius** — cards always 20–24px, inputs always 12–16px, pills always 999px
- **Shared button hierarchy:**
  - Primary: `bg-[#FF3E6C]`, white text, `rounded-2xl`
  - Secondary: ghost with `border`, `rounded-2xl`
  - Tertiary: text link only
- Consistent card shadow: `0 4px 16px rgba(0,0,0,0.08)`
- No inconsistent shadows, uneven padding, misaligned text, or broken wrapping

---

## 22. Definition of Done

The redesign is complete only when:
- [ ] Every page has a consistent design language
- [ ] Typography is perfectly aligned, no broken wrapping
- [ ] All cards have equal heights in grid rows
- [ ] Every section feels premium and editorial
- [ ] Mobile responsiveness is flawless at 375px, 768px, 1280px
- [ ] Buyer trust communicated through visual quality
- [ ] Platform clearly communicates modern fashion marketplace identity
- [ ] Backend functionality 100% unchanged
