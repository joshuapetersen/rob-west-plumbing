import React from 'react';

const AboutPage = ({ content }) => (
  <div className="animate-in fade-in duration-500 pt-16">
    <div className="max-w-7xl mx-auto px-4 pb-20 sm:pb-24">
        <div className="grid sm:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center mb-16 sm:mb-24 md:mb-32">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-6 sm:mb-8 uppercase tracking-tighter leading-none whitespace-pre-line">{content.about.title}</h2>
              <div className="space-y-4 sm:space-y-6 text-base sm:text-lg text-slate-600 whitespace-pre-line"><p>{content.about.description}</p></div>
            </div>
            <div className="relative">
              <div className="absolute -inset-2 sm:-inset-4 bg-emerald-100 rounded-2xl sm:rounded-3xl md:rounded-[3rem] -rotate-3"></div>
              <div className="relative bg-white p-1 sm:p-2 rounded-2xl sm:rounded-3xl md:rounded-[3rem] shadow-xl sm:shadow-2xl border-2 sm:border-4 border-white overflow-hidden aspect-[4/3]">
                <img src={content.about.image} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/800x600/064e3b/ffffff?text=Image+Unavailable'; }} />
              </div>
            </div>
        </div>
        
        {/* MEET THE TEAM SECTION */}
        {content.about.team && content.about.team.length > 0 && (
          <div className="space-y-12 sm:space-y-16">
             <div className="text-center max-w-3xl mx-auto">
               <h3 className="text-2xl sm:text-3xl font-black text-emerald-950 uppercase tracking-tighter mb-3 sm:mb-4">Meet The Team</h3>
               <div className="w-16 sm:w-20 md:w-24 h-0.5 sm:h-1 bg-emerald-500 mx-auto rounded-full"></div>
             </div>
             <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
               {content.about.team.map((member, idx) => (
                 <div key={idx} className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-lg sm:shadow-xl hover:scale-[1.02] transition-transform group">
                   <div className="aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-100 mb-4 sm:mb-6 relative">
                     <img src={member.image || "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/800x600/064e3b/ffffff?text=Image+Unavailable'; }} />
                   </div>
                   <h4 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tight">{member.name}</h4>
                   <p className="text-emerald-600 font-bold text-xs sm:text-sm uppercase tracking-wide mb-2 sm:mb-4">{member.role}</p>
                   <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">{member.bio}</p>
                 </div>
               ))}
             </div>
          </div>
        )}
    </div>
  </div>
);

export default AboutPage;