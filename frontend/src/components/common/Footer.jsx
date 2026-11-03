import { Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePublicConfigQuery } from '../../lib/api/hooks';

export default function Footer() {
  const configQuery = usePublicConfigQuery();
  const supportEmail = configQuery.data?.data.supportEmail;

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-10 md:mb-12">
          {/* About */}
          <div className="flex flex-col items-start text-left">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">W</span>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">WardroWave</span>
            </div>
            <p className="text-gray-400 mb-6 text-sm md:text-base leading-relaxed">
              Browse rental outfits for your next occasion.
            </p>
          </div>

          {/* Quick Links */}
          <div className="w-full">
            <h4 className="text-white font-bold mb-4 md:mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-0.5 md:space-y-2">
              <li><Link to="/" className="block py-3 md:py-1 text-sm md:text-base text-gray-400 hover:text-purple-400 transition min-h-[48px] md:min-h-0 flex items-center">Home</Link></li>
              <li><Link to="/rentals" className="block py-3 md:py-1 text-sm md:text-base text-gray-400 hover:text-purple-400 transition min-h-[48px] md:min-h-0 flex items-center">Rentals</Link></li>
              <li><Link to="/about" className="block py-3 md:py-1 text-sm md:text-base text-gray-400 hover:text-purple-400 transition min-h-[48px] md:min-h-0 flex items-center">About Us</Link></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="w-full">
            <h4 className="text-white font-bold mb-4 md:mb-6 uppercase tracking-wider text-sm">Customer Service</h4>
            <ul className="space-y-0.5 md:space-y-2">
              <li><Link to="/contact" className="block py-3 md:py-1 text-sm md:text-base text-gray-400 hover:text-purple-400 transition min-h-[48px] md:min-h-0 flex items-center">Contact Us</Link></li>
              <li><Link to="/orders" className="block py-3 md:py-1 text-sm md:text-base text-gray-400 hover:text-purple-400 transition min-h-[48px] md:min-h-0 flex items-center">My Bookings</Link></li>
              <li><Link to="/profile" className="block py-3 md:py-1 text-sm md:text-base text-gray-400 hover:text-purple-400 transition min-h-[48px] md:min-h-0 flex items-center">My Profile</Link></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="w-full">
            <h4 className="text-white font-bold mb-4 md:mb-6 uppercase tracking-wider text-sm">Contact Info</h4>
            <div className="space-y-4 md:space-y-6">
            <div className="group flex items-start gap-4 p-2 md:p-0 -ml-2 md:ml-0 rounded-lg">
              <div className="mt-1 p-2 bg-gray-800 group-hover:bg-gray-700 rounded-lg transition flex-shrink-0">
                <Mail className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                {supportEmail ? (
                  <a href={`mailto:${supportEmail}`} className="text-sm md:text-base text-gray-300 hover:text-purple-300 transition leading-tight break-all">
                    {supportEmail}
                  </a>
                ) : (
                  <p className="text-sm md:text-base text-gray-300">Support contact unavailable</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  <Link to="/contact" className="hover:text-purple-300">Send a support request</Link>
                </p>
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8 pb-16 md:pb-8">
          <div className="flex flex-col-reverse md:flex-row justify-between items-center text-center gap-6 md:gap-4">
            <p className="text-gray-500 text-xs md:text-sm order-2 md:order-1">
              &copy; {new Date().getFullYear()} WardroWave.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-6 text-xs md:text-sm order-1 md:order-2 w-full md:w-auto">
              <Link to="/contact" className="py-3 sm:py-2 md:py-0 px-4 sm:px-0 text-gray-400 hover:text-purple-400 transition min-h-[44px] md:min-h-0 flex items-center justify-center">Contact</Link>
              <Link to="/about" className="py-3 sm:py-2 md:py-0 px-4 sm:px-0 text-gray-400 hover:text-purple-400 transition min-h-[44px] md:min-h-0 flex items-center justify-center">About</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
