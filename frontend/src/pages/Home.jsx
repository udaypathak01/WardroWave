import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import HeroSection from '../components/home/HeroSection';
import FeaturedProducts from '../components/home/FeaturedProducts';
import AiTryOnSection from '../components/home/AiTryOnSection';
import AiStylistSection from '../components/home/AiStylistSection';
import CategorySection from '../components/home/CategorySection';
import NewsletterSection from '../components/home/NewsletterSection';
import TestimonialsSection from '../components/home/TestimonialsSection';
import GSAPReveal from '../components/animations/GSAPReveal';

export default function Home() {

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 overflow-x-hidden">
      <Header />
      
      <HeroSection />
      
      <GSAPReveal>
        <FeaturedProducts />
      </GSAPReveal>
      
      <GSAPReveal>
        <CategorySection />
      </GSAPReveal>
      
      <GSAPReveal>
        <AiStylistSection />
      </GSAPReveal>
      
      <GSAPReveal>
        <AiTryOnSection />
      </GSAPReveal>
      
      <GSAPReveal>
        <NewsletterSection />
      </GSAPReveal>
      
      <GSAPReveal>
        <TestimonialsSection />
      </GSAPReveal>

      <Footer />
    </div>
  );
}
