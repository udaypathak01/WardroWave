import { useRef } from "react";
import { Link } from "react-router-dom";
import { Heart, Star, Sparkles, MoveRight } from "lucide-react";
import { useWishlist } from "../../context api/WishlistContext";
import { FadeIn, StaggerContainer, StaggerItem } from '../common/PageTransition';
import { mapCatalogProduct } from "../../utils/api";
import { useFeaturedProductsQuery } from "../../lib/api/hooks";

function EditorialCard({ product }) {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const isFavorite = isInWishlist(product.id);

  return (
    <Link 
      to={`/product/${product.slug || product.id}`}
      className="block relative w-72 md:w-80 h-[28rem] md:h-[32rem] rounded-[32px] overflow-hidden group shrink-0 snap-center shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer"
    >
      <img
        src={product.image}
        alt={product.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-110"
        loading="lazy"
        onError={(e) => {
          if (!e.currentTarget.src.endsWith('/wardrowave_homepage_top_1774577009178.png')) {
            e.currentTarget.src = '/wardrowave_homepage_top_1774577009178.png';
          }
        }}
      />
      
      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-black/10 opacity-80 group-hover:opacity-60 transition-opacity duration-500 z-10" />

      {/* Top badges */}
      <div className="absolute top-5 left-5 right-5 flex justify-between items-start z-20">
        <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border border-white/30 truncate max-w-[60%]">
          {product.category}
        </span>
        
        <button
          onClick={(e) => { e.preventDefault(); toggleWishlist(product); }}
          className="p-2.5 bg-white/20 backdrop-blur-lg rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 border border-white/30"
          title={isFavorite ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? "fill-pink-500 text-pink-500" : "text-white"}`} />
        </button>
      </div>

      {/* Content Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 p-6 z-20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-2xl font-black text-white mb-1 leading-tight line-clamp-2">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1.5 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">
          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
          {product.reviews > 0 ? (
            <>
              <span className="text-yellow-400 font-bold text-sm">{product.rating}</span>
              <span className="text-gray-300 text-xs">({product.reviews})</span>
            </>
          ) : <span className="text-gray-300 text-xs">No reviews yet</span>}
        </div>

        <div className="flex items-end justify-between backdrop-blur-md bg-white/10 p-4 rounded-2xl border border-white/20 relative overflow-hidden group/price">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 translate-x-[-100%] group-hover/price:translate-x-0 transition-transform duration-500"></div>
          <div className="relative z-10">
            <p className="text-xs text-purple-200 font-medium mb-0.5">Rent for</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">₹{product.rentalPrice}</span>
              <span className="text-sm font-medium text-white/50 line-through">₹{product.originalPrice}</span>
            </div>
          </div>
          <div className="relative z-10 w-10 h-10 rounded-full bg-white text-gray-900 flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg">
            <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function FeaturedProducts() {
  const scrollRef = useRef(null);
  const productsQuery = useFeaturedProductsQuery();
  const products = (productsQuery.data?.data || []).map(mapCatalogProduct);

  return (
    <section className="featured-section py-16 lg:py-20 bg-white relative overflow-hidden">
      {/* Optional mesh backorund */}
      <div className="featured-glow absolute top-[-20%] right-[-10%] w-[40%] h-[40%] bg-purple-100 rounded-full blur-[100px] opacity-60 pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 mb-12 relative z-10">
        <FadeIn className="flex flex-col md:flex-row justify-between items-center md:items-end gap-4 md:gap-6 text-center md:text-left">
          <div className="max-w-2xl flex flex-col items-center md:items-start">
            <span className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-pink-50 text-pink-600 font-bold tracking-wider text-xs uppercase mb-4 border border-pink-100">
              <Sparkles className="w-4 h-4" /> Featured rentals
            </span>
            <h2 className="section-title text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
              Featured Collection
            </h2>
          </div>
          <Link 
            to="/rentals"
            className="flex items-center justify-center gap-2 text-purple-600 font-bold text-lg hover:text-pink-600 transition-colors group mt-2 md:mt-0"
          >
            Explore Collection <MoveRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </FadeIn>
      </div>

      {/* Horizontal Scrolling Gallery */}
      <div className="relative z-10">
        <div 
          ref={scrollRef}
          className="flex gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory px-4 md:px-6 pb-12 pt-4 hide-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {productsQuery.isPending ? (
            <div className="px-8 py-12 text-gray-500">Loading featured rentals…</div>
          ) : productsQuery.isError ? (
            <div role="alert" className="px-8 py-12 text-gray-600">
              Featured rentals couldn't be loaded.
              <button onClick={() => productsQuery.refetch()} className="ml-2 font-semibold text-purple-600 underline">
                Try again
              </button>
            </div>
          ) : products.map((product, idx) => (
            <FadeIn key={product.id || idx} delay={idx * 0.1}>
              <EditorialCard product={product} />
            </FadeIn>
          ))}
          
          {/* Extra spacer for the end of the scroll */}
          <div className="w-4 md:w-16 shrink-0"></div>
        </div>
      </div>
    </section>
  );
}
