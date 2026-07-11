# Production Hardening Roadmap

**Project:** Minibrands Marketplace  
**Current Production Score:** 32/100  
**Target Production Score:** 95+/100  
**Timeline:** 12-15 weeks  
**Total Effort:** 425-500 hours

---

## Executive Overview

This roadmap transforms minibrands from MVP to production-grade SaaS through systematic hardening across 7 milestones. Work is organized by functional domain to enable parallel contributions and clear progress tracking.

**Key Principle:** Database and environment constraints first, then application logic, never magic fixes.

---

## Milestone 1: Database & Environment (Week 1-2)
**Owner:** Database Architect + Backend Lead  
**Effort:** 80 hours  
**Blockers:** None (can start immediately)  
**Includes:** Issues #1-8

### Goals
- [x] Environment validation fails hard (no silent failures)
- [x] Database schema has protective constraints
- [x] Migration strategy established and tested
- [x] All env vars documented and validated
- [x] Connection pooling configured

### Issues

#### #1: Add environment validation
- **Type:** Infrastructure
- **Severity:** Critical
- **Files:** `src/lib/env.ts`, `src/app/api/health/route.ts`, `src/lib/prisma.ts`
- **Work:** Validate all required env vars at startup, fail hard
- **Acceptance:** App won't start without all required vars, clear error messages

#### #2: Add Prisma migrations
- **Type:** Database
- **Severity:** Critical
- **Files:** `prisma/migrations/`, `prisma/schema.prisma`
- **Work:** Set up migration infrastructure, create init migration
- **Acceptance:** Migrations run cleanly on fresh database

#### #3: Add unique constraints to prevent duplicates
- **Type:** Database
- **Severity:** Critical
- **Files:** `prisma/schema.prisma`
- **Work:** Add unique(razorpayOrderId) on Order, unique(razorpayPaymentId) on Payment
- **Acceptance:** Database prevents duplicate records at constraint level

#### #4: Add missing database indexes
- **Type:** Database
- **Severity:** High
- **Files:** `prisma/schema.prisma`
- **Work:** Add indexes on (buyerId, createdAt), (sellerId, status), etc.
- **Acceptance:** Query performance improves by 50%+, no N+1 queries

#### #5: Configure database connection pooling
- **Type:** Infrastructure
- **Severity:** Critical
- **Files:** `src/lib/prisma.ts`, `.env.example`
- **Work:** Add connection pool config to DATABASE_URL, set limits
- **Acceptance:** Database survives 1000+ concurrent connections without exhaustion

#### #6: Document environment variables
- **Type:** Documentation
- **Severity:** High
- **Files:** `.env.example`, `docs/ENV_VARS.md`
- **Work:** Create reference for all 25+ environment variables
- **Acceptance:** Developers can set up new environment without guessing

#### #7: Add migration rollback strategy
- **Type:** Operations
- **Severity:** High
- **Files:** `docs/MIGRATION_ROLLBACK.md`, scripts
- **Work:** Document and test rollback procedures for schema changes
- **Acceptance:** Can safely rollback any migration in production

#### #8: Add .env validation schema
- **Type:** Infrastructure
- **Severity:** Medium
- **Files:** `src/lib/env.ts`
- **Work:** Use Zod to validate env vars at startup
- **Acceptance:** Clear, actionable error on invalid configuration

### Definition of Done
- [ ] All env vars listed in `.env.example`
- [ ] Env validation runs at server startup
- [ ] Initial migration created and tested
- [ ] Unique constraints on payment tables
- [ ] Missing indexes added
- [ ] Connection pool configured
- [ ] Documentation complete
- [ ] `npm run build` succeeds
- [ ] `npm run type-check` passes
- [ ] Manual test on fresh database succeeds

---

## Milestone 2: Payment Reliability (Week 3-4)
**Owner:** Backend Lead + Payment Specialist  
**Effort:** 100 hours  
**Blockers:** Milestone 1 complete  
**Includes:** Issues #9-16

### Goals
- [x] Payment flow is fully idempotent
- [x] Single authoritative order creation path
- [x] No duplicate stock deductions
- [x] Razorpay signatures verified correctly
- [x] Webhook is the source of truth

