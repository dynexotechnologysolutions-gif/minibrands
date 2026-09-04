# MiniBrands SEO & Google Search Console Verification Audit

## 1. Executive Summary

This document presents an empirical technical SEO and Google Search Console (GSC) readiness audit for the **MiniBrands** e-commerce marketplace platform built on Next.js App Router (v16.2.9), TypeScript, and Prisma ORM.

The audit was conducted strictly against the existing codebase. No source code was modified, added, deleted, or refactored.

### Summary Verdict & GSC Readiness Score
- **Google Search Console Readiness Score:** **28 / 100**
- **Sitemap Status:** **MISSING** (No `sitemap.ts` or `sitemap.xml` exists in the repository).
- **Robots.txt Status:** **MISSING** (No `robots.ts` or `public/robots.txt` exists at root).
- **MetadataBase Status:** **MISSING** (No `metadataBase` configured in root layout, threatening social preview resolution).
- **Canonical URLs:** **MISSING** (0 canonical tags defined across the entire application).
- **Structured Data:** **PARTIAL** (Basic `Product` JSON-LD exists on product pages and `LocalBusiness` JSON-LD exists on seller storefronts, but `Organization`, `WebSite` SearchAction, and `BreadcrumbList` are missing).

---

## 2. Actual Route Inventory

Based on repository inspection of `src/app/`, the following routes currently exist in the codebase:

### Public Indexable Routes (Intended for Search Engines)
- `/` — Homepage (`src/app/page.tsx`)
- `/products` — Main product catalog (`src/app/products/page.tsx`)
- `/products/[productId]` — Dynamic product detail page (`src/app/products/[productId]/page.tsx`)
- `/sellers/[sellerId]` — Dynamic seller storefront page (`src/app/sellers/[sellerId]/page.tsx`)
- `/stores` — Directory of verified sellers (`src/app/stores/page.tsx`)
- `/categories` — Category browsing hub (`src/app/categories/page.tsx`)
- `/category/[category]` — Dynamic category listing page (`src/app/category/[category]/page.tsx`)
- `/about` — About page (`src/app/about/page.tsx`)
- `/contact` — Contact & support form (`src/app/contact/page.tsx`)
- `/faqs` — Frequently asked questions (`src/app/faqs/page.tsx`)
- `/terms` — Terms of Service (`src/app/terms/page.tsx`)
- `/privacy` — Privacy Policy (`src/app/privacy/page.tsx`)
- `/returns-policy` — Refund & Return Policy (`src/app/returns-policy/page.tsx`)

### Public Non-Indexable / Special Routes
- `/search` — Dynamic search result listing (`src/app/search/page.tsx` - explicitly configured with `robots: { index: false, follow: false }`)

### Private Buyer & Authentication Routes (Should NOT be indexed)
- `/login` (`src/app/login/page.tsx`)
- `/signup` (`src/app/signup/page.tsx`)
- `/verify-email` (`src/app/verify-email/page.tsx`)
- `/forgot-password` (`src/app/forgot-password/page.tsx`)
- `/reset-password` (`src/app/reset-password/page.tsx`)
- `/session-expired` (`src/app/session-expired/page.tsx`)
- `/account/profile` (`src/app/account/profile/page.tsx`)
- `/account/addresses` (`src/app/account/addresses/page.tsx`)
- `/account/orders` (`src/app/account/orders/page.tsx`)
- `/account/orders/[orderId]` (`src/app/account/orders/[orderId]/page.tsx`)
- `/account/security` (`src/app/account/security/page.tsx`)
- `/account/wishlist` (`src/app/account/wishlist/page.tsx`)
- `/cart` (`src/app/cart/page.tsx`)
- `/checkout` (`src/app/checkout/page.tsx`)
- `/checkout/guest` (`src/app/checkout/guest/page.tsx`)
- `/claim-order` (`src/app/claim-order/page.tsx`)
- `/order/success/[orderId]` (`src/app/order/success/[orderId]/page.tsx`)
- `/order/success/guest/[token]` (`src/app/order/success/guest/[token]/page.tsx`)
- `/orders/[orderId]/return` (`src/app/orders/[orderId]/return/page.tsx`)
- `/orders/[orderId]/return/track` (`src/app/orders/[orderId]/return/track/page.tsx`)

