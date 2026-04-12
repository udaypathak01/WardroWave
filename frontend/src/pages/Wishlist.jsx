import { Heart, ShoppingCart, Star, Trash2, ShoppingBag } from 'lucide-react';
import { useEffect } from 'react';
import { useWishlist } from '../context api/WishlistContext';

import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useNavigate } from 'react-router-dom';

function WishlistCard({ item }) {
  const { removeFromWishlist } = useWishlist();
  const savings = item.originalPrice - item.rentalPrice;
  const savingsPercent = Math.round((savings / item.originalPrice) * 100);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition overflow-hidden group">
      <div className="relative h-48 sm:h-56 md:h-64 bg-gray-200 overflow-hidden">
        <img 
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
        />
        <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          Save {savingsPercent}%
        </div>
        <button 
          onClick={() => removeFromWishlist(item.id)}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition"
          title="Remove from wishlist"
        >
          <Trash2 className="w-5 h-5 text-red-500" />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base line-clamp-2">{item.name}</h3>
        
        <div className="flex items-center gap-2 mb-3">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`w-3 sm:w-4 h-3 sm:h-4 ${i < Math.floor(item.rating) ? 'fill-current' : ''}`}
              />
            ))}
          </div>
          <span className="text-xs sm:text-sm text-gray-600">({item.reviews})</span>
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl font-bold text-gray-900">₹{item.rentalPrice}</span>
            <span className="text-xs sm:text-sm text-gray-500 line-through">₹{item.originalPrice}</span>
          </div>
          {item.duration && (
            <p className="text-xs text-gray-600">{item.duration} days rental</p>
          )}
        </div>

        <button 
          className="w-full py-2 bg-purple-600 text-white rounded-lg hover:bg-pink-600 transition font-medium text-sm flex items-center justify-center gap-2"
        >
          <ShoppingCart className="w-4 h-4" />
          Rent Now
        </button>
      </div>
    </div>
  );
}

export default function Wishlist() {
  const { wishlist, clearWishlist } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {

  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />

      {/* Page Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-8 md:py-12">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center gap-3 mb-2">
            <Heart className="w-8 h-8 text-white fill-white" />
            <h1 className="text-3xl md:text-4xl font-bold text-white">My Wishlist</h1>
          </div>
          <p className="text-gray-100 text-sm md:text-base">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-8 md:py-12">
        {wishlist.length > 0 ? (
          <>
            {/* Action Bar */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-gray-600">
                Showing <span className="font-bold">{wishlist.length}</span> {wishlist.length === 1 ? 'item' : 'items'}
              </p>
              <button
                onClick={clearWishlist}
                className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition font-medium text-sm flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Clear All
              </button>
            </div>

            {/* Wishlist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
              {wishlist.map(item => (
                <WishlistCard key={item.id} item={item} />
              ))}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
                <Heart className="w-12 h-12 text-gray-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Start adding items you love to your wishlist by clicking the heart icon on any product
            </p>
            <button
              onClick={() => navigate('/rentals')}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition font-semibold inline-flex items-center gap-2"
            >
              <ShoppingBag className="w-5 h-5" />
              Browse Rentals
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
