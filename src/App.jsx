import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, setDoc, deleteDoc, orderBy, getDoc } from 'firebase/firestore';
import { 
  Phone, Mail, MapPin, Clock, Droplets, Leaf, ShieldCheck, Star, 
  Menu, X, ArrowRight, Instagram, Facebook, Youtube, CheckCircle2, 
  Flower, Wind, Calendar, Lock, LogOut, Upload, Image as ImageIcon, 
  Loader2, AlertCircle, Trash2, Smartphone, Flame, Send, Camera,
  Sparkles, Bot, MessageSquare, SendHorizontal, PenTool, Save, Edit3, Plus, User, Users, FileText, Layout, Eye, EyeOff, Crop
} from 'lucide-react';

// --- CONFIGURATION ---

const firebaseConfig = {
  apiKey: "AIzaSyA6Bn-r5R_m7ZyUQHjC5dnwAX_KcmKtYCw",
  authDomain: "robwestplumbing-2eb06.firebaseapp.com",
  projectId: "robwestplumbing-2eb06",
  storageBucket: "robwestplumbing-2eb06.firebasestorage.app",
  messagingSenderId: "1016017584876",
  appId: "1:1016017584876:web:2de84f833e7747ef459bc9",
  measurementId: "G-11YJK1JPV7"
};

// Use environment variable for Gemini, or fallback to empty string to prevent crash if missing
// If you have a VITE_GEMINI_API_KEY in your .env file, it will use that.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ""; 

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'rob-west-plumbing-main';

// --- DEFAULT CONTENT (Fallback / Initial State) ---
const DEFAULT_CONTENT = {
  pages: [
    { id: 'home', label: 'Home', type: 'fixed', enabled: true, order: 0 },
    { id: 'services', label: 'Services', type: 'fixed', enabled: true, order: 1 },
    { id: 'community', label: 'Community', type: 'fixed', enabled: true, order: 2 },
    { id: 'about', label: 'About', type: 'fixed', enabled: true, order: 3 },
  ],
  global: {
    logo: "/IMG_20251219_082826329_HDR.jpg", // Ensure this file is in the 'public' folder
    phone: "(773) 290-8232",
    address: "1102 N California Ave",
    hours: "7 AM - 7 PM",
    license: "License #055-037380",
    social: {
      facebook: "https://facebook.com",
      instagram: "https://instagram.com",
      youtube: "https://youtube.com"
    }
  },
  home: {
    heroTitle: "Quality & Reliability Meet Service.",
    heroSubtitle: "Welcome to Rob West Plumbing Inc. Licensed, bonded, and insured plumbing solutions for over 20 years!",
    heroImage: "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&q=80&w=2000",
    promoText: "Customer Satisfaction",
    promoLinkText: "4.8/5 on Facebook",
    promoLinkUrl: "https://facebook.com"
  },
  services: {
    title: "Full Service Plumbing",
    description: "Rob West Plumbing handles virtually any plumbing issue. We specialize in both traditional mechanics and environmental water management."
  },
  community: {
    title: "Our Humboldt Park Roots.",
    description: "Rob West Plumbing is more than a service company; we are an active thread in the Humboldt Park neighborhood fabric."
  },
  about: {
    title: "About Us",
    description: "Family-owned, licensed, bonded, and insured plumbing company serving Chicago for over 20 years.",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=1000",
    team: []
  }
};

// --- UTILITIES ---

const handleImageError = (e) => {
  e.target.onerror = null; 
  e.target.src = 'https://placehold.co/800x600/064e3b/ffffff?text=Image+Unavailable';
};

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const scaleSize = MAX_WIDTH / img.width;
        if (scaleSize < 1) {
            canvas.width = MAX_WIDTH;
            canvas.height = img.height * scaleSize;
        } else {
            canvas.width = img.width;
            canvas.height = img.height;
        }
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const getAssetPath = (fileName) => {
  // Points to root/public folder
  return `/${fileName.replace(/^\//, '')}`; 
};

// --- COMPONENTS ---

const RobWestLogo = ({ className = "h-16 w-auto", logoUrl }) => {
  return (
    <div className={`${className} flex items-center justify-start overflow-hidden relative`}>
      <img 
        src={logoUrl || DEFAULT_CONTENT.global.logo} 
        alt="Rob West Plumbing Inc." 
        className="h-[180%] w-auto object-cover object-top -mt-2" 
        onError={(e) => {
          e.target.onerror = null;
          e.target.style.display = 'none';
          e.target.parentNode.innerHTML = '<div class="text-[10px] bg-red-100 text-red-600 p-1 border border-red-300 rounded font-bold">Logo Missing (Check Public Folder)</div>';
        }}
      />
    </div>
  );
};

