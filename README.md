# WardroWave

WardroWave is a fashion rental marketplace. Customers browse published products, choose a size and rental period, save favorites, manage a cart and delivery address, receive an authoritative quote, pay through Razorpay, and track bookings. Staff and admins manage catalog and rental fulfillment through the backend API.

## Repository layout

- `frontend/` — React 19, Vite, Firebase Authentication, Tailwind CSS, and React Router.
- `wardrowave-backend/` — Express API, MongoDB/Mongoose, Firebase token verification, Razorpay payments, and Cloudinary uploads.
- `api/index.js` — Vercel serverless entry point for the Express app.
- `docs/` — deployment notes and project guides. Some older guides describe the previous Firestore backend; use `wardrowave-backend/README.md` for current API setup and behavior.
- [`docs/PROJECT_DOCUMENTATION.md`](docs/PROJECT_DOCUMENTATION.md) — full project guide covering frontend, backend, setup, APIs, configuration, operations, testing, and deployment.

## Local development

Requirements: Node.js 20+, npm, Docker Desktop (for the MongoDB replica set), and development credentials for Firebase, Razorpay, and Cloudinary.

1. Configure `wardrowave-backend/.env` from `wardrowave-backend/.env.example`.
2. Start MongoDB and the API from `wardrowave-backend/` with `docker compose up --build`, or start MongoDB with `docker compose up -d mongodb mongo-init` and run `npm run dev` in that directory.
3. To seed sample catalog data, configure verified Firebase admin credentials, Cloudinary, and `ADMIN_EMAILS`; place 1–8 real JPEG/PNG/WebP photos (up to 5 MiB each) in `wardrowave-backend/seed-images`, then run `npm run create-indexes` and `npm run seed -- --images ./seed-images` from `wardrowave-backend/`. Optionally set `SEED_TEST_USER_EMAIL` to an existing verified Firebase customer account. See `wardrowave-backend/README.md` for details.
4. In `frontend/`, copy `.env.example` to `.env`, set `VITE_API_URL` to the backend API base (for local development, `http://localhost:5000/api/v1`), and fill in the Firebase web app configuration. Then run `npm install` and `npm run dev`. The app displays which required variable names are missing if configuration is incomplete.
5. Open the Vite URL shown in the terminal. For booking checkout, configure Razorpay test keys, an active serviceable pincode, published products with active inventory variants, and a verified Firebase account.

## Main customer journey

1. Browse `/rentals` or a category page. Product data comes from the published catalog API.
2. Open a product, choose a rental start date, duration, and active size variant.
3. Add the rental to the authenticated customer's server-backed cart or wishlist.
4. At checkout, save or select a delivery address. The API checks the pincode, dates, availability, taxes, fees, discounts, and refundable deposit.
5. The backend creates an idempotent booking and Razorpay order. Razorpay's hosted checkout collects payment details; the backend verifies the payment signature and confirms the booking.
6. View the confirmed booking and PDF invoice, or find it later in Profile → Order History.

## Checks

From `frontend/`: `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`.

From `wardrowave-backend/`: `npm run lint` and `npm test`. Run MongoDB-backed integration coverage with `npm run test:integration`; the integration tests use `mongodb-memory-server` and may download a MongoDB binary on the first run.
