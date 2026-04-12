import { useState, useRef, useEffect } from 'react';
import { Star, Quote, ArrowLeft, ArrowRight } from 'lucide-react';
import GSAPReveal from '../animations/GSAPReveal';

const testimonials = [
  {
    text: "I rented a designer Lehenga for my sister's wedding. It arrived in pristine condition, fit perfectly, and saved me over ₹45,000. WardroWave is a lifesaver!",
    name: "Priya Sharma",
    role: "Bride's Sister",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
    rating: 5,
  },
  {
    text: "As a guy who rarely wears suits, buying one for a gala felt like a waste. I rented a timeless tuxedo here—the quality was stellar and returning it was zero hassle.",
    name: "Rahul Desai",
    role: "Business Consultant",
    avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop",
    rating: 5,
  },
  {
    text: "Listing my unused designer sarees on WardroWave has been amazing. The platform handles the logistics, and I've already made enough passive income to buy new outfits!",
    name: "Ananya Patel",
    role: "Lender / Fashion Blogger",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop",
    rating: 5,
  },
  {
    text: "The verification process made me feel super secure lending out my premium bags. It's an incredible way to participate in sustainable fashion.",
    name: "Simran Kaur",
    role: "Verified Lender",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
    rating: 5,
  }
];

const extendedTestimonials = [...testimonials, ...testimonials, ...testimonials];

export default function TestimonialsSection() {
  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const firstChild = scrollRef.current.children[0];
        const cardWidth = firstChild ? firstChild.clientWidth + 24 : 320;

        if (scrollLeft + clientWidth >= scrollWidth - 50) {
          scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          scrollRef.current.scrollBy({ left: cardWidth, behavior: 'smooth' });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isHovered]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const firstChild = scrollRef.current.children[0];
      const cardWidth = firstChild ? firstChild.clientWidth + 24 : 320;
      const scrollAmount = direction === 'left' ? -cardWidth : cardWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 md:py-20 lg:py-24 bg-slate-50 relative overflow-hidden group/section">
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-t from-emerald-50 to-transparent blur-3xl opacity-70"></div>
        <div className="absolute bottom-[-10%] left-[10%] w-[40%] h-[40%] rounded-full bg-gradient-to-tr from-cyan-50 to-transparent blur-3xl opacity-60"></div>
      </div>

      <div className="container mx-auto px-4 md:px-6 relative z-10 mb-8 md:mb-12">
        <GSAPReveal direction="up" className="text-center max-w-3xl mx-auto">
          <span className="inline-block py-1.5 px-4 rounded-full bg-indigo-50 text-indigo-600 font-bold tracking-wider text-xs uppercase mb-4 border border-indigo-100 shadow-sm">
            Real Experiences
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black text-gray-900 mb-4 sm:mb-6 leading-tight px-2 tracking-tight">
            Loved By Thousands
          </h2>
          <p className="text-gray-600 text-sm sm:text-lg md:text-xl font-medium leading-relaxed px-4">
            Don't just take our word for it. Look at what our community of renters and lenders have to say.
          </p>
        </GSAPReveal>
      </div>

      <div
        className="relative max-w-[1400px] mx-auto"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
      >
        <button
          onClick={() => scroll('left')}
          aria-label="Previous Testimonial"
          className="hidden md:flex absolute -left-4 lg:left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] items-center justify-center text-gray-800 hover:bg-white hover:text-purple-600 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/section:opacity-100 border border-gray-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button
          onClick={() => scroll('right')}
          aria-label="Next Testimonial"
          className="hidden md:flex absolute -right-4 lg:right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 backdrop-blur-md rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] items-center justify-center text-gray-800 hover:bg-white hover:text-purple-600 hover:scale-110 active:scale-95 transition-all opacity-0 group-hover/section:opacity-100 border border-gray-100"
        >
          <ArrowRight className="w-6 h-6" />
        </button>

        <div className="absolute left-0 top-0 bottom-0 w-8 md:w-24 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-8 md:w-24 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>

        <GSAPReveal direction="up" threshold="top 90%" delay={0.3}>
          <div
            ref={scrollRef}
            className="flex overflow-x-auto hide-scrollbar snap-x snap-mandatory gap-4 md:gap-6 px-6 md:px-24 pb-12 pt-4 items-stretch"
            style={{ scrollBehavior: 'smooth' }}
          >
            {extendedTestimonials.map((testimonial, idx) => (
              <div
                key={idx}
                className="snap-center sm:snap-start shrink-0 w-[85vw] sm:w-[340px] md:w-[380px] lg:w-[420px] h-auto flex"
              >
                <div className="bg-white p-6 md:p-8 rounded-[28px] shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] transition-all duration-300 w-full flex flex-col relative group overflow-hidden border border-gray-100/80">
                  <Quote className="absolute -top-4 -right-2 md:-top-2 md:-right-2 w-24 h-24 md:w-32 md:h-32 text-gray-50 group-hover:text-purple-50 transition-colors duration-500 z-0 transform rotate-12 opacity-50 md:opacity-100 pointer-events-none" />
                  <div className="flex text-yellow-400 mb-5 relative z-10 gap-1.5 mt-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 md:w-5 md:h-5 fill-current drop-shadow-sm" />
                    ))}
                  </div>
                  <p className="text-gray-700 text-[15px] md:text-lg font-medium leading-relaxed mb-8 flex-grow relative z-10">
                    "{testimonial.text}"
                  </p>
                  <div className="flex items-center gap-4 mt-auto relative z-10 pt-5 border-t border-gray-100">
                    <div className="relative shrink-0">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        loading="lazy"
                        className="w-12 h-12 md:w-14 md:h-14 rounded-full object-cover ring-2 ring-purple-100 shadow-sm"
                      />
                    </div>
                    <div className="flex flex-col justify-center min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm md:text-base truncate">{testimonial.name}</h4>
                      <p className="text-purple-600 font-medium text-xs md:text-sm truncate">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GSAPReveal>
      </div>
    </section>
  );
}
