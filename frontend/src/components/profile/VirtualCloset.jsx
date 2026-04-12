import { useState, useRef, useEffect } from 'react';
import { Camera, Plus, Sparkles, FolderHeart, X, Loader } from 'lucide-react';
import GSAPReveal from '../animations/GSAPReveal';
import GSAPTabTransition from '../animations/GSAPTabTransition';
import virtualClosetApi from '../../services/virtualClosetApi';

export default function VirtualCloset() {
  const [activeTab, setActiveTab] = useState('all');
  const [savedLooks, setSavedLooks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // ─── Load saved looks on mount ────────────────────────────────────────────────
  useEffect(() => {
    loadVirtualCloset();
  }, []);

  // Load looks from backend
  const loadVirtualCloset = async () => {
    try {
      setIsLoadingData(true);
      setError(null);
      console.log('🔄 Loading Virtual Closet...');
      const looks = await virtualClosetApi.getVirtualCloset({ limit: 50, sort: 'newest' });
      console.log('✅ Loaded looks:', looks);
      setSavedLooks(looks || []);
    } catch (err) {
      console.error('❌ Error loading virtual closet:', err);
      setError('Failed to load your closet. Please log in and try again.');
      // Fall back to empty state
      setSavedLooks([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  // ─── Handle file upload to backend ────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      alert('Please upload a valid image (JPG, PNG, or WebP)');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Upload to backend
      const newLook = await virtualClosetApi.uploadLook(file, {
        occasion: 'New Upload',
        tags: ['Your Style', '✨'],
      });

      // Add to local state
      setSavedLooks((prev) => [newLook, ...prev]);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload image');
      alert(`Upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // ─── Delete uploaded image ────────────────────────────────────────────────────
  const handleDeleteLook = async (id) => {
    if (!window.confirm('Are you sure you want to delete this look?')) return;

    try {
      setError(null);
      await virtualClosetApi.deleteLook(id);
      setSavedLooks((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error('Delete error:', err);
      setError('Failed to delete look');
      alert(`Delete failed: ${err.message || 'Unknown error'}`);
    }
  };

  // ─── Filter items by tab ──────────────────────────────────────────────────────
  const filteredItems = savedLooks.filter(
    (item) => activeTab === 'all' || item.occasion === activeTab
  );

  return (
    <div className="bg-white rounded-[32px] p-1 md:p-2">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileUpload}
        className="hidden"
        aria-label="Upload image"
      />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-3">
            <FolderHeart className="w-8 h-8 text-pink-500" /> My Virtual Closet
          </h2>
          <p className="text-gray-500 mt-2 font-medium">Your saved AI styling generations and upcoming events.</p>
        </div>
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-70 text-white px-5 py-2.5 rounded-lg transition-all font-bold flex items-center gap-2 shadow-md shadow-purple-200 active:scale-95"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" /> New AI Try-On
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Loading State */}
      {isLoadingData ? (
        <div className="flex flex-col items-center justify-center h-96">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mb-4" />
          <p className="text-gray-600 font-medium">Loading your closet...</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-4 border-b border-gray-100 pb-4 mb-8 overflow-x-auto hide-scrollbar">
            {['all', 'Summer Getaway', 'Corporate Gala', 'Date Night'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-full font-bold whitespace-nowrap transition-all ${activeTab === tab ? 'bg-purple-100 text-purple-700' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
              >
                {tab === 'all' ? 'All Saved Looks' : tab}
              </button>
            ))}
          </div>

          {/* Gallery Grid */}
          <GSAPTabTransition activeTab={activeTab}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <GSAPReveal direction="up" stagger={0.1} className="contents">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="group relative h-[24rem] rounded-3xl overflow-hidden cursor-pointer shadow-md hover:shadow-2xl transition-all animate-in fade-in duration-500"
                    >
                      <img 
                        src={item.image?.secure_url || item.image} 
                        alt={item.occasion} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                      {/* AI Matched Badge */}
                      {item.isAIMatched && (
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md rounded-full px-3 py-1 font-bold text-xs text-white border border-white/30 flex items-center gap-1 shadow-lg">
                          <Sparkles className="w-3 h-3 text-yellow-300" /> AI Matched
                        </div>
                      )}

                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLook(item.id);
                        }}
                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 bg-red-500/80 hover:bg-red-600 backdrop-blur-md rounded-full p-2 text-white transition-all transform hover:scale-110 shadow-lg"
                        aria-label="Delete look"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        <span className="text-gray-300 text-xs font-bold uppercase tracking-wider mb-2 block">
                          {new Date(item.createdAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <h3 className="text-xl font-bold text-white leading-tight mb-3">{item.occasion}</h3>
                        <div className="flex gap-2 flex-wrap">
                          {item.tags?.map(tag => (
                            <span key={tag} className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-xs text-white font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="h-[24rem] w-full rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-colors group"
                    >
                      <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-gray-400 group-hover:text-purple-600 group-hover:scale-110 transition-all mb-4">
                        <Camera className="w-8 h-8" />
                      </div>
                      <p className="font-bold text-gray-700 group-hover:text-purple-700">Add Your First Photo</p>
                      <p className="text-sm text-gray-400 mt-1 px-8 text-center">Upload a selfie to get started</p>
                    </button>
                  </div>
                )}
              </GSAPReveal>

              {/* Empty Dropzone Card - Only show if has looks but slot available */}
              {filteredItems.length > 0 && filteredItems.length < 4 && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="h-[24rem] rounded-3xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-purple-50 hover:border-purple-300 hover:text-purple-600 transition-colors group"
                >
                  <div className="w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center text-gray-400 group-hover:text-purple-600 group-hover:scale-110 transition-all mb-4">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-gray-700 group-hover:text-purple-700">Add More</p>
                  <p className="text-sm text-gray-400 mt-1 px-8 text-center">Upload another look</p>
                </button>
              )}
            </div>
          </GSAPTabTransition>
        </>
      )}
    </div>
  );
}
