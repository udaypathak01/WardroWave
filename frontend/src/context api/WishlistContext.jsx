import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState([]);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlist();
    } else {
      setWishlist([]);
    }
  }, [isAuthenticated]);

  const fetchWishlist = async () => {
    try {
      const res = await api.wishlist.get();
      // map productId to id for frontend compatibility
      const mappedItems = (res.data.items || []).map(item => ({ ...item, id: item.productId }));
      setWishlist(mappedItems);
    } catch (err) {
      console.error('Failed to fetch wishlist', err);
    }
  };

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
    } catch (err) {
      console.error(err);
      fetchWishlist(); // Revert on failure
    }
  };

  const removeFromWishlist = async (itemId) => {
    if (!isAuthenticated) return;

    setWishlist(prev => prev.filter(item => item.id !== itemId));
    
    try {
      await api.wishlist.remove(itemId);
    } catch (err) {
      console.error(err);
      fetchWishlist(); // Revert on failure
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

    if (isInWishlist(item.id)) {
      setWishlist(prev => prev.filter(i => i.id !== item.id));
    } else {
      setWishlist(prev => [...prev, { ...item, id: item.id }]);
    }

    try {
      await api.wishlist.toggle(item.id);
    } catch (err) {
      console.error(err);
      fetchWishlist(); // Revert on failure
    }
  };

  const clearWishlist = async () => {
    if (!isAuthenticated) return;
    setWishlist([]);
    try {
      await api.wishlist.clear();
    } catch (err) {
      console.error(err);
      fetchWishlist(); // Revert on failure
    }
  };

  return (
    <WishlistContext.Provider value={{
      wishlist,
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