### Issues

#### #9: Remove duplicate order creation flows
- **Type:** Business Logic
- **Severity:** Critical
- **Files:** `src/actions/checkout-order-create.action.ts`, `src/actions/order-create.action.ts`, `src/app/api/payments/verify/route.ts`
- **Work:** Consolidate to single flow, webhook is authoritative
- **Acceptance:** Only one order created per payment, no race conditions

#### #10: Implement payment idempotency keys
- **Type:** Business Logic
- **Severity:** Critical
- **Files:** `src/app/api/payments/verify/route.ts`, `src/app/api/webhooks/razorpay/route.ts`
- **Work:** Use (razorpayPaymentId, razorpayOrderId) as unique key
- **Acceptance:** Retry same payment multiple times = same order

#### #11: Fix stock decount logic
- **Type:** Business Logic
- **Severity:** Critical
- **Files:** `src/app/api/webhooks/razorpay/route.ts`, `src/app/api/payments/verify/route.ts`
- **Work:** Only decrement stock in webhook, not in verify endpoint
- **Acceptance:** Stock decrements exactly once per order

#### #12: Add Razorpay signature verification in all environments
- **Type:** Security
- **Severity:** Critical
- **Files:** `src/app/api/payments/verify/route.ts`, `src/lib/razorpay.ts`
- **Work:** Remove mock bypass, require valid signature or fail
- **Acceptance:** Payment endpoints reject unsigned requests in production

#### #13: Prevent duplicate payment records
- **Type:** Business Logic
- **Severity:** Critical
- **Files:** `src/app/api/webhooks/razorpay/route.ts`
- **Work:** Check for existing payment before creating new
- **Acceptance:** Only one Payment record per razorpayPaymentId

#### #14: Make webhook the single authoritative source
- **Type:** Business Logic
- **Severity:** Critical
- **Files:** `src/app/api/webhooks/razorpay/route.ts`
- **Work:** Webhook is only place orders transition to "paid"
- **Acceptance:** Order state consistent with Razorpay

#### #15: Add webhook retry handling
- **Type:** Business Logic
- **Severity:** High
- **Files:** `src/app/api/webhooks/razorpay/route.ts`
- **Work:** Idempotent processing, return 200 for retries
- **Acceptance:** Duplicate webhooks don't cause duplicate orders

#### #16: Add payment transaction timeout
- **Type:** Business Logic
- **Severity:** Medium
- **Files:** `src/app/api/payments/verify/route.ts`
- **Work:** Transactions must complete in <30s or timeout
- **Acceptance:** Database deadlocks don't hang the app

### Definition of Done
- [ ] Single order creation flow implemented
- [ ] Idempotency keys prevent duplicates
- [ ] Stock decrements exactly once
- [ ] All signatures verified
- [ ] Payment records unique
- [ ] Webhook is authoritative
- [ ] Retries handled safely
- [ ] Transactions timeout
- [ ] `npm run build` succeeds
- [ ] `npm run type-check` passes
- [ ] Integration tests pass (created in Milestone 4)

---

## Milestone 3: Security (Week 5-6)
**Owner:** Security Engineer + Backend Lead  
**Effort:** 90 hours  
**Blockers:** Milestone 1 complete  
**Includes:** Issues #17-25

### Goals
- [x] All OWASP Top 10 issues fixed
- [x] Authorization on all protected endpoints
- [x] Rate limiting on sensitive operations
- [x] Input validation on all inputs
- [x] Secure cookies configured

### Issues

#### #17: Implement RBAC authorization middleware
- **Type:** Security
- **Severity:** Critical
- **Files:** `src/middleware/auth.ts`, `src/app/api/products/route.ts`, etc.
- **Work:** All endpoints check user role before processing
- **Acceptance:** Buyer cannot call seller endpoints

#### #18: Add rate limiting
- **Type:** Security
- **Severity:** High
- **Files:** `src/middleware/rateLimit.ts`, `src/lib/redis.ts`
- **Work:** Rate limit per user/IP on checkout, login, payments
- **Acceptance:** Spam attempts blocked

