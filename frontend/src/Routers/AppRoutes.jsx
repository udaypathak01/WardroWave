import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useState } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import ProtectedRoute from "../components/common/ProtectedRoute";
import BottomNav from "../components/common/BottomNav";
import { useAuth } from "../context api/AuthContext";

// ─── Lazy-loaded pages (code splitting for faster initial load) ───────────────

const Home             = lazy(() => import("../pages/Home"));
const Login            = lazy(() => import("../pages/Login"));
const Signup           = lazy(() => import("../pages/Signup"));
const ForgotPassword   = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword    = lazy(() => import("../pages/ResetPassword"));
const Rentals          = lazy(() => import("../pages/Rentals"));
const About            = lazy(() => import("../pages/About"));
const Contact          = lazy(() => import("../pages/Contact"));
const ProductDetails   = lazy(() => import("../pages/ProductDetails"));
const Discover         = lazy(() => import("../pages/Discover"));

// ─── Protected (login required) ─────────────────────────────────────────────

const UserProfile      = lazy(() => import("../pages/UserProfile"));
const Wishlist         = lazy(() => import("../pages/Wishlist"));
const Cart             = lazy(() => import("../pages/Cart"));
const Checkout         = lazy(() => import("../pages/Checkout"));
const OrderSuccess     = lazy(() => import("../pages/OrderSuccess"));
const AdminPanel       = lazy(() => import("../pages/AdminPanel"));

// ─── Protected user features ─────────────────────────────────────────────────

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

function EmailVerificationBanner() {
  const { firebaseUser, isEmailVerified, resendVerificationEmail, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!firebaseUser || isEmailVerified) return null;

  const refreshVerification = async () => {
    setLoading(true);
    try {
      const profile = await refreshProfile();
      if (profile.emailVerified) toast.success('Your email is verified.');
      else toast.error('The verification link has not been confirmed yet.');
    } catch (error) {
      toast.error(error.message || 'Could not refresh your account.');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setLoading(true);
    try {
      const sent = await resendVerificationEmail();
      toast.success(sent
        ? `Verification email sent to ${firebaseUser.email || 'your email address'}.`
        : 'Your email is already verified.');
    } catch (error) {
      toast.error(error.message || 'Could not send the verification email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <aside
      role="status"
      aria-live="polite"
      className="flex flex-wrap items-center justify-center gap-3 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <span>Verify your email before checkout.</span>
      <button
        type="button"
        onClick={resendVerification}
        disabled={loading}
        className="font-semibold underline disabled:opacity-60"
      >
        Resend email
      </button>
      <button
        type="button"
        onClick={refreshVerification}
        disabled={loading}
        className="font-semibold underline disabled:opacity-60"
      >
        I have verified
      </button>
    </aside>
  );
}

function AuthProfileErrorBanner() {
  const { firebaseUser, authError, retryProfileLoad, isLoading } = useAuth();

  if (!firebaseUser || !authError) return null;

  return (
    <aside
      role="alert"
      className="flex flex-wrap items-center justify-center gap-3 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      <span>{authError}</span>
      <button
        type="button"
        onClick={retryProfileLoad}
        disabled={isLoading}
        className="font-semibold underline disabled:opacity-60"
      >
        Retry account sync
      </button>
    </aside>
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
        <EmailVerificationBanner />
        <AuthProfileErrorBanner />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public routes ─────────────────────────────── */}
            <Route path="/"              element={<Home />} />
            <Route path="/rentals"       element={<Rentals />} />
            <Route path="/men"           element={<Rentals initialCategory="men" />} />
            <Route path="/women"         element={<Rentals initialCategory="women" />} />
            <Route path="/accessories"   element={<Rentals initialCategory="accessories" />} />
            <Route path="/products"      element={<Rentals />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
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
            <Route path="/orders" element={
              <ProtectedRoute><UserProfile initialTab="orders" /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute><UserProfile initialTab="profile" /></ProtectedRoute>
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

            {/* ── Protected user features ──────────────────────── */}
            <Route path="/wardrobe" element={
              <ProtectedRoute><ImageUploadTest /></ProtectedRoute>
            } />
            <Route path="/admin/*" element={
              <ProtectedRoute roles={['admin', 'superadmin']}><AdminPanel /></ProtectedRoute>
            } />
            <Route path="/test/image-upload" element={
              <Navigate to="/wardrobe" replace />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <BottomNav />
      </div>
    </Router>
  );
}
