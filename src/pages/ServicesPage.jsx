import React from 'react';
import { Droplets, ShieldCheck, Smartphone, Flame, Leaf, Calendar } from 'lucide-react';

const ServicesPage = ({ content }) => (
  <div className="animate-in fade-in duration-500 pt-16">
    <div className="max-w-7xl mx-auto px-4 pb-24">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 uppercase tracking-tighter whitespace-pre-line">{content.services.title}</h2>
        <p className="text-lg text-slate-600 leading-relaxed whitespace-pre-line">{content.services.description}</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[
          { title: "Residential", icon: <Droplets />, list: ["Water Heaters", "Sump Pumps", "Sewer Line Repair", "Leak Repairs", "Toilet Repair", "Drain Cleaning"] },
          { title: "Commercial", icon: <ShieldCheck />, list: ["Grease Traps", "RPZ Valve Testing", "Code Compliance", "Commercial Drains", "Maintenance"] },
          { title: "Smart Home", icon: <Smartphone />, list: ["Smart Shutoff Valves", "Wi-Fi Leak Detectors", "Touchless Faucets", "Smart Showers", "App-Controlled Heaters"] },
          { title: "Gas Lines", icon: <Flame />, list: ["Leak Detection", "New Gas Piping", "Leak Repair", "Appliance Hookups", "Emergency Shutoff"] },
          { title: "Green Plumbing", icon: <Leaf />, list: ["Rain Barrels", "Tankless Heaters", "Energy Star", "Conservation", "Eco-Audits"] }
        ].map((s, i) => (
          <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-emerald-500 transition-all flex flex-col h-full">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-8 shrink-0">{React.cloneElement(s.icon, { size: 32 })}</div>
            <h4 className="text-2xl font-black mb-6 text-slate-900 leading-tight uppercase tracking-tighter shrink-0">{s.title}</h4>
            <ul className="space-y-3 mb-10 grow">{s.list.map((item, idx) => (<li key={idx} className="flex items-center gap-3 text-slate-600 font-medium"><div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> {item}</li>))}</ul>
            <a href={`tel:${content.global.phone.replace(/\D/g,'')}`} className="w-full bg-emerald-600 text-white text-center py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 mt-auto"><Calendar size={18} /> {content.global.phone}</a>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ServicesPage;