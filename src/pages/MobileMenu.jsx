import React from 'react';
import { X, Phone } from 'lucide-react';

const MobileMenu = ({ isOpen, onClose, setPage, content }) => {
  const visiblePages = (content.pages || []).filter(p => p.enabled);

  return (
    <div className="fixed inset-0 z-40 bg-slate-900/95 backdrop-blur-sm md:hidden animate-in fade-in duration-200 flex flex-col justify-center items-center overflow-y-auto">
      <button onClick={onClose} className="absolute top-4 sm:top-6 right-4 sm:right-6 text-white p-2"><X size={32} /></button>
      <nav className="flex flex-col gap-4 sm:gap-6 md:gap-8 text-center py-20">
        {visiblePages.map(p => (
          <button key={p.id} onClick={() => { setPage(p.id); onClose(); }} className="text-xl sm:text-2xl md:text-3xl font-black text-white uppercase tracking-tighter hover:text-emerald-400 transition-colors">{p.label}</button>
        ))}
        <button onClick={() => { setPage('dashboard'); onClose(); }} className="text-xl sm:text-2xl md:text-3xl font-black text-slate-400 uppercase tracking-tighter hover:text-emerald-400 transition-colors">Staff</button>
        <a href={`tel:${content.global.phone.replace(/\D/g,'')}`} className="mt-6 sm:mt-8 bg-emerald-500 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg sm:rounded-2xl font-bold text-base sm:text-lg md:text-xl flex items-center justify-center gap-2 sm:gap-3 mx-auto w-fit">
          <Phone size={18} /> Call Now
        </a>
      </nav>
    </div>
  );
};

export default MobileMenu;