### Private Seller Dashboard Routes (Should NOT be indexed)
- `/seller/login` (`src/app/seller/login/page.tsx`)
- `/seller/forgot-password` (`src/app/seller/forgot-password/page.tsx`)
- `/seller/onboarding` (`src/app/seller/onboarding/page.tsx`)
- `/seller/dashboard` (`src/app/seller/dashboard/page.tsx`)
- `/seller/products` (`src/app/seller/products/page.tsx`)
- `/seller/products/new` (`src/app/seller/products/new/page.tsx`)
- `/seller/products/[productId]/edit` (`src/app/seller/products/[productId]/edit/page.tsx`)
- `/seller/orders` (`src/app/seller/orders/page.tsx`)
- `/seller/orders/[orderId]` (`src/app/seller/orders/[orderId]/page.tsx`)
- `/seller/inventory` (`src/app/seller/inventory/page.tsx`)
- `/seller/analytics` (`src/app/seller/analytics/page.tsx`)
- `/seller/reviews` (`src/app/seller/reviews/page.tsx`)
- `/seller/returns` (`src/app/seller/returns/page.tsx`)
- `/seller/verification` (`src/app/seller/verification/page.tsx`)
- `/seller/profile` (`src/app/seller/profile/page.tsx`)

### Private Admin Routes (Should NOT be indexed)
- `/admin/*` (`src/app/admin/layout.tsx`, `page.tsx`, `analytics`, `audit`, `buyers`, `finance`, `kyc-queue`, `login`, `notifications`, `orders`, `products`, `refunds`, `returns`, `reviews`, `sellers`, `settings`, `system-health`, `verifications`)

---

## 3. Sitemap Status

**Sitemap Report:** **MISSING**

### Evidence & Verification Details
1. `src/app/sitemap.ts`: **Does NOT exist** (Repository search found no implementation).
2. `public/sitemap.xml`: **Does NOT exist** (Repository search found no implementation).
3. `generateSitemaps` / `MetadataRoute.Sitemap`: **0 references in codebase**.
4. Product dynamic inclusion: **Not implemented**.
5. Seller storefront inclusion: **Not implemented**.
6. Category inclusion: **Not implemented**.
7. Static public route inclusion: **Not implemented**.
8. Scalability considerations: Next.js App Router `generateSitemaps` or index sitemaps will be necessary once products exceed 50,000 items.

---

## 4. Robots.txt Status

**Robots Report:** **MISSING**

### Evidence & Verification Details
1. `src/app/robots.ts`: **Does NOT exist**.
2. `public/robots.txt`: **Does NOT exist**.
3. `MetadataRoute.Robots`: **0 references in codebase**.
4. Root Crawl Directives: Crawlers visiting `https://<domain>/robots.txt` will receive a 404 response.
5. Page-level robots metadata:
   - Present on `/cart`, `/checkout`, `/account/*`, `/claim-order`, `/order/success/*`, `/search`.
   - **Missing** on `/admin/*` and `/seller/*` dashboard routes (crawlers are not instructed to stay out at the root level).
6. Distinction between Public and Private Seller URLs:
   - Public seller storefronts are located at `/sellers/[sellerId]` (plural `/sellers/`).
   - Private seller dashboard routes are located under `/seller/*` (singular `/seller/`).
   - Disallowing `/seller/` in `robots.txt` is completely safe and will not block public storefronts (`/sellers/`).

---

## 5. Global Metadata Status

### File Inspection: `src/app/layout.tsx`

```tsx
export const metadata: Metadata = {
  title: "ShopHub | Many Stores. One Trusted Place.",
  description: "Connect with verified independent fashion sellers and designers. Trust-first commerce with escrow-protected payments.",
  keywords: ["fashion", "local designers", "boutiques", "independent fashion labels", "social commerce"],
};
```

### Issues Found in Root Layout

