import { ShieldCheck, Zap, Heart, Recycle, Headphones, Sparkles } from 'lucide-react';

export default function WhyChooseSection() {
  const features = [
    { 
      icon: Sparkles,
      title: 'Live Catalog', 
      description: 'Browse published rental products and review their descriptions, images, and size options.',
      delay: '0.1s'
    },
    { 
      icon: Heart,
      title: 'Date Availability', 
      description: 'Choose a size and rental dates to check current inventory before adding an item to your cart.',
      delay: '0.2s'
    },
    { 
      icon: ShieldCheck,
      title: 'Clear Quote', 
      description: 'Review rental charges, applicable discounts, delivery fees, taxes, and deposits before checkout.',
      delay: '0.3s'
    },
    { 
      icon: Zap,
      title: 'Hosted Payment', 
      description: 'Pay through Razorpay Checkout; the backend verifies the payment before confirming a booking.',
      delay: '0.4s'
    },
    { 
      icon: Headphones,
      title: 'Booking History', 
      description: 'View your bookings and download invoices from your account.',
      delay: '0.5s'
    },
    { 
      icon: Recycle,
      title: 'Customer Support', 
      description: 'Send a support request through the contact form and receive a confirmation that it was queued.',
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
