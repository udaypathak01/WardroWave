import { NavLink } from 'react-router-dom';
import { Home, Compass, Shirt, Heart, User } from 'lucide-react';
import { useWishlist } from '../../context api/WishlistContext';

export default function BottomNav() {
  const { wishlistCount } = useWishlist();

  // Active styles specifically requested for visually premium, responsive interface
  const navLinkClass = ({ isActive }) =>
    `flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-300 ${
      isActive 
        ? 'text-purple-600 scale-110 drop-shadow-md font-bold' 
        : 'text-gray-400 hover:text-purple-500 font-medium'
    }`;

  // Safe padding is strictly built in here
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-purple-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-[64px] px-2 w-full">
        <NavLink to="/" className={navLinkClass} end>
          <Home className="w-6 h-6" />
          <span className="text-[10px]">Home</span>
        </NavLink>
        
        <NavLink to="/discover" className={navLinkClass}>
          <Compass className="w-6 h-6" />
          <span className="text-[10px]">Discover</span>
        </NavLink>

        <NavLink to="/rentals" className={navLinkClass}>
          <Shirt className="w-6 h-6" />
          <span className="text-[10px]">Rentals</span>
        </NavLink>

        <NavLink to="/wishlist" className={navLinkClass}>
          <div className="relative">
            <Heart className="w-6 h-6" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold rounded-full w-[16px] h-[16px] flex items-center justify-center shadow-sm">
                {wishlistCount > 9 ? '9+' : wishlistCount}
              </span>
            )}
          </div>
          <span className="text-[10px]">Wishlist</span>
        </NavLink>

        <NavLink to="/profile" className={navLinkClass}>
          <User className="w-6 h-6" />
          <span className="text-[10px]">Profile</span>
        </NavLink>
      </div>
    </nav>
  );
}
