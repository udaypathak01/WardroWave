import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "../components/common/ProtectedRoute";
import BottomNav from "../components/common/BottomNav";

// ─── Lazy-loaded pages (code splitting for faster initial load) ───────────────

const Home             = lazy(() => import("../pages/Home"));
const Login            = lazy(() => import("../pages/Login"));
const Signup           = lazy(() => import("../pages/Signup"));
const ForgotPassword   = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword    = lazy(() => import("../pages/ResetPassword"));
const Products         = lazy(() => import("../pages/Products"));
const Rentals          = lazy(() => import("../pages/Rentals"));
const About            = lazy(() => import("../pages/About"));
const Contact          = lazy(() => import("../pages/Contact"));
const MenCategory      = lazy(() => import("../pages/MenCategory"));
const WomenCategory    = lazy(() => import("../pages/WomenCategory"));
const AccessoriesCategory = lazy(() => import("../pages/AccessoriesCategory"));
const ProductDetails   = lazy(() => import("../pages/ProductDetails"));
const Discover         = lazy(() => import("../pages/Discover"));

// ─── Protected (login required) ─────────────────────────────────────────────

const UserProfile      = lazy(() => import("../pages/UserProfile"));
const VirtualClosetPage = lazy(() => import("../components/profile/VirtualCloset"));
const Wishlist         = lazy(() => import("../pages/Wishlist"));
const Cart             = lazy(() => import("../pages/Cart"));
const Checkout         = lazy(() => import("../pages/Checkout"));
const OrderSuccess     = lazy(() => import("../pages/OrderSuccess"));

// ─── Testing / Development ───────────────────────────────────────────────────

const ImageUploadTest  = lazy(() => import("../pages/ImageUploadTest"));

// ─── Fullscreen Suspense loader ───────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm font-medium">Loading...</p>
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <Router>
      {/* Global toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            borderRadius: '10px',
            background: '#1e1e2e',
            color: '#fff',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#a855f7', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <div className="pb-16 md:pb-0 flex flex-col min-h-screen">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public routes ─────────────────────────────── */}
            <Route path="/"              element={<Home />} />
            <Route path="/rentals"       element={<Rentals />} />
            <Route path="/men"           element={<MenCategory />} />
            <Route path="/women"         element={<WomenCategory />} />
            <Route path="/accessories"   element={<AccessoriesCategory />} />
            <Route path="/products"      element={<Products />} />
            <Route path="/product/:id"   element={<ProductDetails />} />
            <Route path="/discover"      element={<Discover />} />
            <Route path="/about"         element={<About />} />
            <Route path="/contact"       element={<Contact />} />
            <Route path="/login"         element={<Login />} />
            <Route path="/signup"        element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />

            {/* ── Protected: any logged-in user ─────────────── */}
            <Route path="/profile" element={
              <ProtectedRoute><UserProfile /></ProtectedRoute>
            } />
            <Route path="/virtual-closet" element={
              <ProtectedRoute><VirtualClosetPage /></ProtectedRoute>
            } />
            <Route path="/wishlist" element={
              <ProtectedRoute><Wishlist /></ProtectedRoute>
            } />
            <Route path="/cart" element={
              <ProtectedRoute><Cart /></ProtectedRoute>
            } />
            <Route path="/checkout" element={
              <ProtectedRoute><Checkout /></ProtectedRoute>
            } />
            <Route path="/order-success" element={
              <ProtectedRoute><OrderSuccess /></ProtectedRoute>
            } />

            {/* ── Testing / Development ────────────────────────── */}
            <Route path="/test/image-upload" element={
              <ProtectedRoute><ImageUploadTest /></ProtectedRoute>
            } />
          </Routes>
        </Suspense>
        <BottomNav />
      </div>
    </Router>
  );
}
