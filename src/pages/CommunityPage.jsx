import React from 'react';
import { Droplets, Flower, Leaf, Wind, ImageIcon } from 'lucide-react';

const CommunityPage = ({ dynamicImages = [], content }) => (
  <div className="animate-in fade-in duration-500 pt-16">
    <div className="max-w-7xl mx-auto px-4 pb-24">
      <div className="bg-emerald-950 rounded-[3rem] p-8 md:p-24 text-white relative overflow-hidden shadow-2xl mb-16">
        <div className="relative z-10 max-w-4xl">
          <h2 className="text-4xl md:text-7xl font-black mb-8 uppercase tracking-tight leading-none whitespace-pre-line">{content.community.title}</h2>
          <p className="text-emerald-100/80 text-xl leading-relaxed mb-12 max-w-2xl whitespace-pre-line">{content.community.description}</p>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              { title: "Rain Barrel Install", icon: <Droplets className="text-blue-500" />, desc: "Recycling rainwater in Chicago properties." },
              { title: "Community Gardens", icon: <Flower className="text-pink-500" />, desc: "Providing vital plumbing infrastructure." },
              { title: "DIY Green Plumbing", icon: <Leaf className="text-emerald-500" />, desc: "Empowering homeowners with knowledge." },
              { title: "World Water Day", icon: <Wind className="text-cyan-500" />, desc: "Educational events on water crisis." }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:bg-white/10 transition-all group">
                 <div className="mb-4 bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">{item.icon}</div>
                 <h4 className="text-xl font-black mb-2 uppercase tracking-tight">{item.title}</h4>
                 <p className="text-emerald-100/60 leading-relaxed font-medium text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-12">
         <div className="flex items-end justify-between border-b border-slate-200 pb-8"><h3 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter">Community Gallery</h3><p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Live Updates</p></div>
         {dynamicImages.length > 0 ? (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {dynamicImages.map((img) => (
               <div key={img.id} className="aspect-square bg-slate-100 rounded-3xl overflow-hidden border-4 border-white shadow-lg hover:scale-[1.02] transition-transform group relative">
                  <img src={img.url} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/800x600/064e3b/ffffff?text=Image+Unavailable'; }} />
               </div>
             ))}
           </div>
         ) : (<div className="py-20 text-center bg-slate-50 rounded-[3rem] border border-slate-200"><ImageIcon className="mx-auto text-slate-300 mb-4" size={64} /><h4 className="text-xl font-bold text-slate-400 uppercase tracking-tight">Gallery Empty</h4></div>)}
      </div>
    </div>
  </div>
);

export default CommunityPage;