import { useMemo, useState } from 'react';
import { mapCatalogProduct } from '../utils/api';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/common/PageTransition';
import { Heart, ShoppingBag, Sparkles, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProductsQuery } from '../lib/api/hooks';
import { useWishlist } from '../context api/WishlistContext';
import { SkeletonGrid } from '../components/common/Skeleton';
import ThemeBubbles from '../components/common/ThemeBubbles';

export default function Discover() {
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const productsQuery = useProductsQuery({ limit: 60, sort: 'popular' });
  const products = (productsQuery.data?.data || []).map(mapCatalogProduct);
  const occasions = useMemo(
    () => [...new Set((productsQuery.data?.data || []).flatMap((product) => product.occasions || []))],
    [productsQuery.data?.data],
  );
  const filteredProducts = activeFilter === 'all'
    ? products
    : products.filter((product) => (product.occasions || []).includes(activeFilter));

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <Header />
      
      <main className="discover-page container mx-auto px-4 md:px-6 py-12 md:py-20 relative overflow-hidden">
        {/* Background mesh */}
        <div className="discover-mesh absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-purple-50 via-pink-50/50 to-transparent pointer-events-none rounded-[100px] z-0"></div>
        <ThemeBubbles />

        <FadeIn className="text-center max-w-2xl mx-auto mb-16 relative z-10">
          <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-white shadow-sm text-purple-600 font-bold text-xs uppercase mb-4 border border-purple-100">
            <Sparkles className="w-3 h-3" /> WardroWave Collection
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">
            Discover Your Next <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">Rental Style</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium">
            Explore published pieces from the WardroWave rental catalog.
          </p>
        </FadeIn>

        {/* Filter Pills */}
        <div className="flex justify-center gap-3 mb-12 relative z-10 overflow-x-auto pb-4 hide-scrollbar">
          {['all', ...occasions].map((filter) => (
            <button 
              key={filter} 
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-3 rounded-full font-bold transition-all shadow-sm shrink-0 ${activeFilter === filter ? 'bg-gray-900 text-white shadow-lg -translate-y-1' : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-300'}`}
            >
              {filter === 'all' ? 'All styles' : filter}
            </button>
          ))}
        </div>

        {productsQuery.isPending ? (
          <SkeletonGrid count={6} />
        ) : productsQuery.isError ? (
          <div role="alert" className="relative z-10 rounded-2xl bg-white py-12 text-center text-gray-600">
            Products couldn't be loaded.
            <button onClick={() => productsQuery.refetch()} className="ml-2 font-semibold text-purple-600 underline">Retry</button>
          </div>
        ) : filteredProducts.length ? (
          <StaggerContainer className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 relative z-10" key={activeFilter}>
            {filteredProducts.map((product) => (
              <StaggerItem key={product.id}>
                <article className="break-inside-avoid relative rounded-[32px] overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-500 bg-white">
                  <button
                    type="button"
                    aria-label={isInWishlist(product.id) ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                    onClick={() => toggleWishlist(product)}
                    className="absolute top-4 right-4 z-20 rounded-full bg-white/90 p-3 shadow-lg"
                  >
                    <Heart className={`h-5 w-5 ${isInWishlist(product.id) ? 'fill-pink-500 text-pink-500' : 'text-gray-500'}`} />
                  </button>
                  <button type="button" onClick={() => navigate(`/product/${product.slug}`)} className="block w-full text-left">
                    <div className="h-[380px] bg-gradient-to-br from-purple-100 to-pink-100">
                      {product.image && (
                        <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      )}
                    </div>
                    <div className="p-5">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-purple-600">{product.category}</p>
                      <h3 className="mb-3 text-xl font-bold text-gray-900">{product.name}</h3>
                      {product.reviews > 0 && (
                        <div className="mb-3 flex items-center gap-1 text-sm text-gray-600">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          {product.rating} ({product.reviews})
                        </div>
                      )}
                      <p className="font-semibold text-gray-900">Rent from ₹{product.rentalPrice}</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/product/${product.slug}`)}
                    className="mx-5 mb-5 flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3 font-bold text-white"
                  >
                    <ShoppingBag className="h-4 w-4" /> View rental details
                  </button>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div role="status" className="relative z-10 rounded-2xl bg-white py-12 text-center text-gray-600">
            No products match this style yet.
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
