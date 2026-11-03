import { Users, Globe, ShieldCheck } from 'lucide-react';

export default function ValuesCards() {
  const values = [
    {
      icon: Users,
      title: 'Style for Occasions',
      description: 'Browse rental pieces for different occasions and choose what suits your plans.',
      color: 'bg-purple-100 text-purple-600',
      delay: '0.1s'
    },
    {
      icon: Globe,
      title: 'Considered Choices',
      description: 'Renting gives each selected piece another opportunity to be worn.',
      color: 'bg-pink-100 text-pink-600',
      delay: '0.2s'
    },
    {
      icon: ShieldCheck,
      title: 'Clear Booking Details',
      description: 'Check product information, size options, rental dates, and a server-calculated quote before checkout.',
      color: 'bg-purple-100 text-purple-600',
      delay: '0.3s'
    }
  ];

  return (
    <div className="mb-32">
      <div className="text-center mb-16 px-4">
        <h2 className="section-title text-3xl md:text-5xl font-black text-slate-900 mb-6">
          The <span className="text-gradient">Principles</span> We Live By
        </h2>
        <p className="text-slate-500 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
          A straightforward rental experience built around clear product details and booking information.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {values.map((value, index) => {
          const IconComponent = value.icon;
          return (
            <div 
              key={index} 
              className="group bg-white rounded-[32px] p-10 text-center border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500 hover:-translate-y-2 animate-fade-in"
              style={{ animationDelay: value.delay }}
            >
              <div className={`mx-auto mb-8 flex items-center justify-center w-20 h-20 rounded-2xl ${value.color} group-hover:scale-110 transition-transform duration-500 group-hover:rotate-3`}>
                <IconComponent className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{value.title}</h3>
              <p className="text-slate-600 font-medium leading-relaxed">
                {value.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
