import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import HeroSection from '../components/home/HeroSection';
import FeaturedProducts from '../components/home/FeaturedProducts';
import CategorySection from '../components/home/CategorySection';
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
      
      <Footer />
    </div>
  );
}
