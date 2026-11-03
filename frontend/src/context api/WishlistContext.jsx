import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api, { mapCatalogProduct } from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();

  const fetchWishlist = useCallback(async () => {
    try {
      setError('');
      const res = await api.wishlist.get();
      const rawProducts = res?.data?.products || res?.data?.items || [];
      const mappedItems = rawProducts.map((item) => mapCatalogProduct(item));
      setWishlist(mappedItems);
      return true;
    } catch (err) {
      setError(err.message || 'Could not load your wishlist.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true);
      fetchWishlist();
    } else {
      setWishlist([]);
      setError('');
      setIsLoading(false);
    }
  }, [isAuthenticated, fetchWishlist]);

  const addToWishlist = async (item) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to manage your wishlist.', { id: 'wishlist-auth' });
      return;
    }

    setWishlist(prev => {
      if (prev.find(i => i.id === item.id)) return prev;
      return [...prev, { ...item, id: item.id }];
    });

    try {
      await api.wishlist.add(item.id);
      toast.success('Added to your wishlist');
    } catch (err) {
      toast.error(err.message || 'Could not add this item to your wishlist.');
      await fetchWishlist();
    }
  };

  const removeFromWishlist = async (itemId) => {
    if (!isAuthenticated) return;

    setWishlist(prev => prev.filter(item => item.id !== itemId));
    
    try {
      await api.wishlist.remove(itemId);
    } catch (err) {
      toast.error(err.message || 'Could not remove this item from your wishlist.');
      await fetchWishlist();
    }
  };

  const isInWishlist = (itemId) => {
    return wishlist.some(item => item.id === itemId);
  };

  const toggleWishlist = async (item) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to manage your wishlist.', { id: 'wishlist-auth' });
      return;
    }

    const shouldAdd = !isInWishlist(item.id);
    if (!shouldAdd) {
      setWishlist(prev => prev.filter(i => i.id !== item.id));
    } else {
      setWishlist(prev => [...prev, { ...item, id: item.id }]);
    }

    try {
      await api.wishlist.toggle(item.id, shouldAdd);
    } catch (err) {
      toast.error(err.message || 'Could not update your wishlist.');
      await fetchWishlist();
    }
  };

  const clearWishlist = async () => {
    if (!isAuthenticated) return;
    setWishlist([]);
    try {
      await api.wishlist.clear(wishlist.map((item) => item.id));
    } catch (err) {
      toast.error(err.message || 'Could not clear your wishlist.');
      await fetchWishlist();
    }
  };

  return (
    <WishlistContext.Provider value={{
      wishlist,
      isLoading,
      error,
      refreshWishlist: fetchWishlist,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      clearWishlist,
      wishlistCount: wishlist.length
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
