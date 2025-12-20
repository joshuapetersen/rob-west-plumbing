import React from 'react';
import { X, Phone } from 'lucide-react';

const MobileMenu = ({ isOpen, onClose, setPage, content }) => {
  const visiblePages = (content.pages || []).filter(p => p.enabled);

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/95 backdrop-blur-sm md:hidden animate-in fade-in duration-200 flex flex-col justify-center items-center">
      <button onClick={onClose} className="absolute top-6 right-6 text-white p-2"><X size={40} /></button>
      <nav className="flex flex-col gap-8 text-center">
        {visiblePages.map(p => (
          <button key={p.id} onClick={() => { setPage(p.id); onClose(); }} className="text-3xl font-black text-white uppercase tracking-tighter hover:text-emerald-400 transition-colors">{p.label}</button>
        ))}
        <button onClick={() => { setPage('staff'); onClose(); }} className="text-3xl font-black text-slate-700 uppercase tracking-tighter hover:text-emerald-400 transition-colors">Staff</button>
        <a href={`tel:${content.global.phone.replace(/\D/g,'')}`} className="mt-8 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 mx-auto w-fit">
          <Phone /> Call Now
        </a>
      </nav>
    </div>
  );
};

export default MobileMenu;