import { Linkedin, Instagram, Twitter } from 'lucide-react';

export default function TeamCards() {
  const teamMembers = [
    { 
      name: 'Priya Sharma', 
      role: 'Founder & CEO', 
      image: '/ceo_portrait_1774587062917.png',
      bio: 'Fashion tech visionary with 10+ years in sustainable retail.'
    },
    { 
      name: 'Rajesh Kumar', 
      role: 'Creative Director', 
      image: '/design_lead_portrait_1774587087014.png',
      bio: 'Award-winning designer obsessed with circular fashion aesthetics.'
    },
    { 
      name: 'Ananya Gupta', 
      role: 'Marketing Lead', 
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop&q=80',
      bio: 'Growth strategist bringing WardroWave to millions nationwide.'
    },
    { 
      name: 'Vikram Singh', 
      role: 'Operations Chief', 
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&q=80',
      bio: 'Supply chain expert ensuring every garment remains pristine.'
    },
  ];

  return (
    <div className="mb-32">
      <div className="text-center mb-20 px-4 animate-fade-in">
        <h2 className="section-title text-4xl md:text-5xl font-black text-slate-900 mb-6">
          The <span className="text-gradient">Architects</span> of Style
        </h2>
        <p className="text-slate-600 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
          Meet the team dedicated to revolutionizing how you access and experience luxury fashion.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
        {teamMembers.map((member, index) => (
          <div 
            key={index} 
            className="group animate-fade-in"
            style={{ animationDelay: `${0.1 * index}s` }}
          >
            <div className="relative mb-6 rounded-[32px] overflow-hidden aspect-[4/5] shadow-xl group-hover:shadow-2xl transition-all duration-500">
              <img 
                src={member.image} 
                alt={member.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-8 p-4">
                <div className="flex gap-4">
                  <a href="#" className="p-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/40 transition-colors text-white">
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a href="#" className="p-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/40 transition-colors text-white">
                    <Instagram className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
            <div className="text-center px-4">
              <h3 className="text-2xl font-black text-slate-900 mb-1 group-hover:text-purple-600 transition-colors">{member.name}</h3>
              <p className="text-purple-600 text-sm font-bold uppercase tracking-widest mb-4">{member.role}</p>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                {member.bio}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
