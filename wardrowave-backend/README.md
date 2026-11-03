# WardroWave Backend

WardroWave is a Node.js/Express API foundation for a fashion rental marketplace. It uses MongoDB/Mongoose, Firebase Authentication, Razorpay payments, and IST calendar rental dates.

## Requirements

- Node.js 20 or newer
- Docker Desktop (recommended for local MongoDB replica-set transactions)
- Firebase Admin service-account credentials
- Razorpay test credentials for checkout and webhooks

## Local setup

1. Copy `.env.example` to `.env` and replace all credential examples with valid development values.
2. Start the replica-set database and API with `docker compose up --build`, or start only MongoDB with `docker compose up -d mongodb mongo-init`.
3. Optionally create a verified Firebase customer account and set its email in `SEED_TEST_USER_EMAIL`; this lets the seed create a local customer profile for end-to-end testing. From this directory run `npm install`, `npm run create-indexes`, and `npm run seed -- --images ./seed-images`. The images folder must contain 1–8 real JPEG, PNG, or WebP product photos (5 MiB maximum each); the seed uploads them to Cloudinary and publishes the sample product only after upload succeeds.
4. For host-based development, run `npm run dev`. The API listens on port `5000` by default.

The seed command requires the first email in `ADMIN_EMAILS` to already exist as a verified Firebase account, valid Cloudinary credentials, and a real image folder. If `SEED_TEST_USER_EMAIL` is set, that must also be a different, existing, verified Firebase customer account; the seed never creates or sets a password. For test photos, download images from [Unsplash](https://unsplash.com/license) or [Pexels](https://www.pexels.com/license/) and follow the applicable license and any model/property-release requirements. Keep downloaded images out of source control unless you have rights to redistribute them.

## Implemented API surfaces

- `GET /health`
- `GET /health/ready` (MongoDB readiness and external integration configuration status)
- `GET /meta/config` and `GET /api/v1/meta/config` (public storefront rental settings)
- Public catalog routes at `/api/v1/categories`, `/api/v1/products`, `/api/v1/products/featured`, `/api/v1/products/:slug`, `/api/v1/products/:slug/availability`, `/api/v1/products/:slug/reviews`, `/api/v1/products/:slug/similar`, and `/api/v1/pincodes/:pincode/serviceable`. The previous `/api/v1/catalog/...` paths remain available for compatibility.
- `GET /api/v1/catalog/prerender/products` returns bounded pages of published product details and variants for static storefront builds without incrementing product view counts.
- `POST /api/v1/auth/sync`
- `GET /api/v1/catalog/products` and `GET /api/v1/catalog/products/:slug`
- `GET /api/v1/catalog/categories`
- `GET /api/v1/catalog/products/:productId/reviews` and authenticated review submission for completed rentals
- `GET /api/v1/catalog/variants/:variantId/availability`
- `GET /api/v1/catalog/products/:productId/blocked-dates`
- Cart item/coupon management, wishlist management, and `POST /api/v1/cart/quote`
- `POST /api/v1/bookings/quote`
- `POST /api/v1/bookings` with `Idempotency-Key`
- `GET /api/v1/bookings` (paginated customer booking history), `GET /api/v1/bookings/:id`, `POST /api/v1/bookings/:id/cancel`, and `POST /api/v1/bookings/:id/retry-payment`
- `GET /api/v1/bookings/:id/invoice` for a PDF invoice after payment confirmation
- `POST /api/v1/payments/verify`
- `POST /api/v1/webhooks/razorpay`
- `GET/PATCH/DELETE /api/v1/users/me` and owned address management under `/api/v1/users/me/addresses`
- `POST /api/v1/bookings/:id/return` to schedule a return pickup
- Staff dispatch, delivery, warehouse receipt, return inspection, and cleaning actions under `/api/v1/staff`
- Admin role/account access changes under `/api/v1/admin/users/:id/access`
- Admin product, category, inventory, coupon, and signed catalog-image-upload operations under `/api/v1/admin`
- Admin runtime rental settings and serviceable pincodes under `/api/v1/admin/settings` and `/api/v1/admin/pincodes/:pincode`
- Admin date-bounded operational summary at `/api/v1/admin/reports/summary?from=YYYY-MM-DD&to=YYYY-MM-DD`
- Admin review moderation at `/api/v1/admin/reviews/:reviewId/moderation`
- `GET /api/v1/users/me/notifications` and `PATCH /api/v1/users/me/notifications/:notificationId/read`

Return inspections calculate late fees and damage deductions against the security deposit, create a refund for any remaining deposit, and move inventory into cleaning or retirement. Cleaning holds are completed by a distributed background job; staff can also mark units clean directly.

Booking notifications are stored in-app and email is queued transactionally in a durable outbox. Handlebars templates provide branded HTML and plain-text versions for account, booking, payment, delivery, returns, refunds, reviews, and admin alerts. Outbox delivery retries SMTP failures up to three times with exponential backoff; failures are logged and do not roll back completed customer requests. Configure `SUPPORT_EMAIL` for the branded email footer. Scheduled rental reminders and review requests are handled by the scheduled-jobs section.

Scheduled jobs run in `Asia/Kolkata`, use Mongo-backed distributed locks, and are disabled in tests. They release expired checkout holds, reconcile payments, retry/escalate refunds, complete cleaning, deliver the email outbox, send rental/return/overdue/review reminders, alert admins about unavailable variants, and clean up expired reservations and old read notifications. Job duration and result counts are logged.

Swagger UI is available at `/api/docs` outside production, or in production when `ENABLE_DOCS=true`.
`openapi.yaml` defines bearer-token authorization and documents the registered API routes; the test suite checks route/path/method coverage against the live Express router tree.

All responses include a request ID in the `X-Request-Id` header. JSON success responses use `{ success: true, data, meta? }`; JSON errors use `{ success: false, error: { code, message, details? } }`. Request validation failures return `400`, malformed JSON returns `400`, oversized request bodies return `413`, and unexpected server errors use a generic message without exposing stack traces.

Logging uses Pino JSON output outside development and `pino-pretty` in development. HTTP logs include the request ID, method, URL, status, and response time; sensitive credentials and tokens are redacted. Booking, payment, refund, and scheduled-job events are structured and identify records by IDs only. `/health` reports uptime, memory use, version, and database connection state. Set `OBSERVABILITY_ENABLED=true` and register a Sentry/Prometheus-compatible adapter through `src/utils/observability.js` to enable the optional exception/metric hooks; hooks are no-ops when disabled or unconfigured.

Paginated metadata includes `totalPages`. Validation details are represented as `{ path, message }` entries in `error.details`. Shared Zod primitives validate ObjectIds, real `YYYY-MM-DD` dates, Indian pincodes/phone numbers, paise amounts, slugs, and pagination.

Security middleware includes a global limiter (with only the signed Razorpay webhook excluded), route-specific auth/payment/checkout/review/upload/coupon/availability limits, and memory-backed multipart guards for JPEG/PNG/WebP signatures (5 MiB per file, at most eight). Authenticated route limiters key requests by local user ID; auth sync is IP-limited.

Image uploads use Cloudinary folders scoped to products, users, reviews, or damage records. Server-side multipart endpoints validate both declared MIME type and file signatures before upload; Cloudinary delivery is secure and transformed using automatic format/quality with a 2000-pixel maximum dimension. Avatar replacement, review creation, and product image attachment compensate by deleting new uploads if persistence fails. Removed/replaced assets are deleted best-effort after the database update. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` to enable uploads.

- `POST /api/v1/users/me/avatar` accepts `avatar` multipart image.
- `POST /api/v1/admin/products/:productId/images` accepts up to 8 `images`; `PATCH` and `DELETE` on the same path reorder, set primary, or remove product images. `POST /api/v1/admin/products/:productId/upload-signature` returns product-scoped direct-upload parameters.
- `POST /api/v1/catalog/products/:productId/reviews` accepts up to 3 multipart `images` with the review fields.

## Validation

- Run unit tests and lint with `npm test` and `npm run lint`; use `npm run test:watch` while developing and `npm run test:coverage` to report coverage.
- MongoDB-backed authentication and booking-concurrency tests are opt-in. Run them with `npm run test:integration`; they use a shared `mongodb-memory-server` replica set and may download a MongoDB binary on the first run.
- Integration tests mock Firebase, Razorpay, Nodemailer, and Cloudinary so they do not call live providers.
- All API currency values are integers in paise. Rental dates accept strict `YYYY-MM-DD` strings and normalize to midnight IST stored as UTC.
