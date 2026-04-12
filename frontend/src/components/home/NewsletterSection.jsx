import GSAPReveal from '../animations/GSAPReveal';
import { Mail, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function NewsletterSection() {
  const [email, setEmail] = useState('');

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter a valid email.');
      return;
    }
    toast.success('Thanks for subscribing!');
    setEmail('');
  };

  return (
    <section className="py-10 md:py-24 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 hidden md:block">
        <GSAPReveal direction="up" distance={40} threshold="top 90%">
          <div className="relative rounded-[32px] overflow-hidden bg-gray-900 border border-gray-800 shadow-2xl p-6 lg:p-16 text-center lg:text-left flex flex-col lg:flex-row items-center justify-between gap-6 md:gap-12 group">

            <div className="absolute inset-0 z-0 opacity-40 mix-blend-screen pointer-events-none transition-opacity duration-1000 group-hover:opacity-70">
              <div className="absolute top-[-50%] left-[-20%] w-[80%] h-[150%] bg-purple-600 rounded-full blur-[120px] mix-blend-multiply opacity-50 animate-pulse" style={{ animationDuration: '8s' }}></div>
              <div className="absolute bottom-[-50%] right-[-20%] w-[80%] h-[150%] bg-pink-600 rounded-full blur-[120px] mix-blend-multiply opacity-50 animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 max-w-2xl px-2 md:px-0">
              <div className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white/10 rounded-full text-white/90 font-medium text-xs md:text-sm mb-4 md:mb-6 border border-white/20 backdrop-blur-md">
                <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-pink-400" />
                <span>Join our VIP Club</span>
              </div>

              <h2 className="text-2xl md:text-5xl lg:text-6xl font-black text-white mb-3 md:mb-6 leading-tight tracking-tight">
                Unlock Secret Styles & Offers
              </h2>
              <p className="text-gray-400 text-sm md:text-xl font-medium max-w-xl mx-auto lg:mx-0">
                Get priority access to designer drops, invite-only sales, and personal styling tips.
              </p>
            </div>

            <div className="relative z-10 w-full lg:w-auto flex-1 max-w-md">
              <form onSubmit={handleSubscribe} className="relative group/form">
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-25 group-focus-within/form:opacity-75 transition duration-500"></div>
                <div className="relative flex flex-col md:flex-row gap-2 bg-gray-900 p-1.5 md:p-2 rounded-2xl border border-gray-700">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 bg-transparent px-4 py-3 md:px-6 md:py-4 text-white focus:outline-none placeholder-gray-500 font-medium text-sm md:text-base min-h-[48px]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-3 md:px-8 md:py-4 bg-white text-gray-900 font-bold rounded-xl hover:bg-gray-100 transition-all shadow-lg active:scale-95 flex flex-row items-center justify-center gap-2 text-sm md:text-base min-h-[48px] w-full md:w-auto"
                  >
                    Subscribe <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover/form:translate-x-1 transition-transform" />
                  </button>
                </div>
              </form>
              <p className="text-xs md:text-sm text-gray-500 mt-4 md:mt-6 text-center font-medium">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </GSAPReveal>
      </div>

      {/* --- MOBILE VERSION --- */}
      <div className="md:hidden mx-4 mt-6 relative overflow-hidden rounded-3xl bg-gray-900 shadow-xl border border-gray-800 p-5 group">
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-purple-500/20 to-pink-500/20 blur-2xl rounded-full pointer-events-none"></div>
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-sm backdrop-blur-md">
            <Mail className="w-5 h-5 text-pink-400" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg tracking-tight leading-tight">VIP Access</h3>
            <p className="text-gray-400 text-xs font-medium">Unlock secret styles & offers</p>
          </div>
        </div>

        <form onSubmit={handleSubscribe} className="flex gap-2 relative z-10">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            className="flex-1 bg-black/40 border border-gray-700 rounded-xl px-4 text-sm text-white focus:outline-none focus:border-purple-500 placeholder-gray-500 h-[48px] transition-colors"
          />
          <button type="submit" className="h-[48px] px-5 bg-white text-gray-900 rounded-xl font-bold flex items-center justify-center active:scale-95 transition shadow-lg shrink-0 gap-2 text-sm">
            Join <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
