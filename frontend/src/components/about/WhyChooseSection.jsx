import { ShieldCheck, Zap, Heart, Recycle, Headphones, Sparkles } from 'lucide-react';

export default function WhyChooseSection() {
  const features = [
    { 
      icon: Sparkles,
      title: 'Authentic Collections', 
      description: 'Hand-picked by professional stylists to blend traditional heritage with modern trends.',
      delay: '0.1s'
    },
    { 
      icon: Heart,
      title: 'Elite Affordability', 
      description: 'Experience ₹20,000+ luxury outfits for a fraction of the price, starting at just 5%.',
      delay: '0.2s'
    },
    { 
      icon: ShieldCheck,
      title: 'Diamond Protection', 
      description: 'Your rentals are fully insured and undergo high-grade industrial sanitization.',
      delay: '0.3s'
    },
    { 
      icon: Zap,
      title: 'Seamless Logic', 
      description: 'One-click checkout, instant sizing AI, and dedicated doorstep pickup.',
      delay: '0.4s'
    },
    { 
      icon: Headphones,
      title: 'Concierge Support', 
      description: '24/7 fashion assistants ready to help you style your look or manage your orders.',
      delay: '0.5s'
    },
    { 
      icon: Recycle,
      title: 'Surgical Eco-Focus', 
      description: 'Each rental reduces the fashion industry carbon footprint by up to 80% per wear.',
      delay: '0.6s'
    }
  ];

  return (
    <div className="bg-slate-50 border border-slate-100 rounded-[50px] p-12 md:p-24 mb-32 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
      
      <div className="text-center mb-20 relative z-10 animate-fade-in">
        <h2 className="section-title text-4xl md:text-5xl font-black text-slate-900 mb-6 px-4">
          Why Choose <span className="text-gradient">WardroWave?</span>
        </h2>
        <p className="text-slate-600 text-lg md:text-xl font-medium max-w-2xl mx-auto">
          We have engineered every touchpoint to ensure your fashion journey is as effortless as it is exquisite.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 lg:gap-12 relative z-10">
        {features.map((feature, index) => (
          <div 
            key={index} 
            className="flex flex-col gap-6 p-2 group hover:-translate-y-1 transition-transform duration-500 animate-fade-in"
            style={{ animationDelay: feature.delay }}
          >
            <div className={`flex-shrink-0 flex h-16 w-16 items-center justify-center rounded-2xl ${
              index % 2 === 0 ? 'bg-white text-purple-600 shadow-xl shadow-purple-500/10' : 'bg-white text-pink-600 shadow-xl shadow-pink-500/10'
            } group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 group-hover:text-white transition-all duration-500`}>
              <feature.icon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{feature.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