#### #19: Add input validation middleware
- **Type:** Security
- **Severity:** High
- **Files:** `src/middleware/validation.ts`, `src/schemas/`
- **Work:** Validate all request bodies against schemas
- **Acceptance:** Malformed requests rejected at middleware

#### #20: Secure session cookies
- **Type:** Security
- **Severity:** High
- **Files:** `src/lib/auth.ts`
- **Work:** Set httpOnly, secure, sameSite flags
- **Acceptance:** Cookies inaccessible to JavaScript

#### #21: Add CORS headers properly
- **Type:** Security
- **Severity:** Medium
- **Files:** `src/middleware/cors.ts`, `next.config.ts`
- **Work:** Explicit allowed origins, not wildcard
- **Acceptance:** Only allowed domains can call API

#### #22: Validate file uploads
- **Type:** Security
- **Severity:** High
- **Files:** `src/app/api/cloudinary/route.ts`
- **Work:** Verify file type, size, scan with antivirus
- **Acceptance:** Only images accepted, max 5MB

#### #23: Remove all hardcoded credentials
- **Type:** Security
- **Severity:** Critical
- **Files:** Multiple
- **Work:** Move all secrets to env vars
- **Acceptance:** No credentials in code

#### #24: Add Razorpay key security
- **Type:** Security
- **Severity:** High
- **Files:** `src/actions/order-create.action.ts`
- **Work:** Don't send RAZORPAY_KEY_ID to client
- **Acceptance:** Key stored only in frontend config

#### #25: Add OWASP security headers
- **Type:** Security
- **Severity:** Medium
- **Files:** `next.config.ts`, `src/middleware/security.ts`
- **Work:** Add CSP, X-Frame-Options, etc.
- **Acceptance:** Security headers present on all responses

### Definition of Done
- [ ] Authorization on all protected endpoints
- [ ] Rate limiting active
- [ ] Input validation on all endpoints
- [ ] Cookies secured
- [ ] CORS configured
- [ ] File uploads validated
- [ ] No hardcoded credentials
- [ ] Security headers added
- [ ] ESLint passes
- [ ] No OWASP violations
- [ ] Security audit checklist complete

---

## Milestone 4: Testing (Week 7-9)
**Owner:** QA Lead + Test Engineers  
**Effort:** 150 hours  
**Blockers:** Milestone 1, 2, 3 complete  
**Includes:** Issues #26-33

### Goals
- [x] 90%+ code coverage
- [x] All critical paths tested
- [x] Payment flow fully tested
- [x] Auth flows fully tested
- [x] Database operations tested

### Issues

#### #26: Create unit test suite
- **Type:** Testing
- **Severity:** Critical
- **Files:** `tests/unit/`
- **Work:** Tests for auth, validation, commission, utils
- **Acceptance:** >80% function coverage

#### #27: Create integration tests
- **Type:** Testing
- **Severity:** Critical
- **Files:** `tests/integration/`
- **Work:** Tests for orders, payments, inventory
- **Acceptance:** Database operations fully tested

#### #28: Create API endpoint tests
- **Type:** Testing
- **Severity:** Critical
- **Files:** `tests/api/`
- **Work:** Tests for all endpoints, success and error cases
- **Acceptance:** All endpoints tested

#### #29: Create payment flow E2E tests
- **Type:** Testing
- **Severity:** Critical
- **Files:** `tests/e2e/`
- **Work:** Full checkout to payment tests
- **Acceptance:** Complete user journeys validated

#### #30: Create auth flow tests
- **Type:** Testing
- **Severity:** High
- **Files:** `tests/e2e/`
- **Work:** Login, signup, role switching
- **Acceptance:** Auth flows fully tested

#### #31: Create inventory/stock tests
- **Type:** Testing
- **Severity:** High
- **Files:** `tests/integration/`
- **Work:** Stock reservation, race conditions
- **Acceptance:** Race conditions validated