1. **FILE:** `src/app/layout.tsx`
   - **CURRENT:** `title: "ShopHub | Many Stores. One Trusted Place."`
   - **PROBLEM:** Uses legacy/placeholder brand name `"ShopHub"` instead of the actual platform brand name `"MiniBrands"`. Lacks `title.template` (`%s | MiniBrands`).
   - **SEO IMPACT:** Brand inconsistency across search result snippets. Subpages without title templates duplicate or override branding unpredictably.
   - **RECOMMENDATION:** Change title to `title: { default: "MiniBrands | Fashion-Forward Local Marketplace", template: "%s | MiniBrands" }`.

2. **FILE:** `src/app/layout.tsx`
   - **CURRENT:** No `metadataBase` property defined.
   - **PROBLEM:** Next.js throws build/runtime warnings and fails to resolve relative OpenGraph image URLs without a valid `metadataBase`.
   - **SEO IMPACT:** Social media previews (WhatsApp, Twitter, Facebook, iMessage) fail to render images correctly when shared.
   - **RECOMMENDATION:** Add `metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://minibrands.example.com')`.

3. **FILE:** `src/app/layout.tsx`
   - **CURRENT:** No `openGraph` or `twitter` card objects defined in root layout.
   - **PROBLEM:** Global fallback social share images and metadata are missing.
   - **SEO IMPACT:** Pages lacking page-level OpenGraph metadata inherit zero OpenGraph context.
   - **RECOMMENDATION:** Add default `openGraph` and `twitter: { card: 'summary_large_image' }` configurations.

4. **FILE:** `src/app/layout.tsx`
   - **CURRENT:** No `authors`, `creator`, `publisher`, `applicationName`, or `icons` configuration.
   - **PROBLEM:** Incomplete HTML `<head>` signals for modern web standards and PWA capability.
   - **SEO IMPACT:** Lower site authority signals.

---

## 6. Page-by-Page Metadata Audit

| Route | Exists | Title Metadata | Description Metadata | Dynamic Metadata | Canonical URL | OpenGraph | Twitter Card | Robots Metadata | JSON-LD | Overall SEO Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `/` (Home) | ✅ | ✅ Yes | ✅ Yes | ❌ Static | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Default | ❌ Missing | ⚠️ Partial |
| `/products` | ✅ | ✅ Yes | ✅ Yes | ✅ `generateMetadata` | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Default | ❌ Missing | ⚠️ Partial |
| `/products/[productId]` | ✅ | ✅ Yes | ✅ Yes | ✅ `generateMetadata` | ❌ Missing | ⚠️ Partial (Title/Desc/Img) | ❌ Missing | ❌ Default | ✅ Product | ⚠️ Partial |
| `/sellers/[sellerId]` | ✅ | ✅ Yes | ✅ Yes | ✅ `generateMetadata` | ❌ Missing | ⚠️ Partial (Title/Desc) | ❌ Missing | ❌ Default | ✅ LocalBusiness | ⚠️ Partial |
| `/stores` | ✅ | ❌ Missing | ❌ Missing | ❌ None | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Default | ❌ Missing | ❌ Missing |
| `/categories` | ✅ | ✅ Yes | ✅ Yes | ❌ Static | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Default | ❌ Missing | ⚠️ Partial |
| `/category/[category]` | ✅ | ✅ Yes | ✅ Yes | ✅ `generateMetadata` | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Default | ❌ Missing | ⚠️ Partial |
| `/search` | ✅ | ✅ Yes | ❌ Missing | ❌ Static | ❌ Missing | ❌ Missing | ❌ Missing | ✅ `noindex, nofollow` | ❌ Missing | ✅ Good (Intended noindex) |
| `/about` | ✅ | ✅ Yes | ✅ Yes | ❌ Static | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Default | ❌ Missing | ⚠️ Partial |
| `/contact` | ✅ | ❌ Missing | ❌ Missing | ❌ None | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Default | ❌ Missing | ❌ Missing |
| `/faqs` | ✅ | ✅ Yes | ✅ Yes | ❌ Static | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Default | ❌ Missing | ⚠️ Partial |
| `/terms` | ✅ | ✅ Yes | ✅ Yes | ❌ Static | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Default | ❌ Missing | ⚠️ Partial |
| `/privacy` | ✅ | ✅ Yes | ✅ Yes | ❌ Static | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Default | ❌ Missing | ⚠️ Partial |
| `/returns-policy` | ✅ | ✅ Yes | ✅ Yes | ❌ Static | ❌ Missing | ❌ Missing | ❌ Missing | ❌ Default | ❌ Missing | ⚠️ Partial |

