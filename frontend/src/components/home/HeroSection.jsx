import { ArrowRight, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';

// Simple particles component
function Particles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {[...Array(15)].map((_, i) => (
        <div 
          key={i} 
          className="particle"
          style={{
            width: `${Math.random() * 8 + 4}px`,
            height: `${Math.random() * 8 + 4}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 20 + 10}s`,
            animationDelay: `${Math.random() * -20}s`
          }}
        />
      ))}
    </div>
  );
}

export default function HeroSection() {
  const navigate = useNavigate();
  const titleRef = useRef(null);
  const descRef = useRef(null);
  const buttonsRef = useRef(null);
  const imageRef = useRef(null);
  const badgeRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(badgeRef.current, { opacity: 0, y: 20, duration: 0.8, delay: 0.2 });
      gsap.from(titleRef.current, { opacity: 0, y: 30, duration: 1, delay: 0.4 });
      gsap.from(descRef.current, { opacity: 0, y: 20, duration: 0.8, delay: 0.6 });
      gsap.from(buttonsRef.current, { opacity: 0, y: 20, duration: 0.8, delay: 0.8 });
      gsap.from(imageRef.current, { opacity: 0, x: 50, duration: 1.2, delay: 0.5, ease: "power3.out" });
    });
    return () => ctx.revert();
  }, []);

  return (
    <section className="relative bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pt-16 pb-16 lg:pt-12 lg:pb-12 overflow-hidden min-h-[calc(100vh-80px)] flex items-center">
      <Particles />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16 items-center">
          
          {/* Content */}
          <div className="text-center md:text-left">
            <div 
              ref={badgeRef}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full text-purple-600 font-semibold text-sm mb-6 shadow-sm border border-purple-100 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4" />
              <span>India's #1 Premium Fashion Rental</span>
            </div>
            
            <h1 
              ref={titleRef}
              className="section-title text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.1] mb-6"
            >
              Rent <span className="text-gradient">Premium</span><br />
              Fashion
            </h1>
            
            <p 
              ref={descRef}
              className="text-base md:text-lg text-gray-600 mb-8 max-w-xl mx-auto md:mx-0 leading-relaxed font-medium"
            >
              Wear stunning outfits at just 25% of the retail price. Rent for any occasion, zero commitment, unlimited style.
            </p>
            
            <div 
              ref={buttonsRef}
              className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start"
            >
              <button 
                onClick={() => navigate('/rentals')}
                className="btn-primary text-lg px-8 py-4 w-full sm:w-auto justify-center"
              >
                Rent Now <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          
          {/* Image */}
          <div className="relative w-full max-w-[500px] mx-auto h-[350px] sm:h-[400px] md:h-[450px] lg:h-[550px] mt-8 md:mt-0" ref={imageRef}>
            <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-[32px] blur-3xl opacity-30 mix-blend-multiply"></div>
            <img 
              src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&h=800&fit=crop&q=80" 
              alt="Premium Fashion Rental - WardroWave"
              className="relative w-full h-full object-cover rounded-[32px] shadow-2xl z-10"
              loading="eager"
            />
            {/* Floating price badge */}
            <div className="absolute bottom-6 left-[-10px] md:bottom-10 md:left-[-30px] z-20 glass rounded-2xl px-5 md:px-6 py-3 md:py-4 shadow-xl float-badge border border-white/60">
              <p className="text-[10px] md:text-xs text-gray-800 font-bold uppercase tracking-wider mb-0.5 md:mb-1">Rent from just</p>
              <p className="text-2xl md:text-3xl font-black text-gradient">₹299/day</p>
              <p className="text-[10px] md:text-xs text-gray-500 font-medium mt-0.5 md:mt-1">vs ₹3,000+ retail price</p>
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
