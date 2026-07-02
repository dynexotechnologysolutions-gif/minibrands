# Velvet Lane Platform Navigation & Route Audit

## 1. Executive Summary

An audit of the Velvet Lane platform's information architecture, routing matrix, and navigation flow was conducted by inspecting the file-based routing layout in `src/app/` and the associated components. 

### Key Findings
* **Layout Consistency**: The platform is powered by a single root layout (`src/app/layout.tsx`). General inner pages use a standard [Header](file:///c:/Users/asus/OneDrive/DTS/velvet/src/components/Header.tsx) and [Footer](file:///c:/Users/asus/OneDrive/DTS/velvet/src/components/Footer.tsx), while the landing page employs a specialized [HomeHeader](file:///c:/Users/asus/OneDrive/DTS/velvet/src/components/home/HomeHeader.tsx).
* **Role-Based Controls**: Role management handles transitioning users between **BUYER** and **SELLER** modes.
* **Orphan & Redundant Routes**: 
  * The `/catalog` directory exists but is completely empty (unused).
  * The `/category/[category]` route is orphaned and unreachable through the UI because category filters are handled on the main `/products` catalog page using query parameters.
  * The `/search` page is orphaned; the search bar in `HomeHeader.tsx` routes directly to `/products?q=...`.
* **Redirects**: Legacy paths such as `/orders`, `/profile`, `/wishlist`, and `/addresses` are correctly configured to redirect to their clean, nested `/account/...` paths.

---

## 2. Buyer Pages

### Public Pages
* **Landing Page (`/`)**
  * **Purpose**: Primary marketing entry point and feed, showcasing featured local designers, Editor's Picks, trending items, and category rows.
  * **Navigation Entry**: Roots at domain level (`http://localhost:3000/`).
  * **Exit Paths**: Direct links to products (`/products/[productId]`), boutique storefronts (`/sellers/[sellerId]`), general catalog (`/products`), and account settings.
  * **Authentication**: None.
* **Public Catalog (`/products`)**
  * **Purpose**: Displays the main search/filter results with options for sorting, price ranges, and active categories.
  * **Navigation Entry**: Header search submission, clicking "View All Products", or filtering by category on the homepage.
  * **Exit Paths**: `/products/[productId]`, `/cart`, `/account/profile`.
  * **Authentication**: None.
* **Product Details (`/products/[productId]`)**
  * **Purpose**: Detailed item viewing, size selection, image galleries, and seller storefront redirects.
  * **Navigation Entry**: Clicked from the home feed or catalog grid.
  * **Exit Paths**: Add to Cart (`/cart`), Wishlist (`/account/wishlist`), Seller Boutique (`/sellers/[sellerId]`), Catalog (`/products`).
  * **Authentication**: None (adding items to cart or toggle wishlist triggers redirect to `/login`).
* **Boutique Storefront (`/sellers/[sellerId]`)**
  * **Purpose**: Showcases a specific boutique's identity, description, banner, verification status, reviews, and catalog of listed products.
  * **Navigation Entry**: Clicking on the boutique's name on product detail cards, the home feed, or the seller's dashboard link.
  * **Exit Paths**: `/products/[productId]`, `/products`.
  * **Authentication**: None.

### Buyer Authentication & Onboarding
* **Login/Register (`/login`)**
  * **Purpose**: Unified credential entry supporting redirect query parameters (`?redirectTo=...`) and role specifications (`?role=seller`).
  * **Navigation Entry**: Header "Login" CTA, unauthorized redirects, or footer seller registration links.
  * **Exit Paths**: Redirect back to the requested path, or the buyer/seller dashboard.
  * **Authentication**: None.
* **Session Expired (`/session-expired`)**
  * **Purpose**: Intermediate error page for expired sessions, offering quick reload options.
  * **Navigation Entry**: Redirected automatically from checkout when session checks fail.
  * **Exit Paths**: `/login`, `/cart`.
  * **Authentication**: None.

### Cart & Checkout
* **Shopping Cart (`/cart`)**
  * **Purpose**: Displays reserved items, countdown timer (concurrency reservations), price breakdown, and checkout action.
  * **Navigation Entry**: Header shopping bag icon.
  * **Exit Paths**: Checkout (`/checkout`), Browse (`/products`).
  * **Authentication**: Required.
* **Checkout (`/checkout`)**
  * **Purpose**: Escrow-protected checkout summary, delivery address selection/creation, and Razorpay payment processing.
  * **Navigation Entry**: Clicked "Proceed to Checkout" from the cart page.
  * **Exit Paths**: Order Success (`/order/success/[orderId]`), Cart (`/cart`), Session Expired (`/session-expired`).
  * **Authentication**: Required.
* **Order Placement Confirmation (`/order/success/[orderId]`)**
  * **Purpose**: Post-payment receipt page verifying Razorpay signature and listing iCarry AWB tracking codes.
  * **Navigation Entry**: Redirected automatically upon successful Razorpay payment verification.
  * **Exit Paths**: View Order details (`/account/orders/[orderId]`), Home (`/`).
  * **Authentication**: Required.

### Account Management
* **My Orders List (`/account/orders`)**
  * **Purpose**: Lists all previous orders placed by the user.
  * **Navigation Entry**: Account dropdown link "My Orders".
  * **Exit Paths**: Order detail page (`/account/orders/[orderId]`), Home (`/`).
  * **Authentication**: Required.
* **Order Details (`/account/orders/[orderId]`)**
  * **Purpose**: Full breakdown of an order, shipment status, tracking URL, escrow release release timer, and a review writing form.
  * **Navigation Entry**: Clicked from the orders list.
  * **Exit Paths**: `/account/orders`, Boutique Storefront (`/sellers/[sellerId]`).
  * **Authentication**: Required (strict ownership check).
* **My Profile (`/account/profile`)**
  * **Purpose**: Main account overview displaying total order counts, wishlist count, default shipping address, and active role switcher.
  * **Navigation Entry**: Account dropdown link "My Profile".
  * **Exit Paths**: Wishlist (`/account/wishlist`), Addresses (`/account/addresses`), Security Settings (`/account/security`), Seller Dashboard (`/seller/dashboard`).
  * **Authentication**: Required.
* **Address Management (`/account/addresses`)**
  * **Purpose**: Create, edit, set default, and delete shipping addresses.
  * **Navigation Entry**: Profile page link "Manage Addresses" or `/checkout` address change trigger.
  * **Exit Paths**: `/account/profile`, `/checkout`.
  * **Authentication**: Required.
* **My Wishlist (`/account/wishlist`)**
  * **Purpose**: Display items the user added to their wishlist, coupled with recommendations based on recently viewed items.
  * **Navigation Entry**: Account dropdown link "My Wishlist" or profile overview card.
  * **Exit Paths**: Product details (`/products/[productId]`), Home (`/`).
  * **Authentication**: Required.
* **Security Settings (`/account/security`)**
  * **Purpose**: Change password and configure credential options.
  * **Navigation Entry**: Profile page sidebar menu "Security Settings".
  * **Exit Paths**: `/account/profile`.
  * **Authentication**: Required.

---

## 3. Seller Pages

* **Seller Onboarding (`/seller/onboarding`)**
  * **Purpose**: Onboarding form for KYC verification, PAN validation, and bank account setup via Signzy.
  * **Navigation Entry**: Login as seller, or switching mode to seller for the first time.
  * **Exit Paths**: Dashboard (`/seller/dashboard`) once KYC is approved.
  * **Authentication**: Required.
* **Seller Dashboard (`/seller/dashboard`)**
  * **Purpose**: Performance analytics (Total Sales, Orders Count, Wallet Balance), KYC statuses, recent orders table, and quick link actions.
  * **Navigation Entry**: Account dropdown switcher (when mode is SELLER), or `/login?role=seller`.
  * **Exit Paths**: View Storefront (`/sellers/[sellerId]`), Manage Products (`/seller/products`), Manage Orders (`/seller/orders`), Profile (`/seller/profile`).
  * **Authentication**: Required (verified seller role).
* **Manage Products (`/seller/products`)**
  * **Purpose**: Lists all seller inventory with instant publish/unpublish toggles, edit links, and stock checks.
  * **Navigation Entry**: Sidebar navigation link "Products".
  * **Exit Paths**: Create Product (`/seller/products/new`), Edit Product (`/seller/products/[productId]/edit`), Dashboard.
  * **Authentication**: Required.
* **Create Product (`/seller/products/new`)**
  * **Purpose**: Form to list new items with size variations, image uploads, and an AI description generator.
  * **Navigation Entry**: Button "Add Product" on the manage products page.
  * **Exit Paths**: `/seller/products`.
  * **Authentication**: Required.
* **Edit Product (`/seller/products/[productId]/edit`)**
  * **Purpose**: Update details, add stock, or add image uploads for existing products.
  * **Navigation Entry**: Clicked "Edit" on a product card in the manage products list.
  * **Exit Paths**: `/seller/products`.
  * **Authentication**: Required.
* **Manage Orders (`/seller/orders`)**
  * **Purpose**: Tabbed view of incoming orders (Paid, Confirmed, Shipped, Completed), confirm order action, print shipping label action, and ship modal.
  * **Navigation Entry**: Sidebar navigation link "Orders".
  * **Exit Paths**: Order details (`/seller/orders/[orderId]`).
  * **Authentication**: Required.
* **Seller Order Details (`/seller/orders/[orderId]`)**
  * **Purpose**: View buyer delivery details, tracking details, commission breakdown, print labels, and apply shipping tracking overrides.
  * **Navigation Entry**: Clicked from the seller orders list.
  * **Exit Paths**: `/seller/orders`.
  * **Authentication**: Required.
* **Boutique Profile (`/seller/profile`)**
  * **Purpose**: Configure store logo, banner image, business description, and seller category selectors.
  * **Navigation Entry**: Sidebar navigation link "Profile Settings".
  * **Exit Paths**: `/seller/dashboard`.
  * **Authentication**: Required.

---

## 4. Shared Pages

The pages that share assets or route prefixes across roles:
1. **Login Page (`/login`)**: Serves both buyers and sellers by reading role query settings.
2. **Security Page (`/account/security`)**: Unified component used by both buyers and sellers to change profile passwords.
3. **Session Expired Page (`/session-expired`)**: Standard fallback for authorization timeout.
4. **404 / 500 Error Boundaries**: Shared global boundaries rendering standard Next.js error fallback components.

---

## 5. Public Pages

| Route Path | Page Name | Purpose | Layout |
| :--- | :--- | :--- | :--- |
| `/` | Home Page | Main marketplace discovery feed | Root Layout + HomeHeader + Footer |
| `/products` | Catalog Page | Browse and filter all listed products | Root Layout + Header + Footer |
| `/products/[productId]` | Product Details | Product gallery, pricing, reviews, add to cart | Root Layout + Header + Footer |
| `/sellers/[sellerId]` | Boutique Page | Public boutique storefront & review metrics | Root Layout + Header + Footer |
| `/login` | Auth Page | User sign-in and registration | Root Layout + Header + Footer |
| `/session-expired` | Session Error | Inactive session message page | Root Layout + Header + Footer |
| `/search` | Search Page *(Orphan)* | Dedicated product search page | Root Layout (No Header/Footer) |
| `/category/[category]` | Category Page *(Orphan)* | Catalog view filtered by category path parameter | Root Layout (No Header/Footer) |

---

## 6. Protected Pages

| Route Path | Allowed Roles | Purpose | Layout |
| :--- | :--- | :--- | :--- |
| `/cart` | BUYER | View selected items & reserve times | Root Layout + Header + Footer |
| `/checkout` | BUYER | Delivery address & Razorpay transaction gateway | Root Layout + Header + Footer |
| `/order/success/[orderId]` | BUYER | Post-payment invoice & confirmation details | Root Layout + Header + Footer |
| `/account/profile` | BUYER / SELLER | Profile overview and mode toggles | Root Layout + Header + Footer |
| `/account/orders` | BUYER | List of purchases made by the user | Root Layout + Header + Footer |
| `/account/orders/[orderId]` | BUYER | Order timeline, tracking, and product reviews form | Root Layout + Header + Footer |
| `/account/addresses` | BUYER | Shipping addresses management | Root Layout + Header + Footer |
| `/account/wishlist` | BUYER | Saved products & recommendations list | Root Layout + Header + Footer |
| `/account/security` | BUYER / SELLER | Password updates | Root Layout + Header + Footer |
| `/seller/onboarding` | BUYER (to register) | Signzy KYC, PAN & Bank validation | Root Layout + Header + Footer |
| `/seller/dashboard` | SELLER | Performance analytics, wallet earnings and quick links | Root Layout (custom sidebar) |
| `/seller/orders` | SELLER | Customer order fulfillment tabbed board | Root Layout (custom sidebar) |
| `/seller/orders/[orderId]` | SELLER | Customer delivery sheet and label settings | Root Layout (custom sidebar) |
| `/seller/products` | SELLER | List products, toggle visibility and edit stock | Root Layout (custom sidebar) |
| `/seller/products/new` | SELLER | Upload new item with size selections | Root Layout (custom sidebar) |
| `/seller/products/[productId]/edit` | SELLER | Edit existing product details | Root Layout (custom sidebar) |
| `/seller/profile` | SELLER | Customize boutique description, logos and banners | Root Layout (custom sidebar) |

---

## 7. Navigation Graph

```mermaid
graph TD
    %% Public Nodes
    Home["Home (/)"]
    Catalog["Catalog (/products)"]
    ProdDetail["Product Details (/products/[productId])"]
    Boutique["Boutique Page (/sellers/[sellerId])"]
    Login["Login (/login)"]
    SessExp["Session Expired (/session-expired)"]

    %% Protected Buyer Nodes
    Cart["Cart (/cart)"]
    Checkout["Checkout (/checkout)"]
    Success["Order Success (/order/success/[orderId])"]
    AccProfile["Profile (/account/profile)"]
    AccOrders["Orders (/account/orders)"]
    AccOrderDetail["Order Detail (/account/orders/[orderId])"]
    AccAddr["Addresses (/account/addresses)"]
    AccWish["Wishlist (/account/wishlist)"]
    AccSec["Security (/account/security)"]

    %% Protected Seller Nodes
    SellOnb["Seller Onboarding (/seller/onboarding)"]
    SellDash["Seller Dashboard (/seller/dashboard)"]
    SellOrders["Seller Orders (/seller/orders)"]
    SellOrderDetail["Seller Order Detail (/seller/orders/[orderId])"]
    SellProds["Seller Products (/seller/products)"]
    SellNewProd["New Product (/seller/products/new)"]
    SellEditProd["Edit Product (/seller/products/[productId]/edit)"]
    SellProf["Boutique Profile Settings (/seller/profile)"]

    %% Connections
    Home -->|Search / Category| Catalog
    Home -->|Click Product| ProdDetail
    Home -->|Click Boutique| Boutique
    Home -->|Login Button| Login

    Catalog -->|Click Product| ProdDetail
    ProdDetail -->|Seller Link| Boutique
    ProdDetail -->|Add to Cart| Cart
    
    %% Auth Transitions
    Cart -->|Checkout (if logged in)| Checkout
    Cart -.->|If not logged in| Login
    Checkout -->|Razorpay Pay| Success
    Checkout -.->|Session Expired| SessExp
    SessExp -->|Re-login| Login

    %% Buyer Account Connections
    Login -->|Authenticated| AccProfile
    AccProfile -->|Manage Orders| AccOrders
    AccProfile -->|Manage Addresses| AccAddr
    AccProfile -->|Manage Wishlist| AccWish
    AccProfile -->|Manage Security| AccSec
    AccOrders -->|Click Order| AccOrderDetail
    AccWish -->|Click Product| ProdDetail

    %% Seller Transitions
    Login -->|Seller Role (KYC Pending)| SellOnb
    Login -->|Seller Role (KYC Approved)| SellDash
    AccProfile -->|Toggle Seller Mode| SellDash
    SellOnb -->|KYC Approved| SellDash
    
    SellDash -->|Sidebar| SellOrders
    SellDash -->|Sidebar| SellProds
    SellDash -->|Sidebar| SellProf
    SellDash -->|Sidebar| AccSec
    SellDash -->|Sidebar| AccProfile
    
    SellOrders -->|Click Order| SellOrderDetail
    SellProds -->|Add Product| SellNewProd
    SellProds -->|Edit Product| SellEditProd
```

---

## 8. Route Matrix

| Route Path | Buyer | Seller | Admin | Public | Auth Required | Reachable | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `/` | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ | Active |
| `/products` | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ | Active |
| `/products/[productId]` | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ | Active |
| `/sellers/[sellerId]` | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ | Active |
| `/login` | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ | Active |
| `/session-expired` | ✔ | ✔ | ✔ | ✔ | ✖ | ✔ | Active |
| `/search` | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | **Orphaned** |
| `/category/[category]` | ✔ | ✔ | ✔ | ✔ | ✖ | ✖ | **Orphaned** |
| `/cart` | ✔ | ✖ | ✖ | ✖ | ✔ | ✔ | Active |
| `/checkout` | ✔ | ✖ | ✖ | ✖ | ✔ | ✔ | Active |
| `/order/success/[orderId]` | ✔ | ✖ | ✖ | ✖ | ✔ | ✔ | Active |
| `/account/profile` | ✔ | ✔ | ✔ | ✖ | ✔ | ✔ | Active |
| `/account/orders` | ✔ | ✖ | ✖ | ✖ | ✔ | ✔ | Active |
| `/account/orders/[orderId]` | ✔ | ✖ | ✖ | ✖ | ✔ | ✔ | Active |
| `/account/addresses` | ✔ | ✖ | ✖ | ✖ | ✔ | ✔ | Active |
| `/account/wishlist` | ✔ | ✖ | ✖ | ✖ | ✔ | ✔ | Active |
| `/account/security` | ✔ | ✔ | ✔ | ✖ | ✔ | ✔ | Active |
| `/seller/onboarding` | ✔ | ✔ | ✖ | ✖ | ✔ | ✔ | Active |
| `/seller/dashboard` | ✖ | ✔ | ✖ | ✖ | ✔ | ✔ | Active |
| `/seller/orders` | ✖ | ✔ | ✖ | ✖ | ✔ | ✔ | Active |
| `/seller/orders/[orderId]` | ✖ | ✔ | ✖ | ✖ | ✔ | ✔ | Active |
| `/seller/products` | ✖ | ✔ | ✖ | ✖ | ✔ | ✔ | Active |
| `/seller/products/new` | ✖ | ✔ | ✖ | ✖ | ✔ | ✔ | Active |
| `/seller/products/[productId]/edit` | ✖ | ✔ | ✖ | ✖ | ✔ | ✔ | Active |
| `/seller/profile` | ✖ | ✔ | ✖ | ✖ | ✔ | ✔ | Active |

---

## 9. Orphan Pages

### Route: `/catalog`
* **Reason**: Directory is completely empty (no page component).
* **Impact**: Unusable route.
* **Fix**: Delete `/catalog` directory.
* **Priority**: Low.

### Route: `/category/[category]`
* **Reason**: The route expects category name paths (e.g. `/category/Streetwear`), but all category filtering in the application is routed to `/products?category=Streetwear`. There are no links targeting this path.
* **Impact**: Unreachable pages that load duplicate product fetching queries.
* **Fix**: Add links in the home page category selectors pointing to `/category/[category]` or redirect it to `/products?category=...` and delete the folder.
* **Priority**: Medium.

### Route: `/search`
* **Reason**: The page handles searching, but the main site search bar in `HomeHeader.tsx` is hardcoded to route to `/products?q=...`. There is no entrance link to `/search` on any layout.
* **Impact**: Disconnected page containing a duplicate search input box.
* **Fix**: Redirect `/search` to `/products` or update `HomeHeader.tsx` to route queries to `/search?q=...`.
* **Priority**: Medium.

---

## 10. Broken Navigation

### 1. Missing Search Bar in Inner Headers
* **Symptom**: `HomeHeader.tsx` contains a functional search input. However, the generic header `Header.tsx` used by all inner pages (Product Details, Cart, Profile, etc.) lacks a search input entirely.
* **Impact**: Users cannot search for new products while viewing an item, checking their cart, or reading order timelines without returning to the landing page first.

### 2. Disconnected Category buttons in static mockups
* **Symptom**: The static templates in `src/app/home feed/category.html` have hardcoded button styles that do not match the main application behavior.

---

## 11. Layout Audit

### Root Layout (`src/app/layout.tsx`)
* **Pages using it**: All routes.
* **Sidebar**: None.
* **Navbar**: Loaded dynamically inside page components (`Header.tsx` or `HomeHeader.tsx`).
* **Footer**: Loaded dynamically inside page components (`Footer.tsx`).
* **Protected Routes**: None.
* **Missing Navigation / Inconsistencies**: Loading the header and footer dynamically inside each page leads to duplicate imports and potential layout inconsistencies. Moving them to a layout file or a unified layout wrapper is recommended.

### Seller Dashboard Sidebar Layout
* **Pages using it**: `/seller/dashboard`, `/seller/orders`, `/seller/products`, `/seller/profile`.
* **Sidebar**: Sidebar navigation menu is coded in each seller page component.
* **Navbar**: Embedded inside page dashboards.
* **Footer**: None.
* **Protected Routes**: All seller pages.

---

## 12. User Journey Audit

### Buyer Journey
1. **Landing Page (`/`)**: Discover items -> Click "Saree" -> Navigates to `/products?category=Women%27s%20Ethnic%20Wear`.
2. **Catalog Page (`/products`)**: Browse lists -> Click item -> Navigates to `/products/[productId]`.
3. **Product Details Page**: Choose size -> Add to Cart -> Navigates to `/cart`.
4. **Cart Page**: Check countdown reservation -> Click checkout -> Navigates to `/checkout` (requires Auth).
5. **Checkout Page**: Add new address or select default -> Click Make Payment -> Opens Razorpay checkout -> Pay.
6. **Order Success Page**: Payment verified -> Show iCarry details -> Navigates to `/account/orders/[orderId]`.
7. **Order Details**: Check status -> Click "Mark as Delivered" -> Write product review.

### Seller Journey
1. **Login Page**: Select "Boutique Partner" -> Enter credentials -> Logged In.
2. **Onboarding Page**: Complete Signzy KYC (PAN match + bank check) -> Approved.
3. **Dashboard Page**: Switch to Seller mode -> View earnings metrics -> Click "Add Product".
4. **New Product Page**: Fill details -> AI Description helper -> Save product.
5. **Inventory / Products List**: View item in listed state -> Toggle visibility.
6. **Orders Board**: Receive order -> Confirm order (books iCarry automatically) -> Print shipping label.
7. **Fulfillment / Mark Shipped**: Package item -> Hand over to courier -> Mark as Shipped (provide AWB override if needed).
8. **Completed Orders**: Item delivered -> Escrow released -> Earnings credited to seller wallet.

---

## 13. Navigation Health Score

* **Total Pages**: 25 (excluding legacy redirects and mockups)
* **Reachable Pages**: 23
* **Orphan Pages**: 2 (`/search`, `/category/[category]`)
* **Broken Links**: 0
* **Redundant Folders**: 1 (`/catalog`)
* **Navigation Health Score**: **92%**

---

## 14. Action Plan

### High Priority
* **Fix the Search Route Mismatch**:
  Ensure the search flow is unified. Since `/products?q=...` is fully integrated, either redirect `/search` to `/products` or update `/search` to use the unified `CatalogPage` component.
* **Remove Empty Directories**:
  Delete the `/catalog` folder from `src/app/` to prevent directory bloat.

### Medium Priority
* **Unify Category Handling**:
  Configure category entry points on the landing page to link directly to `/products?category=...` or link them to `/category/[category]` pages.
* **Header Search Bar**:
  Update the generic `Header.tsx` to include the search input box from `HomeHeader.tsx` so users can search the platform from any inner page.

### Low Priority
* **Unified Page Layout**:
  Consider extracting `Header` and `Footer` out of individual page components into a unified client layout wrapper to prevent redundant imports.
