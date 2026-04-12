import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const { isAuthenticated } = useAuth(); // Import from AuthContext

  // Fetch cart when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    } else {
      setCart([]);
    }
  }, [isAuthenticated]);

  const fetchCart = async () => {
    try {
      const res = await api.cart.get();
      // The backend returns an array of cart items enriched with product data
      // Note: The backend cart items use the field `productId` instead of `id` for the product, 
      // but they also return properties like name, image, etc. We map `productId` to `id` for compatibility 
      // with old frontend code which expects `id` on the items.
      const mappedItems = res.data.items.map(item => ({ ...item, id: item.productId }));
      setCart(mappedItems);
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  };

  const addToCart = async (item, rentalDays = 3) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to your cart.', { id: 'cart-auth' });
      return;
    }
    
    // Optimistic UI update
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, rentalDays, id: item.id }];
    });

    try {
      await api.cart.add(item.id, 1, rentalDays);
      fetchCart(); // Ensure fully synced with backend pricing
    } catch (error) {
       console.error(error);
       fetchCart(); // Revert on failure
    }
  };

  const removeFromCart = async (itemId) => {
    if (!isAuthenticated) return;
    
    setCart(prev => prev.filter(item => item.id !== itemId));
    try {
      await api.cart.remove(itemId);
    } catch (error) {
       console.error(error);
       fetchCart(); // Revert on failure
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    if (!isAuthenticated) return;

    if (quantity < 1) {
      removeFromCart(itemId);
      return;
    }

    setCart(prev => prev.map(item => item.id === itemId ? { ...item, quantity } : item));
    try {
      await api.cart.update(itemId, { quantity });
    } catch (error) {
       console.error(error);
       fetchCart(); // Revert on failure
    }
  };

  const updateRentalDays = async (itemId, days) => {
    if (!isAuthenticated) return;

    setCart(prev => prev.map(item => item.id === itemId ? { ...item, rentalDays: days } : item));
    try {
      await api.cart.update(itemId, { rentalDays: days });
    } catch (error) {
       console.error(error);
       fetchCart(); // Revert on failure
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    setCart([]);
    try {
      await api.cart.clear();
    } catch (error) {
       console.error(error);
       fetchCart(); // Revert on failure
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.rentalPrice * item.quantity * ((item.rentalDays || 3) / (item.duration || 3));
      return total + itemTotal;
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      updateRentalDays,
      clearCart,
      getCartTotal,
      cartCount: getCartCount()
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}