---

## 7. Canonical URL Audit

**Canonical Status:** **0 Canonical Tags Defined (100% MISSING)**

### Findings & Analysis
1. Repository search for `alternates` or `canonical` returned **0 SEO canonical implementations**.
2. Query Parameter Vulnerabilities:
   - On `/products`, query parameters accepted: `q`, `category`, `minPrice`, `maxPrice`, `sort`, `rating`, `discount`, `page`.
   - On `/category/[category]`, sorting/filtering parameters can create URLs such as `/category/Streetwear?sort=price_asc&page=2`.
   - On `/stores`, filtering parameters create near-duplicate pages.
3. Impact: Without `alternates: { canonical: "https://<domain>/category/Streetwear" }`, search engines (Googlebot) have to guess which parameter permutation is the primary URL, risking indexing sub-optimal filtered pages or diluting page rank across parameter variations.

---

## 8. OpenGraph & Twitter Audit

**OpenGraph / Twitter Status:** **INCOMPLETE**

### Findings & Analysis
1. **Product Detail Page (`src/app/products/[productId]/page.tsx`):**
   - Configures `openGraph: { title, description, images }`.
   - Lacks `twitter: { card: 'summary_large_image' }`.
2. **Seller Storefront Page (`src/app/sellers/[sellerId]/page.tsx`):**
   - Configures `openGraph: { title, description }`.
   - Lacks `images` array in `openGraph`.
   - Lacks `twitter` object.
3. **All Other Pages (`/`, `/stores`, `/categories`, `/category/[category]`, `/about`, `/contact`, `/faqs`, `/terms`, `/privacy`, `/returns-policy`):**
   - Completely lack `openGraph` and `twitter` metadata declarations.

---

## 9. Structured Data / JSON-LD Audit

**Structured Data Status:** **PARTIALLY IMPLEMENTED (2 pages only)**

### Existing Schemas in Codebase

#### 1. `Product` Schema — `src/app/products/[productId]/page.tsx` (Lines 232–256)
```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "product.name",
  "image": ["image_urls"],
  "description": "product.shortDescription",
  "offers": {
    "@type": "Offer",
    "priceCurrency": "INR",
    "price": "formatted_price",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "LocalBusiness",
      "name": "product.seller.businessName",
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "city",
        "addressRegion": "Tamil Nadu",
        "addressCountry": "IN"
      }
    }
  }
}
```
- **Strengths:** Accurately maps real Prisma data (`name`, `shortDescription`, `price`, `images`, `stockCount`, `city`).
- **Gaps:** Omits `aggregateRating` and `review` array from the JSON-LD payload even though review data is already queried by the page component (`reviewSummary`, `initialReviews`).

