import { useState, useEffect } from 'react';
import api from '../utils/api';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { FadeIn, StaggerContainer, StaggerItem } from '../components/common/PageTransition';
import { Heart, MessageCircle, MapPin, Sparkles } from 'lucide-react';

import { useNavigate } from 'react-router-dom';

const COMMUNITY_LOOKS = [
  { id: 1, user: '@priya_styles', city: 'Mumbai', likes: 124, comments: 12, height: 400, category: 'wedding season', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&h=800&fit=crop', product: 'Designer Silk Saree' },
  { id: 2, user: '@rahul_d', city: 'Delhi', likes: 89, comments: 5, height: 320, category: 'minimalist', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=500&h=600&fit=crop', product: 'Embellished Kurta' },
  { id: 3, user: '@ananya_p', city: 'Bangalore', likes: 256, comments: 24, height: 450, category: 'resort wear', image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&h=900&fit=crop', product: 'Summer Floral Dress' },
  { id: 4, user: '@karan_v', city: 'Pune', likes: 67, comments: 3, height: 360, category: 'resort wear', image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=500&h=700&fit=crop', product: 'Resort Linen Shirt' },
  { id: 5, user: '@sneha_r', city: 'Goa', likes: 412, comments: 56, height: 380, category: 'minimalist', image: 'https://images.unsplash.com/photo-1495385794356-15371f348c31?w=600&h=800&fit=crop', product: 'Breezy Linen Gown' },
  { id: 6, user: '@vikram_s', city: 'Jaipur', likes: 112, comments: 8, height: 420, category: 'luxe', image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&h=900&fit=crop', product: 'Velvet Dinner Jacket' }
];

export default function Discover() {
  const [activeFilter, setActiveFilter] = useState('trending');
  const [likedLooks, setLikedLooks] = useState({});
  const [backendProducts, setBackendProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch live products from Firebase to match IDs for navigation
    const fetchProducts = async () => {
      try {
        const res = await api.product.getAll();
        setBackendProducts(res.data?.products || res.products || []);
      } catch (err) {
        console.error('Failed to load products for mapping:', err);
      }
    };
    fetchProducts();
  }, []);

  const handleLike = (id) => {
    setLikedLooks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRentThisLook = (e, look) => {
    e.stopPropagation();
    if (!backendProducts.length) return navigate('/rentals');

    // Attempt to strictly match the product name from the seed database
    let match = backendProducts.find(p => p.name.toLowerCase().includes(look.product.toLowerCase()));
    
    // If exact name doesn't exist, map it to the next closest dynamic backend product using category or AI-style mapping
    if (!match) {
      const categoryMatches = backendProducts.filter(p => 
        (look.category === 'luxe' && p.category === 'men') || 
        (look.category === 'wedding season' && p.category === 'women') ||
        p.category === (look.category === 'men' || look.category === 'women' ? look.category : 'accessories')
      );
      match = categoryMatches.length > 0 
        ? categoryMatches[Math.floor(Math.random() * categoryMatches.length)] 
        : backendProducts[0];
    }

    if (match && match.id) {
      navigate(`/product/${match.id}`);
    } else {
      navigate('/rentals');
    }
  };

  const filteredLooks = activeFilter === 'trending' 
    ? COMMUNITY_LOOKS 
    : COMMUNITY_LOOKS.filter(look => look.category === activeFilter);

  return (
    <div className="min-h-screen bg-slate-50 overflow-x-hidden">
      <Header />
      
      <main className="container mx-auto px-4 md:px-6 py-12 md:py-20 relative">
        {/* Background mesh */}
        <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-purple-50 via-pink-50/50 to-transparent pointer-events-none rounded-[100px] z-0"></div>

        <FadeIn className="text-center max-w-2xl mx-auto mb-16 relative z-10">
          <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-white shadow-sm text-purple-600 font-bold text-xs uppercase mb-4 border border-purple-100">
            <Sparkles className="w-3 h-3" /> Community Lookbook
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">
            Discover Real <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">AI Styles</span>
          </h1>
          <p className="text-lg text-gray-500 font-medium">
            See how the WardroWave community is rocking their AI-curated rental outfits in the real world.
          </p>
        </FadeIn>

        {/* Filter Pills */}
        <div className="flex justify-center gap-3 mb-12 relative z-10 overflow-x-auto pb-4 hide-scrollbar">
          {['Trending', 'Wedding Season', 'Resort Wear', 'Minimalist', 'Luxe'].map(filter => (
            <button 
              key={filter} 
              onClick={() => setActiveFilter(filter.toLowerCase())}
              className={`px-6 py-3 rounded-full font-bold transition-all shadow-sm shrink-0 ${activeFilter === filter.toLowerCase() ? 'bg-gray-900 text-white shadow-lg -translate-y-1' : 'bg-white text-gray-600 border border-gray-100 hover:border-gray-300'}`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Masonry Grid (Simulated with columns) */}
        <StaggerContainer className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6 relative z-10" key={activeFilter}>
          {filteredLooks.map((look) => (
            <StaggerItem key={look.id}>
              <div className="break-inside-avoid relative rounded-[32px] overflow-hidden group shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer">
                {/* Image */}
                <div className="w-full bg-gray-200" style={{ height: `${look.height}px` }}>
                  <img src={look.image} alt={look.product} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                
                {/* Gradients */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-gray-900/60 to-transparent opacity-80 z-10"></div>
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent opacity-90 z-10"></div>

                {/* Top Info: User */}
                <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-20">
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/30 text-white shadow-lg">
                    <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs font-black">
                      {look.user.charAt(1).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold tracking-tight">{look.user}</span>
                  </div>
                </div>

                {/* Bottom Info: Actions & Tags */}
                <div className="absolute bottom-5 left-5 right-5 z-20">
                  <div className="flex items-center gap-1 text-pink-200 mb-3 text-xs font-bold uppercase tracking-wider backdrop-blur-sm bg-black/20 w-fit px-2 py-1 rounded">
                    <MapPin className="w-3 h-3" /> {look.city}
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-4 leading-tight">{look.product}</h3>
                  
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={(e) => handleRentThisLook(e, look)}
                      className="px-5 py-2.5 bg-white text-gray-900 font-bold rounded-xl hover:bg-purple-600 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] text-sm flex items-center gap-2 group/btn"
                    >
                      Rent This Look
                    </button>
                    
                    <div className="flex items-center gap-4 text-white">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleLike(look.id); }}
                        className="flex items-center gap-1 hover:text-pink-400 transition-colors"
                      >
                        <Heart className={`w-5 h-5 transition-colors ${likedLooks[look.id] ? 'fill-pink-500 text-pink-500' : 'fill-transparent hover:fill-current'}`} /> 
                        <span className="text-sm font-medium">{look.likes + (likedLooks[look.id] ? 1 : 0)}</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-blue-400 transition-colors">
                        <MessageCircle className="w-5 h-5" /> <span className="text-sm font-medium">{look.comments}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

      </main>
      <Footer />
    </div>
  );
}
