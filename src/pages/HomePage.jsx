import React from 'react';
import { MapPin, Phone, ArrowRight, Star, Facebook } from 'lucide-react';

const HomePage = ({ setPage, content, reviews = [] }) => {
  const displayReviews = reviews.length > 0 ? reviews : [
    { name: "Sarah M.", rating: 5, text: "Rob came out same-day and fixed our water heater. Absolutely amazing service and very professional!" },
    { name: "Mike D.", rating: 5, text: "Best plumber in Humboldt Park. Honest pricing and clean work. Highly recommend!" },
    { name: "Jessica T.", rating: 5, text: "They installed our rain barrels and did a great job explaining the system. Love supporting a local business." }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <section className="relative pt-16 sm:pt-24 md:pt-32 pb-24 sm:pb-36 md:pb-48 overflow-hidden bg-emerald-950 border-b border-emerald-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/80 to-transparent z-10" />
          <img src={content.home.heroImage} alt="Hero" className="w-full h-full object-cover opacity-40 mix-blend-overlay" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/800x600/064e3b/ffffff?text=Image+Unavailable'; }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-3 sm:px-4 py-1.5 rounded-full text-xs font-bold mb-4 sm:mb-8 uppercase tracking-widest border border-emerald-500/30"><MapPin size={14} /> {content.global.address}</div>
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white leading-[1.05] mb-4 sm:mb-8 tracking-tight whitespace-pre-line">{content.home.heroTitle}</h1>
            <p className="text-base sm:text-lg md:text-xl text-emerald-100/80 mb-6 sm:mb-10 leading-relaxed max-w-2xl whitespace-pre-line">{content.home.heroSubtitle}</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
              <button onClick={() => setPage('services')} className="bg-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-900/50 flex items-center justify-center gap-2">Explore Services <ArrowRight size={18} /></button>
              <a href={`tel:${content.global.phone.replace(/\D/g,'')}`} className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:bg-white hover:text-emerald-950 transition-all flex items-center justify-center gap-2"><Phone size={18} /> {content.global.phone}</a>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION ON HOMEPAGE */}
      <section className="py-12 sm:py-20 md:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
           <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4 sm:mb-6 uppercase tracking-tighter">What Our Neighbors Say</h2>
              <div className="w-16 sm:w-20 md:w-24 h-1 sm:h-1.5 bg-emerald-500 mx-auto rounded-full mb-4 sm:mb-6"></div>
              <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">Trusted by hundreds of homeowners across Chicago.</p>
           </div>
           
           <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
             {displayReviews.slice(0, 3).map((review, idx) => (
               <div key={idx} className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-slate-100 shadow-lg sm:shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex gap-1 mb-4 sm:mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill={i < (review.rating || 5) ? "#fbbf24" : "none"} stroke={i < (review.rating || 5) ? "none" : "#fbbf24"} />
                    ))}
                  </div>
                  <p className="text-slate-600 mb-6 sm:mb-8 italic leading-relaxed text-base sm:text-lg">"{review.text}"</p>
                  <div className="flex items-center gap-3 sm:gap-4 mt-auto border-t border-slate-100 pt-4 sm:pt-6">
                    <div className="w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-xs sm:text-sm">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold text-sm sm:text-base">{review.name}</p>
                      <p className="text-emerald-600 text-xs font-bold uppercase tracking-wide">Verified Customer</p>
                    </div>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </section>

      <section className="py-8 sm:py-12 bg-white border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 bg-slate-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-base sm:text-lg md:text-xl font-black uppercase tracking-tight text-emerald-950">{content.home.promoText}</h3>
              <div className="h-0.5 w-full sm:h-8 sm:w-px bg-slate-200"></div>
              <a href={content.home.promoLinkUrl || content.global.social?.facebook || "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 sm:gap-3 bg-[#1877F2] text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:bg-blue-700 transition-all shadow-lg hover:scale-105 flex-shrink-0"><Facebook size={18} fill="currentColor" /><span>{content.home.promoLinkText}</span></a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;