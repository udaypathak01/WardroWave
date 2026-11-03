import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context api/AuthContext';
import toast from 'react-hot-toast';

/**
 * ProtectedRoute — wraps any route that requires authentication.
 *
 * Props:
 *   children     — the protected component to render
 *   roles        — optional array of allowed roles e.g. ['admin']
 *                  if omitted, any logged-in user is allowed
 *
 * Behavior:
 *   - While Firebase is resolving auth state → show a full-screen loader
 *   - If user is not logged in → redirect to /login with a toast
 *   - If roles provided and user's role is not in the list → redirect to /
 */
export default function ProtectedRoute({ children, roles }) {
  const { user, isLoading, isAuthenticated, authError, retryProfileLoad } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast.error('Please sign in to access this page.', {
        id: 'auth-required',
        duration: 3000,
      });
    }
  }, [isLoading, isAuthenticated]);

  // Firebase is still resolving the auth state — don't flash the redirect
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (authError && isAuthenticated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-6">
        <section className="max-w-md rounded-xl bg-white p-8 text-center shadow-lg">
          <h1 className="text-xl font-semibold text-gray-900">Account unavailable</h1>
          <p className="mt-3 text-sm text-gray-600">{authError}</p>
          <button
            type="button"
            onClick={retryProfileLoad}
            className="mt-5 rounded-lg bg-purple-600 px-5 py-2.5 font-medium text-white hover:bg-purple-700"
          >
            Try again
          </button>
        </section>
      </main>
    );
  }

  // Not logged in → redirect to login, preserving the page they tried to visit
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check — if roles prop is provided, ensure the user's role qualifies
  if (roles && roles.length > 0) {
    const userRole = user?.role || 'customer';
    if (!roles.includes(userRole)) {
      toast.error("You don't have permission to access that page.", {
        id: 'role-denied',
        duration: 3000,
      });
      return <Navigate to="/" replace />;
    }
  }

  return children;
}
