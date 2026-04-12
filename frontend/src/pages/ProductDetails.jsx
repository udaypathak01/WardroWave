import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ShieldCheck, Truck, RotateCcw, Star, ChevronRight } from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import PageTransition, { FadeIn } from '../components/common/PageTransition';
import { SkeletonDetail } from '../components/common/Skeleton';
import { useWishlist } from '../context api/WishlistContext';
import { useCart } from '../context api/CartContext';
import CompleteTheLook from '../components/products/CompleteTheLook';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { RENTAL_ITEMS } from '../data/productsData';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rentalDays, setRentalDays] = useState(3);
  
  const isFavorite = product ? isInWishlist(product.id) : false;

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchProduct = async () => {
      try {
        setLoading(true);
        
        // First, try to find product locally in RENTAL_ITEMS
        const localProduct = RENTAL_ITEMS.find(p => p.id === parseInt(id) || p.id === id);
        if (localProduct) {
          setProduct(localProduct);
          setLoading(false);
          return;
        }
        
        // If not found locally, try to fetch from API
        const res = await api.product.getById(id);
        if (res.data?.product) {
          setProduct(res.data.product);
        } else if (res.product) {
          setProduct(res.product);
        } else {
          toast.error("Product not found");
          navigate('/rentals');
        }
      } catch (err) {
        console.error('Product fetch error:', err);
        // Check one more time if product exists locally before showing error
        const localProduct = RENTAL_ITEMS.find(p => p.id === parseInt(id) || p.id === id);
        if (localProduct) {
          setProduct(localProduct);
        } else {
          toast.error("Failed to load product details");
          navigate('/rentals');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate]);

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

        {loading ? (
          <SkeletonDetail />
        ) : !product ? null : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            
            {/* Left: Image Gallery */}
            <FadeIn delay={0.1}>
              <div className="relative rounded-3xl overflow-hidden bg-white shadow-lg border border-gray-100 flex items-center justify-center w-full" style={{ height: '600px' }}>
                <img 
                  src={product.image || product.images?.[0]?.url} 
                  alt={product.name}
                  className="w-full h-full object-contain p-4"
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
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full text-yellow-600">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="font-bold text-sm">{product.rating || "4.8"}</span>
                  </div>
                  <span className="text-gray-500 text-sm underline cursor-pointer">{product.reviews || "120"} reviews</span>
                </div>
              </div>

              <div className="flex bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Rental Price</p>
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                      ₹{product.rentalPrice}
                    </span>
                    <span className="text-gray-500 pb-1">/ day</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Retail Price</p>
                  <span className="text-xl font-bold text-gray-400 line-through">₹{product.originalPrice}</span>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">Select Rental Duration</h3>
                <div className="flex gap-4">
                  {[3, 5, 7, 14].map(days => (
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
                  Total rental cost: <span className="font-bold text-gray-900">₹{product.rentalPrice * rentalDays}</span>
                </p>
              </div>

              <div className="mb-8">
                <h3 className="font-bold text-gray-900 mb-3 text-lg">Product Description</h3>
                <p className="text-gray-600 leading-relaxed text-base">
                  {product.description || "A stunning piece perfect for any premium occasion. Crafted with excellence and designed to make you stand out. Rent it today and experience luxury at a fraction of the cost."}
                </p>
              </div>

              <button 
                onClick={() => addToCart(product, rentalDays)}
                disabled={!product.inStock}
                className="w-full py-4 text-lg btn-primary justify-center shadow-lg shadow-purple-200 disabled:opacity-50 disabled:cursor-not-allowed mb-8"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {product.inStock ? `Add to Cart - ₹${product.rentalPrice * rentalDays}` : 'Currently Unavailable'}
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
          
          <CompleteTheLook currentProductId={product.id} />
        </>
        )}
      </main>
      
      <Footer />
    </PageTransition>
  );
}
