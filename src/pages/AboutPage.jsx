import React from 'react';

const AboutPage = ({ content }) => (
  <div className="animate-in fade-in duration-500 pt-16">
    <div className="max-w-7xl mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 uppercase tracking-tighter leading-none whitespace-pre-line">{content.about.title}</h2>
              <div className="space-y-6 text-lg text-slate-600 whitespace-pre-line"><p>{content.about.description}</p></div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-emerald-100 rounded-[3rem] -rotate-3"></div>
              <div className="relative bg-white p-2 rounded-[3rem] shadow-2xl border-4 border-white overflow-hidden aspect-[4/3]">
                <img src={content.about.image} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/800x600/064e3b/ffffff?text=Image+Unavailable'; }} />
              </div>
            </div>
        </div>
        
        {/* MEET THE TEAM SECTION */}
        {content.about.team && content.about.team.length > 0 && (
          <div className="space-y-16">
             <div className="text-center max-w-3xl mx-auto">
               <h3 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter mb-4">Meet The Team</h3>
               <div className="w-24 h-1 bg-emerald-500 mx-auto rounded-full"></div>
             </div>
             <div className="grid md:grid-cols-3 gap-8">
               {content.about.team.map((member, idx) => (
                 <div key={idx} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-xl hover:scale-[1.02] transition-transform group">
                   <div className="aspect-square rounded-3xl overflow-hidden bg-slate-100 mb-6 relative">
                     <img src={member.image || "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/800x600/064e3b/ffffff?text=Image+Unavailable'; }} />
                   </div>
                   <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">{member.name}</h4>
                   <p className="text-emerald-600 font-bold text-sm uppercase tracking-wide mb-4">{member.role}</p>
                   <p className="text-slate-500 text-sm leading-relaxed">{member.bio}</p>
                 </div>
               ))}
             </div>
          </div>
        )}
    </div>
  </div>
);

export default AboutPage;