// --- GEMINI AI ASSISTANT ---
const GeminiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'system', text: "Hello! I'm the Rob West AI Assistant. ✨ Describe your plumbing issue, and I'll give you a quick assessment!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isOpen]);

  const callGemini = async (userText) => {
    setLoading(true);
    const updatedMessages = [...messages, { role: 'user', text: userText }];
    setMessages(updatedMessages);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: userText }] }],
            systemInstruction: {
              parts: [{ text: "You are a friendly, expert plumbing assistant for Rob West Plumbing in Chicago. Provide helpful, safety-conscious advice. If a problem sounds serious (gas, flooding, sewer backup), urge them to call (773) 290-8232 immediately. Keep answers concise (under 3 sentences). Always be polite and local-focused." }]
            }
          })
        }
      );
      const data = await response.json();
      const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm having trouble connecting right now. Please call our office directly!";
      setMessages(prev => [...prev, { role: 'model', text: botResponse }]);
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I couldn't reach the AI server. Please try again or call us." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 mb-4 overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-5 duration-300 flex flex-col max-h-[500px]">
          <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2"><Sparkles size={18} className="text-yellow-300" /><h3 className="font-bold text-sm">AI Diagnostic Helper</h3></div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-emerald-700 p-1 rounded-full transition-colors"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3 min-h-[300px]">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>{msg.text}</div>
              </div>
            ))}
            {loading && <div className="flex justify-start"><div className="bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2 text-slate-500 text-xs font-bold"><Loader2 className="animate-spin" size={12} /> Analyzing...</div></div>}
            <div ref={messagesEndRef} />
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if(input.trim() && !loading) { callGemini(input); setInput(''); }}} className="p-3 bg-white border-t border-slate-100 flex gap-2">
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your issue..." className="flex-1 bg-slate-100 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <button type="submit" disabled={loading || !input.trim()} className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"><SendHorizontal size={18} /></button>
          </form>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className="pointer-events-auto bg-emerald-600 text-white p-4 rounded-full shadow-xl shadow-emerald-900/30 hover:scale-110 hover:bg-emerald-500 transition-all flex items-center gap-2 font-bold group">
        {isOpen ? <X size={24} /> : <Bot size={24} />}
        {!isOpen && <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Ask AI Helper</span>}
      </button>
    </div>
  );
};

// --- PAGES & SECTIONS ---

const MobileMenu = ({ isOpen, onClose, setPage, content }) => {
  if (!isOpen) return null;
  const pages = content.pages || DEFAULT_CONTENT.pages;
  const visiblePages = pages.filter(p => p.enabled);

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

const CustomPage = ({ pageData }) => (
  <div className="animate-in fade-in duration-500 pt-32 pb-24">
    <div className="max-w-4xl mx-auto px-4">
      <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-8 uppercase tracking-tighter leading-none">{pageData.title || pageData.label}</h2>
      <div className="prose prose-lg prose-emerald text-slate-600 whitespace-pre-wrap">
        {pageData.content || "Content coming soon..."}
      </div>
    </div>
  </div>
);

const HomePage = ({ setPage, content, reviews = [] }) => {
  const displayReviews = reviews.length > 0 ? reviews : [
    { name: "Sarah M.", rating: 5, text: "Rob came out same-day and fixed our water heater. Absolutely amazing service and very professional!" },
    { name: "Mike D.", rating: 5, text: "Best plumber in Humboldt Park. Honest pricing and clean work. Highly recommend!" },
    { name: "Jessica T.", rating: 5, text: "They installed our rain barrels and did a great job explaining the system. Love supporting a local business." }
  ];

  return (
    <div className="animate-in fade-in duration-500">
      <section className="relative pt-32 pb-48 overflow-hidden bg-emerald-950 border-b border-emerald-900">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/80 to-transparent z-10" />
          <img src={content.home.heroImage} alt="Hero" className="w-full h-full object-cover opacity-40 mix-blend-overlay" onError={handleImageError} />
        </div>
        <div className="max-w-7xl mx-auto px-4 relative z-20">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold mb-8 uppercase tracking-widest border border-emerald-500/30"><MapPin size={14} /> {content.global.address}</div>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] mb-8 tracking-tight whitespace-pre-line">{content.home.heroTitle}</h1>
            <p className="text-xl text-emerald-100/80 mb-10 leading-relaxed max-w-2xl whitespace-pre-line">{content.home.heroSubtitle}</p>
            <div className="flex flex-col sm:flex-row gap-5">
              <button onClick={() => setPage('services')} className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-900/50 flex items-center justify-center gap-2">Explore Services <ArrowRight size={20} /></button>
              <a href={`tel:${content.global.phone.replace(/\D/g,'')}`} className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-emerald-950 transition-all flex items-center justify-center gap-2"><Phone size={20} /> {content.global.phone}</a>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION ON HOMEPAGE */}
      <section className="py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4">
           <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-6 uppercase tracking-tighter">What Our Neighbors Say</h2>
              <div className="w-24 h-1.5 bg-emerald-500 mx-auto rounded-full mb-6"></div>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">Trusted by hundreds of homeowners across Chicago.</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-8">
             {displayReviews.slice(0, 3).map((review, idx) => (
               <div key={idx} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300">
                  <div className="flex gap-1 mb-6">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={18} fill={i < (review.rating || 5) ? "#fbbf24" : "none"} stroke={i < (review.rating || 5) ? "none" : "#fbbf24"} />
                    ))}
                  </div>
                  <p className="text-slate-600 mb-8 italic leading-relaxed text-lg">"{review.text}"</p>
                  <div className="flex items-center gap-4 mt-auto border-t border-slate-100 pt-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                      {review.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-slate-900 font-bold">{review.name}</p>
                      <p className="text-emerald-600 text-xs font-bold uppercase tracking-wide">Verified Customer</p>
                    </div>
                  </div>
               </div>
             ))}
           </div>
        </div>
      </section>

      <section className="py-12 bg-white border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex flex-col md:flex-row items-center justify-center gap-6 bg-slate-50 p-6 rounded-3xl shadow-sm border border-slate-200">
              <h3 className="text-xl font-black uppercase tracking-tight text-emerald-950">{content.home.promoText}</h3>
              <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
              <a href={content.home.promoLinkUrl || content.global.social?.facebook || "#"} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-[#1877F2] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:scale-105"><Facebook size={24} fill="currentColor" /><span className="text-lg">{content.home.promoLinkText}</span></a>
          </div>
        </div>
      </section>
    </div>
  );
};

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
            <a href={`tel:${content.global.phone.replace(/\D/g,'')}`} className="w-full bg-emerald-600 text-white text-center py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 mt-auto"><Calendar size={18} /> Book Now</a>
          </div>
        ))}
      </div>
    </div>
  </div>
);

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
                  <img src={img.url} className="w-full h-full object-cover" onError={handleImageError} />
               </div>
             ))}
           </div>
         ) : (<div className="py-20 text-center bg-slate-50 rounded-[3rem] border border-slate-200"><ImageIcon className="mx-auto text-slate-300 mb-4" size={64} /><h4 className="text-xl font-bold text-slate-400 uppercase tracking-tight">Gallery Empty</h4></div>)}
      </div>
    </div>
  </div>
);

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
                <img src={content.about.image} className="w-full h-full object-cover" onError={handleImageError} />
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
                     <img src={member.image || "https://placehold.co/400x400/e2e8f0/64748b?text=No+Image"} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={handleImageError} />
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

