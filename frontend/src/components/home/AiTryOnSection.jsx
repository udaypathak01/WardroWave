import { useState, useRef } from 'react';
import { Upload, Sparkles, Camera, ArrowRight, Loader2, X, ChevronLeft, ChevronRight, ShoppingCart, Heart, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FadeIn } from '../common/PageTransition';
import { RENTAL_ITEMS } from '../../data/productsData';
import { useAuth } from '../../context api/AuthContext';
import { useCart } from '../../context api/CartContext';
import { useWishlist } from '../../context api/WishlistContext';
import toast from 'react-hot-toast';

const outfitData = {
  'Casual': {
    image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=1000&fit=crop',
    title: 'Relaxed Everyday Casual Look'
  },
  'Wedding Reception': {
    image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&h=1000&fit=crop',
    title: 'Premium Embellished Lehenga'
  },
  'Corporate Gala': {
    image: 'https://images.unsplash.com/photo-1612336307429-8a898d10e223?w=800&h=1000&fit=crop',
    title: 'Midnight Sparkle Gala Gown'
  },
  'Beach Vacation': {
    image: '/relaxed_beach_man.png',
    title: 'Relaxed Tailored Beach Outfit'
  },
  'Date Night': {
    image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=800&h=1000&fit=crop',
    title: 'Satin Slip Midi Dress'
  },
  'Festive Party': {
    image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&h=1000&fit=crop',
    title: 'Royal Tissue Saree'
  }
};

const occasions = Object.keys(outfitData);

