export default function StatsSection() {
  const stats = [
    { number: '15K+', label: 'Global Collections' },
    { number: '50K+', label: 'Happy Users' },
    { number: '200K+', label: 'Rentals Completed' },
    { number: '4.9★', label: 'Average Rating' }
  ];

  return (
    <div className="relative bg-slate-900 rounded-[50px] p-12 md:p-20 mb-32 overflow-hidden shadow-2xl">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600/20 blur-[100px] rounded-full -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-600/20 blur-[100px] rounded-full translate-x-1/2 translate-y-1/2"></div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 text-white text-center relative z-10">
        {stats.map((stat, index) => (
          <div 
            key={index} 
            className="group animate-fade-in"
            style={{ animationDelay: `${0.1 * index}s` }}
          >
            <div className="text-5xl md:text-6xl font-black mb-4 tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-white to-white/40 group-hover:scale-110 transition-transform duration-500">
              {stat.number}
            </div>
            <p className="text-gray-400 text-sm md:text-lg font-bold uppercase tracking-[0.2em] group-hover:text-purple-400 transition-colors">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