#### #32: Set up test fixtures and mocks
- **Type:** Testing
- **Severity:** Medium
- **Files:** `tests/fixtures/`, `tests/mocks/`
- **Work:** Reusable test data and mocks
- **Acceptance:** Tests easy to write and maintain

#### #33: Set up code coverage reporting
- **Type:** Testing
- **Severity:** Medium
- **Files:** `vitest.config.ts`, `.github/workflows/`
- **Work:** Coverage reports in CI/CD
- **Acceptance:** Coverage tracked over time

### Definition of Done
- [ ] >90% code coverage
- [ ] All critical paths tested
- [ ] All tests pass
- [ ] Test suite runs in <5 minutes
- [ ] Coverage reports generated
- [ ] Fixtures and mocks set up
- [ ] GitHub Actions runs tests on PR

---

## Milestone 5: Infrastructure (Week 10-11)
**Owner:** DevOps Engineer + Cloud Architect  
**Effort:** 100 hours  
**Blockers:** Milestone 1 complete  
**Includes:** Issues #34-42

### Goals
- [x] CI/CD pipeline working
- [x] Docker build successful
- [x] Automated deployments
- [x] Health checks implemented
- [x] Monitoring configured

### Issues

#### #34: Create GitHub Actions CI pipeline
- **Type:** DevOps
- **Severity:** Critical
- **Files:** `.github/workflows/ci.yml`
- **Work:** Lint, type-check, test on every PR
- **Acceptance:** CI blocks merge on failures

#### #35: Create GitHub Actions CD pipeline
- **Type:** DevOps
- **Severity:** Critical
- **Files:** `.github/workflows/cd.yml`
- **Work:** Automated deploy on main branch
- **Acceptance:** Merging to main triggers deploy

#### #36: Create Dockerfile
- **Type:** DevOps
- **Severity:** Critical
- **Files:** `Dockerfile`, `.dockerignore`
- **Work:** Multi-stage build, minimal final image
- **Acceptance:** Docker image <500MB

#### #37: Create Docker Compose
- **Type:** DevOps
- **Severity:** High
- **Files:** `docker-compose.yml`, `docker/.env.production`
- **Work:** Full stack locally with Postgres, Redis
- **Acceptance:** `docker-compose up` runs full app

#### #38: Add health check endpoint
- **Type:** Infrastructure
- **Severity:** Critical
- **Files:** `src/app/api/health/route.ts`
- **Work:** Endpoint checks database and Redis
- **Acceptance:** Load balancer can detect dead instances

#### #39: Add readiness endpoint
- **Type:** Infrastructure
- **Severity:** High
- **Files:** `src/app/api/readiness/route.ts`
- **Work:** Endpoint checks if app is ready for traffic
- **Acceptance:** Kubernetes can determine readiness

#### #40: Add liveness endpoint
- **Type:** Infrastructure
- **Severity:** High
- **Files:** `src/app/api/liveness/route.ts`
- **Work:** Endpoint checks if app process is alive
- **Acceptance:** Kubernetes can detect dead processes

#### #41: Set up Prometheus metrics
- **Type:** Observability
- **Severity:** High
- **Files:** `src/lib/metrics.ts`, `src/app/api/metrics/route.ts`
- **Work:** Metrics for requests, orders, payments, database
- **Acceptance:** Prometheus can scrape metrics

#### #42: Set up structured logging
- **Type:** Observability
- **Severity:** High
- **Files:** `src/lib/logger.ts`, `src/middleware/logging.ts`
- **Work:** JSON logs with request ID, user ID, order ID
- **Acceptance:** Logs easily searchable

### Definition of Done
- [ ] CI pipeline passes all checks
- [ ] CD pipeline deploys automatically
- [ ] Docker image builds successfully
- [ ] Docker Compose runs full stack
- [ ] Health endpoints respond correctly
- [ ] Metrics endpoint returns data
- [ ] Logs are structured JSON
- [ ] No secrets in Docker image
- [ ] Images cached for fast builds

---

## Milestone 6: Performance (Week 12)
**Owner:** Backend Lead + Performance Engineer  
**Effort:** 60 hours  
**Blockers:** Milestone 1, 2, 4 complete  
**Includes:** Issues #43-48

