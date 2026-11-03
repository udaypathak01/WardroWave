import AppRoutes from './Routers/AppRoutes';
import { WishlistProvider } from './context api/WishlistContext';
import { CartProvider } from './context api/CartContext';
import { AuthProvider } from './context api/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApiError } from './lib/api/ApiError';
import { runtimeConfigErrors } from './lib/api/runtimeConfig';
import { ThemeProvider } from './context api/ThemeContext';
import AdminStepUpGate from './components/common/AdminStepUpGate';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status > 0 && error.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 5_000),
    },
    mutations: { retry: false },
  },
});

function App() {
  if (runtimeConfigErrors.length > 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-6">
        <section className="max-w-xl rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-slate-900">Setup required</h1>
          <p className="mt-3 text-slate-600">
            WardroWave needs frontend environment configuration before it can start.
          </p>
          <p className="mt-3 text-sm text-slate-600">
            Add the following values to <code>frontend/.env</code>, then restart the Vite server:
          </p>
          <ul className="mt-3 list-disc pl-6 text-sm text-slate-700">
            {runtimeConfigErrors.map((variable) => <li key={variable}>{variable}</li>)}
          </ul>
          <p className="mt-4 text-sm text-slate-600">
            Use <code>frontend/.env.example</code> as a template. Never commit private credentials.
          </p>
        </section>
      </main>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <ThemeProvider>
              <>
                <AppRoutes />
                <AdminStepUpGate />
              </>
            </ThemeProvider>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
export default App;