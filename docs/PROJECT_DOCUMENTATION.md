# WardroWave Project Documentation

WardroWave is a fashion-rental marketplace. Customers can discover rental items, check size and date availability, request a price quote, and book and pay for rentals. The project includes a React storefront, an Express API, MongoDB persistence, Firebase Authentication, Razorpay payments, and Cloudinary image storage.

This guide describes the current implementation in `frontend/` and `wardrowave-backend/`. Use the source and [`wardrowave-backend/openapi.yaml`](../wardrowave-backend/openapi.yaml) as the definitive references when an implementation detail changes.

## Contents

- [Architecture](#architecture)
- [Repository map](#repository-map)
- [Requirements and local setup](#requirements-and-local-setup)
- [Frontend](#frontend)
- [Backend](#backend)
- [Data model](#data-model)
- [Configuration](#configuration)
- [API overview](#api-overview)
- [Security and operational behavior](#security-and-operational-behavior)
- [Testing and quality checks](#testing-and-quality-checks)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Architecture

```text
Browser
  └── React 19 + Vite storefront
        ├── Firebase client authentication (ID tokens)
        ├── React Query API/cache layer
        └── HTTPS/JSON ─────────────────────────────┐
                                                    │
Express API <───────────────────────────────────────┘
  ├── Firebase Admin token verification
  ├── MongoDB / Mongoose
  ├── Razorpay orders, verification, and webhooks
  ├── Cloudinary image storage
  └── Scheduled operational jobs and email outbox
```

The backend is authoritative for customer profiles, catalog visibility, inventory availability, quotes, booking state, payments, and refunds. The frontend does not determine the final booking price or confirm a payment itself. Firebase handles identity; the API synchronizes that identity to a MongoDB user profile.

The backend requires MongoDB replica-set support for transactional operations. The provided Docker Compose setup initializes a local single-node replica set.

## Repository map

| Path | Responsibility |
|---|---|
| `frontend/` | React/Vite web application and browser tests |
| `frontend/src/pages/` | Route-level screens |
| `frontend/src/components/` | Shared layout and page feature components |
| `frontend/src/context api/` | Authentication, cart, wishlist, and theme contexts |
| `frontend/src/lib/api/` | Typed API client, API data types, and React Query hooks |
| `frontend/src/Routers/AppRoutes.jsx` | Route definitions, auth banners, and global notifications |
| `wardrowave-backend/src/` | Express application, API implementation, models, and jobs |
| `wardrowave-backend/openapi.yaml` | OpenAPI 3.0 specification and Swagger UI source |
| `wardrowave-backend/tests/` | Backend unit and MongoDB-backed integration tests |
| `wardrowave-backend/scripts/` | Database setup and catalog seeding utilities |
| `render.yaml` | Render Blueprint for the persistent backend web service |
| `vercel.json` | Frontend build and SPA route fallback |
| `config/firestore.rules` | Firebase Firestore rules; current application persistence is MongoDB |
| `docs/` | Project documentation |

Do not treat `node_modules/`, build output, coverage output, or local environment files as application source.

## Requirements and local setup

### Prerequisites

- Node.js 20 or newer and npm.
- Docker Desktop for the local MongoDB replica set.
- Development Firebase project credentials for authentication.
- Razorpay test credentials to test booking payments.
- Cloudinary credentials to test image uploads and the provided catalog seed.
- SMTP credentials to exercise real outbound email delivery.

### Start MongoDB and the API

1. In `wardrowave-backend/`, create `.env` using `.env.example` as a variable-name and format template. Supply your own development credentials. Never commit `.env`.
2. From `wardrowave-backend/`, start the database and API:

   ```sh
   docker compose up --build
   ```

   Or start only MongoDB and its replica-set initializer:

   ```sh
   docker compose up -d mongodb mongo-init
   ```

   Then run the API in a separate terminal:

   ```sh
   npm install
   npm run dev
   ```

   The API listens on port `5000` by default.

3. Optional catalog seed: configure a verified Firebase admin account whose email is listed in `ADMIN_EMAILS`, Cloudinary, and (optionally) a separate verified customer account in `SEED_TEST_USER_EMAIL`. Put 1–8 legally usable JPEG, PNG, or WebP images (each no larger than 5 MiB) in `wardrowave-backend/seed-images`, then run:

   ```sh
   npm run create-indexes
   npm run seed -- --images ./seed-images
   ```

   The seed script does not create Firebase identities or set passwords. Review `wardrowave-backend/README.md` for seed requirements and image licensing notes.

### Start the frontend

1. In `frontend/`, create `.env` from `.env.example`.
2. Set `VITE_API_URL` to the API base URL, normally `http://localhost:5000/api/v1` for local development.
3. Fill in the Firebase web app values required by the frontend.
4. Run:

   ```sh
   npm install
   npm run dev
   ```

5. Open the Vite URL printed in the terminal (default `http://localhost:5173`).

The frontend checks its API/Firebase configuration at startup and renders a setup screen naming missing variables. API URL normalization adds `/api/v1` when needed. The `.env.example` files document required variable names; local `.env` files may contain secrets and must not be copied into documentation or source control.

## Frontend

### Technology

- React 19 and React Router 7.
- Vite 7 and Tailwind CSS 4.
- TypeScript for the API client and its data types; most UI components are JSX.
- TanStack React Query for server-state caching and request retries.
- Firebase client SDK for sign-in and ID-token management.
- GSAP for entrance, reveal, and list animations; Lucide React for icons.
- Vitest, Testing Library, and jsdom for tests.

### Application composition

`src/main.jsx` mounts the app. `src/App.jsx` creates a shared React Query client and wraps routes with providers:

1. `AuthProvider` restores Firebase auth and synchronizes a customer profile.
2. `WishlistProvider` and `CartProvider` expose server-backed shopping state.
3. `ThemeProvider` persists light/dark preference and applies `data-theme` on the document root.
4. `AppRoutes` provides browser routing, route-level lazy loading, email/profile status banners, global toast notifications, and the mobile bottom navigation.

`ProtectedRoute` restricts customer-only pages to authenticated users. Admin and staff API authorization is enforced by the backend; the frontend must not be relied on as the security boundary.

### Routes and screens

| Browser route | Screen | Access |
|---|---|---|
| `/` | Home: hero, featured rentals, and category collections | Public |
| `/rentals`, `/products` | Searchable/filterable rental catalog | Public |
| `/men`, `/women`, `/accessories` | Rental catalog with an initial category | Public |
| `/product/:slug` | Product detail, availability, reviews, and booking selection | Public |
| `/discover` | Product discovery/occasion filters | Public |
| `/about`, `/contact` | About and support/contact form | Public |
| `/login`, `/signup` | Firebase sign-in and registration | Public |
| `/forgot-password`, `/reset-password` | Password recovery | Public |
| `/profile`, `/settings`, `/orders` | Customer profile, addresses, and order history | Authenticated |
| `/wishlist`, `/cart`, `/checkout` | Saved items, rental cart, and payment checkout | Authenticated |
| `/order-success` | Booking/payment confirmation | Authenticated |
| `/wardrobe` | Customer wardrobe image feature | Authenticated |
| `/admin` | Role-protected operations dashboard for bookings, customers, catalog, inventory, coupons, reviews, rental settings, and audit history | Verified admin |
| `/test/image-upload` | Redirects to `/wardrobe` | Redirect |

Unknown routes redirect to `/`.

### Frontend API and state

`src/lib/api/client.ts` is the HTTP boundary. `src/lib/api/api.ts` maps typed API operations; `hooks.ts` and `queryKeys.ts` provide React Query integration and cache keys. API errors are represented by `ApiError.ts`.

The API client attaches the Firebase bearer token for authenticated requests, passes `Idempotency-Key` for booking creation, supports JSON and uploads, and converts non-success responses into typed errors. `utils/api.js` maps API product records into display models used by older JSX components. The admin panel uses the typed `api.admin` methods and React Query to load paginated tables and refresh data after mutations.

The contexts have distinct roles:

- **Authentication:** Firebase sign-up/sign-in, token/profile synchronization, session restore, sign-out, verification email, profile refresh, and password recovery.
- **Cart:** persisted rental lines, quantities/variants/rental dates, coupon state, and cart totals from the API.
- **Wishlist:** saved catalog items managed using authenticated API calls.
- **Theme:** `wardrowave-theme` in `localStorage`; `data-theme="dark"` activates dark theme CSS.

Data requiring persistence or authorization belongs in the API, not only in browser storage.

### Styling and animation

Global styles are in `src/index.css`; mobile/responsive overrides are in `src/responsive.css`. Shared theme bubble animation lives in `components/common/ThemeBubbles.jsx`; sections opt in by rendering the component. The home hero uses it; Featured Collection intentionally does not. Page entrance/reveal helpers are in `components/common/PageTransition.jsx` and `components/animations/`.

When modifying theme styling, check both themes and small/touch viewports. Touch devices should not rely on hover for persistent state; respect `prefers-reduced-motion`.

## Backend

### Technology and startup

- Node.js 20+, ES modules, Express 4.
- MongoDB 7 with Mongoose 8.
- Firebase Admin SDK for bearer-token verification.
- Razorpay SDK for payment orders/refunds.
- Cloudinary for image hosting.
- Zod request/environment validation.
- Pino HTTP/application logging.
- Jest and Supertest for tests.

`src/server.js` validates configuration, connects to MongoDB, starts scheduled jobs, and listens on the configured port. It performs graceful shutdown on termination signals. `src/app.js` builds the Express application.

### Backend source layers

| Folder | Responsibility |
|---|---|
| `src/config/` | Environment validation and database/provider setup |
| `src/routes/` | Route registration and middleware composition |
| `src/controllers/` | HTTP request/response handlers |
| `src/services/` | Business logic and integration workflows |
| `src/models/` | Mongoose collections and indexes |
| `src/validators/` | Zod request schema and shared input validation |
| `src/middlewares/` | Auth, role checks, validation, sanitization, uploads, rate limits, and error handling |
| `src/jobs/` | Scheduled tasks and distributed job coordination |
| `src/utils/` | Responses/errors, money/date helpers, transactions, logging, and shared primitives |

Routes are mounted under `API_PREFIX` (default `/api/v1`). Health endpoints are mounted at the root. Success responses use `{ success: true, data, meta? }`; error responses use `{ success: false, error: { code, message, details? } }`. Validation error details contain `{ path, message }` entries. Every API response has an `X-Request-Id` header.

### Business workflows

#### Identity

1. The browser authenticates through Firebase and sends its ID token as a bearer token.
2. `POST /api/v1/auth/sync` verifies/synchronizes the Firebase identity to a local MongoDB user profile.
3. Authenticated API middleware verifies the token with Firebase Admin, loads the active local profile, and rejects missing, deleted, or blocked users.
4. Role middleware separately restricts staff and admin endpoints. Admin endpoints additionally require a Firebase token with a verified email claim; the admin UI's route guard is only a usability layer.

Email verification may be required by backend configuration; the default is to require verified email for protected purchasing steps.

#### Catalog and availability

Public catalog endpoints return published products and active categories. Search/filter/sort and pagination are validated server-side. Product detail includes variants, size information, and rating summary. Availability uses inventory-unit and reservation/booking state to report blocked date ranges and available units; it is not inferred solely from the product card.

Admin catalog products must have an HTTPS image, at least one active size/color variant, and at least one physical inventory unit in `available` status before they can be published. From **Admin → Products**, use **Sizes & stock** on a draft or published product to add a variant (SKU, size, color) and its unique physical unit codes, entered one per line or comma-separated. The API creates the variant and units atomically and records the action in the audit log. Once stock is in place, publish the draft; the backend independently enforces the image, variant, and stock requirements. Existing published products without active variants/available units will not offer a rentable size until inventory is added or restored to `available`.

#### Quote, booking, and payment

1. The customer selects product variant, rental dates, delivery address, and optional coupon.
2. The API validates the dates, serviceable pincode, active variant, and inventory.
3. The server calculates the authoritative quote, including rental price, fees, delivery, applicable tax/discounts, and refundable deposit.
4. Booking creation uses an `Idempotency-Key` and a database transaction to prevent duplicate bookings and reserve stock.
5. The backend creates a Razorpay order; the browser completes Razorpay Checkout.
6. The frontend posts payment details to `/api/v1/payments/verify`; the backend verifies the signature before confirming the booking.
7. Razorpay webhooks provide an additional payment-event path; reconciliation jobs handle pending or delayed events.
8. A confirmed booking can produce a PDF invoice. Cancellation and return inspection workflows determine refunds, late fees, and damage deductions.

Amounts are represented in paise (integer minor currency units), and rental dates use India-local calendar conventions.

#### Fulfillment and operations

Staff actions transition bookings through dispatch, delivery, receipt, and inspection. Returned inventory may be cleaned, returned to availability, or retired. Inspection can apply late fees and damage deductions against the deposit and create a refund for the remainder.

Notifications are recorded in-app. Email is queued through a durable MongoDB outbox so an SMTP outage does not undo a successful customer operation. Scheduled jobs retry delivery and other transient operations.

#### Admin console

The `/admin` frontend is restricted to users with an administrator profile role. Backend admin routes independently require an authenticated, non-revoked Firebase token, an active MongoDB profile with the `admin` or `superadmin` role, and a verified-email token claim. Superadmins inherit admin and staff route access. Admin endpoints have a dedicated 300-request/15-minute limiter in addition to the global limiter; sensitive routes have an additional configurable 30-request/15-minute limiter.

The admin API provides dashboard totals and paginated/filterable reads for bookings, customers, products, categories, inventory units, coupons, reviews, and audit history. The overview report supports a selected date range and CSV export for booking/payment totals, alongside a current inventory snapshot; booking lists can be filtered by status and date, user-access lists by role and account status, and audit history by action, entity type, actor, and date. Inventory units can be moved to maintenance, restored to availability, marked clean through the staff workflow, or retired; retirement is allowed only for unreserved available/maintenance units and is terminal through this interface. Booking and customer detail endpoints provide authorized operational information; customer list rows omit addresses and measurements. Paginated responses include `meta.page`, `meta.limit`, `meta.total`, and `meta.pages`. Staff fulfillment endpoints remain available to admins and are used for dispatch, delivery, return receipt, and cleaning workflows.

Admin pages are available at `/admin/dashboard`, `/admin/users`, `/admin/products`, `/admin/orders`, `/admin/rentals`, `/admin/payments`, and `/admin/settings`; the older inventory, coupon, review, and audit sections remain available under `/admin/inventory`, `/admin/coupons`, `/admin/reviews`, and `/admin/audit`. Orders and rentals share the booking data and fulfillment workflow. The users section can block/unblock users, manage roles, or anonymize customer accounts without active bookings. Customer anonymization requires recent authentication and is audited; administrator and staff identities cannot be deleted through that action. Disabling an administrator instead requires superadmin access, recent authentication, and MFA when enabled.

The payments section lists bounded, paginated payment and refund data without exposing raw provider payloads or card numbers. An administrator may initiate a partial or full goodwill refund up to the remaining captured balance; the API requires recent authentication, atomically reserves the amount, and writes an audit event before submitting it to Razorpay. The platform does not expose bank-account or payment-provider credential editing in the admin UI; provider credentials must be managed through backend secret management.

User access changes reject self-demotion/blocking, preserve an active administrator/superadministrator, and require a verified email before granting either administrator role. Verified addresses in `SUPERADMIN_EMAILS` receive the `superadmin` profile role on first sign-in; `ADMIN_EMAILS` bootstraps the lower `admin` role. Only superadmins can change user roles or the status of an administrator account. Changes that grant/revoke roles require a recent sign-in, and when enabled, a Firebase second-factor claim.

Opening the dashboard uses the existing Firebase session and server-verified administrator role; it does not prompt for a password on every visit. Sensitive mutations such as blocking/unblocking, customer anonymization, product archiving, inventory retirement, return inspection, and payment refunds require a Firebase `auth_time` no older than `ADMIN_REAUTH_MAX_AGE_SECONDS` (default 300 seconds). Critical operations (role changes, disabling administrator accounts, and rental/platform settings updates) additionally require superadmin authorization and, when `ADMIN_REQUIRE_MFA` is enabled, a Firebase `firebase.sign_in_second_factor` claim. The frontend responds to `REAUTH_REQUIRED` and `MFA_REQUIRED` with an identity-verification prompt and retries the waiting action once after successful verification. MFA enforcement defaults to enabled in production and disabled in other environments; production MFA requires Firebase Identity Platform with TOTP and/or SMS factors enabled. Re-authentication and MFA denials are logged with the request ID, user ID, and event code; tokens are not logged. Token claims are verified with revocation checks, and role/status updates revoke refresh tokens when access is removed.

When the API returns `REAUTH_REQUIRED` or `MFA_REQUIRED`, the frontend prompts the signed-in user to verify with their linked password, Google, or Facebook provider. Firebase MFA challenges support enrolled TOTP authenticator and SMS factors. Requests waiting on the same challenge share one prompt and retry once with a refreshed token; cancelling verification leaves the action unsubmitted. MFA enrollment is managed through Firebase account security settings, not this challenge dialog.

Audit records include the request ID where the change originates from an HTTP request, enabling correlation with the `X-Request-Id` response header. For stronger production isolation, use a MongoDB database identity with only read/insert access to the audit collection where operationally feasible.

#### Admin production rollout checklist

1. **Provision administrator identities:** configure verified operational administrators in `ADMIN_EMAILS` and owner/security administrators in `SUPERADMIN_EMAILS`. Sign in once with each Firebase account so its active MongoDB profile and role are synchronized. For production MFA, enable Firebase Identity Platform and the supported TOTP and/or SMS factor providers before enabling `ADMIN_REQUIRE_MFA`.
2. **Deploy backend first:** deploy the API changes before the frontend. Confirm backend runtime configuration and MongoDB connectivity using the normal secret-management process; do not put backend credentials in frontend variables.
3. **Review and apply indexes:** the added read paths rely on declared Mongoose indexes. `npm run create-indexes` calls `syncIndexes()` for every model; review its effects against the production index inventory and test on staging first, because synchronization can remove indexes that are not declared in the schemas. Take a database backup and schedule index work appropriately for the dataset before applying to production.
4. **Deploy frontend:** set its API URL to the deployed API base and verify the site origin is allowed by backend CORS configuration.
5. **Smoke-check access:** unauthenticated requests to `/api/v1/admin/dashboard` should return 401; customer/staff or unverified-admin tokens should return 403; a verified admin should receive 200. An old `auth_time` on a sensitive route should return 401 `REAUTH_REQUIRED`; a critical action as a plain admin should return 403; a superadmin without a second-factor claim should return 403 `MFA_REQUIRED` when MFA is enabled. Verify pagination metadata and that audited mutations record the matching `X-Request-Id`.
6. **Exercise core operations in staging:** review a booking, dispatch/confirm delivery/receive a return, complete an item inspection with no damage, create a draft product and category, add an HTTPS image plus an active size variant and available physical inventory before publishing, toggle inventory maintenance, create/deactivate a coupon, moderate a review, and update a setting. Confirm audit entries and notifications/financial side effects where applicable before production use.
7. **Monitor after release:** watch 4xx/5xx rates, rate-limit responses, slow list queries, index build health, and audit-log writes. Keep the prior frontend deployment available for rollback; roll back the frontend independently if necessary, while coordinating backend/API rollback with any index/schema state.

### Persistence model

Models in `src/models/` represent:

- **Identity/catalog:** `User`, `Category`, `Product`, `Variant`, `InventoryUnit`.
- **Shopping and rentals:** `Cart`, `Wishlist`, `Reservation`, `Booking`.
- **Payment and promotions:** `Payment`, `Refund`, `Coupon`, `CouponRedemption`, `Counter`.
- **Customer experience:** `Review`, `Notification`, `WardrobeImage`, `ServiceablePincode`, `Setting`.
- **Reliability and audit:** `AuditLog`, `AdminAccessLock`, `EmailOutbox`, `WebhookEvent`, `JobLock`.

`models/index.js` centralizes model exports; `schemaFields.js` contains shared schema field definitions. Relationships are generally stored as Mongo ObjectId references, while Firebase UID is the external identity key. Inventory/booking/payment lifecycles are separate records so reservation, payment verification, fulfillment, and refund status can be tracked independently.

### Scheduled jobs

Jobs are disabled in tests. In development/production they run in `Asia/Kolkata` and use MongoDB-backed distributed locks to avoid duplicate work across API instances.

| Job | Schedule |
|---|---|
| Release expired checkout holds | Every minute |
| Retry pending Razorpay webhooks | Every minute |
| Deliver email outbox | Every minute |
| Reconcile pending payments | Every 15 minutes |
| Retry pending refunds | Every 30 minutes |
| Complete expired cleaning holds | Hourly |
| Low-stock alerts | Daily at 08:00 |
| Rental start reminders | Daily at 09:00 |
| Return reminders | Daily at 09:30 |
| Overdue-return notices | Daily at 10:00 |
| Review requests | Daily at 11:00 |
| Cleanup old data | Daily at 03:00 |

All schedules above use Asia/Kolkata time.

## Configuration

Use the checked-in `.env.example` files to create private local `.env` files. Do not copy secret values into this document. The backend validates configuration at process startup and requires complete provider credential groups when any value in a group is supplied.

### Frontend variables

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Backend API URL; frontend normalizes it to an `/api/v1` base |
| `VITE_FIREBASE_API_KEY` | Firebase web app configuration |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase web app configuration |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project used by client auth |
| `VITE_FIREBASE_APP_ID` | Firebase web app configuration |

Vite variables are embedded in client output and must not be used for private server credentials.

### Backend variables

**Process and network**

- `NODE_ENV`, `PORT`, `API_PREFIX`, `ENABLE_DOCS`, `TRUST_PROXY_HOPS`, `MONGODB_URI`, `CORS_ORIGINS`.

**Integrations and identity**

- Firebase Admin group: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`.
- Razorpay: `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`.
- Cloudinary group: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER`.
- SMTP/email: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`, `SUPPORT_EMAIL`.

**Authorization and seed**

- `REQUIRE_VERIFIED_EMAIL` controls verified-email requirements.
- `ADMIN_EMAILS` configures bootstrap/admin email addresses; `SUPERADMIN_EMAILS` configures owner/security administrator bootstrap addresses.
- `ADMIN_REAUTH_MAX_AGE_SECONDS` sets the allowed age of authentication for sensitive actions (default 300).
- `ADMIN_REQUIRE_MFA` requires Firebase second-factor claims for critical actions (defaults to true in production and false elsewhere).
- `ADMIN_SENSITIVE_RATE_LIMIT_WINDOW_MS` and `ADMIN_SENSITIVE_RATE_LIMIT_MAX` configure the extra sensitive-route limiter (defaults: 900000 ms and 30 requests).
- `SEED_TEST_USER_EMAIL` optionally identifies a verified test customer for seeding.

**Rental policy and pricing**

- `APP_URL`, `FRONTEND_URL`, `MIN_LEAD_DAYS`, `MAX_ADVANCE_DAYS`, `HOLD_MINUTES`.
- `GST_PERCENT`, `DELIVERY_FEE`, `FREE_DELIVERY_ABOVE`, `LATE_FEE_MULTIPLIER`, `FREE_CANCEL_HOURS`.
- `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX`.

**Operations**

- `LOG_LEVEL` controls Pino verbosity.
- `OBSERVABILITY_ENABLED` gates optional observability hooks.

For exact defaults, allowed values, and production-required credentials, inspect `wardrowave-backend/src/config/env.js` and each `.env.example`.

## API overview

Full request/response schemas and registered OpenAPI operations are documented in [`wardrowave-backend/openapi.yaml`](../wardrowave-backend/openapi.yaml). Swagger UI is available at `/api/docs` outside production; production requires `ENABLE_DOCS=true`.

| Base path | Purpose |
|---|---|
| `/health`, `/health/ready` | Liveness and readiness |
| `/api/v1/meta/config` | Public storefront rental settings |
| `/api/v1/auth` | Firebase profile synchronization |
| `/api/v1/categories`, `/api/v1/products` | Public category/product browse, search, detail, availability, reviews, and similar products |
| `/api/v1/catalog` | Compatibility catalog routes, review operations, availability, and prerender catalog |
| `/api/v1/pincodes` | Delivery serviceability checks |
| `/api/v1/cart`, `/api/v1/wishlist` | Authenticated cart and wishlist |
| `/api/v1/bookings` | Quote, idempotent creation, history/detail, cancellation, retry payment, invoice, and return scheduling |
| `/api/v1/payments`, `/api/v1/webhooks` | Payment verification and Razorpay webhooks |
| `/api/v1/users/me` | Profile, address, wardrobe image, and notification operations |
| `/api/v1/contact` | Validated support message submission |
| `/api/v1/staff` | Staff booking fulfillment and inventory actions |
| `/api/v1/admin` | Dashboard; paginated bookings, customers, catalog, categories, inventory, coupons, reviews, and audit history; plus access management, catalog mutations, settings, pincodes, reports, and moderation |

The older `/api/v1/catalog/...` paths remain for compatibility. Avoid adding new API behavior without updating the OpenAPI specification and its route coverage test.

## Security and operational behavior

- Firebase ID tokens are verified server-side; user role and account state are loaded from MongoDB.
- Helmet, explicit CORS origins, request validation, NoSQL sanitization, HTTP parameter pollution protection, request IDs, body size limits, and layered rate limits are enabled.
- Sensitive request headers and fields are redacted from Pino HTTP logs.
- Multipart uploads are limited to JPEG, PNG, and WebP, capped at 5 MiB per file and eight files, and checked by declared MIME type and file signature before Cloudinary upload.
- Admin/staff authorization is applied at route groups. Razorpay webhook requests use the raw request body where signature validation requires it.
- Booking and payment paths use database transactions, idempotency, signature verification, and background reconciliation to handle retries and concurrent requests.
- Error responses avoid exposing stack traces; unexpected errors are logged with request context.
- Production configuration requires credentials for Firebase Admin, Razorpay, Cloudinary, and SMTP.
- Secrets belong in deployment environment configuration, not frontend `VITE_` variables, docs, or commits.

## Testing and quality checks

Run commands from the corresponding package directory.

### Frontend

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

Tests use Vitest with jsdom, Testing Library, and shared setup in `src/test/setup.ts`. Current coverage includes API client behavior, checkout, protected routes, cart context, theme persistence, and signup navigation.

### Backend

```sh
npm test
npm run lint
npm run test:integration
npm run test:coverage
```

Unit tests cover validation, money/pricing, dates, email, payments, security middleware, and response/error behavior. Integration tests exercise authentication, availability, bookings/payment, customer services, admin services, and operational workflows using MongoDB test support. The integration command may download a MongoDB binary on first use.

## Deployment

### Vercel

Import the repository into Vercel with the **repository root** as the project root. The root `vercel.json` installs and builds `frontend/`, serves `frontend/dist`, and routes browser paths to the SPA entry point. Set these Vercel environment variables for Production (and Preview if needed):

- `VITE_API_URL`: the Render service URL followed by `/api/v1` (for example, `https://<your-render-service>.onrender.com/api/v1`).
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID`: the Firebase web app configuration.

Vite embeds these values in the browser bundle, so only Firebase web-app configuration belongs here; never put backend secrets in Vercel `VITE_` variables.

### Render

Create a MongoDB Atlas cluster first. Atlas databases support the replica-set transactions this API requires. Configure Atlas Network Access for Render and use a database user with a strong password.

In Render, create a Blueprint from the repository using `render.yaml`, or create a Node web service manually with:

- Root Directory: `wardrowave-backend`
- Build Command: `npm ci`
- Start Command: `npm start`
- Health Check Path: `/health/ready`

Set all values marked `sync: false` in Render's environment settings. Required production credentials include `MONGODB_URI`, the Firebase Admin group (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`), Razorpay keys and webhook secret, Cloudinary credentials, and SMTP host/user/password plus `MAIL_FROM`. Set `CORS_ORIGINS` to the exact Vercel origin (scheme and hostname only, no path or trailing slash), `FRONTEND_URL` to that same origin, and `ADMIN_EMAILS` to the verified administrator email addresses. In Render, enter the Firebase private key with newlines preserved, or use `\n` sequences; the backend normalizes escaped newlines.

Use a continuously running Render instance for production: the backend runs scheduled jobs in-process, so an instance that sleeps can delay emails, payment reconciliation, and rental operations. After both services are deployed, set the Razorpay webhook URL to `https://<your-render-service>.onrender.com/api/v1/webhooks/razorpay` and verify `/health/ready` returns a successful response.

### Deployment order

1. Create the Vercel project to establish its public production origin.
2. Deploy the Render Blueprint and set its MongoDB/provider credentials, `CORS_ORIGINS`, `FRONTEND_URL`, and `ADMIN_EMAILS`.
3. Add the Render URL and Firebase web-app configuration to Vercel, then deploy the frontend.
4. If the Vercel origin differs from the value entered in Render, update `CORS_ORIGINS` and `FRONTEND_URL` in Render and redeploy.
5. Add the Vercel hostname to Firebase Authentication's authorized domains. Confirm catalog access, sign-in, a payment test, webhook delivery, and health checks.

Never upload local `.env` files or commit credentials. Rotate any credentials that have been exposed.

### Docker backend

`wardrowave-backend/docker-compose.yml` runs MongoDB 7 as a replica set, initializes the replica set, and starts the API with a health check. `Dockerfile` builds the API image. Set provider configuration in the backend `.env` before starting Compose.

### Health and API docs

- `GET /health` reports liveness, uptime, memory, version, and database connection state.
- `GET /health/ready` checks database readiness and external integration configuration status.
- `/api/docs` serves Swagger UI when enabled.

## Troubleshooting

| Symptom | Checks |
|---|---|
| Frontend displays missing setup values | Check `frontend/.env` variable names and restart Vite after edits. |
| API cannot start | Read startup validation output; check `MONGODB_URI`, MongoDB readiness, and required variable groups. |
| Browser API requests fail | Confirm `VITE_API_URL`, backend health, and that the browser origin is included in `CORS_ORIGINS`. |
| Authenticated API returns 401 | Ensure Firebase client and backend Admin use the same project and the browser has a valid ID token; ensure profile sync has completed. |
| Admin/staff API returns 403 | Verify local MongoDB profile status and role; Firebase authentication alone does not grant staff/admin access. |
| Booking is unavailable | Check active published product/variant, inventory state, rental dates, serviceable pincode, and existing holds/bookings. |
| Payment remains pending | Check Razorpay keys/webhook configuration, request correlation ID, webhook delivery, and payment reconciliation logs. |
| Email is queued but not delivered | Check SMTP host/port/security/credentials and email outbox job logs. |
| Images do not upload | Check Cloudinary credential group, supported format, 5 MiB file limit, and eight-file maximum. |
| Transaction/replica-set errors | Use the provided MongoDB replica-set Docker Compose setup rather than standalone MongoDB. |
