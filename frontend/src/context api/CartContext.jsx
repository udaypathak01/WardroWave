import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { addRentalDays, getRentalDate, rentalCalendarDate } from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cart, setCart] = useState([]);
  const [couponCode, setCouponCode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();

  const fetchCart = useCallback(async () => {
    try {
      setError('');
      const res = await api.cart.get();
      const rawItems = res?.data?.items || [];
      setCouponCode(res?.data?.couponCode || null);
      const mappedItems = rawItems.map(item => {
        const product = item.product || {};
        const variant = item.variant || {};
        return {
          id: item._id,
          cartItemId: item._id,
          productId: product._id || item.product,
          variantId: variant._id || item.variant,
          name: product.title || item.name || 'Rental Item',
          price: product.pricing?.basePrice ? product.pricing.basePrice / 100 : (item.rentalPrice || item.price || 0),
          rentalPrice: product.pricing?.basePrice ? product.pricing.basePrice / 100 : (item.rentalPrice || item.price || 0),
          extraDayPrice: Number(product.pricing?.extraDayPrice || 0) / 100,
          minRentalDays: Number(product.pricing?.minRentalDays || 3),
          maxRentalDays: Number(product.pricing?.maxRentalDays || 14),
          securityDeposit: Number(product.pricing?.securityDeposit || 0) / 100,
          image: product.images?.[0]?.url || item.image || '',
          size: variant.size || item.size || 'M',
          startDate: item.startDate,
          endDate: item.endDate,
          rentalDays: Math.max(1, Math.round((Date.parse(`${rentalCalendarDate(item.endDate)}T00:00:00Z`) - Date.parse(`${rentalCalendarDate(item.startDate)}T00:00:00Z`)) / 86400000) + 1),
          quantity: 1,
        };
      });
      setCart(mappedItems);
      return true;
    } catch (err) {
      setError(err.message || 'Could not load your cart.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch cart when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      fetchCart();
    } else {
      setCart([]);
      setCouponCode(null);
      setError('');
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchCart]);

  const addToCart = async (item, rentalDays = 3, options = {}) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to add items to your cart.', { id: 'cart-auth' });
      return;
    }
    
    // Optimistic UI update
    try {
      const variantId = item.variantId || item.variants?.find((variant) => variant.active !== false && variant.isActive !== false)?._id;
      if (!variantId) throw new Error('Choose an available size before adding this item.');
      await api.cart.add(variantId, 1, rentalDays, options);
      if (await fetchCart()) toast.success('Added to your rental cart');
      else toast.error('The item was added, but the cart could not be refreshed.');
    } catch (error) {
       toast.error(error.message || 'Could not add this item to your cart');
    }
  };

  const removeFromCart = async (itemId) => {
    if (!isAuthenticated) return;
    
    try {
      await api.cart.remove(itemId);
      setCart((prev) => prev.filter((item) => item.id !== itemId));
    } catch (error) {
       toast.error(error.message || 'Could not remove this item.');
       await fetchCart();
    }
  };

  const updateRentalDays = async (itemId, days) => {
    if (!isAuthenticated) return;

    try {
      const item = cart.find((entry) => entry.id === itemId);
      if (!item?.variantId) return;
      const startDate = item.startDate ? rentalCalendarDate(item.startDate) : getRentalDate(1);
      const previousEndDate = item.endDate ? rentalCalendarDate(item.endDate) : addRentalDays(startDate, (item.rentalDays || 3) - 1);
      await api.cart.remove(itemId);
      try {
        await api.cart.add(item.variantId, 1, days, { startDate, endDate: addRentalDays(startDate, days - 1) });
      } catch (error) {
        try {
          await api.cart.add(item.variantId, 1, item.rentalDays || 3, { startDate, endDate: previousEndDate });
        } catch (rollbackError) {
          setError(`Could not restore the previous rental period: ${rollbackError.message || 'please refresh your cart.'}`);
        }
        throw error;
      }
      await fetchCart();
    } catch (error) {
      toast.error(error.message || 'Could not update rental dates');
      await fetchCart();
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) return;
    try {
      await api.cart.clear();
      setCart([]);
      setCouponCode(null);
    } catch (error) {
       toast.error(error.message || 'Could not clear your cart.');
       await fetchCart();
    }
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const itemTotal = item.rentalPrice + (item.extraDayPrice || 0) * Math.max(0, (item.rentalDays || 3) - (item.minRentalDays || 3));
      return total + itemTotal;
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cart,
      couponCode,
      isLoading,
      error,
      refreshCart: fetchCart,
      addToCart,
      removeFromCart,
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
