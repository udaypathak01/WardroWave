import { ShoppingCart, Heart, Search, Menu, X, User, LogOut, Clock, TrendingUp, Tag, ChevronRight, Package, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useWishlist } from '../../context api/WishlistContext';
import { useCart } from '../../context api/CartContext';
import { useAuth } from '../../context api/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import { RENTAL_ITEMS } from '../../data/productsData';

// Mock Search Data
const RECENT_SEARCHES = ['Wedding Lehenga', 'Tuxedo', 'Saree'];
const TRENDING_ITEMS = ['Manish Malhotra Red Lehenga', 'Armani Navy Suit', 'Sabyasachi Floral Modal'];
const CATEGORIES = ['Lehenga', 'Suit', 'Western Wear', 'Accessories'];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  
  const searchRef = useRef(null);
  const drawerRef = useRef(null);

  const { wishlistCount } = useWishlist();
  const { cartCount } = useCart();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Handle glass header scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Debounced intelligent search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const uniqueSuggestions = new Set();
        
        RENTAL_ITEMS.forEach(item => {
          if (item.name.toLowerCase().includes(query)) uniqueSuggestions.add(item.name);
          if (item.category.toLowerCase().includes(query)) {
            uniqueSuggestions.add(`${item.category.charAt(0).toUpperCase()}${item.category.slice(1)}`);
          }
        });

        setSuggestions(Array.from(uniqueSuggestions).slice(0, 8));
      } else {
        setSuggestions([]);
      }
    }, 250); // Fast 250ms debounce
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle global click outside to close dropdowns and drawers
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Close Desktop Search Dropdown
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchFocused(false);
      }
      // Close Mobile Drawer
      if (isOpen && drawerRef.current && !drawerRef.current.contains(e.target)) {
        // Only if they didn't click the hamburger icon itself (handled by its onClick)
        if (!e.target.closest('.hamburger-btn')) {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Lock body scroll when mobile drawer or search is open
  useEffect(() => {
    if (isOpen || isMobileSearchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen, isMobileSearchOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsOpen(false);
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    navigate('/rentals', { state: { searchQuery: suggestion } });
    setSearchQuery('');
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
    setIsOpen(false);
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      handleSuggestionClick(searchQuery.trim());
    }
  };

  // Safe display name
  const displayName = user?.fullName || user?.displayName || user?.email?.split('@')[0] || 'User';

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition ${
      isActive ? 'text-purple-600 font-bold' : 'text-gray-700 hover:text-purple-600'
    }`;

  // ─────────────────────────────────────────────────────────────
  // REUSABLE INTELLIGENT SEARCH DROPDOWN
  // ─────────────────────────────────────────────────────────────
  const renderSearchDropdown = (isMobile = false) => {
    const show = isMobile ? true : isSearchFocused;
    if (!show) return null;

    return (
      <div className={`${isMobile ? 'flex-1 overflow-y-auto mt-2 pb-24' : 'absolute top-full left-0 right-0 mt-3 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden transform opacity-100 scale-100 transition-all origin-top'}`}>
        {!searchQuery.trim() ? (
          <div className={`p-4 md:p-5 bg-white space-y-6 ${isMobile ? '' : 'max-h-[70vh] overflow-y-auto'}`}>
            {/* Recent Searches */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Recent Searches
              </h4>
              <div className="flex flex-wrap gap-2">
                {RECENT_SEARCHES.map(term => (
                  <button key={term} onClick={() => handleSuggestionClick(term)} className="px-3.5 py-1.5 bg-gray-50 border border-gray-100/50 text-gray-600 text-[13px] font-medium rounded-lg hover:bg-gray-100 hover:text-gray-900 transition active:scale-95">
                    {term}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Items */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-pink-500" /> Trending Now
              </h4>
              <ul className="space-y-1">
                {TRENDING_ITEMS.map((item, idx) => (
                  <li key={idx}>
                    <button onClick={() => handleSuggestionClick(item)} className="w-full text-left px-3.5 py-2.5 hover:bg-purple-50 rounded-xl text-[14px] font-medium text-gray-800 transition flex items-center gap-3 group">
                      <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-white transition-colors shrink-0">
                        <Search className="w-3 h-3 text-gray-400" />
                      </div>
                      <span className="truncate">{item}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Shop by Category
              </h4>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => handleSuggestionClick(cat)} className="px-3.5 py-1.5 border border-gray-200 text-gray-600 text-[13px] font-medium rounded-lg hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition active:scale-95">
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className={`bg-white ${isMobile ? '' : 'max-h-[60vh] overflow-y-auto'}`}>
            <div className="p-2">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-3 pt-2">Suggestions</h4>
              {suggestions.length > 0 ? (
                suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-purple-50 rounded-xl transition flex items-center gap-3"
                  >
                    <Search className="w-4 h-4 text-purple-400 shrink-0" />
                    <span className="text-gray-800 text-sm font-medium">{suggestion}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400 ml-auto bg-gray-50 px-2 py-1 rounded-md hidden sm:block">Return</span>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 text-sm font-medium">
                  No matches for "{searchQuery}"
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <header className={`sticky top-0 z-[60] transition-colors duration-300 ${
      scrolled ? 'bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-white shadow-sm'
    }`}>
      
      {/* ─────────────────────────────────────────────────────────────
          MOBILE FULL-WIDTH SEARCH OVERLAY
          ───────────────────────────────────────────────────────────── */}
      {isMobileSearchOpen && (
        <div className="md:hidden fixed inset-0 h-[100dvh] bg-white z-[80] flex flex-col animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="px-4 py-3 flex items-center gap-3 border-b border-gray-100 bg-white flex-shrink-0">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                autoFocus
                type="text" 
                placeholder="Search outfits, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchSubmit}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-100 border-transparent rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-200 focus:bg-white text-[15px] font-medium min-h-[48px] transition-all"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 p-1">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button 
              onClick={() => {
                setIsMobileSearchOpen(false);
                setSearchQuery('');
              }} 
              className="text-gray-600 font-medium text-[15px] p-2 active:scale-95 shrink-0"
            >
              Cancel
            </button>
          </div>
          <div className="flex-1 bg-white">
            {renderSearchDropdown(true)}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MAIN NAVBAR
          ───────────────────────────────────────────────────────────── */}
      <nav className="container mx-auto px-4 md:px-6 py-3.5 flex justify-between items-center">
        
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-purple-300/50 transition-shadow">
            <span className="text-white font-bold text-lg md:text-xl">W</span>
          </div>
          <span className="logo-text text-[22px] md:text-2xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent tracking-tight hidden sm:block">
            WardroWave
          </span>
        </NavLink>

        {/* Desktop Primary Links */}
        <div className="hidden md:flex gap-6 lg:gap-8 items-center flex-1 justify-center">
          <NavLink to="/" end className={navLinkClass}>Home</NavLink>
          <NavLink to="/discover" className={navLinkClass}>Discover</NavLink>
          <NavLink to="/rentals" className={navLinkClass}>Rent Clothes</NavLink>
          <NavLink to="/about" className={navLinkClass}>About</NavLink>
        </div>

        {/* Right Side Tools */}
        <div className="flex items-center gap-2 sm:gap-4 ml-auto">
          
          {/* Desktop Search Bar */}
          <div className="hidden xl:flex relative w-64 xl:w-80" ref={searchRef}>
            <div className="relative group/search">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] transition-colors ${isSearchFocused ? 'text-purple-500' : 'text-gray-400'}`} />
              <input 
                type="text" 
                placeholder="Search outfits, brands..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchSubmit}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full pl-11 pr-10 py-2.5 bg-slate-100/80 border border-slate-200/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all text-sm font-medium text-gray-800 placeholder-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 bg-white rounded-full shadow-sm"
                >
                  <X className="w-3.5 h-3.5 text-gray-600" />
                </button>
              )}
            </div>
            {renderSearchDropdown(false)}
          </div>

          {/* Mobile Search Trigger */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="xl:hidden p-2.5 hover:bg-slate-100 rounded-full transition active:scale-95"
            aria-label="Search"
          >
            <Search className="w-[22px] h-[22px] text-gray-800" />
          </button>

          {/* Icons: Wishlist & Cart */}
          <button
            onClick={() => navigate('/wishlist')}
            className="hidden sm:block p-2.5 hover:bg-slate-100 rounded-full transition relative active:scale-95"
          >
            <Heart className="w-[22px] h-[22px] text-gray-800" />
            {wishlistCount > 0 && (
              <span className="absolute top-1 right-1 -mt-0.5 -mr-0.5 bg-pink-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-white">
                {wishlistCount}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate('/cart')}
            className="p-2.5 hover:bg-slate-100 rounded-full transition relative active:scale-95"
          >
            <ShoppingCart className="w-[22px] h-[22px] text-gray-800" />
            {cartCount > 0 && (
              <span className="absolute top-1 right-1 -mt-0.5 -mr-0.5 bg-purple-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 border-2 border-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Desktop User / Auth Profiles */}
          {user ? (
            <div className="hidden md:flex ml-2 border-l border-gray-200 pl-4 items-center gap-3">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 pl-1 pr-3 py-1 bg-slate-50 border border-slate-100 rounded-full hover:bg-purple-50 hover:border-purple-100 transition group"
              >
                <div className="w-7 h-7 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:shadow-md transition">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="text-[13px] font-bold text-gray-700 group-hover:text-purple-700">{displayName.split(' ')[0]}</span>
              </button>
            </div>
          ) : (
            <div className="hidden md:flex gap-2 ml-2 border-l border-gray-200 pl-4">
              <button onClick={() => navigate('/login')} className="px-4 py-2 text-gray-600 hover:text-purple-600 font-bold text-[13px] transition">Sign In</button>
              <button onClick={() => navigate('/signup')} className="px-4 py-2 bg-gray-900 text-white text-[13px] rounded-full hover:bg-purple-600 transition font-bold shadow-sm active:scale-95">Sign Up</button>
            </div>
          )}

          {/* Mobile Hamburger Trigger */}
          <button
            className="md:hidden hamburger-btn p-2.5 hover:bg-slate-100 rounded-full transition active:scale-95 ml-1"
            onClick={() => setIsOpen(true)}
            aria-label="Open Menu"
          >
            <Menu className="w-[24px] h-[24px] text-gray-900" />
          </button>
        </div>
      </nav>

      {/* ─────────────────────────────────────────────────────────────
          MOBILE SLIDE-IN DRAWER
          ───────────────────────────────────────────────────────────── */}
      
      {/* Dimmed Background Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/60 z-[85] backdrop-blur-sm transition-opacity duration-300 md:hidden animate-in fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Drawer Panel */}
      <div 
        ref={drawerRef}
        className={`fixed top-0 right-0 h-screen w-[85%] max-w-[340px] bg-white z-[90] shadow-2xl transform transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] flex flex-col md:hidden overflow-hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-5 pb-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-base">W</span>
            </div>
            <span className="text-lg font-black text-gray-900 tracking-tight">Menu</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-gray-200 active:scale-95 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8 flex flex-col hide-scrollbar pb-safe">
          
          {/* Auth Display in Drawer */}
          {user ? (
            <div className="bg-gradient-to-tr from-purple-50 to-pink-50 p-5 rounded-[20px] border border-purple-100 shadow-inner">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 truncate">Hi, {displayName}</p>
                  <p className="text-[11px] font-medium text-gray-500 truncate">{user.email || 'Welcome back!'}</p>
                </div>
              </div>
              <button
                onClick={() => { navigate('/profile'); setIsOpen(false); }}
                className="w-full py-2.5 bg-white border border-purple-200 rounded-xl text-purple-700 font-bold text-xs hover:bg-purple-600 hover:text-white transition shadow-sm"
              >
                View full profile
              </button>
            </div>
          ) : (
            <div className="bg-gray-50 p-5 rounded-[20px] border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-1">Welcome to WardroWave</h3>
              <p className="text-[12px] text-gray-500 mb-4 font-medium">Sign in to save favorites and track orders.</p>
              <div className="flex gap-2">
                <button onClick={() => { navigate('/login'); setIsOpen(false); }} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-800 rounded-xl font-bold text-[13px] active:scale-95 shadow-sm">Log In</button>
                <button onClick={() => { navigate('/signup'); setIsOpen(false); }} className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl font-bold text-[13px] active:scale-95 shadow-sm">Sign Up</button>
              </div>
            </div>
          )}

          {/* Navigation structured Links */}
          <div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">Shop</h4>
            <div className="space-y-1">
              <NavLink to="/discover" onClick={() => setIsOpen(false)} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 text-gray-700 font-semibold active:scale-[0.98] transition">
                <div className="flex items-center gap-3"><Tag className="w-[20px] h-[20px] text-gray-400"/> Collections</div>
                <ChevronRight className="w-4 h-4 text-gray-300"/>
              </NavLink>
              <NavLink to="/rentals" onClick={() => setIsOpen(false)} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 text-gray-700 font-semibold active:scale-[0.98] transition">
                <div className="flex items-center gap-3"><Search className="w-[20px] h-[20px] text-gray-400"/> Explore Rentals</div>
                <ChevronRight className="w-4 h-4 text-gray-300"/>
              </NavLink>
            </div>
          </div>

          <div>
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">My Account</h4>
            <div className="space-y-1">
              <NavLink to="/orders" onClick={() => setIsOpen(false)} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 text-gray-700 font-semibold active:scale-[0.98] transition">
                <div className="flex items-center gap-3"><Package className="w-[20px] h-[20px] text-gray-400"/> Orders & Returns</div>
                <ChevronRight className="w-4 h-4 text-gray-300"/>
              </NavLink>
              <NavLink to="/wishlist" onClick={() => setIsOpen(false)} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 text-gray-700 font-semibold active:scale-[0.98] transition">
                <div className="flex items-center gap-3"><Heart className="w-[20px] h-[20px] text-gray-400"/> Wishlist {wishlistCount > 0 && <span className="text-[10px] bg-pink-100 text-pink-600 px-2 py-0.5 rounded-full ml-1">{wishlistCount}</span>}</div>
                <ChevronRight className="w-4 h-4 text-gray-300"/>
              </NavLink>
              <NavLink to="/settings" onClick={() => setIsOpen(false)} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 text-gray-700 font-semibold active:scale-[0.98] transition">
                <div className="flex items-center gap-3"><Settings className="w-[20px] h-[20px] text-gray-400"/> Settings</div>
                <ChevronRight className="w-4 h-4 text-gray-300"/>
              </NavLink>
            </div>
          </div>

          {/* Spacer to push logout to bottom */}
          <div className="mt-auto pt-8">
            {user && (
              <button
                onClick={handleLogout}
                className="w-full py-4 text-red-500 font-bold text-[14px] flex items-center justify-center gap-2 hover:bg-red-50 rounded-xl transition active:scale-95"
              >
                <LogOut className="w-[18px] h-[18px]" />
                Log Out Securely
              </button>
            )}
          </div>
        </div>
      </div>

    </header>
  );
}