const StaffPortal = ({ setPage, dynamicImages, content, setContent }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fileData, setFileData] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('pages'); 
  const [editContent, setEditContent] = useState(content);

  useEffect(() => { const u = onAuthStateChanged(auth, setUser); return () => u(); }, []);
  useEffect(() => { setEditContent(content); }, [content]);

  const ALLOWED_EMAILS = ['rigo@robwestplumbing.com', 'rob@robwestplumbing.com'];

  const handleLogin = async (e) => {
    e.preventDefault(); setError('');
    if (!ALLOWED_EMAILS.includes(emailInput.toLowerCase().trim())) { setError('Access Denied'); return; }
    setLoading(true);
    try { await signInWithEmailAndPassword(auth, emailInput, passwordInput); } catch (err) { setError('Invalid credentials.'); } finally { setLoading(false); }
  };

  const handleFileUpload = async (e, setFn) => {
    const file = e.target.files[0];
    if (file) { setLoading(true); try { const c = await compressImage(file); setFn(c); setError(''); } catch { setError('Error'); } finally { setLoading(false); } }
  };

  const handleContentImageUpload = async (e, section, key) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      try {
        const compressed = await compressImage(file);
        setEditContent(prev => ({
          ...prev,
          [section]: { ...prev[section], [key]: compressed }
        }));
      } catch (err) { setError("Image upload failed"); } finally { setLoading(false); }
    }
  };

  const handleTeamImageUpload = async (e, idx) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      try {
        const compressed = await compressImage(file);
        const newTeam = [...(editContent.about.team || [])];
        newTeam[idx] = { ...newTeam[idx], image: compressed };
        setEditContent(prev => ({ ...prev, about: { ...prev.about, team: newTeam } }));
      } catch (err) { setError("Upload failed"); } finally { setLoading(false); }
    }
  };

  const addTeamMember = () => {
    const newMember = { name: "New Member", role: "Role", bio: "Short bio goes here...", image: "" };
    const currentTeam = editContent.about.team || [];
    setEditContent(prev => ({ ...prev, about: { ...prev.about, team: [...currentTeam, newMember] } }));
  };

  const removeTeamMember = (idx) => {
    if(!confirm("Remove this team member?")) return;
    const newTeam = [...(editContent.about.team || [])];
    newTeam.splice(idx, 1);
    setEditContent(prev => ({ ...prev, about: { ...prev.about, team: newTeam } }));
  };

  const updateTeamMember = (idx, field, val) => {
    const newTeam = [...(editContent.about.team || [])];
    newTeam[idx] = { ...newTeam[idx], [field]: val };
    setEditContent(prev => ({ ...prev, about: { ...prev.about, team: newTeam } }));
  };

  const updatePageLabel = (id, newLabel) => {
     const newPages = editContent.pages.map(p => p.id === id ? { ...p, label: newLabel } : p);
     setEditContent(prev => ({ ...prev, pages: newPages }));
  };

  const togglePageVisibility = (id) => {
     const newPages = editContent.pages.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p);
     setEditContent(prev => ({ ...prev, pages: newPages }));
  };

  const addCustomPage = () => {
    const label = prompt("Enter page name (e.g., FAQ):");
    if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]/g, '-');
    if (editContent.pages.find(p => p.id === id)) { alert("Page ID exists!"); return; }
    const newPage = { id, label, type: 'custom', enabled: true, title: label, content: 'Add your content here...' };
    setEditContent(prev => ({ ...prev, pages: [...prev.pages, newPage] }));
  };

  const deleteCustomPage = (id) => {
    if(!confirm("Delete this page?")) return;
    setEditContent(prev => ({ ...prev, pages: prev.pages.filter(p => p.id !== id) }));
  };

  const updateCustomPageContent = (id, field, val) => {
    const newPages = editContent.pages.map(p => p.id === id ? { ...p, [field]: val } : p);
    setEditContent(prev => ({ ...prev, pages: newPages }));
  };

  const saveToGallery = async () => {
    if (!fileData || !user) return;
    setLoading(true);
    try { 
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), { url: fileData, createdAt: new Date().toISOString(), uploadedBy: user.uid }); 
      setSuccess(true); setFileData(null); setTimeout(() => setSuccess(false), 3000); 
    } catch { setError('Failed'); } finally { setLoading(false); }
  };

  const saveContent = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'site_content', 'main'), editContent);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError("Failed to save content");
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (docId) => { if(confirm("Delete?")) { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gallery', docId)); } catch { setError("Failed"); } } };

  // if (!user || user.isAnonymous) {
  //   return (
  //     <div className="min-h-[60vh] flex items-center justify-center p-4 animate-in fade-in duration-500">
  //       <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md text-center">
  //         <Lock className="w-16 h-16 text-emerald-600 mx-auto mb-6" /><h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Staff Portal</h2>
  //         <form onSubmit={handleLogin} className="space-y-4">
  //           <input type="text" required placeholder="Email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
  //           <input type="password" required placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
  //           {error && <div className="text-red-500 text-xs font-bold">{error}</div>}
  //           <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700">{loading ? <Loader2 className="animate-spin" /> : 'Login'}</button>
  //         </form>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-[70vh] p-4 lg:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Staff Dashboard</h2>
          <p className="text-emerald-600 font-bold">{user?.email}</p>
        </div>
        <button onClick={() => { signOut(auth); }} className="flex items-center gap-2 text-slate-500 font-bold hover:text-red-500 uppercase text-xs">Logout <LogOut size={16} /></button>
      </div>
      
      {/* TABS */}
      <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
        <button onClick={() => setActiveTab('pages')} className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'pages' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>Pages & Navigation</button>
        <button onClick={() => setActiveTab('content')} className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'content' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>Site Editor</button>
        <button onClick={() => setActiveTab('team')} className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'team' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>Team Manager</button>
        <button onClick={() => setActiveTab('gallery')} className={`px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap ${activeTab === 'gallery' ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>Gallery</button>
      </div>

      {activeTab === 'gallery' && (
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-8">
              <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl">
                <h3 className="text-xl font-black mb-6 uppercase tracking-tight flex items-center gap-2"><Upload size={20} /> Upload to Gallery</h3>
                <label className="block w-full cursor-pointer mb-4"><div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-emerald-400 bg-slate-50"><ImageIcon className="mx-auto text-slate-300 mb-2" size={32} /><p className="text-xs font-bold text-slate-500">Select Photo</p><input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setFileData)} /></div></label>
                {fileData && <><img src={fileData} className="w-full h-24 object-cover rounded-xl mb-3" /><button disabled={loading} onClick={saveToGallery} className="w-full bg-emerald-600 text-white py-2 rounded-xl font-bold">Confirm Upload</button></>}
                {success && <p className="text-emerald-600 font-bold text-center text-sm">Success!</p>}
              </div>
          </div>
          <div className="lg:col-span-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-inner h-fit">
             <h3 className="text-xl font-black uppercase tracking-tight mb-6">Gallery Images ({dynamicImages.length})</h3>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto p-2">
               {dynamicImages.map((img) => (<div key={img.id} className="relative group aspect-square bg-white rounded-2xl overflow-hidden shadow-sm"><img src={img.url} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-red-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => deleteImage(img.id)}><Trash2 className="text-white" /></div></div>))}
             </div>
          </div>
        </div>
      )}

      {/* TEAM MANAGER TAB */}
      {activeTab === 'team' && (
        <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
           {/* Header */}
           <div className="flex justify-between items-center mb-8 pb-8 border-b border-slate-100">
              <div><h3 className="text-2xl font-black uppercase tracking-tight">Team Manager</h3><p className="text-slate-500 text-sm">Add, edit, or remove team members.</p></div>
              <button onClick={saveContent} disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg hover:scale-105 transition-all">{loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Save Changes</>}</button>
           </div>
           
           {success && <div className="mb-6 bg-emerald-100 text-emerald-800 p-4 rounded-xl font-bold flex items-center gap-2"><CheckCircle2 /> Team Updated Successfully!</div>}

           {/* Grid Layout */}
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Add Button Card */}
              <button onClick={addTeamMember} className="border-3 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center p-8 hover:border-emerald-400 hover:bg-emerald-50 transition-all group h-full min-h-[400px]">
                 <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-sm"><Plus size={32} /></div>
                 <span className="font-black text-emerald-800 uppercase tracking-tight">Add Team Member</span>
              </button>

              {/* Member Cards */}
              {editContent.about.team?.map((member, idx) => (
                 <div key={idx} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 relative group transition-all hover:shadow-lg hover:border-emerald-200">
                    <button onClick={() => removeTeamMember(idx)} className="absolute top-4 right-4 bg-white text-red-400 p-2 rounded-full shadow-md hover:text-red-600 hover:bg-red-50 z-10 transition-colors"><Trash2 size={16} /></button>
                    
                    {/* Image Upload Area */}
                    <div className="aspect-square bg-white rounded-2xl mb-4 overflow-hidden relative border border-slate-200 shadow-inner group-hover:shadow-none transition-shadow">
                       <img src={member.image || "https://placehold.co/400x400/e2e8f0/64748b?text=No+Photo"} className="w-full h-full object-cover" />
                       <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white font-bold backdrop-blur-sm">
                          <Camera size={24} className="mb-2"/>
                          <span>Change Photo</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleTeamImageUpload(e, idx)} />
                       </label>
                    </div>

                    {/* Inputs */}
                    <div className="space-y-3">
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Full Name</label>
                          <input type="text" placeholder="Name" value={member.name} onChange={(e) => updateTeamMember(idx, 'name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Role / Title</label>
                          <input type="text" placeholder="Role (e.g. Master Plumber)" value={member.role} onChange={(e) => updateTeamMember(idx, 'role', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Short Bio</label>
                          <textarea placeholder="Write a short description..." value={member.bio} onChange={(e) => updateTeamMember(idx, 'bio', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" rows={3} />
                       </div>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
           <div className="flex justify-between items-center mb-8 pb-8 border-b border-slate-100">
             <div><h3 className="text-2xl font-black uppercase tracking-tight">Edit Site Content</h3><p className="text-slate-500 text-sm">Update text and main images across the website.</p></div>
             <button onClick={saveContent} disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg hover:scale-105 transition-all">{loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Save Changes</>}</button>
           </div>
           
           {success && <div className="mb-6 bg-emerald-100 text-emerald-800 p-4 rounded-xl font-bold flex items-center gap-2"><CheckCircle2 /> Content Updated Successfully!</div>}
           {error && <div className="mb-6 bg-red-100 text-red-800 p-4 rounded-xl font-bold flex items-center gap-2"><AlertCircle /> {error}</div>}

           <div className="space-y-12">
              {/* GLOBAL */}
              <div className="space-y-4">
                <h4 className="font-black text-lg text-emerald-800 uppercase tracking-widest border-b border-emerald-100 pb-2">Global Settings</h4>
                
                {/* NEW: LOGO UPLOADER */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Site Logo (Upload Business Card Here)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-lg border border-slate-300 overflow-hidden flex items-center justify-center">
                       <img src={editContent.global.logo || DEFAULT_CONTENT.global.logo} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                       <input type="file" accept="image/*" onChange={(e) => handleContentImageUpload(e, 'global', 'logo')} className="text-sm font-bold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                       <p className="text-xs text-slate-400 mt-1">Upload the business card image here. The site will attempt to crop it to show only the logo.</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Phone Number</label><input type="text" value={editContent.global.phone} onChange={(e) => setEditContent({...editContent, global: {...editContent.global, phone: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Address</label><input type="text" value={editContent.global.address} onChange={(e) => setEditContent({...editContent, global: {...editContent.global, address: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium" /></div>
                </div>
                <div className="space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase">Social Media Links</label>
                   <div className="grid md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200"><Facebook size={18} className="text-blue-600 shrink-0" /><input type="text" placeholder="Facebook URL" value={editContent.global.social?.facebook || ''} onChange={(e) => setEditContent({...editContent, global: {...editContent.global, social: {...(editContent.global.social || {}), facebook: e.target.value}}})} className="bg-transparent w-full text-sm font-medium focus:outline-none" /></div>
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200"><Instagram size={18} className="text-pink-600 shrink-0" /><input type="text" placeholder="Instagram URL" value={editContent.global.social?.instagram || ''} onChange={(e) => setEditContent({...editContent, global: {...editContent.global, social: {...(editContent.global.social || {}), instagram: e.target.value}}})} className="bg-transparent w-full text-sm font-medium focus:outline-none" /></div>
                      <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200"><Youtube size={18} className="text-red-600 shrink-0" /><input type="text" placeholder="YouTube URL" value={editContent.global.social?.youtube || ''} onChange={(e) => setEditContent({...editContent, global: {...editContent.global, social: {...(editContent.global.social || {}), youtube: e.target.value}}})} className="bg-transparent w-full text-sm font-medium focus:outline-none" /></div>
                   </div>
                </div>
              </div>

              {/* HOME PAGE */}
              <div className="space-y-4">
                <h4 className="font-black text-lg text-emerald-800 uppercase tracking-widest border-b border-emerald-100 pb-2">Home Page</h4>
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Hero Title</label><textarea rows={2} value={editContent.home.heroTitle} onChange={(e) => setEditContent({...editContent, home: {...editContent.home, heroTitle: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium resize-none" /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Hero Subtitle</label><textarea rows={3} value={editContent.home.heroSubtitle} onChange={(e) => setEditContent({...editContent, home: {...editContent.home, heroSubtitle: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium resize-none" /></div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Promo Banner Text</label><input type="text" value={editContent.home.promoText} onChange={(e) => setEditContent({...editContent, home: {...editContent.home, promoText: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium" /></div>
                  <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Promo Link Text</label><input type="text" value={editContent.home.promoLinkText} onChange={(e) => setEditContent({...editContent, home: {...editContent.home, promoLinkText: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium" /></div>
                  <div className="space-y-2 md:col-span-2"><label className="text-xs font-bold text-slate-500 uppercase">Promo Link URL</label><input type="text" placeholder="https://facebook.com/..." value={editContent.home.promoLinkUrl || ''} onChange={(e) => setEditContent({...editContent, home: {...editContent.home, promoLinkUrl: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium" /></div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Hero Background Image</label>
                  <div className="flex items-center gap-4">
                    <img src={editContent.home.heroImage} className="w-32 h-20 object-cover rounded-lg border border-slate-300" />
                    <input type="file" accept="image/*" onChange={(e) => handleContentImageUpload(e, 'home', 'heroImage')} className="text-sm font-bold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                  </div>
                </div>
              </div>

              {/* SERVICES PAGE */}
              <div className="space-y-4">
                <h4 className="font-black text-lg text-emerald-800 uppercase tracking-widest border-b border-emerald-100 pb-2">Services Page</h4>
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Page Title</label><input type="text" value={editContent.services.title} onChange={(e) => setEditContent({...editContent, services: {...editContent.services, title: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium" /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Intro Description</label><textarea rows={3} value={editContent.services.description} onChange={(e) => setEditContent({...editContent, services: {...editContent.services, description: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium resize-none" /></div>
              </div>

              {/* COMMUNITY PAGE */}
              <div className="space-y-4">
                <h4 className="font-black text-lg text-emerald-800 uppercase tracking-widest border-b border-emerald-100 pb-2">Community Page</h4>
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Page Title</label><input type="text" value={editContent.community.title} onChange={(e) => setEditContent({...editContent, community: {...editContent.community, title: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium" /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Intro Description</label><textarea rows={3} value={editContent.community.description} onChange={(e) => setEditContent({...editContent, community: {...editContent.community, description: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium resize-none" /></div>
              </div>

              {/* ABOUT PAGE */}
              <div className="space-y-4">
                <h4 className="font-black text-lg text-emerald-800 uppercase tracking-widest border-b border-emerald-100 pb-2">About Page</h4>
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Page Title</label><input type="text" value={editContent.about.title} onChange={(e) => setEditContent({...editContent, about: {...editContent.about, title: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium" /></div>
                <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase">Description</label><textarea rows={4} value={editContent.about.description} onChange={(e) => setEditContent({...editContent, about: {...editContent.about, description: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-medium resize-none" /></div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">About Image</label>
                  <div className="flex items-center gap-4">
                    <img src={editContent.about.image} className="w-32 h-20 object-cover rounded-lg border border-slate-300" />
                    <input type="file" accept="image/*" onChange={(e) => handleContentImageUpload(e, 'about', 'image')} className="text-sm font-bold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                  </div>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* NEW: PAGES MANAGER TAB */}
      {activeTab === 'pages' && (
        <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
          <div className="flex justify-between items-center mb-8 pb-8 border-b border-slate-100">
             <div><h3 className="text-2xl font-black uppercase tracking-tight">Pages & Navigation</h3><p className="text-slate-500 text-sm">Manage menu tabs and add custom pages.</p></div>
             <div className="flex gap-2">
                <button onClick={addCustomPage} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 flex items-center gap-2"><Plus size={18} /> Add Page</button>
                <button onClick={saveContent} disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg hover:scale-105 transition-all">{loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Save Changes</>}</button>
             </div>
          </div>

          {success && <div className="mb-6 bg-emerald-100 text-emerald-800 p-4 rounded-xl font-bold flex items-center gap-2"><CheckCircle2 /> Navigation Updated Successfully!</div>}
          
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-4">
               <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Site Menu Structure</h4>
               {editContent.pages?.map((page) => (
                 <div key={page.id} className={`p-4 rounded-xl border flex items-center gap-4 ${page.enabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-75'}`}>
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-400"><Layout size={20} /></div>
                    <div className="grow">
                      <div className="flex items-center gap-2 mb-1">
                         <input 
                           type="text" 
                           value={page.label} 
                           onChange={(e) => updatePageLabel(page.id, e.target.value)} 
                           className="font-bold text-slate-900 bg-transparent border-b border-transparent focus:border-emerald-500 focus:outline-none hover:border-slate-300 transition-colors w-full" 
                         />
                         <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{page.type}</span>
                      </div>
                      <p className="text-xs text-slate-500">/{page.id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <button onClick={() => togglePageVisibility(page.id)} className={`p-2 rounded-lg transition-colors ${page.enabled ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}>
                         {page.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
                       </button>
                       {page.type === 'custom' && (
                         <button onClick={() => deleteCustomPage(page.id)} className="p-2 rounded-lg text-red-400 bg-red-50 hover:bg-red-100 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
                       )}
                    </div>
                 </div>
               ))}
            </div>
            
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 h-fit">
               <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Edit3 size={16} /> Edit Custom Page Content</h4>
               <p className="text-xs text-slate-500 mb-6">Select a custom page from the list to edit its title and body content.</p>
               
               {editContent.pages?.filter(p => p.type === 'custom').map(page => (
                 <div key={page.id} className="bg-white p-6 rounded-2xl border border-slate-200 mb-6 shadow-sm">
                    <h5 className="font-bold text-lg mb-4 flex items-center gap-2">{page.label} <span className="text-xs font-normal text-slate-400">({page.id})</span></h5>
                    <div className="space-y-4">
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Page Title</label>
                          <input type="text" value={page.title || page.label} onChange={(e) => updateCustomPageContent(page.id, 'title', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold" />
                       </div>
                       <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 block">Body Content</label>
                          <textarea rows={6} value={page.content || ''} onChange={(e) => updateCustomPageContent(page.id, 'content', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm resize-none font-medium" />
                       </div>
                    </div>
                 </div>
               ))}

               {editContent.pages?.filter(p => p.type === 'custom').length === 0 && (
                 <div className="text-center py-12 text-slate-400">
                    <Layout size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="font-bold text-sm">No custom pages yet.</p>
                    <button onClick={addCustomPage} className="text-emerald-600 text-xs font-bold mt-2 hover:underline">Create one now</button>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FooterReviewForm = ({ onSubmit, content, reviews = [] }) => {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e) => { e.preventDefault(); if(name && text) { onSubmit({ name, rating, text }); setSubmitted(true); setName(''); setText(''); setTimeout(() => setSubmitted(false), 3000); } };
  
  // Safe access to social links
  const social = content?.global?.social || {};

  // Calculate average rating
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + (parseInt(r.rating) || 0), 0) / reviews.length).toFixed(1) 
    : "5.0";

  return (
    <div className="bg-slate-900 border-t border-slate-800 py-20">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* REVIEWS DISPLAY SECTION */}
        <div className="mb-20">
           <div className="text-center mb-12">
              <h4 className="text-emerald-500 font-bold uppercase tracking-widest text-xs mb-3">Customer Feedback</h4>
              <h3 className="text-3xl md:text-4xl font-black text-white mb-6">What Our Neighbors Say</h3>
              <div className="inline-flex items-center justify-center gap-4 bg-slate-800 px-6 py-3 rounded-2xl border border-slate-700/50">
                 <span className="text-4xl font-black text-white">{averageRating}</span>
                 <div className="flex flex-col items-start">
                   <div className="flex gap-1 mb-1">
                     {[1,2,3,4,5].map(star => (
                       <Star key={star} size={18} fill={star <= Math.round(averageRating) ? "#fbbf24" : "none"} stroke={star <= Math.round(averageRating) ? "none" : "#475569"} />
                     ))}
                   </div>
                   <span className="text-slate-400 text-xs font-bold uppercase tracking-wide">{reviews.length} Verified Reviews</span>
                 </div>
              </div>
           </div>

           {reviews.length > 0 ? (
             <div className="grid md:grid-cols-3 gap-6">
               {reviews.slice(0, 3).map((review, idx) => (
                 <div key={idx} className="bg-slate-800/50 p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/30 transition-all">
                    <div className="flex gap-1 mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < (review.rating || 5) ? "#fbbf24" : "none"} stroke={i < (review.rating || 5) ? "none" : "#475569"} />
                      ))}
                    </div>
                    <p className="text-slate-300 mb-6 italic leading-relaxed">"{review.text}"</p>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className="w-8 h-8 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center font-black text-xs">
                        {review.name.charAt(0)}
                      </div>
                      <p className="text-emerald-400 font-bold text-sm">{review.name}</p>
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center p-12 bg-slate-800/30 rounded-3xl border border-slate-800 border-dashed">
                <MessageSquare className="mx-auto text-slate-600 mb-4" size={32} />
                <p className="text-slate-500 italic font-medium">Be the first to leave a review!</p>
             </div>
           )}
        </div>

        {/* LEAVE A REVIEW FORM */}
        <div className="max-w-2xl mx-auto border-t border-slate-800 pt-16">
          <h4 className="text-white font-bold text-center mb-8 uppercase tracking-widest text-sm">Share Your Experience</h4>
          {submitted ? <div className="bg-emerald-600 text-white p-6 rounded-2xl text-center animate-in fade-in zoom-in"><CheckCircle2 className="mx-auto mb-2" /><p className="font-bold">Thank you for your feedback!</p></div> : 
            <form onSubmit={handleSubmit} className="space-y-4 mb-16">
              <div className="grid grid-cols-2 gap-4"><input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} className="bg-slate-800 text-white placeholder:text-slate-500 rounded-xl p-4 font-bold border border-slate-700 focus:border-emerald-500 focus:outline-none transition-colors" required /><div className="flex items-center justify-center bg-slate-800 rounded-xl px-4 gap-1 border border-slate-700">{[1,2,3,4,5].map(star => (<Star key={star} size={24} fill={star <= rating ? "#fbbf24" : "none"} stroke={star <= rating ? "none" : "#475569"} className="cursor-pointer hover:scale-110 transition-transform" onClick={() => setRating(star)} />))}</div></div>
              <textarea placeholder="Describe your experience with us..." rows={4} value={text} onChange={e => setText(e.target.value)} className="w-full bg-slate-800 text-white placeholder:text-slate-500 rounded-xl p-4 font-bold resize-none border border-slate-700 focus:border-emerald-500 focus:outline-none transition-colors" required />
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20">Submit Review <Send size={18} /></button>
            </form>}
            
            {/* SOCIAL MEDIA LINKS */}
            <div className="flex flex-col items-center gap-6 border-t border-slate-800 pt-12">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Connect With Us</p>
              <div className="flex gap-4">
                {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="bg-slate-800 p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-[#1877F2] transition-all hover:-translate-y-1 shadow-lg"><Facebook size={24} /></a>}
                {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="bg-slate-800 p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-red-500 hover:to-purple-500 transition-all hover:-translate-y-1 shadow-lg"><Instagram size={24} /></a>}
                {social.youtube && <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="bg-slate-800 p-4 rounded-2xl text-slate-400 hover:text-white hover:bg-red-600 transition-all hover:-translate-y-1 shadow-lg"><Youtube size={24} /></a>}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App = () => {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState(null);
  const [dynamicImages, setDynamicImages] = useState([]);
  const [reviews, setReviews] = useState([]); // NEW: State for reviews
  const [siteContent, setSiteContent] = useState(DEFAULT_CONTENT);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (e) {
        console.error("Auth failed", e);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Fetch Data: Gallery + Site Content + Reviews
  useEffect(() => {
    if (!user) return;
    
    // Gallery Sync
    const unsubGallery = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), orderBy('createdAt', 'desc')), (s) => setDynamicImages(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.log("Gallery Sync", e));
    
    // Reviews Sync (NEW)
    const unsubReviews = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'reviews'), orderBy('createdAt', 'desc')), (s) => setReviews(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.log("Reviews Sync", e));

    // Site Content Sync
    const unsubContent = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'site_content', 'main'), (s) => {
      if (s.exists()) {
        const fetched = s.data();
        setSiteContent(prev => ({
          ...prev,
          ...fetched,
          // NEW: Ensure pages array exists
          pages: fetched.pages || prev.pages,
          global: { ...prev.global, ...fetched.global, social: { ...prev.global?.social, ...fetched.global?.social } },
          home: { ...prev.home, ...fetched.home },
          services: { ...prev.services, ...fetched.services },
          community: { ...prev.community, ...fetched.community },
          about: { ...prev.about, ...fetched.about, team: fetched.about?.team || prev.about.team },
        }));
      }
    }, e => console.log("Content Sync", e));

    return () => { unsubGallery(); unsubContent(); unsubReviews(); };
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => window.scrollTo(0, 0), [page]);

  const handleAddReview = async (d) => { if(user) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'reviews'), { ...d, createdAt: new Date().toISOString() }); };

  const renderPage = () => {
    // 1. Check if the current page is one of the fixed pages
    if (page === 'home') return <HomePage setPage={setPage} content={siteContent} reviews={reviews} />;
    if (page === 'services') return <ServicesPage content={siteContent} />;
    if (page === 'community') return <CommunityPage dynamicImages={dynamicImages} content={siteContent} />;
    if (page === 'staff') return <StaffPortal setPage={setPage} dynamicImages={dynamicImages} content={siteContent} setContent={setSiteContent} />;
    if (page === 'about') return <AboutPage content={siteContent} />;

    // 2. Check if it is a Custom Page
    const customPage = siteContent.pages?.find(p => p.id === page && p.type === 'custom');
    if (customPage) return <CustomPage pageData={customPage} />;

    // 3. Fallback
    return <HomePage setPage={setPage} content={siteContent} reviews={reviews} />;
  };

  // Get pages from content for navigation
  const visiblePages = (siteContent.pages || DEFAULT_CONTENT.pages).filter(p => p.enabled);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* ... existing header and nav ... */}
      <div className="bg-emerald-950 text-white py-2 px-4 text-xs font-medium border-b border-emerald-900 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6 items-center"><span className="flex items-center gap-1.5"><MapPin size={12} className="text-emerald-400" /> {siteContent.global.address}</span><span className="flex items-center gap-1.5"><Clock size={12} className="text-emerald-400" /> {siteContent.global.hours}</span></div>
          <div className="flex items-center gap-6"><button onClick={() => setPage('staff')} className="hover:text-emerald-400 flex items-center gap-1 transition-colors"><Lock size={12} /> Staff Portal</button><a href={`tel:${siteContent.global.phone.replace(/\D/g,'')}`} className="hover:text-emerald-300 font-bold">{siteContent.global.phone}</a></div>
        </div>
      </div>

      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-xl py-3' : 'bg-white/95 backdrop-blur-md py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <button onClick={() => setPage('home')} className="flex items-center gap-3 group text-left hover:opacity-80 transition-opacity">
            {/* UPDATED: Larger height, auto width, no HTML text next to it, using dynamic logo */}
            <RobWestLogo className="h-12 md:h-20 w-auto" logoUrl={siteContent.global.logo} />
          </button>
          <div className="hidden md:flex items-center gap-10 font-bold text-sm text-slate-700 uppercase tracking-widest">
            {/* DYNAMIC NAVIGATION MENU */}
            {visiblePages.map(p => (
              <button 
                key={p.id} 
                onClick={() => setPage(p.id)} 
                className={`transition-colors border-b-2 py-1 ${page === p.id ? 'text-emerald-600 border-emerald-600' : 'hover:text-emerald-600 border-transparent'}`}
              >
                {p.label}
              </button>
            ))}
            <a href={`tel:${siteContent.global.phone.replace(/\D/g,'')}`} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl hover:bg-emerald-700 shadow-lg flex items-center gap-2">Book Now <ArrowRight size={16} /></a>
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(true)}><Menu size={32} /></button>
        </div>
      </nav>

      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} setPage={setPage} content={siteContent} />

      <main className="min-h-[70vh]">{renderPage()}</main>
      <GeminiAssistant />
      {/* Pass reviews state to footer */}
      <FooterReviewForm onSubmit={handleAddReview} content={siteContent} reviews={reviews} />
      
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center md:text-left"><p className="text-xs uppercase tracking-widest">© 2025 Rob West Plumbing Inc. • {siteContent.global.license}</p></div>
      </footer>
    </div>
  );
};

export default App;