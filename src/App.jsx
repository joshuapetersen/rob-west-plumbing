import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { 
  Phone, Mail, MapPin, Clock, Droplets, Leaf, ShieldCheck, Star, 
  Menu, X, ArrowRight, Instagram, Facebook, Youtube, CheckCircle2, 
  Flower, Wind, Calendar, Lock, LogOut, Upload, Image as ImageIcon, 
  Loader2, AlertCircle, Trash2, Smartphone, Flame, Send, Camera,
  Sparkles, Bot, MessageSquare, SendHorizontal, PenTool
} from 'lucide-react';

// --- CONFIGURATION & INITIALIZATION ---

// HYBRID CONFIGURATION HANDLER
// This allows the app to work in BOTH the Chat Preview (Canvas) and your Vercel Deployment.

let firebaseConfig;
let apiKey = "";
const appId = typeof __app_id !== 'undefined' ? __app_id : 'rob-west-plumbing-main';

// 1. Try to load from Preview Environment (Canvas)
if (typeof __firebase_config !== 'undefined') {
  try {
    firebaseConfig = JSON.parse(__firebase_config);
  } catch (e) {
    console.warn("Preview config parse failed.");
  }
}

// 2. If not in preview, try to load from Vite Environment (Vercel/Local)
// We use a try-catch block to safely access import.meta.env without crashing the preview bundler
if (!firebaseConfig) {
  try {
    // Check if import.meta.env exists before accessing properties
    // This prevents "Cannot read properties of undefined" errors
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        appId: import.meta.env.VITE_FIREBASE_APP_ID
      };
      apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    }
  } catch (e) {
    console.warn("Vite env vars not found.");
  }
}

// 3. Fallback / Error State
if (!firebaseConfig) {
  console.error("No Firebase configuration found. Please check your .env file or environment variables.");
  // Provide a dummy config to prevent immediate crash, app will show error UI
  firebaseConfig = { apiKey: "", authDomain: "", projectId: "" };
}

// Initialize Firebase
let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error("Firebase Initialization Error:", error);
}

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
  // Use relative path for preview, absolute for prod if needed, or just handle both
  return `./${fileName}`;
};

// --- COMPONENTS ---

