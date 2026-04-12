import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
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
              Your ultimate destination for premium fashion and style.
            </p>
            <div className="flex flex-wrap gap-2 -ml-2">
              <a href="#" className="p-2 md:p-1.5 rounded-full hover:bg-gray-800 hover:text-purple-400 transition min-h-[44px] min-w-[44px] flex items-center justify-center"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="p-2 md:p-1.5 rounded-full hover:bg-gray-800 hover:text-purple-400 transition min-h-[44px] min-w-[44px] flex items-center justify-center"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="p-2 md:p-1.5 rounded-full hover:bg-gray-800 hover:text-purple-400 transition min-h-[44px] min-w-[44px] flex items-center justify-center"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="p-2 md:p-1.5 rounded-full hover:bg-gray-800 hover:text-purple-400 transition min-h-[44px] min-w-[44px] flex items-center justify-center"><Linkedin className="w-5 h-5" /></a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="w-full">
            <h4 className="text-white font-bold mb-4 md:mb-6 uppercase tracking-wider text-sm">Quick Links</h4>
            <ul className="space-y-0.5 md:space-y-2">
              <li><a href="/" className="block py-3 md:py-1 text-sm md:text-base text-gray-400 hover:text-purple-400 transition min-h-[48px] md:min-h-0 flex items-center">Home</a></li>
              <li><a href="/products" className="block py-3 md:py-1 text-sm md:text-base text-gray-400 hover:text-purple-400 transition min-h-[48px] md:min-h-0 flex items-center">Shop</a></li>
              <li><a href="/about" className="block py-3 md:py-1 text-sm md:text-base text-gray-400 hover:text-purple-400 transition min-h-[48px] md:min-h-0 flex items-center">About Us</a></li>
              <li><a href="/blog" className="block py-3 md:py-1 text-sm md:text-base text-gray-400 hover:text-purple-400 transition min-h-[48px] md:min-h-0 flex items-center">Blog</a></li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="w-full">
            <h4 className="text-white font-bold mb-4 md:mb-6 uppercase tracking-wider text-sm">Customer Service</h4>
            <ul className="space-y-0.5 md:space-y-2">
              <li><a href="/contact" className="block py-3 md:py-1 text-sm md:text-base text-gray-400 hover:text-purple-400 transition min-h-[48px] md:min-h-0 flex items-center">Contact Us</a></li>
              <li><a href="/faq" className="block py-3 md:py-1 text-sm md:text-base text-gray-400 hover:text-purple-400 transition min-h-[48px] md:min-h-0 flex items-center">FAQ</a></li>
              <li><a href="/shipping" className="block py-3 md:py-1 text-sm md:text-base text-gray-400 hover:text-purple-400 transition min-h-[48px] md:min-h-0 flex items-center">Shipping Info</a></li>
              <li><a href="/returns" className="block py-3 md:py-1 text-sm md:text-base text-gray-400 hover:text-purple-400 transition min-h-[48px] md:min-h-0 flex items-center">Returns</a></li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="w-full">
            <h4 className="text-white font-bold mb-4 md:mb-6 uppercase tracking-wider text-sm">Contact Info</h4>
            <div className="space-y-4 md:space-y-6">
              <a href="mailto:support@wardrowave.com" className="group flex items-start gap-4 hover:bg-gray-800/50 p-2 md:p-0 -ml-2 md:ml-0 rounded-lg transition">
                <div className="mt-1 p-2 bg-gray-800 group-hover:bg-gray-700 rounded-lg transition flex-shrink-0">
                  <Mail className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm md:text-base text-gray-300 group-hover:text-purple-300 transition leading-tight">support@wardrowave.com</p>
                  <p className="text-xs text-gray-500 mt-1">We reply within 24 hours</p>
                </div>
              </a>
              <a href="tel:+918445890000" className="group flex items-center gap-4 hover:bg-gray-800/50 p-2 md:p-0 -ml-2 md:ml-0 rounded-lg transition">
                <div className="p-2 bg-gray-800 group-hover:bg-gray-700 rounded-lg transition flex-shrink-0">
                  <Phone className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-sm md:text-base text-gray-300 group-hover:text-purple-300 transition leading-tight">+91 844589xxxx</p>
              </a>
              <div className="flex items-start gap-4 p-2 md:p-0 -ml-2 md:ml-0">
                <div className="mt-1 p-2 bg-gray-800 rounded-lg flex-shrink-0">
                  <MapPin className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-sm md:text-base text-gray-300 leading-snug pt-1">Beta 1st Greater Noida, <br className="hidden md:block"/> Uttar Pradesh, India</p>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8 pb-16 md:pb-8">
          <div className="flex flex-col-reverse md:flex-row justify-between items-center text-center gap-6 md:gap-4">
            <p className="text-gray-500 text-xs md:text-sm order-2 md:order-1">
              &copy; 2025 WardroWave. All rights reserved.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-6 text-xs md:text-sm order-1 md:order-2 w-full md:w-auto">
              <a href="/privacy" className="py-3 sm:py-2 md:py-0 px-4 sm:px-0 text-gray-400 hover:text-purple-400 transition min-h-[44px] md:min-h-0 flex items-center justify-center bg-gray-800/50 sm:bg-transparent rounded-lg sm:rounded-none">Privacy Policy</a>
              <a href="/terms" className="py-3 sm:py-2 md:py-0 px-4 sm:px-0 text-gray-400 hover:text-purple-400 transition min-h-[44px] md:min-h-0 flex items-center justify-center bg-gray-800/50 sm:bg-transparent rounded-lg sm:rounded-none">Terms of Service</a>
              <a href="/cookies" className="py-3 sm:py-2 md:py-0 px-4 sm:px-0 text-gray-400 hover:text-purple-400 transition min-h-[44px] md:min-h-0 flex items-center justify-center bg-gray-800/50 sm:bg-transparent rounded-lg sm:rounded-none">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
