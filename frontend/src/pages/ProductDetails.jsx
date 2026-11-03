import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ShieldCheck, Truck, RotateCcw, Star, ChevronRight } from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import PageTransition, { FadeIn } from '../components/common/PageTransition';
import { SkeletonDetail } from '../components/common/Skeleton';
import { useWishlist } from '../context api/WishlistContext';
import { useCart } from '../context api/CartContext';
import { useAuth } from '../context api/AuthContext';
import CompleteTheLook from '../components/products/CompleteTheLook';
import { addRentalDays, getRentalDate, mapCatalogProduct } from '../utils/api';
import {
  useProductAvailabilityQuery,
  useProductQuery,
  usePublicConfigQuery,
} from '../lib/api/hooks';

export default function ProductDetails() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const productQuery = useProductQuery(slug);
  const settingsQuery = usePublicConfigQuery();
  const rawProduct = productQuery.data?.data;
  const product = useMemo(
    () => rawProduct ? mapCatalogProduct(rawProduct) : null,
    [rawProduct],
  );
  const settings = settingsQuery.data?.data;
  const [rentalDays, setRentalDays] = useState(3);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [startDate, setStartDate] = useState('');
  const endDate = startDate ? addRentalDays(startDate, rentalDays - 1) : '';
  const minRentalDays = Math.max(
    settings?.minRentalDays ?? 1,
    product?.pricing?.minRentalDays ?? 1,
  );
  const maxRentalDays = Math.min(
    settings?.maxRentalDays ?? minRentalDays,
    product?.pricing?.maxRentalDays ?? settings?.maxRentalDays ?? minRentalDays,
  );
  const hasValidRentalRange = minRentalDays <= maxRentalDays;
  const validStartDate = Boolean(
    settings
    && startDate >= getRentalDate(settings.minLeadDays)
    && startDate <= getRentalDate(settings.maxAdvanceDays),
  );
  const validRentalDuration = hasValidRentalRange
    && rentalDays >= minRentalDays
    && rentalDays <= maxRentalDays;
  const availabilityQuery = useProductAvailabilityQuery(
    slug || '',
    selectedVariantId,
    startDate,
    endDate,
    Boolean(product && settings && validStartDate && validRentalDuration),
  );
  const availability = availabilityQuery.data?.data;
  const canRent = availability?.available === true;
  const rentalOptions = [...new Set([minRentalDays, 5, 7, maxRentalDays])]
    .filter((days) => days >= minRentalDays && days <= maxRentalDays);
  const calculatedRentalPrice = product
    ? product.rentalPrice + (Number(product.pricing?.extraDayPrice || 0) / 100)
      * Math.max(0, rentalDays - (product.pricing?.minRentalDays || minRentalDays))
    : 0;
  const retailPrice = Number(product?.originalPrice || 0);

  const isFavorite = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (!product) return;
    setSelectedVariantId(
      product.variants?.find((variant) => variant.active !== false && variant.isActive !== false)?._id || '',
    );
  }, [product]);

  useEffect(() => {
    if (settings && !startDate) {
      setStartDate(getRentalDate(settings.minLeadDays));
    }
    if (settings && product) {
      setRentalDays(Math.min(
        settings.maxRentalDays,
        Math.max(settings.minRentalDays, product.pricing?.minRentalDays || settings.minRentalDays),
      ));
    }
  }, [settings, product, startDate]);

  return (
    <PageTransition className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 md:py-12">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <button onClick={() => navigate('/')} className="hover:text-purple-600 transition">Home</button>
          <ChevronRight className="w-4 h-4" />
          <button onClick={() => navigate('/rentals')} className="hover:text-purple-600 transition">Rentals</button>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900 font-medium truncate">{product?.name || 'Loading...'}</span>
        </div>

        {productQuery.isPending || settingsQuery.isPending ? (
          <SkeletonDetail />
        ) : productQuery.isError || settingsQuery.isError ? (
          <div role="alert" className="rounded-2xl bg-white p-8 text-center">
            <p className="mb-4 text-gray-700">Product details couldn't be loaded.</p>
            <button
              onClick={() => {
                if (productQuery.isError) productQuery.refetch();
                if (settingsQuery.isError) settingsQuery.refetch();
              }}
              className="rounded-lg bg-purple-600 px-6 py-2 font-medium text-white hover:bg-pink-600"
            >
              Retry
            </button>
          </div>
        ) : !product ? (
          <div role="status" className="rounded-2xl bg-white p-8 text-center">
            <p className="mb-4 text-gray-700">This product is no longer available.</p>
            <button onClick={() => navigate('/rentals')} className="font-semibold text-purple-600 underline">
              Browse rentals
            </button>
          </div>
        ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            
            {/* Left: Image Gallery */}
            <FadeIn delay={0.1}>
              <div className="relative rounded-3xl overflow-hidden bg-white shadow-lg border border-gray-100 flex items-center justify-center w-full min-h-[280px] max-h-[75vh]">
                <img 
                  src={product.image || product.images?.[0]?.url} 
                  alt={product.name}
                  className="block w-full max-h-[75vh] object-contain p-2"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling && (e.target.nextElementSibling.style.display = 'flex');
                  }}
                />
                {/* Fallback background if image fails */}
                <div 
                  className="absolute inset-0 bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center"
                  style={{ display: 'none' }}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-4">🛍️</div>
                    <p className="text-gray-500 font-medium">Image not available</p>
                  </div>
                </div>
                {!product.inStock && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm">
                    <span className="text-white font-bold text-2xl tracking-wide px-6 py-3 border-2 border-white rounded-xl">Currently Rented</span>
                  </div>
                )}
                <button 
                  onClick={() => toggleWishlist(product)}
                  className="absolute top-6 right-6 p-3 bg-white/90 backdrop-blur rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-300 z-10"
                >
                  <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                </button>
              </div>
            </FadeIn>

            {/* Right: Product Details */}
            <FadeIn delay={0.2} className="flex flex-col">
              <div className="mb-2">
                <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
                  {product.category}
                </span>
                <h1 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
                  {product.name}
                </h1>
                
                {product.reviews > 0 && <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full text-yellow-600">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-sm">{product.rating}</span>
                  </div>
                  <span className="text-gray-500 text-sm">{product.reviews} reviews</span>
                </div>}
              </div>

              <div className="flex bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Rental Price</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                      ₹{product.rentalPrice}
                    </span>
                    <span className="text-gray-500 pb-1">/ {rentalDays} days</span>
                  </div>
                </div>
                {retailPrice > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Retail Price</p>
                    <span className="text-xl font-bold text-gray-400 line-through">₹{retailPrice}</span>
                  </div>
                )}
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">Select Rental Duration</h3>
                <div className="flex gap-4">
                  {rentalOptions.map(days => (
                    <button
                      key={days}
                      onClick={() => setRentalDays(days)}
                      className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all ${
                        rentalDays === days 
                          ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-sm' 
                          : 'border-gray-200 text-gray-600 hover:border-purple-300 hover:bg-slate-50'
                      }`}
                    >
                      {days} Days
                    </button>
                  ))}
                </div>
                <p className="text-gray-500 text-sm mt-3 text-center">
                      Rental charge: <span className="font-bold text-gray-900">₹{calculatedRentalPrice}</span>
                </p>
              </div>

              <div className="mb-6">
                <label htmlFor="rental-start-date" className="block font-bold text-gray-900 mb-2">Rental start date</label>
                <input
                  id="rental-start-date"
                  type="date"
                  min={getRentalDate(settings.minLeadDays)}
                  max={getRentalDate(settings.maxAdvanceDays)}
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3"
                />
                {availabilityQuery.isFetching && <p className="mt-2 text-sm text-gray-500">Checking availability…</p>}
                {!validStartDate && startDate && (
                  <p role="alert" className="mt-2 text-sm text-amber-700">
                    Choose a start date within the allowed rental window.
                  </p>
                )}
                {availabilityQuery.isError && (
                  <p role="alert" className="mt-2 text-sm text-red-600">
                    Availability couldn't be checked.
                    <button onClick={() => availabilityQuery.refetch()} className="ml-1 font-semibold underline">
                      Retry
                    </button>
                  </p>
                )}
                {availability && !availability.available && (
                  <p role="status" className="mt-2 text-sm text-amber-700">This size is unavailable for the selected dates.</p>
                )}
                {availability?.available && (
                  <p role="status" className="mt-2 text-sm text-green-700">Available for these dates.</p>
                )}
              </div>

              <div className="mb-8">
                <label htmlFor="rental-size" className="block font-bold text-gray-900 mb-2">Select size</label>
                <select id="rental-size" value={selectedVariantId} onChange={(event) => setSelectedVariantId(event.target.value)} className="product-size-select w-full rounded-xl border border-gray-300 px-4 py-3">
                  <option value="" disabled>Choose an available size</option>
                  {product.variants?.filter((variant) => variant.active !== false && variant.isActive !== false).map((variant) => <option key={variant._id} value={variant._id}>{variant.size}{variant.color ? ` · ${variant.color}` : ''}</option>)}
                </select>
                  {!hasValidRentalRange && (
                    <p role="status" className="mt-2 text-sm text-amber-700">
                      This item is not available within the current rental duration limits.
                    </p>
                  )}
                {!product.variants?.some((variant) => variant.active !== false && variant.isActive !== false) && (
                  <p role="status" className="mt-2 text-sm text-gray-600">No sizes are currently available.</p>
                )}
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">Product Description</h3>
                <p className="text-gray-600 leading-relaxed text-base">
                  {product.description || "No description has been provided for this item."}
                </p>
              </div>

              <button 
                onClick={() => isAuthenticated
                  ? addToCart({ ...product, variantId: selectedVariantId }, rentalDays, { startDate, endDate })
                  : navigate('/login', { state: { from: { pathname: `/product/${product.slug || product.id}` } } })}
                disabled={!selectedVariantId || !validStartDate || !validRentalDuration || !canRent || availabilityQuery.isFetching || availabilityQuery.isError}
                className="w-full py-4 text-lg btn-primary justify-center shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed mb-8"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {availabilityQuery.isFetching ? 'Checking availability…' : canRent ? `Add to Cart - ₹${calculatedRentalPrice}` : 'Currently Unavailable'}
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="p-2 bg-purple-50 rounded-full text-purple-600"><ShieldCheck className="w-5 h-5" /></div>
                  <span className="font-medium">Quality Verified</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="p-2 bg-pink-50 rounded-full text-pink-600"><Truck className="w-5 h-5" /></div>
                  <span className="font-medium">Fast Delivery</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <div className="p-2 bg-blue-50 rounded-full text-blue-600"><RotateCcw className="w-5 h-5" /></div>
                  <span className="font-medium">Easy Returns</span>
                </div>
              </div>
            </FadeIn>
            
          </div>
          
          <CompleteTheLook currentProductSlug={product.slug} />
        </>
        )}
      </main>
      
      <Footer />
    </PageTransition>
  );
}