const RobWestLogo = ({ className = "w-12 h-12" }) => (
  <div className={`${className} flex items-center justify-center overflow-hidden rounded-full bg-white shadow-sm border border-slate-100`}>
    <img 
      src={getAssetPath("1000001024.jpg")} 
      alt="Rob West Plumbing Original Logo" 
      className="w-full h-full object-contain p-1"
      onError={(e) => {
        e.target.onerror = null;
        e.target.style.display = 'none';
        e.target.parentNode.innerHTML = '<div class="text-[8px] font-black text-emerald-900 text-center leading-tight">ROB<br/>WEST</div>';
      }}
    />
  </div>
);

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
    // Check if key is available (it might be empty in preview if not manually set, but works in Prod via Env)
    if (!apiKey) {
        // In preview, we might be using a proxy or missing the key. 
        // We'll try to proceed if we think we're in preview, otherwise show error.
        if (typeof __firebase_config === 'undefined') {
             setMessages(prev => [...prev, { role: 'user', text: userText }, { role: 'model', text: "AI Service Unavailable: API Key missing in configuration." }]);
             return;
        }
    }

    setLoading(true);
    const updatedMessages = [...messages, { role: 'user', text: userText }];
    setMessages(updatedMessages);
    
    // Determine the correct URL/Method based on environment
    const isPreview = typeof __firebase_config !== 'undefined';
    // In preview, apiKey variable is empty string, system injects it. In prod, we use the variable.
    const keyParam = isPreview ? "" : apiKey; 

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${keyParam}`,
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

const MobileMenu = ({ isOpen, onClose, setPage }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-40 bg-slate-900/95 backdrop-blur-sm md:hidden animate-in fade-in duration-200 flex flex-col justify-center items-center">
      <button onClick={onClose} className="absolute top-6 right-6 text-white p-2"><X size={40} /></button>
      <nav className="flex flex-col gap-8 text-center">
        {['home', 'services', 'community', 'about', 'staff'].map(p => (
          <button key={p} onClick={() => { setPage(p); onClose(); }} className="text-3xl font-black text-white uppercase tracking-tighter hover:text-emerald-400 transition-colors">{p}</button>
        ))}
        <a href="tel:7732908232" className="mt-8 bg-emerald-500 text-white px-8 py-4 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 mx-auto w-fit">
          <Phone /> Call Now
        </a>
      </nav>
    </div>
  );
};

const HomePage = ({ setPage }) => (
  <div className="animate-in fade-in duration-500">
    <section className="relative pt-32 pb-48 overflow-hidden bg-emerald-950 border-b border-emerald-900">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/90 via-emerald-950/80 to-transparent z-10" />
        <img src="https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&q=80&w=2000" alt="Chicago" className="w-full h-full object-cover opacity-40 mix-blend-overlay" onError={handleImageError} />
      </div>
      <div className="max-w-7xl mx-auto px-4 relative z-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 px-4 py-1.5 rounded-full text-xs font-bold mb-8 uppercase tracking-widest border border-emerald-500/30"><MapPin size={14} /> Humboldt Park • Chicago</div>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] mb-8 tracking-tight">Quality & Reliability<br/>Meet <span className="text-emerald-400">Service.</span></h1>
          <p className="text-xl text-emerald-100/80 mb-10 leading-relaxed max-w-2xl">Welcome to Rob West Plumbing Inc. Licensed, bonded, and insured plumbing solutions for over 20 years!</p>
          <div className="flex flex-col sm:flex-row gap-5">
            <button onClick={() => setPage('services')} className="bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-400 transition-all shadow-xl shadow-emerald-900/50 flex items-center justify-center gap-2">Explore Services <ArrowRight size={20} /></button>
            <a href="tel:7732908232" className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white hover:text-emerald-950 transition-all flex items-center justify-center gap-2"><Phone size={20} /> (773) 290-8232</a>
          </div>
        </div>
      </div>
    </section>
    <section className="py-12 bg-emerald-50/50 border-b border-emerald-100">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <div className="inline-flex flex-col md:flex-row items-center justify-center gap-6 bg-white p-6 rounded-3xl shadow-sm border border-emerald-100/50">
            <h3 className="text-xl font-black uppercase tracking-tight text-emerald-950">Customer Satisfaction</h3>
            <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
            <a href="https://www.facebook.com/pages/Rob-West-Plumbing-Inc/165024206842801" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-[#1877F2] text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:scale-105"><Facebook size={24} fill="currentColor" /><span className="text-lg">4.8/5 on Facebook</span></a>
        </div>
      </div>
    </section>
  </div>
);

const ServicesPage = () => (
  <div className="animate-in fade-in duration-500 pt-16">
    <div className="max-w-7xl mx-auto px-4 pb-24">
      <div className="text-center max-w-3xl mx-auto mb-20">
        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 uppercase tracking-tighter">Full Service Plumbing</h2>
        <p className="text-lg text-slate-600 leading-relaxed">Rob West Plumbing handles virtually any plumbing issue. We specialize in both traditional mechanics and environmental water management.</p>
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
            <a href="tel:7732908232" className="w-full bg-emerald-600 text-white text-center py-4 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg flex items-center justify-center gap-2 mt-auto"><Calendar size={18} /> Book Now</a>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const CommunityPage = ({ dynamicImages = [] }) => (
  <div className="animate-in fade-in duration-500 pt-16">
    <div className="max-w-7xl mx-auto px-4 pb-24">
      <div className="bg-emerald-950 rounded-[3rem] p-8 md:p-24 text-white relative overflow-hidden shadow-2xl mb-16">
        <div className="relative z-10 max-w-4xl">
          <h2 className="text-4xl md:text-7xl font-black mb-8 uppercase tracking-tight leading-none">Our Humboldt<br/><span className="text-emerald-400">Park Roots.</span></h2>
          <p className="text-emerald-100/80 text-xl leading-relaxed mb-12 max-w-2xl">Rob West Plumbing is more than a service company; we are an active thread in the Humboldt Park neighborhood fabric.</p>
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

const StaffPortal = ({ setPage, dynamicImages, currentAboutImage }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fileData, setFileData] = useState(null);
  const [aboutFileData, setAboutFileData] = useState(null);
  const [success, setSuccess] = useState(false);
  const [aboutSuccess, setAboutSuccess] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => { const u = onAuthStateChanged(auth, setUser); return () => u(); }, []);
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

  const saveToGallery = async () => {
    if (!fileData || !user) return;
    setLoading(true);
    try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), { url: fileData, createdAt: new Date().toISOString(), uploadedBy: user.uid }); setSuccess(true); setFileData(null); setTimeout(() => setSuccess(false), 3000); } catch { setError('Failed'); } finally { setLoading(false); }
  };

  const saveAboutImage = async () => {
    if (!aboutFileData || !user) return;
    setLoading(true);
    try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'site_config', 'main'), { aboutPageImage: aboutFileData, lastUpdatedBy: user.email, updatedAt: new Date().toISOString() }, { merge: true }); setAboutSuccess(true); setAboutFileData(null); setTimeout(() => setAboutSuccess(false), 3000); } catch { setError('Failed'); } finally { setLoading(false); }
  };

  const deleteImage = async (docId) => { if(confirm("Delete?")) { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gallery', docId)); } catch { setError("Failed"); } } };

  if (!user || user.isAnonymous) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 animate-in fade-in duration-500">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md text-center">
          <Lock className="w-16 h-16 text-emerald-600 mx-auto mb-6" /><h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Staff Portal</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" required placeholder="Email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
            <input type="password" required placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
            {error && <div className="text-red-500 text-xs font-bold">{error}</div>}
            <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700">{loading ? <Loader2 className="animate-spin" /> : 'Login'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-12"><div><h2 className="text-4xl font-black uppercase tracking-tighter">Staff Dashboard</h2><p className="text-emerald-600 font-bold">{user.email}</p></div><button onClick={() => signOut(auth)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-red-500 uppercase text-xs">Logout <LogOut size={16} /></button></div>
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight flex items-center gap-2"><Upload size={20} /> Upload to Gallery</h3>
              <label className="block w-full cursor-pointer mb-4"><div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center hover:border-emerald-400 bg-slate-50"><ImageIcon className="mx-auto text-slate-300 mb-2" size={32} /><p className="text-xs font-bold text-slate-500">Select Photo</p><input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setFileData)} /></div></label>
              {fileData && <><img src={fileData} className="w-full h-24 object-cover rounded-xl mb-3" /><button disabled={loading} onClick={saveToGallery} className="w-full bg-emerald-600 text-white py-2 rounded-xl font-bold">Confirm</button></>}
              {success && <p className="text-emerald-600 font-bold text-center text-sm">Success!</p>}
            </div>
            <div className="bg-emerald-900 text-white p-8 rounded-[2rem] border border-emerald-800 shadow-xl">
              <h3 className="text-xl font-black mb-6 uppercase tracking-tight flex items-center gap-2"><PenTool size={20} /> Update About Image</h3>
              <img src={currentAboutImage || "https://placehold.co/800x600"} className="w-full h-32 object-cover rounded-lg mb-4 opacity-50" />
              <label className="block w-full cursor-pointer mb-4"><div className="border-2 border-dashed border-emerald-700/50 rounded-3xl p-8 text-center hover:border-emerald-400 bg-emerald-800/30"><p className="text-xs font-bold text-emerald-200">Select New Image</p><input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, setAboutFileData)} /></div></label>
              {aboutFileData && <><img src={aboutFileData} className="w-full h-24 object-cover rounded-xl mb-3" /><button disabled={loading} onClick={saveAboutImage} className="w-full bg-white text-emerald-900 py-2 rounded-xl font-bold">Replace</button></>}
              {aboutSuccess && <p className="text-emerald-300 font-bold text-center text-sm">Updated!</p>}
            </div>
        </div>
        <div className="lg:col-span-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-inner h-fit">
           <h3 className="text-xl font-black uppercase tracking-tight mb-6">Gallery ({dynamicImages.length})</h3>
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto p-2">
             {dynamicImages.map((img) => (<div key={img.id} className="relative group aspect-square bg-white rounded-2xl overflow-hidden shadow-sm"><img src={img.url} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-red-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => deleteImage(img.id)}><Trash2 className="text-white" /></div></div>))}
           </div>
        </div>
      </div>
    </div>
  );
};

const FooterReviewForm = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const handleSubmit = (e) => { e.preventDefault(); if(name && text) { onSubmit({ name, rating, text }); setSubmitted(true); setName(''); setText(''); setTimeout(() => setSubmitted(false), 3000); } };
  return (
    <div className="bg-slate-900 border-t border-slate-800 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h4 className="text-white font-bold text-center mb-8 uppercase tracking-widest text-sm">Leave a Review</h4>
        {submitted ? <div className="bg-emerald-600 text-white p-6 rounded-2xl text-center"><CheckCircle2 className="mx-auto mb-2" /><p className="font-bold">Thanks!</p></div> : 
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4"><input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="bg-slate-800 text-white rounded-xl p-4 font-bold" required /><div className="flex items-center justify-center bg-slate-800 rounded-xl px-4 gap-1">{[1,2,3,4,5].map(star => (<Star key={star} size={20} fill={star <= rating ? "#fbbf24" : "none"} stroke={star <= rating ? "none" : "#475569"} className="cursor-pointer" onClick={() => setRating(star)} />))}</div></div>
            <textarea placeholder="Experience..." rows={3} value={text} onChange={e => setText(e.target.value)} className="w-full bg-slate-800 text-white rounded-xl p-4 font-bold resize-none" required />
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">Submit <Send size={18} /></button>
          </form>}
      </div>
    </div>
  );
};

// --- MAIN APP ---

const App = () => {
  const [page, setPage] = useState('home');
  const [user, setUser] = useState(null);
  const [dynamicImages, setDynamicImages] = useState([]);
  const [aboutImage, setAboutImage] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Try Custom Token (Preview Env)
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        try { await signInWithCustomToken(auth, __initial_auth_token); } catch(e) { console.error("Custom token failed", e); }
      } else {
        // 2. Fallback to Anonymous (Production/Local without token)
        await signInAnonymously(auth).catch(e => console.error("Anon auth failed", e));
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubGallery = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), orderBy('createdAt', 'desc')), (s) => setDynamicImages(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => console.log("Gallery Sync", e));
    const unsubConfig = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'site_config', 'main'), (s) => { if(s.exists()) setAboutImage(s.data().aboutPageImage); }, e => console.log("Config Sync", e));
    return () => { unsubGallery(); unsubConfig(); };
  }, [user]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => window.scrollTo(0, 0), [page]);

  const handleAddReview = async (d) => { if(user) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'reviews'), { ...d, createdAt: new Date().toISOString() }); };

  const renderPage = () => {
    if (page === 'home') return <HomePage setPage={setPage} />;
    if (page === 'services') return <ServicesPage />;
    if (page === 'community') return <CommunityPage dynamicImages={dynamicImages} />;
    if (page === 'staff') return <StaffPortal setPage={setPage} dynamicImages={dynamicImages} currentAboutImage={aboutImage} />;
    if (page === 'about') return (
      <div className="animate-in fade-in duration-500 pt-16">
        <div className="max-w-7xl mx-auto px-4 pb-24 grid md:grid-cols-2 gap-16 items-center">
           <div><h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-8 uppercase tracking-tighter leading-none">About Us</h2><div className="space-y-6 text-lg text-slate-600"><p>Family-owned, licensed, bonded, and insured plumbing company serving Chicago for over 20 years.</p></div></div>
           <div className="relative"><div className="absolute -inset-4 bg-emerald-100 rounded-[3rem] -rotate-3"></div><div className="relative bg-white p-2 rounded-[3rem] shadow-2xl border-4 border-white overflow-hidden aspect-[4/3]"><img src={aboutImage || "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=1000"} className="w-full h-full object-cover" onError={handleImageError} /></div></div>
        </div>
      </div>
    );
    return <HomePage setPage={setPage} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="bg-emerald-950 text-white py-2 px-4 text-xs font-medium border-b border-emerald-900 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6 items-center"><span className="flex items-center gap-1.5"><MapPin size={12} className="text-emerald-400" /> 1102 N California Ave</span><span className="flex items-center gap-1.5"><Clock size={12} className="text-emerald-400" /> 7 AM - 7 PM</span></div>
          <div className="flex items-center gap-6"><button onClick={() => setPage('staff')} className="hover:text-emerald-400 flex items-center gap-1 transition-colors"><Lock size={12} /> Staff Portal</button><a href="tel:7732908232" className="hover:text-emerald-300 font-bold">(773) 290-8232</a></div>
        </div>
      </div>

      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-xl py-3' : 'bg-white/95 backdrop-blur-md py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <button onClick={() => setPage('home')} className="flex items-center gap-3 group text-left">
            <RobWestLogo className="w-16 h-16" />
            <div className="hidden lg:block border-l border-slate-200 pl-4"><h1 className="text-2xl font-black tracking-tighter text-emerald-950 leading-none">ROB WEST</h1><p className="text-[10px] font-bold tracking-[0.3em] text-emerald-600 uppercase">Plumbing Inc.</p></div>
          </button>
          <div className="hidden md:flex items-center gap-10 font-bold text-sm text-slate-700 uppercase tracking-widest">
            {['home', 'services', 'community', 'about'].map(p => (<button key={p} onClick={() => setPage(p)} className={`transition-colors border-b-2 py-1 ${page === p ? 'text-emerald-600 border-emerald-600' : 'hover:text-emerald-600 border-transparent'}`}>{p}</button>))}
            <a href="tel:7732908232" className="bg-emerald-600 text-white px-8 py-3 rounded-2xl hover:bg-emerald-700 shadow-lg flex items-center gap-2">Book Now <ArrowRight size={16} /></a>
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(true)}><Menu size={32} /></button>
        </div>
      </nav>

      {/* MOBILE MENU OVERLAY */}
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} setPage={setPage} />

      <main className="min-h-[70vh]">{renderPage()}</main>
      <GeminiAssistant />
      <FooterReviewForm onSubmit={handleAddReview} />
      
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center md:text-left"><p className="text-xs uppercase tracking-widest">© 2025 Rob West Plumbing Inc. • License #055-037380</p></div>
      </footer>
    </div>
  );
};

export default App;