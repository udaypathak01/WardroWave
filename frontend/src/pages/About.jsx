import { useEffect } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import StorySection from '../components/about/StorySection';
import ValuesCards from '../components/about/ValuesCards';
import StatsSection from '../components/about/StatsSection';
import TeamCards from '../components/about/TeamCards';
import WhyChooseSection from '../components/about/WhyChooseSection';

export default function About() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section - Gradient Theme View */}
      <section className="relative h-[65vh] md:h-[75vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-slate-50">
          {/* Main theme gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-pink-600/5 to-purple-600/5"></div>
          
          {/* Animated glow orbs for premium feel */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/40 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-pink-200/30 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Texture Mesh */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
          
          {/* Bottom fade into white content */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white"></div>
        </div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <div className="animate-fade-in">
            <span className="inline-block px-5 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-xs font-black tracking-[0.2em] uppercase mb-8 shadow-xl">
              Since 2024
            </span>
            <h1 className="section-title text-5xl md:text-7xl lg:text-9xl font-black mb-10 tracking-tighter text-slate-900 leading-none">
              The <span className="text-gradient">Future</span> of Fashion
            </h1>
            <p className="text-lg md:text-2xl text-slate-600 max-w-3xl mx-auto font-bold leading-relaxed">
              WardroWave is a community-driven luxury rental ecosystem, where world-class style meets responsible consumption.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 md:px-6 py-32 space-y-40">
        <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <StorySection />
        </div>
        
        <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <ValuesCards />
        </div>
        
        <div className="animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <StatsSection />
        </div>
        
        <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <TeamCards />
        </div>
        
        <div className="animate-fade-in" style={{ animationDelay: '0.7s' }}>
          <WhyChooseSection />
        </div>

        {/* CTA Section */}
        <div className="text-center mt-32 p-16 lg:p-32 bg-slate-100 rounded-[80px] border border-slate-200 relative overflow-hidden group shadow-sm">
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
          
          <div className="relative z-10 animate-fade-in">
            <h2 className="section-title text-5xl md:text-7xl font-black text-slate-950 mb-10 leading-tight tracking-tighter">
              Join the Movement.
            </h2>
            <p className="text-slate-500 text-xl md:text-3xl mb-16 max-w-4xl mx-auto font-bold leading-snug">
              Every outfit shared is a story told. Start your journey into the world of curated luxury rentals today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <a 
                href="/rentals"
                className="btn-primary text-2xl px-14 py-6 shadow-2xl shadow-purple-500/40"
              >
                Start Renting
              </a>
              <a 
                href="/contact"
                className="px-14 py-6 bg-white text-slate-900 font-black rounded-3xl border border-slate-300 hover:bg-slate-50 transition-all text-2xl"
              >
                Inquire
              </a>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