export default function AiTryOnSection() {
  const { user } = useAuth();
  
  const [isHovering, setIsHovering] = useState(false);
  const [selectedOccasion, setSelectedOccasion] = useState(occasions[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [outfitsWithProducts, setOutfitsWithProducts] = useState([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [error, setError] = useState(null);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [currentFile, setCurrentFile] = useState(null);
  const fileInputRef = useRef(null);

  // Upload image to Cloudinary after recommendation
  const uploadToCloudinary = async (file, occasion) => {
    if (!user) return null;
    
    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
      
      if (!cloudName || !uploadPreset) {
        console.warn('Cloudinary credentials not configured in .env');
        return null;
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', `user-recommendations/${user.uid}/${new Date().toISOString().split('T')[0]}`);
      formData.append('public_id', `${occasion.replace(/\s+/g, '_')}_${Date.now()}`);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.secure_url;
      }
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
    }
    return null;
  };

  const handleSaveToCloud = async () => {
    if (!currentFile) return;
    
    setIsSavingToCloud(true);
    try {
      const cloudinaryUrl = await uploadToCloudinary(currentFile, selectedOccasion);
      if (cloudinaryUrl) {
        setError(null);
        setShowSavePrompt(false);
        console.log('Image saved to Cloudinary:', cloudinaryUrl);
      }
    } catch (err) {
      setError('Failed to save image to cloud');
    } finally {
      setIsSavingToCloud(false);
    }
  };

  const handleImageUpload = async (file) => {
    if (!file) return;

    // Check if user is logged in
    if (!user) {
      setError('Please login to use AI Try-On feature');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setError('Please upload a valid image (PNG, JPG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImage(e.target.result);
    };
    reader.readAsDataURL(file);

    setIsLoading(true);
    setError(null);
    setAiResult(null);
    setShowSavePrompt(false);
    setCurrentFile(file);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('occasion', selectedOccasion);

      const response = await fetch('https://codesrhereaman-recommendai.hf.space/recommend', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const data = await response.json();
      setAiResult(data);
      findProductsForOutfits(data);
      setShowSavePrompt(true);
    } catch (err) {
      setError(err.message || 'Error: Failed to process image');
      setUploadedImage(null);
    } finally {
      setIsLoading(false);
    }
  };

  const findProductsForOutfits = (aiData) => {
    const outfitsWithProds = aiData.outfits?.map((outfit) => {
      const outfitItems = {};

      outfit.forEach(item => {
        const [category, ...colorParts] = item.split('+');
        const color = colorParts.join('+').trim();
        outfitItems[category.toLowerCase().trim()] = color;
      });

      const products = {
        top: findBestProduct('top', outfitItems.top),
        bottom: findBestProduct('bottom', outfitItems.bottom),
        shoes: findBestProduct('shoes', outfitItems.shoes),
        jacket: findBestProduct('jacket', outfitItems.jacket),
      };

      return { items: outfitItems, products };
    }) || [];

    setOutfitsWithProducts(outfitsWithProds);
    setCurrentOutfitIndex(0);
  };

  const findBestProduct = (type, colorHint) => {
    // First try to find by type field
    let filtered = RENTAL_ITEMS.filter(p => p.type === type);

    // If no exact type match, fallback to keyword search
    if (filtered.length === 0) {
      switch (type) {
        case 'top':
          filtered = RENTAL_ITEMS.filter(p => 
            p.name.toLowerCase().includes('blouse') ||
            p.name.toLowerCase().includes('shirt') ||
            p.name.toLowerCase().includes('top') ||
            p.name.toLowerCase().includes('kurti') ||
            p.name.toLowerCase().includes('sweatshirt') ||
            p.name.toLowerCase().includes('dress') ||
            p.name.toLowerCase().includes('t-shirt') ||
            p.name.toLowerCase().includes('sweater')
          );
          break;
        case 'bottom':
          filtered = RENTAL_ITEMS.filter(p => 
            p.name.toLowerCase().includes('jeans') ||
            p.name.toLowerCase().includes('pants') ||
            p.name.toLowerCase().includes('skirt') ||
            p.name.toLowerCase().includes('shorts') ||
            p.name.toLowerCase().includes('trousers') ||
            p.name.toLowerCase().includes('leggings') ||
            p.name.toLowerCase().includes('saree')
          );
          break;
        case 'shoes':
          filtered = RENTAL_ITEMS.filter(p => 
            p.name.toLowerCase().includes('shoes') ||
            p.name.toLowerCase().includes('heels') ||
            p.name.toLowerCase().includes('pumps') ||
            p.name.toLowerCase().includes('sandal') ||
            p.name.toLowerCase().includes('boots') ||
            p.name.toLowerCase().includes('sneaker') ||
            p.name.toLowerCase().includes('flats')
          );
          break;
        case 'jacket':
          filtered = RENTAL_ITEMS.filter(p => 
            p.name.toLowerCase().includes('jacket') ||
            p.name.toLowerCase().includes('blazer') ||
            p.name.toLowerCase().includes('coat') ||
            p.name.toLowerCase().includes('sherwani') ||
            p.name.toLowerCase().includes('cardigan')
          );
          break;
        default:
          filtered = RENTAL_ITEMS;
      }
    }

    // If still no results, get any items of that type
    if (filtered.length === 0) {
      filtered = RENTAL_ITEMS.filter(p => p.inStock).slice(0, 5);
    }

    // Try to match color if hint is provided
    if (colorHint && colorHint.length > 0) {
      const colorLower = colorHint.toLowerCase().trim();
      
      // Extract main color word (e.g., "Dark Brown" -> "Brown", "Tan Boots" -> "Tan")
      const colorWords = colorLower.split(/\s+/);
      const mainColor = colorWords[0]; // Get first word as main color
      const lastWord = colorWords[colorWords.length - 1]; // Get last word
      
      // Try exact color match first
      const exactColorMatch = filtered.filter(p => 
        p.color && p.color.toLowerCase() === colorLower
      );
      if (exactColorMatch.length > 0) {
        filtered = exactColorMatch;
        console.log(`✓ Found exact color match: ${colorLower}`);
      } else {
        // Try partial color match with main color or any word in the hint
        const partialColorMatch = filtered.filter(p => 
          p.color && (
            p.color.toLowerCase().includes(colorLower) ||
            colorLower.includes(p.color.toLowerCase()) ||
            p.color.toLowerCase().includes(mainColor) ||
            p.color.toLowerCase().includes(lastWord) ||
            mainColor.includes(p.color.toLowerCase())
          )
        );
        if (partialColorMatch.length > 0) {
          filtered = partialColorMatch;
          console.log(`✓ Found partial color match for: ${colorLower}`);
        } else {
          console.warn(`⚠ No color match found for: ${colorLower} in type: ${type}`);
        }
      }
    }

    // Return best product by rating, filtered by stock
    const inStockProducts = filtered.filter(p => p.inStock);
    if (inStockProducts.length > 0) {
      const best = inStockProducts.sort((a, b) => b.rating - a.rating)[0];
      console.log(`→ Selected: ${best.name} (${best.color}) for ${type}+${colorHint}`);
      return best;
    }
    
    // Fallback to any available product
    const fallback = filtered.sort((a, b) => b.rating - a.rating)[0] || RENTAL_ITEMS[0];
    console.warn(`⚠ Using fallback: ${fallback.name} for ${type}+${colorHint}`);
    return fallback;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageUpload(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsHovering(true);
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const resetUpload = () => {
    setUploadedImage(null);
    setAiResult(null);
    setOutfitsWithProducts([]);
    setCurrentOutfitIndex(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section
      className="tryon-section py-10 lg:py-20 relative overflow-hidden"
      style={{ background: 'linear-gradient(145deg, #faf8ff 0%, #f3effe 45%, #fdf0f8 100%)' }}
    >
      {/* Background mesh glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-18%] left-[-8%] w-[52%] h-[52%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(167,139,250,0.35) 0%, rgba(139,92,246,0.15) 50%, transparent 75%)', filter: 'blur(72px)' }}
        />
        <div
          className="absolute bottom-[-18%] right-[-8%] w-[44%] h-[44%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(249,168,212,0.35) 0%, rgba(236,72,153,0.15) 50%, transparent 75%)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute top-[35%] right-[20%] w-[25%] h-[25%] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.2) 0%, transparent 70%)', filter: 'blur(50px)' }}
        />
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-[0.018]"
          style={{
            backgroundImage: 'radial-gradient(circle, #7c3aed 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
        />
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <FadeIn className="text-center mb-6 lg:mb-10">
          {/* Eyebrow badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{
              background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(236,72,153,0.1))',
              border: '1px solid rgba(124,58,237,0.2)',
              color: '#7c3aed',
              letterSpacing: '0.14em'
            }}
          >
            <Sparkles className="w-3 h-3" />
            Powered by AI
          </div>

          <h2
            className="tryon-heading section-title text-3xl md:text-5xl lg:text-7xl font-black text-slate-900 mb-3 md:mb-5"
            style={{ letterSpacing: '-0.03em', lineHeight: 1.05 }}
          >
            Virtual{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #6d28d9 0%, #9333ea 45%, #ec4899 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Try-On
            </span>
          </h2>
          <p
            className="tryon-subtext text-sm md:text-xl text-slate-500 font-normal max-w-xl mx-auto"
            style={{ lineHeight: 1.75 }}
          >
            Upload your photo, select an occasion, and let our AI generate your perfect outfit instantly.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-start">

          {/* Left Side: Upload Interface & Results */}
          <FadeIn delay={0.2}>
            <div className="space-y-5">
              {/* Upload Card */}
              <div
                className="tryon-upload-card relative overflow-hidden group"
                style={{
                  background: 'rgba(255,255,255,0.82)',
                  backdropFilter: 'blur(28px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.92)',
                  borderRadius: '28px',
                  padding: '28px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02), 0 12px 40px rgba(124,58,237,0.08), 0 0 0 1px rgba(124,58,237,0.04)'
                }}
              >
                {/* Corner glow accent */}
                <div
                  className="absolute top-0 right-0 w-48 h-48 pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at top right, rgba(167,139,250,0.18), rgba(244,114,182,0.1) 55%, transparent 75%)',
                    borderRadius: '0 28px 0 100%'
                  }}
                />

                <h3
                  className="tryon-step-title font-bold text-slate-900 mb-5 flex items-center gap-3"
                  style={{ fontSize: '1.05rem' }}
                >
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-black flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                      boxShadow: '0 3px 10px rgba(124,58,237,0.4)'
                    }}
                  >
                    1
                  </span>
                  <span>Select Occasion</span>
                </h3>

                <div className="tryon-occasions flex flex-wrap gap-2 mb-6">
                  {occasions.map(occ => (
                    <button
                      key={occ}
                      onClick={() => { setSelectedOccasion(occ); resetUpload(); }}
                      className="tryon-occasion-btn text-sm font-semibold transition-all duration-200"
                      style={selectedOccasion === occ
                        ? {
                          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                          color: 'white',
                          border: '1px solid transparent',
                          borderRadius: '100px',
                          padding: '7px 16px',
                          boxShadow: '0 4px 14px rgba(124,58,237,0.32)',
                          transform: 'translateY(-1px)'
                        }
                        : {
                          background: 'rgba(250,249,255,0.9)',
                          color: '#64748b',
                          border: '1px solid rgba(226,232,240,0.9)',
                          borderRadius: '100px',
                          padding: '7px 16px'
                        }
                      }
                    >
                      {occ}
                    </button>
                  ))}
                </div>

                <h3
                  className="tryon-step-title font-bold text-slate-900 mb-4 flex items-center gap-3"
                  style={{ fontSize: '1.05rem' }}
                >
                  <span
                    className="flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-black flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #ec4899, #f43f5e)',
                      boxShadow: '0 3px 10px rgba(236,72,153,0.4)'
                    }}
                  >
                    2
                  </span>
                  <span>Upload Your Photo</span>
                </h3>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div
                  className="tryon-drop-zone relative w-full rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden"
                  style={{
                    height: uploadedImage ? '400px' : '192px',
                    border: `2px dashed ${isHovering || isLoading ? '#8b5cf6' : uploadedImage ? '#22c55e' : '#ddd6fe'}`,
                    background: isHovering || isLoading
                      ? 'rgba(139,92,246,0.05)'
                      : uploadedImage
                        ? 'rgba(34,197,94,0.04)'
                        : 'rgba(250,248,255,0.7)',
                    transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)'
                  }}
                  onMouseEnter={() => !isLoading && !uploadedImage && setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={!isLoading && !uploadedImage ? handleCameraClick : undefined}
                >
                  {!isLoading && !uploadedImage && (
                    <div
                      className="flex flex-col items-center text-center p-6 z-10"
                      style={{ transform: isHovering ? 'translateY(-4px)' : 'none', transition: 'transform 0.25s ease' }}
                    >
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all duration-300"
                        style={{
                          background: isHovering
                            ? 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.1))'
                            : 'rgba(255,255,255,0.95)',
                          boxShadow: isHovering
                            ? '0 8px 24px rgba(139,92,246,0.22)'
                            : '0 2px 10px rgba(0,0,0,0.06)',
                          border: '1px solid rgba(221,214,254,0.7)',
                          color: isHovering ? '#7c3aed' : '#a78bfa'
                        }}
                      >
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="tryon-drop-text-primary text-slate-700 font-semibold text-base mb-1">Click to Upload Image</p>
                      <p className="tryon-drop-text-secondary text-slate-400 text-xs">PNG, JPG up to 10MB</p>
                    </div>
                  )}

                  {isLoading && (
                    <div className="flex flex-col items-center text-center z-10">
                      <div className="relative mb-3">
                        <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#7c3aed' }} />
                        <div
                          className="absolute inset-0 rounded-full"
                          style={{ background: 'radial-gradient(circle, rgba(139,92,246,0.2), transparent)', filter: 'blur(8px)' }}
                        />
                      </div>
                      <p className="font-bold text-base" style={{ color: '#6d28d9' }}>AI is styling you…</p>
                      <p className="text-slate-400 text-xs mt-1">Analyzing for {selectedOccasion}</p>
                    </div>
                  )}

                  {uploadedImage && !isLoading && (
                    <div className="absolute inset-0">
                      <img src={uploadedImage} className="w-full h-full object-contain" alt="Uploaded" />
                      <div
                        className="absolute inset-0 flex flex-col justify-end p-4"
                        style={{ background: 'linear-gradient(to top, rgba(15,5,40,0.72) 0%, transparent 55%)' }}
                      >
                        <span
                          className="inline-flex items-center gap-1.5 self-start py-1 px-2.5 text-white rounded-full text-xs font-bold"
                          style={{ background: 'rgba(34,197,94,0.92)', backdropFilter: 'blur(8px)' }}
                        >
                          <Sparkles className="w-3 h-3" /> Image Uploaded
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <div
                    className="mt-4 p-3 rounded-xl text-sm flex items-center justify-between"
                    style={{
                      background: 'rgba(254,242,242,0.9)',
                      border: '1px solid rgba(252,165,165,0.5)',
                      color: '#dc2626'
                    }}
                  >
                    <span>{error}</span>
                    <button onClick={resetUpload}><X className="w-4 h-4" /></button>
                  </div>
                )}
              </div>

              {/* AI Result Display & Save Prompt */}
              {aiResult && uploadedImage && (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.82)',
                    backdropFilter: 'blur(28px) saturate(180%)',
                    border: '1px solid rgba(255,255,255,0.92)',
                    borderRadius: '28px',
                    padding: '24px 28px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02), 0 12px 40px rgba(124,58,237,0.08)'
                  }}
                >
                  {/* AI Results Header */}
                  <div className="flex items-center justify-between mb-5">
                    <h3
                      className="font-bold text-slate-900 flex items-center gap-2.5"
                      style={{ fontSize: '1.1rem' }}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                          boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
                        }}
                      >
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                      AI Analysis
                    </h3>
                    <button
                      onClick={resetUpload}
                      className="p-2 rounded-xl transition"
                      style={{ background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(226,232,240,0.7)' }}
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>

                  {/* Main Results Grid - Body, Skin, Undertone */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    <div
                      className="p-4 rounded-2xl"
                      style={{
                        background: 'linear-gradient(145deg, rgba(237,233,254,0.8), rgba(221,214,254,0.5))',
                        border: '1px solid rgba(196,181,253,0.3)'
                      }}
                    >
                      <p className="font-bold uppercase text-purple-600" style={{ fontSize: '0.6rem', letterSpacing: '0.12em' }}>Body Shape</p>
                      <p className="text-base font-black text-slate-900 mt-1">{aiResult.body_shape}</p>
                    </div>
                    <div
                      className="p-4 rounded-2xl"
                      style={{
                        background: 'linear-gradient(145deg, rgba(255,251,235,0.8), rgba(254,243,199,0.5))',
                        border: '1px solid rgba(252,211,77,0.3)'
                      }}
                    >
                      <p className="font-bold uppercase text-amber-600" style={{ fontSize: '0.6rem', letterSpacing: '0.12em' }}>Skin Tone</p>
                      <p className="text-base font-black text-slate-900 mt-1">{aiResult.skin_tone}</p>
                    </div>
                    <div
                      className="p-4 rounded-2xl"
                      style={{
                        background: 'linear-gradient(145deg, rgba(253,242,248,0.8), rgba(252,231,243,0.5))',
                        border: '1px solid rgba(249,168,212,0.3)'
                      }}
                    >
                      <p className="font-bold uppercase text-pink-600" style={{ fontSize: '0.6rem', letterSpacing: '0.12em' }}>Undertone</p>
                      <p className="text-base font-black text-slate-900 mt-1">{aiResult.undertone}</p>
                    </div>
                  </div>

                  {/* Additional Recommendations - if available */}
                  {aiResult.recommendations && aiResult.recommendations.length > 0 && (
                    <div className="mb-5">
                      <p className="font-bold text-slate-900 text-sm mb-3" style={{ fontSize: '0.9rem' }}>Style Recommendations</p>
                      <div className="flex flex-wrap gap-2">
                        {aiResult.recommendations.map((rec, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 rounded-full text-xs font-semibold"
                            style={{
                              background: 'rgba(124,58,237,0.1)',
                              color: '#7c3aed',
                              border: '1px solid rgba(124,58,237,0.2)'
                            }}
                          >
                            {rec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Color Suggestions - if available */}
                  {aiResult.color_suggestions && aiResult.color_suggestions.length > 0 && (
                    <div className="mb-5">
                      <p className="font-bold text-slate-900 text-sm mb-3" style={{ fontSize: '0.9rem' }}>Best Colors for You</p>
                      <div className="flex flex-wrap gap-2">
                        {aiResult.color_suggestions.map((color, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
                            style={{
                              background: 'rgba(250,248,255,0.9)',
                              border: '1px solid rgba(226,232,240,0.6)'
                            }}
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ background: color }}
                            />
                            {color}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full API Response Data */}
                  <div className="mb-5">
                    <details className="group">
                      <summary 
                        className="cursor-pointer font-bold text-slate-900 text-sm mb-3 flex items-center gap-2 list-none"
                        style={{ fontSize: '0.9rem' }}
                      >
                        <span 
                          style={{ color: '#7c3aed' }}
                          className="inline-block transition-transform group-open:rotate-90"
                        >
                          ▶
                        </span>
                        Full AI Analysis Data
                      </summary>
                      <div
                        className="mt-3 p-3 rounded-lg text-xs font-mono overflow-auto max-h-48"
                        style={{
                          background: 'rgba(15,23,42,0.9)',
                          color: '#e2e8f0',
                          border: '1px solid rgba(148,163,184,0.2)',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}
                      >
                        {JSON.stringify(aiResult, null, 2)}
                      </div>
                    </details>
                  </div>

                  {/* Save to Cloud Prompt - Smaller at bottom */}
                  {showSavePrompt && (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(236,72,153,0.05))',
                        border: '1px solid rgba(124,58,237,0.2)',
                        borderRadius: '16px',
                        padding: '14px 16px',
                        marginTop: '16px'
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-semibold text-slate-900 text-sm">
                            Save this photo?
                          </p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            Store for future recommendations
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={handleSaveToCloud}
                            disabled={isSavingToCloud}
                            className="px-4 py-2 rounded-lg font-semibold text-white text-xs transition-all duration-200 disabled:opacity-60 flex items-center gap-1.5 whitespace-nowrap"
                            style={{
                              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                              boxShadow: '0 2px 8px rgba(124,58,237,0.2)'
                            }}
                          >
                            {isSavingToCloud ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Saving
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3" />
                                Save
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => setShowSavePrompt(false)}
                            className="px-4 py-2 rounded-lg font-semibold text-xs transition-all duration-200 whitespace-nowrap"
                            style={{
                              background: 'rgba(248,250,252,0.9)',
                              border: '1px solid rgba(226,232,240,0.7)',
                              color: '#64748b'
                            }}
                          >
                            Skip
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </FadeIn>

          {/* Right Side: Outfit Carousel with Product Cards */}
          <FadeIn delay={0.4} className="w-full">
            {uploadedImage && aiResult && outfitsWithProducts.length > 0 && (
              <div
                className="w-full lg:static overflow-hidden flex flex-col"
                style={{
                  background: 'rgba(255,255,255,0.92)',
                  backdropFilter: 'blur(32px) saturate(200%)',
                  border: '1px solid rgba(255,255,255,0.96)',
                  borderRadius: '28px',
                  padding: '28px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 24px 60px rgba(124,58,237,0.14), 0 0 0 1px rgba(124,58,237,0.05)',
                  minHeight: '500px',
                  maxHeight: '850px'
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                  <h3
                    className="font-bold text-slate-900 flex items-center gap-2.5"
                    style={{ fontSize: '1.2rem' }}
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                        boxShadow: '0 4px 14px rgba(124,58,237,0.35)'
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    Complete Outfits
                  </h3>
                  <button
                    onClick={resetUpload}
                    className="p-2 rounded-xl transition"
                    style={{ background: 'rgba(248,250,252,0.9)', border: '1px solid rgba(226,232,240,0.7)' }}
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>

                {/* Carousel */}
                <div className="flex-1 overflow-hidden">
                  <div className="h-full flex flex-col">
                    {/* Outfit Counter */}
                    <div
                      className="text-center font-bold mb-4 uppercase"
                      style={{ color: '#94a3b8', fontSize: '0.7rem', letterSpacing: '0.14em' }}
                    >
                      Outfit {currentOutfitIndex + 1} of {outfitsWithProducts.length}
                    </div>

                    {/* Product Grid */}
                    <div className="flex-1 grid grid-cols-2 gap-3 mb-5 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
                      {outfitsWithProducts[currentOutfitIndex]?.products && (
                        <>
                          {outfitsWithProducts[currentOutfitIndex].products.top && (
                            <ProductCard
                              product={outfitsWithProducts[currentOutfitIndex].products.top}
                              label="TOP"
                              color={outfitsWithProducts[currentOutfitIndex].items.top}
                            />
                          )}
                          {outfitsWithProducts[currentOutfitIndex].products.bottom && (
                            <ProductCard
                              product={outfitsWithProducts[currentOutfitIndex].products.bottom}
                              label="BOTTOM"
                              color={outfitsWithProducts[currentOutfitIndex].items.bottom}
                            />
                          )}
                          {outfitsWithProducts[currentOutfitIndex].products.shoes && (
                            <ProductCard
                              product={outfitsWithProducts[currentOutfitIndex].products.shoes}
                              label="SHOES"
                              color={outfitsWithProducts[currentOutfitIndex].items.shoes}
                            />
                          )}
                          {outfitsWithProducts[currentOutfitIndex].products.jacket && (
                            <ProductCard
                              product={outfitsWithProducts[currentOutfitIndex].products.jacket}
                              label="JACKET"
                              color={outfitsWithProducts[currentOutfitIndex].items.jacket}
                            />
                          )}
                        </>
                      )}
                    </div>

                    {/* Navigation */}
                    <div
                      className="flex items-center justify-between pt-4"
                      style={{ borderTop: '1px solid rgba(226,232,240,0.6)' }}
                    >
                       <button
                         onClick={() => setCurrentOutfitIndex(prev => Math.max(0, prev - 1))}
                         disabled={currentOutfitIndex === 0}
                         className="p-2.5 rounded-xl transition-all duration-200 hover:shadow-md active:scale-95"
                         style={{
                           background: currentOutfitIndex === 0 
                             ? 'rgba(248,250,252,0.6)' 
                             : 'rgba(248,250,252,0.95)',
                           border: '1px solid rgba(226,232,240,0.7)',
                           color: currentOutfitIndex === 0 ? '#cbd5e1' : '#64748b',
                           cursor: currentOutfitIndex === 0 ? 'not-allowed' : 'pointer',
                           opacity: 1
                         }}
                       >
                         <ChevronLeft className="w-5 h-5" />
                       </button>

                       <div className="flex gap-2 items-center">
                         {outfitsWithProducts.map((_, idx) => (
                           <button
                             key={idx}
                             onClick={() => setCurrentOutfitIndex(idx)}
                             className="rounded-full transition-all duration-300 hover:opacity-100"
                             style={{
                               height: '8px',
                               width: idx === currentOutfitIndex ? '24px' : '8px',
                               background: idx === currentOutfitIndex
                                 ? 'linear-gradient(135deg, #7c3aed, #ec4899)'
                                 : 'rgba(203,213,225,0.7)',
                               boxShadow: idx === currentOutfitIndex ? '0 2px 8px rgba(124,58,237,0.4)' : '0 1px 3px rgba(0,0,0,0.08)',
                               cursor: 'pointer',
                               opacity: 1
                             }}
                           />
                         ))}
                       </div>

                       <button
                         onClick={() => setCurrentOutfitIndex(prev => Math.min(outfitsWithProducts.length - 1, prev + 1))}
                         disabled={currentOutfitIndex === outfitsWithProducts.length - 1}
                         className="p-2.5 rounded-xl transition-all duration-200 hover:shadow-lg active:scale-95"
                         style={{
                           background: currentOutfitIndex === outfitsWithProducts.length - 1
                             ? 'linear-gradient(135deg, #a855f7, #d946ef)'
                             : 'linear-gradient(135deg, #7c3aed, #ec4899)',
                           boxShadow: currentOutfitIndex === outfitsWithProducts.length - 1
                             ? '0 2px 8px rgba(124,58,237,0.2)'
                             : '0 4px 14px rgba(124,58,237,0.38)',
                           color: 'white',
                           cursor: currentOutfitIndex === outfitsWithProducts.length - 1 ? 'not-allowed' : 'pointer',
                           opacity: 1
                         }}
                       >
                         <ChevronRight className="w-5 h-5" />
                       </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Empty State */}
            {!uploadedImage && (
              <div
                className="text-center flex flex-col items-center justify-center"
                style={{
                  background: 'rgba(255,255,255,0.78)',
                  backdropFilter: 'blur(24px) saturate(180%)',
                  border: '1px solid rgba(255,255,255,0.88)',
                  borderRadius: '28px',
                  padding: '56px 48px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02), 0 12px 40px rgba(124,58,237,0.06)'
                }}
              >
                <div
                  className="w-20 h-20 mx-auto mb-6 rounded-3xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(145deg, rgba(237,233,254,0.9), rgba(252,231,243,0.9))',
                    boxShadow: '0 8px 28px rgba(124,58,237,0.16)',
                    border: '1px solid rgba(196,181,253,0.35)'
                  }}
                >
                  <Camera className="w-9 h-9" style={{ color: '#7c3aed' }} />
                </div>
                <h4 className="text-xl font-black text-slate-900 mb-2" style={{ letterSpacing: '-0.02em' }}>No Upload Yet</h4>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                  Upload a photo to see AI-recommended complete outfits
                </p>
                <div className="flex gap-2 mt-7">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="rounded-full"
                      style={{
                        width: i === 1 ? '20px' : '6px',
                        height: '6px',
                        background: i === 1 ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'rgba(203,213,225,0.7)'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </FadeIn>

        </div>
      </div>
    </section>
  );
}

// Product Card Component
function ProductCard({ product, label, color }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  if (!product) return null;

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    setIsAddingToCart(true);
    try {
      await addToCart(product, 3);
      toast.success('Added to cart!');
    } catch (err) {
      toast.error('Failed to add item to cart');
      console.error(err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    setIsTogglingWishlist(true);
    try {
      await toggleWishlist(product);
      if (isInWishlist(product.id)) {
        toast.success('Removed from wishlist');
      } else {
        toast.success('Added to wishlist!');
      }
    } catch (err) {
      toast.error('Failed to update wishlist');
      console.error(err);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  const handleViewDetails = (e) => {
    e.stopPropagation();
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      className="overflow-hidden flex flex-col transition-all duration-200 hover:-translate-y-0.5 cursor-pointer group"
      style={{
        background: 'rgba(255,255,255,0.95)',
        border: '1px solid rgba(226,232,240,0.7)',
        borderRadius: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(124,58,237,0.03)'
      }}
      onClick={handleViewDetails}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 8px 24px rgba(124,58,237,0.12), 0 0 0 1px rgba(124,58,237,0.06)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(124,58,237,0.03)'}
    >
      {/* Image — takes up most of the card */}
      <div className="relative overflow-hidden flex-1" style={{ minHeight: '200px', background: '#f8f7ff' }}>
        <img
          src={product.image || product.images?.[0]?.url}
          alt={product.name}
          className="w-full h-full object-cover absolute inset-0 transition-transform duration-500"
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        />

        {/* Label badge overlaid on top of image */}
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-between px-3 py-2"
          style={{
            background: 'linear-gradient(to bottom, rgba(15,5,40,0.55) 0%, transparent 100%)'
          }}
        >
          <span
            className="font-black text-white"
            style={{ fontSize: '0.62rem', letterSpacing: '0.14em' }}
          >
            {label}
          </span>
          {color && (
            <span
              className="font-semibold px-2 py-0.5 rounded-full"
              style={{
                fontSize: '0.6rem',
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(6px)',
                color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              {color}
            </span>
          )}
        </div>

        {/* Heart button */}
        <button
          onClick={handleToggleWishlist}
          disabled={isTogglingWishlist}
          className="absolute top-2 right-2 transition-all duration-200 disabled:opacity-60"
          style={{
            background: 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(226,232,240,0.6)',
            borderRadius: '10px',
            padding: '6px'
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,241,242,0.95)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.92)'}
        >
          <Heart 
            className={`w-3.5 h-3.5 transition-colors ${
              isInWishlist(product.id) 
                ? 'fill-red-500 text-red-500' 
                : 'text-slate-400 hover:text-red-500'
            }`} 
          />
        </button>

        {/* Bottom gradient overlay with price + rating */}
        <div
          className="absolute bottom-0 left-0 right-0 px-3 pt-8 pb-3"
          style={{
            background: 'linear-gradient(to top, rgba(10,4,30,0.82) 0%, rgba(10,4,30,0.4) 60%, transparent 100%)'
          }}
        >
          <h4 className="text-white font-bold text-sm line-clamp-1 mb-1" style={{ lineHeight: 1.3 }}>
            {product.name}
          </h4>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <div className="flex" style={{ color: '#fbbf24' }}>
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-2.5 h-2.5 ${i < Math.floor(product.rating) ? 'fill-current' : ''}`}
                  />
                ))}
              </div>
              <span className="text-white/60" style={{ fontSize: '0.6rem' }}>({product.reviews})</span>
            </div>
            <div className="text-right">
              <p className="text-white font-black" style={{ fontSize: '0.95rem', letterSpacing: '-0.02em' }}>
                ₹{product.rentalPrice}
              </p>
              <p className="text-white/50 line-through" style={{ fontSize: '0.62rem' }}>₹{product.originalPrice}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Add to Cart — slim footer */}
      <button
        onClick={handleAddToCart}
        disabled={isAddingToCart}
        className="flex items-center justify-center gap-1.5 w-full py-2.5 text-white font-bold transition-all duration-200 disabled:opacity-60"
        style={{
          background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
          fontSize: '0.8rem',
          flexShrink: 0,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)'
        }}
        onMouseEnter={e => !isAddingToCart && (e.currentTarget.style.filter = 'brightness(1.08)')}
        onMouseLeave={e => e.currentTarget.style.filter = 'brightness(1)'}
      >
        <ShoppingCart className="w-3.5 h-3.5" />
        {isAddingToCart ? 'Adding...' : 'Add to Cart'}
      </button>
    </div>
  );
}