### Goals
- [x] Database queries optimized
- [x] Redis operations batched
- [x] Bundle size reduced
- [x] Caching implemented
- [x] 50% latency reduction

### Issues

#### #43: Optimize database queries
- **Type:** Performance
- **Severity:** High
- **Files:** `src/actions/`, `src/app/api/`
- **Work:** Add indexes, batch queries, remove N+1
- **Acceptance:** Slow queries <100ms

#### #44: Batch Redis operations
- **Type:** Performance
- **Severity:** High
- **Files:** `src/lib/redis.ts`
- **Work:** Use MGET instead of individual GETs
- **Acceptance:** Reservation lookup <10ms

#### #45: Implement HTTP caching headers
- **Type:** Performance
- **Severity:** Medium
- **Files:** `src/middleware/caching.ts`
- **Work:** Add cache-control headers to responses
- **Acceptance:** Static content cached by browsers

#### #46: Add Redis caching layer
- **Type:** Performance
- **Severity:** High
- **Files:** `src/lib/cache.ts`
- **Work:** Cache product listings, seller data
- **Acceptance:** Cache hit ratio >70%

#### #47: Optimize images
- **Type:** Performance
- **Severity:** Medium
- **Files:** `next.config.ts`, `src/components/`
- **Work:** Enable WebP, responsive sizes
- **Acceptance:** Image downloads <50KB average

#### #48: Set up performance monitoring
- **Type:** Observability
- **Severity:** High
- **Files:** `src/middleware/performance.ts`
- **Work:** Track page load, API latency, database time
- **Acceptance:** Performance metrics visible in dashboards

### Definition of Done
- [ ] Query times <100ms for most queries
- [ ] Redis operations <10ms
- [ ] Page load time <2s
- [ ] API latency p95 <500ms
- [ ] Performance benchmarks established
- [ ] Regression tests for performance

---

## Milestone 7: Production Release (Week 13-15)
**Owner:** Architect + All Leads  
**Effort:** 100 hours  
**Blockers:** All previous milestones complete  
**Includes:** Issues #49-56

### Goals
- [x] Production deployment successful
- [x] Final security audit passed
- [x] Documentation complete
- [x] Runbooks ready
- [x] Production-readiness score ≥95

### Issues

#### #49: Create deployment guide
- **Type:** Documentation
- **Severity:** High
- **Files:** `docs/DEPLOYMENT.md`
- **Work:** Step-by-step guide for deploying to production
- **Acceptance:** New team member can deploy after reading

#### #50: Create API documentation
- **Type:** Documentation
- **Severity:** High
- **Files:** `docs/API.md`
- **Work:** OpenAPI/Swagger for all endpoints
- **Acceptance:** Developers can use API without reading code

#### #51: Create architecture documentation
- **Type:** Documentation
- **Severity:** Medium
- **Files:** `docs/ARCHITECTURE.md`
- **Work:** System design, data flows, error handling
- **Acceptance:** New developers understand system quickly

#### #52: Create runbooks
- **Type:** Documentation
- **Severity:** High
- **Files:** `docs/RUNBOOKS.md`
- **Work:** Procedures for common incidents
- **Acceptance:** On-call can handle emergencies

#### #53: Create environment guide
- **Type:** Documentation
- **Severity:** Medium
- **Files:** `docs/ENV_VARS.md`
- **Work:** Reference for all environment variables
- **Acceptance:** No guessing when setting up environments

#### #54: Update README
- **Type:** Documentation
- **Severity:** Medium
- **Files:** `README.md`
- **Work:** Quick start, features, architecture overview
- **Acceptance:** GitHub visitors understand project

#### #55: Perform final security audit
- **Type:** Quality
- **Severity:** Critical
- **Files:** Security audit report
- **Work:** Third-party or internal comprehensive review
- **Acceptance:** No critical vulnerabilities found

#### #56: Perform production readiness review
- **Type:** Quality
- **Severity:** Critical
- **Files:** Production readiness checklist
- **Work:** Verify all requirements met
- **Acceptance:** Score ≥95/100

