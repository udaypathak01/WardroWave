import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { StaggerContainer, StaggerItem, FadeIn } from '../common/PageTransition';
import { ShoppingBag } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const categories = [
  {
    name: 'Men’s Collection',
    image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&h=800&fit=crop',
    icon: '👔',
    tag: 'Formal & Ethnic',
    path: '/men'
  },
  {
    name: 'Women’s Collection',
    image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&h=800&fit=crop',
    icon: '👗',
    tag: 'Bridal & Party',
    path: '/women'
  },
  {
    name: 'Luxe Accessories',
    image: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=800&fit=crop',
    icon: '⌚',
    tag: 'Jewelry & Watches',
    path: '/accessories'
  }
];

export default function CategoriesSection() {
  const navigate = useNavigate();

  return (
    <section className="py-8 sm:py-16 lg:py-20 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-3 sm:px-4 md:px-6">
        <FadeIn delay={0.1} className="text-center mb-16 md:mb-20 max-w-2xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-pink-100 text-pink-600 font-bold tracking-wider text-xs uppercase mb-4 border border-pink-200">
            Curated Collections
          </span>
          <h2 className="section-title text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 mb-6 leading-tight">
            Shop by Category
          </h2>
          <p className="text-gray-600 text-base sm:text-lg md:text-xl font-medium leading-relaxed">
            Find the perfect rental for your next grand event. Designed to turn heads and engineered for comfort.
          </p>
        </FadeIn>
        
        <StaggerContainer stagger={0.15} className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {categories.map((category, idx) => (
            <StaggerItem key={idx}>
              <div
                onClick={() => navigate(category.path)}
                className="relative h-64 sm:h-80 md:h-96 lg:h-[32rem] rounded-[32px] overflow-hidden cursor-pointer group shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 block"
              >
                {/* Background image & overlay */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500 z-10" />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 z-10" />
                
                <img 
                  src={category.image}
                  alt={category.name}
                  loading="lazy"
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] z-0"
                />

                {/* Content over image */}
                <div className="absolute inset-x-0 bottom-0 p-8 z-20 flex flex-col items-center justify-end h-full">
                  <span className="text-white/80 uppercase tracking-[0.2em] text-xs font-bold mb-3 transform translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    {category.tag}
                  </span>
                  
                  <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-white text-center leading-tight mb-2 group-hover:-translate-y-4 transition-transform duration-500">
                    {category.name}
                  </h3>

                  <button className="flex items-center gap-2 mt-2 px-6 py-3 bg-white/20 backdrop-blur-md text-white rounded-full font-bold text-sm border border-white/50 hover:bg-white hover:text-gray-900 transition-all duration-300 transform translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                    <ShoppingBag className="w-4 h-4" />
                    Explore Now
                  </button>
                </div>

                {/* Icon blob floating top right */}
                <div className="absolute top-6 right-6 w-14 h-14 bg-white/20 backdrop-blur-lg rounded-full flex items-center justify-center text-2xl shadow-lg border border-white/30 z-20 transform translate-y-[-20px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                  {category.icon}
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