#### 2. `LocalBusiness` Schema — `src/app/sellers/[sellerId]/page.tsx` (Lines 98–111)
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "storeName || businessName",
  "image": "coverImage",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "city",
    "addressRegion": "Tamil Nadu",
    "addressCountry": "IN"
  },
  "priceRange": "₹₹",
  "telephone": ""
}
```
- **Strengths:** Uses seller's store name, banner/logo, and verified city.
- **Gaps:** `telephone` is empty string (`""`). Omits `aggregateRating` from seller reviews.

### Missing Schemas Across Platform
- `Organization` Schema: Missing on homepage (`/`).
- `WebSite` Schema with `SearchAction` (Sitelinks Searchbox): Missing on homepage (`/`).
- `BreadcrumbList` Schema: Missing on product detail pages, category pages, and store pages.
- `FAQPage` Schema: Missing on `/faqs`.

---

## 10. Indexability & Private Route Audit

### Verification of Private Route Directives

1. **Private Buyer Pages (`/cart`, `/checkout`, `/account/*`, `/claim-order`, `/order/success/*`):**
   - Correctly declare `robots: { index: false, follow: false }` or are guarded by auth redirects.
2. **Search Page (`/search`):**
   - Correctly declares `robots: { index: false, follow: false }` to avoid indexing internal search query strings.
3. **Private Admin Pages (`/admin/*`):**
   - Guarded by `AdminRootLayout` session check (`src/app/admin/layout.tsx`).
   - **Risk:** Lacks `robots: { index: false, follow: false }` in layout or root `robots.txt`. If unauthenticated users hit login pages (`/admin/login`), search engine crawlers might index admin page titles.
4. **Private Seller Dashboard Pages (`/seller/*`):**
   - Some individual pages set metadata title, but **lack explicit `noindex` directives** or root `robots.txt` exclusion.

---

## 11. Internal Linking & Crawlability

1. **Navigation & Links:**
   - [src/components/Footer.tsx](file:///c:/Users/asus/OneDrive/DTS/velvet/src/components/Footer.tsx) and header components use standard Next.js `<Link href="...">` HTML elements, allowing crawlers to discover `/products`, `/categories`, `/about`, `/contact`, `/faqs`, `/privacy`, `/terms`, `/returns-policy`.
2. **Catalog Crawlability:**
   - Products are linked via `<Link href={`/products/${product.id}`}>` from catalog grids and homepage featured listings.
   - Seller storefronts are linked via `<Link href={`/sellers/${seller.id}`}>`.
   - Category pages link to `/category/${category}`.
3. **Crawl Depth:**
   - All public pages are reachable within 2 clicks from the homepage.

---

## 12. Image SEO Audit

1. **Product Cards ([src/components/product/ProductCard.tsx](file:///c:/Users/asus/OneDrive/DTS/velvet/src/components/product/ProductCard.tsx)):**
   - Uses Next.js `<Image src={primaryImage} alt={product.name} fill sizes="..." />`.
   - Uses descriptive `alt` tags matching the exact product name (`product.name`).
2. **Storefront Logos & Banners:**
   - Logo badges use `product.seller.storeLogo` with secondary `alt` fallback.
3. **OpenGraph Images:**
   - Product detail page passes primary image URL to `openGraph.images`.
   - Root layout and static pages lack default OpenGraph preview images (`og-image.jpg`).

---

## 13. Google Search Console Readiness Audit

| Checkpoint | Status | Detail |
| :--- | :---: | :--- |
| 1. Sitemap Endpoint | ❌ Not Ready | No `/sitemap.xml` endpoint exists. |
| 2. Robots.txt Endpoint | ❌ Not Ready | No `/robots.txt` endpoint exists. |
| 3. Production Domain Config | ⚠️ Partial | Defined in `.env.example` as `NEXT_PUBLIC_APP_URL`, but missing `metadataBase` in layout. |
| 4. Canonical URL Coverage | ❌ Not Ready | 0 canonical tags defined. |
| 5. Core Web Vitals / Performance | ✅ Ready | Uses Next.js App Router, font optimization, and server components. |
| 6. Indexable Public Pages | ✅ Ready | Public pages exist with server-rendered content. |
| 7. Accidental Noindex on Public Content | ✅ Clear | Public pages (`/`, `/products`, `/sellers`, `/category`) do NOT have accidental `noindex`. |
| 8. Structured Data Validation | ⚠️ Partial | Product and LocalBusiness schema exist, but need Breadcrumb and WebSite schemas. |
| 9. HTTPS Assumptions | ✅ Ready | Standard production setup assumes HTTPS. |

---

## 14. Database SEO Data Availability

Inspection of `prisma/schema.prisma` confirms that all data necessary for rich SEO and dynamic sitemaps is already supported by the database model:

### `Product` Model
- `id`: String (UUID) — Used for route URL `/products/[productId]`
- `name`: String — Product title
- `shortDescription`, `fullDescription`: String — Product meta & JSON-LD description
- `price`: Int (paise) — Converted to INR (`price / 100`) for Offer schema
- `isPublished`: Boolean, `isDeleted`: Boolean, `status`: ProductStatus — Used to filter active products for sitemap
- `updatedAt`: DateTime — Used for sitemap `<lastmod>`
- `category`: String, `subcategory`: String? — Category mapping
- `images`: ProductImage[] (`url`) — Image sitemap & JSON-LD image array
- `variants`: ProductVariant[] (`stockCount`) — Availability schema (`InStock` vs `OutOfStock`)
- `averageRating`, `reviewCount`: Float/Int — Rating schema
- *Note:* Product model does **not** have a `slug` field. URLs use `id` (UUID).

### `Seller` Model
- `id`: String (UUID) — Used for route URL `/sellers/[sellerId]`
- `businessName`, `storeName`: String — Store title
- `storeLogo`, `storeBanner`, `storeDescription`: String? — LocalBusiness schema assets
- `city`: String — Address locality
- `verification`: SellerVerification (`kycStatus`, `bankVerified`) — Used to filter verified seller storefronts for sitemap
- `updatedAt`: DateTime — Used for sitemap `<lastmod>`
- *Note:* Seller model does **not** have a `slug` field. Storefront URLs use `id` (UUID).

---

## 15. Technical SEO Issues

1. **Placeholder Brand Name in Root Metadata:** `src/app/layout.tsx` uses `"ShopHub"` instead of `"MiniBrands"`.
2. **Missing `metadataBase`:** Causes relative OpenGraph asset resolution failure in Next.js.
3. **Missing Root `robots.txt` & `sitemap.xml`:** GSC cannot submit or automatically discover platform pages.
4. **Missing Canonical Tags:** Risk of duplicate content issues from query strings (`?category=`, `?sort=`, `?page=`).
5. **Missing Metadata on Store Directory & Contact Pages:** `stores/page.tsx` and `contact/page.tsx` export zero metadata.
6. **Incomplete JSON-LD Schemas:** Product JSON-LD omits `aggregateRating` and `review` array despite data being available. Missing `Organization`, `WebSite`, and `BreadcrumbList` schemas.

---

## 16. What Already Exists

- Product detail page dynamic metadata (`generateMetadata`) in `src/app/products/[productId]/page.tsx`.
- Seller storefront dynamic metadata (`generateMetadata`) in `src/app/sellers/[sellerId]/page.tsx`.
- Category page dynamic metadata (`generateMetadata`) in `src/app/category/[category]/page.tsx`.
- Product catalog dynamic title in `src/app/products/page.tsx`.
- Static page metadata on `/about`, `/faqs`, `/privacy`, `/terms`, `/returns-policy`, `/categories`, `/page.tsx`.
- Page-level `noindex, nofollow` on `/cart`, `/checkout`, `/account/*`, `/claim-order`, `/order/success/*`, and `/search`.
- Valid `Product` JSON-LD schema on product pages.
- Valid `LocalBusiness` JSON-LD schema on seller storefront pages.
- Next.js `<Image>` optimization with descriptive `alt` tags in product cards.

---

## 17. What Is Missing

- Root dynamic sitemap (`src/app/sitemap.ts`).
- Root robots configuration (`src/app/robots.ts`).
- `metadataBase` configuration in `src/app/layout.tsx`.
- Canonical URL declarations (`alternates: { canonical: ... }`) across all pages.
- Metadata exports on `/stores` (`src/app/stores/page.tsx`) and `/contact` (`src/app/contact/page.tsx`).
- `twitter: { card: 'summary_large_image' }` configuration.
- Homepage (`/`) `Organization` and `WebSite` SearchAction JSON-LD.
- `BreadcrumbList` JSON-LD on product, seller, and category pages.
- Explicit `robots: { index: false, follow: false }` on `/admin/*` and `/seller/*` private dashboard layouts.

---

## 18. What Is Incorrect

- `src/app/layout.tsx` title is set to `"ShopHub | Many Stores. One Trusted Place."` (incorrect brand name).
- Absence of `title.template` causes subpage title inconsistencies.
- Product JSON-LD schema omits existing `aggregateRating` data.

---

## 19. What Should NOT Be Changed

- Database schema (`prisma/schema.prisma`) — Product and Seller UUID identifiers and data structures are fully functional and supported.
- Page-level `robots: { index: false, follow: false }` on `/search` and private transactional pages (`/cart`, `/checkout`, `/account/*`).
- Authentication, payment processing, or seller dashboard application logic.

---

## 20. Recommended Implementation Plan

### Priority P0 — Critical before Google Search Console Indexing
1. **Create `src/app/sitemap.ts`**: Dynamically query published products (`isPublished: true, isDeleted: false`), verified sellers (`kycStatus: approved/auto_approved, bankVerified: true`), static categories, and static public pages.
2. **Create `src/app/robots.ts`**: Allow public routes, disallow `/api/`, `/admin/`, `/seller/`, `/account/`, `/cart/`, `/checkout/`, `/orders/`, `/order/`, `/claim-order/`, and point to `${siteUrl}/sitemap.xml`.
3. **Fix Root Layout (`src/app/layout.tsx`)**: Replace `"ShopHub"` with `"MiniBrands"`, set `title.template`, and configure `metadataBase`.

### Priority P1 — Important SEO Improvements
1. **Add Canonical URLs**: Implement `alternates: { canonical: ... }` on all public page metadata generators.
2. **Add Missing Metadata**: Add title & description metadata to `stores/page.tsx` and `contact/page.tsx`.
3. **Enhance Social Previews**: Add `twitter: { card: 'summary_large_image' }` and OpenGraph images across all public pages.
4. **Add Homepage & Breadcrumb Structured Data**: Add `Organization` & `WebSite` JSON-LD to `/` and `BreadcrumbList` to `/products/[productId]` and `/sellers/[sellerId]`.

### Priority P2 — Enhancements
1. **Expand Product JSON-LD**: Include `aggregateRating` and `review` array inside Product JSON-LD payload.
2. **Explicit Admin/Seller Dashboard Noindex**: Add layout-level `noindex` to `src/app/admin/layout.tsx` and `src/app/seller/` private layouts.

---

## FINAL AUDIT VERIFICATION SUMMARY

### VERIFIED AS EXISTING
- Dynamic metadata generation on product detail pages, seller storefront pages, category pages, and catalog search pages.
- Valid `Product` JSON-LD on product detail pages.
- Valid `LocalBusiness` JSON-LD on seller storefront pages.
- Page-level `noindex` on private transactional routes and search pages.
- Server-rendered HTML internal linking across header, footer, and catalog cards.
- Next.js image optimization with descriptive alt text on product cards.

### VERIFIED AS MISSING
- `src/app/sitemap.ts` or `public/sitemap.xml`
- `src/app/robots.ts` or `public/robots.txt`
- `metadataBase` in root layout
- Canonical URL declarations (`alternates.canonical`) across all routes
- Page metadata on `/stores` and `/contact`
- Twitter card metadata specifications (`summary_large_image`)
- `Organization` and `WebSite` SearchAction JSON-LD on homepage
- `BreadcrumbList` JSON-LD schema

### VERIFIED AS PARTIAL
- Root layout metadata (has title/description/keywords, but wrong brand name and missing `metadataBase`/OpenGraph/Twitter).
- Page-level robots metadata (covers buyer pages, but lacks root `robots.txt` and private admin/seller layout declarations).
- JSON-LD structured data (present on product/seller pages, but missing reviews/ratings in payload and missing site-wide schemas).

### INCORRECT IMPLEMENTATIONS
- Root layout title contains legacy placeholder brand name `"ShopHub"`.
- Relative OpenGraph image URLs failing due to missing `metadataBase`.

### SAFE TO IMPLEMENT NEXT
1. `src/app/sitemap.ts`
2. `src/app/robots.ts`
3. Fix branding & add `metadataBase` in `src/app/layout.tsx`
4. Add canonical URLs (`alternates.canonical`)
5. Add metadata to `/stores` and `/contact`

### DO NOT TOUCH
- `prisma/schema.prisma`
- Payment, cart, checkout, or auth logic
- Existing page-level `noindex` configuration on private buyer pages

---

### GOOGLE SEARCH CONSOLE READINESS SCORE: **28 / 100**

- **Critical Blockers:** Absence of `sitemap.xml` and root `robots.txt`; missing `metadataBase`.
- **Quick Wins:** Add `src/app/sitemap.ts`, `src/app/robots.ts`, update `layout.tsx` brand title and `metadataBase`.
- **Medium-Term Improvements:** Canonical URLs, `BreadcrumbList` schema, `Organization` homepage schema, OpenGraph/Twitter cards.
- **Risks:** Submitting to Google Search Console before creating `sitemap.xml` and `robots.txt` will result in inefficient crawl budgets and missing indexing for seller stores and products.
