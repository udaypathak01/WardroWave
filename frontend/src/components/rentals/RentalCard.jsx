import { Heart, ShoppingCart, Star, Calendar } from "lucide-react";
import { useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { useWishlist } from "../../context api/WishlistContext";
import { useCart } from "../../context api/CartContext";

export default function RentalCard({ item }) {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isFavorite = isInWishlist(item.id);
  const savings = item.originalPrice - item.rentalPrice;
  const savingsPercent = Math.round((savings / item.originalPrice) * 100);

  useEffect(() => {
    if (cardRef.current) {
      gsap.from(cardRef.current, {
        opacity: 0,
        y: 20,
        duration: 0.5,
      });
    }
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col h-full group card-lift hover:-translate-y-1">
      <Link to={`/product/${item.id}`} className="relative h-48 sm:h-56 md:h-64 bg-gray-200 overflow-hidden block">
        <img
          src={item.image || item.images?.[0]?.url}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
          Save {savingsPercent}%
        </div>
        {!item.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold text-lg">Not Available</span>
          </div>
        )}
        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(item); }}
          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 z-10"
          title={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-400"
            }`}
          />
        </button>
      </Link>

      <div className="p-4 md:p-5 flex flex-col flex-grow">
        <Link to={`/product/${item.id}`} className="hover:text-purple-600 transition-colors">
          <h3 className="font-bold text-gray-900 mb-2 text-sm sm:text-base line-clamp-2">
            {item.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 mb-4">
          <div className="flex text-yellow-400">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 sm:w-4 h-3 sm:h-4 ${
                  i < Math.floor(item.rating) ? "fill-current" : ""
                }`}
              />
            ))}
          </div>
          <span className="text-xs sm:text-sm text-gray-600">
            ({item.reviews})
          </span>
        </div>

        {/* Pricing */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg sm:text-xl font-bold text-gray-900">
              ₹{item.rentalPrice}
            </span>
            <span className="text-xs sm:text-sm text-gray-500 line-through">
              ₹{item.originalPrice}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            <Calendar className="w-3 h-3" />
            <span>{item.duration} days rental</span>
          </div>
        </div>

        <button
          onClick={(e) => { e.preventDefault(); navigate(`/product/${item.id}`); }}
          disabled={!item.inStock}
          className="mt-auto w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:shadow-lg hover:shadow-purple-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <ShoppingCart className="w-4 h-4" />
          View Details
        </button>
      </div>
    </div>
  );
}
