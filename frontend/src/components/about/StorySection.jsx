import { Award, Heart, Zap } from 'lucide-react';

export default function StorySection() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 mb-32 items-center">
      <div className="relative animate-fade-in">
        <div className="absolute -top-6 -left-6 w-32 h-32 bg-purple-100 rounded-3xl -z-10 blur-xl opacity-60"></div>
        <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-pink-100 rounded-full -z-10 blur-2xl opacity-50"></div>
        
        <div className="relative rounded-[40px] overflow-hidden shadow-2xl border-8 border-white">
          <img 
            src="/story_fashion_team_1774586811731.png" 
            alt="Our Creative Studio" 
            className="w-full h-full object-cover aspect-[4/5] hover:scale-105 transition-transform duration-700"
          />
        </div>
        
        {/* Floating Stat Card */}
        <div className="absolute bottom-10 -right-8 glass p-6 rounded-3xl shadow-xl border border-white/50 max-w-[200px] hidden md:block">
          <p className="text-4xl font-black text-gradient mb-1">2024</p>
          <p className="text-sm font-bold text-slate-900 uppercase tracking-tighter">Year We Started</p>
          <p className="text-xs text-slate-500 mt-2 font-medium">From a small idea to India's leading rental platform.</p>
        </div>
      </div>

      <div className="space-y-10">
        <div>
          <h2 className="section-title text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight">
            Redefining <span className="text-gradient">Style</span> Through Circulation
          </h2>
          <p className="text-slate-600 text-lg md:text-xl font-medium leading-relaxed">
            WardroWave was born from a simple yet powerful observation: our closets are full of untapped value, while our desire for fresh style is constant. 
          </p>
        </div>
        
        <div className="space-y-6">
          <p className="text-slate-600 leading-relaxed text-lg">
            Founded in the heart of the digital transformation, we set out to build more than a website—we built a movement. Our platform connects thousands of fashion-forward individuals, allowing luxury pieces to live multiple lives across different styled stories.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 italic transition-transform hover:scale-105">
              <Award className="w-8 h-8 text-purple-600 mb-3" />
              <h4 className="font-bold text-slate-900">Premium</h4>
              <p className="text-xs text-slate-500">Only the finest curated pieces</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-transform hover:scale-105">
              <Heart className="w-8 h-8 text-pink-600 mb-3" />
              <h4 className="font-bold text-slate-900">Curated</h4>
              <p className="text-xs text-slate-500">Hand-picked by stylists</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 transition-transform hover:scale-105">
              <Zap className="w-8 h-8 text-purple-600 mb-3" />
              <h4 className="font-bold text-slate-900">Swift</h4>
              <p className="text-xs text-slate-500">Fast delivery nationwide</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
