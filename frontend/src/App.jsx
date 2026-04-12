import AppRoutes from './Routers/AppRoutes';
import { WishlistProvider } from './context api/WishlistContext';
import { CartProvider } from './context api/CartContext';
import { AuthProvider } from './context api/AuthContext';

function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  );
}
export default App;