### Definition of Done
- [ ] All documentation complete
- [ ] Deployment guide verified by new person
- [ ] API documentation matches code
- [ ] Security audit passed
- [ ] Production-readiness score ≥95
- [ ] Team trained on runbooks
- [ ] Monitoring and alerts configured
- [ ] Rollback procedures tested
- [ ] Backup strategy verified
- [ ] Deployment to production successful

---

## GitHub Issue Template

Each issue should include:

```markdown
## [MILESTONE] [SEVERITY] Issue Title

**Type:** [Infrastructure/Database/Security/Business Logic/Testing/DevOps]  
**Severity:** [Critical/High/Medium/Low]  
**Milestone:** [1-7]  
**Estimated Effort:** [hours]  

### Description
Clear description of what needs to be done.

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Criterion 3

### Technical Details
- Files affected
- Dependencies
- Breaking changes (if any)

### Testing
- How to verify the fix
- Test cases

### Related Issues
- Links to related issues
```

---

## Milestones Summary

| Milestone | Focus | Duration | Issues | Effort | Status |
|-----------|-------|----------|--------|--------|--------|
| 1 | Database & Environment | Week 1-2 | #1-8 | 80h | Not Started |
| 2 | Payment Reliability | Week 3-4 | #9-16 | 100h | Blocked |
| 3 | Security | Week 5-6 | #17-25 | 90h | Blocked |
| 4 | Testing | Week 7-9 | #26-33 | 150h | Blocked |
| 5 | Infrastructure | Week 10-11 | #34-42 | 100h | Blocked |
| 6 | Performance | Week 12 | #43-48 | 60h | Blocked |
| 7 | Production Release | Week 13-15 | #49-56 | 100h | Blocked |
| | **TOTAL** | **15 weeks** | **56 issues** | **680h** | |

---

## Success Metrics

### Code Quality
- [ ] TypeScript strict mode: 0 errors
- [ ] ESLint: 0 errors
- [ ] Test coverage: ≥90%
- [ ] No deprecated dependencies

### Performance
- [ ] API latency p95 <500ms
- [ ] Database query p95 <100ms
- [ ] Page load time <2s
- [ ] Lighthouse score >90

### Security
- [ ] OWASP Top 10: 0 issues
- [ ] Penetration test: 0 critical
- [ ] Dependency audit: 0 critical
- [ ] SIEM alerts: 0 false positives

### Reliability
- [ ] Test coverage: ≥90%
- [ ] Uptime SLO: 99.9%
- [ ] Error rate <0.1%
- [ ] All critical paths tested

### Operations
- [ ] CI/CD: 100% pass rate
- [ ] Deployments: fully automated
- [ ] Rollback time: <5 minutes
- [ ] MTTR: <30 minutes

---

## Team Assignments

### Recommended Team Structure
- **Architect:** Roadmap oversight, critical decisions
- **Backend Leads (2):** Milestones 1-2, 3, 5-6
- **Security Engineer:** Milestone 3, security review
- **DevOps Engineer:** Milestone 5
- **QA Lead:** Milestone 4
- **Frontend Lead:** Milestone 7 quality
- **Database Architect:** Milestone 1 support

### Parallel Tracks
- **Track A:** Database & Environment (Milestone 1)
- **Track B:** Payment System (Milestone 2)
- **Track C:** Security (Milestone 3)
- **Track D:** Infrastructure (Milestone 5, can start week 1)

---

## Risk Mitigation

### High-Risk Areas
1. **Payment System Changes** → Run A/B testing before full cutover
2. **Database Schema Changes** → Test on production data copy
3. **Deployment Automation** → Dry-run before real deployment
4. **Performance Changes** → Baseline before optimization

### Communication Plan
- Standup: Daily during milestones 2-4
- Weekly review: All leads sync on blockers
- Milestone review: Formal approval before next milestone
- GitHub Projects: Track real-time progress

---

**Version:** 2.0  
**Last Updated:** 2026-07-11  
**Status:** Ready for Milestone 1 kick-off

For questions or clarifications, open an issue with the label `roadmap-question`.
