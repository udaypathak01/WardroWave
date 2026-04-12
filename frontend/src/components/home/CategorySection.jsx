import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { FadeIn, StaggerContainer } from '../common/PageTransition';

export default function CategorySection() {
  const categories = [
    {
      id: 'women',
      title: 'Womenswear',
      subtitle: 'From Designer Lehengas to Elegant Gowns',
      image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&fit=crop',
      imagePosition: 'object-center',
      link: '/women'
    },
    {
      id: 'jewelry',
      title: 'Luxe Jewelry',
      subtitle: 'Premium AI-matched Accessories',
      image: 'https://images.unsplash.com/photo-1651160670627-2896ddf7822f?w=600&auto=format&fit=crop&w=800&q=80',
      imagePosition: 'object-bottom',
      link: '/accessories'
    },
    {
      id: 'men',
      title: 'Menswear Couture',
      subtitle: 'Precision Tailored Suits & Sherwanis',
      image: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&fit=crop',
      imagePosition: 'object-top',
      link: '/men'
    }
  ];

  return (
    <section className="category-section py-8 sm:py-16 lg:py-20 bg-slate-50 relative">
      <div className="container mx-auto px-3 sm:px-4 md:px-6">

        <FadeIn className="text-center mb-10 md:mb-16">
          <h2 className="category-section-title section-title text-3xl sm:text-4xl md:text-5xl font-black text-slate-800 mb-4">
            Shop by <span className="text-[#a84c75]">Category</span>
          </h2>
          <p className="category-section-desc text-base sm:text-lg text-slate-600 font-medium max-w-2xl mx-auto">
            Explore curated collections designed to make you the center of attention. Every piece is thoroughly dry-cleaned, insured, and ready for you.
          </p>
        </FadeIn>

        <StaggerContainer>
          <div className="category-grid grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 min-h-[350px] sm:min-h-[400px] lg:min-h-[500px]">
            {categories.map((category) => (
              <FadeIn key={category.id} className="h-full">
                <Link to={category.link} className="category-card block relative w-full h-full rounded-[24px] md:rounded-[32px] overflow-hidden group cursor-pointer shadow-lg hover:shadow-xl border border-slate-200/50 transition-shadow duration-300">
                  {/* Background Image */}
                  <img
                    src={category.image}
                    alt={category.title}
                    className={`absolute inset-0 w-full h-full object-cover ${category.imagePosition} transition-transform duration-[1.5s] ease-out group-hover:scale-105`}
                  />

                  {/* Dynamic Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent bottom-0"></div>

                  {/* Content Container */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8 flex items-end justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1 md:mb-2 tracking-tight">
                        {category.title}
                      </h3>
                      <p className="text-slate-200 text-sm md:text-base font-normal">
                        {category.subtitle}
                      </p>
                    </div>

                    {/* Bottom Right Decorative Arrow */}
                    <div className="w-10 h-10 md:w-12 md:h-12 bg-white/70 backdrop-blur-sm rounded-full flex items-center justify-center text-slate-900 group-hover:bg-white group-hover:scale-110 transition-all duration-300 shrink-0">
                      <ArrowUpRight className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                  </div>
                </Link>
              </FadeIn>
            ))}
          </div>
        </StaggerContainer>

      </div>
    </section>
  );
}
