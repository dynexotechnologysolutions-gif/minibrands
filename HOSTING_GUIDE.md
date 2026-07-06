# Velvet Lane – End-to-End Free Hosting & Deployment Guide

This guide details how to host the **Velvet Lane** platform 100% efficiently and **completely FREE of cost**, using free-tier services (Vercel, Neon, Upstash, Cloudinary).

---

## Architecture Overview

Velvet Lane uses a modern, high-performance web architecture:

```
┌─────────────────────────────────────────────────────────┐
│              Vercel (Frontend + Server Actions)        │
│          Next.js App Router (React 19 + SSR)            │
└──────────────┬──────────────────┬───────────────────────┘
               │                  │
               ▼                  ▼
┌──────────────────────────┐    ┌─────────────────────────┐
│  Neon.tech / Supabase    │    │      Upstash Redis      │
│  PostgreSQL Database     │    │  Cart Locks & Cache     │
└──────────────────────────┘    └─────────────────────────┘
               │                  │
               ▼                  ▼
┌──────────────────────────┐    ┌─────────────────────────┐
│     Cloudinary CDN       │    │      Razorpay PG        │
│ Product Images & Evidence│    │ Payments & Refunds      │
└──────────────────────────┘    └─────────────────────────┘
```

---

## Step 1: Database Setup (Neon PostgreSQL – Free Tier)

**Neon.tech** provides a serverless PostgreSQL database with 0.5 GiB storage for free.

1. Go to [Neon.tech](https://neon.tech) and create a free account.
2. Click **Create Project**, name it `velvet-lane`, and select a region (e.g. `ap-south-1` Asia Pacific / Mumbai).
3. Copy the Pooled Connection String provided in the dashboard. It will look like:
   ```env
   DATABASE_URL="postgres://alex:Password@ep-cool-flower-123456.ap-southeast-1.aws.neon.tech/velvet?sslmode=require"
   ```

---

## Step 2: Redis Cache Setup (Upstash Redis – Free Tier)

**Upstash** provides 10,000 free Redis requests/day for cart item reservations and lock management.

1. Go to [Upstash.com](https://upstash.com) and sign up.
2. Click **Create Database**, select **Redis**, name it `velvet-cache`, and choose `AWS ap-south-1 (Mumbai)`.
3. In the database details panel, scroll to **REST API** and copy:
   * `UPSTASH_REDIS_REST_URL`
   * `UPSTASH_REDIS_REST_TOKEN`

---

## Step 3: Media Storage Setup (Cloudinary – Free Tier)

1. Go to [Cloudinary.com](https://cloudinary.com) and create a free account (25 GB free storage & bandwidth).
2. Go to Dashboard and copy:
   * `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   * `CLOUDINARY_API_KEY`
   * `CLOUDINARY_API_SECRET`

---

## Step 4: Third-Party Integrations (Razorpay & Resend)

1. **Razorpay Payments**:
   * Create account at [Razorpay.com](https://razorpay.com).
   * Obtain `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from Settings → API Keys.
   * Add a Webhook pointing to `https://your-domain.vercel.app/api/webhooks/razorpay` for `payment.captured`, `refund.processed`, `refund.failed`.
2. **Resend (Email Alerts)**:
   * Create account at [Resend.com](https://resend.com) (3,000 free emails/month).
   * Copy `RESEND_API_KEY`.

---

## Step 5: Frontend & Server Actions Deployment (Vercel – Free Tier)

**Vercel** is the official hosting platform for Next.js and provides unlimited free serverless deployment.

### A. Push Code to GitHub
1. Create a new public/private repository on GitHub named `velvet-lane`.
2. Run in terminal:
   ```bash
   git init
   git add .
   git commit -m "Initial production commit for Velvet Lane"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/velvet-lane.git
   git push -u origin main
   ```

### B. Import to Vercel
1. Go to [Vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New** → **Project**.
3. Import `velvet-lane` repository.
4. Framework Preset: **Next.js**.

### C. Configure Environment Variables in Vercel
In the project setup page, add all Environment Variables:

```env
# Database
DATABASE_URL="postgres://..."

# App URL
NEXT_PUBLIC_APP_URL="https://your-project.vercel.app"
BETTER_AUTH_URL="https://your-project.vercel.app"
BETTER_AUTH_SECRET="your_32_character_random_secret_string"

# Redis Cache
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# Razorpay
RAZORPAY_KEY_ID="..."
RAZORPAY_KEY_SECRET="..."
RAZORPAY_WEBHOOK_SECRET="..."

# Resend Email
RESEND_API_KEY="..."
EMAIL_FROM="onboarding@resend.dev"
```

5. Click **Deploy**.

---

## Step 6: Push Database Schema & Migration

After Vercel finishes the initial build:

1. Open local terminal in your project folder.
2. Update `.env` temporarily with your production `DATABASE_URL` from Neon.
3. Run schema push command:
   ```bash
   npx prisma db push
   ```
4. Seed or create initial admin account:
   ```bash
   npx prisma db seed # if seed script exists
   ```

---

## Step 7: Webhook Endpoint Configuration

Update webhook callback URLs in vendor dashboards:

1. **Razorpay**: Set URL to `https://your-app.vercel.app/api/webhooks/razorpay`
2. **Signzy (Seller KYC)**: Set URL to `https://your-app.vercel.app/api/webhooks/signzy`
3. **iCarry (Logistics)**: Set URL to `https://your-app.vercel.app/api/icarry/webhook/your_secret`

---

## Step-by-Step Summary Table

| Layer | Service Provider | Plan / Tier | Cost |
| :--- | :--- | :--- | :--- |
| **Frontend & API Actions** | Vercel | Hobby Tier | **$0 / month** |
| **PostgreSQL Database** | Neon.tech / Supabase | Free Serverless | **$0 / month** |
| **Redis Cache / Locking** | Upstash Redis | Free 10k req/day | **$0 / month** |
| **Media CDN / Images** | Cloudinary | Free 25GB | **$0 / month** |
| **Transactional Email** | Resend | Free 3,000 emails/mo | **$0 / month** |
| **Payment Gateway** | Razorpay | Standard (Per tx fee) | **$0 setup fee** |
