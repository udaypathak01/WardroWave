import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, ChevronRight, Plus } from 'lucide-react';
import { FadeIn } from '../common/PageTransition';

const MATCHING_ACCESSORIES = [
  {
    id: 101,
    name: 'Minimalist Silver Watch',
    price: 150,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    type: 'Watch'
  },
  {
    id: 102,
    name: 'Classic Leather Brogues',
    price: 299,
    image: 'https://images.unsplash.com/photo-1614252235316-026c483984ca?w=500&h=500&fit=crop',
    type: 'Shoes'
  },
  {
    id: 103,
    name: 'Onyx Cufflinks Set',
    price: 99,
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500&h=500&fit=crop',
    type: 'Jewelry'
  },
  {
    id: 104,
    name: 'Silk Pocket Square',
    price: 49,
    image: 'https://images.unsplash.com/photo-1588610586208-a0e28e14b2d5?w=500&h=500&fit=crop',
    type: 'Accessories'
  }
];

export default function CompleteTheLook({ currentProductId }) {
  return (
    <section className="mt-16 pt-16 border-t border-gray-100">
      <FadeIn className="flex justify-between items-end mb-8">
        <div>
          <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-purple-50 text-purple-600 font-bold text-xs uppercase mb-3">
            <SparklesIcon /> AI Recommendation
          </div>
          <h2 className="text-3xl font-black text-gray-900">Complete The Look</h2>
          <p className="text-gray-500 font-medium">Perfectly matched luxe accessories for your rental.</p>
        </div>
        <Link to="/accessories" className="text-purple-600 font-bold hover:text-pink-600 transition flex items-center">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </FadeIn>

      <div className="flex gap-6 overflow-x-auto snap-x hide-scrollbar pb-8 pt-4">
        {MATCHING_ACCESSORIES.map((item, idx) => (
          <FadeIn key={item.id} delay={idx * 0.1}>
            <div className="w-56 md:w-64 snap-center shrink-0 group relative cursor-pointer">
              <div className="h-64 rounded-[24px] overflow-hidden relative shadow-md bg-gray-50 mb-4 border border-gray-100 group-hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded border border-gray-200 text-[10px] font-bold text-gray-600 uppercase tracking-widest shadow-sm">
                  {item.type}
                </div>
                
                {/* Floating Add Area */}
                <div className="absolute inset-0 bg-transparent group-hover:bg-gray-900/10 transition-colors z-10 flex items-center justify-center">
                  <button className="w-12 h-12 rounded-full bg-white text-gray-900 shadow-xl opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 flex items-center justify-center hover:bg-purple-600 hover:text-white hover:scale-110">
                    <Plus className="w-6 h-6" />
                  </button>
                </div>
              </div>
              <h4 className="font-bold text-gray-900 leading-tight mb-1 group-hover:text-purple-600 transition">{item.name}</h4>
              <p className="text-gray-500 font-medium text-sm">+ ₹{item.price} to rental</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// Inline spark icon to avoid import issues
function SparklesIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
      <path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>
    </svg>
  );
}
