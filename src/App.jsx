import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, query, doc, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { 
  Phone, Mail, MapPin, Clock, Droplets, Leaf, ShieldCheck, Star, 
  Menu, X, ArrowRight, Instagram, Facebook, Youtube, CheckCircle2, 
  Flower, Wind, Calendar, Lock, LogOut, Upload, Image as ImageIcon, 
  Loader2, AlertCircle, Trash2, Smartphone, Flame, Send, Camera,
  Sparkles, Bot, MessageSquare, SendHorizontal, PenTool, Save, Edit3, Plus, User, Users, FileText, Layout, Eye, EyeOff, Crop
} from 'lucide-react';

// Lazy loaded components
const HomePage = lazy(() => import('./pages/HomePage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const CustomPage = lazy(() => import('./pages/CustomPage'));
const MobileMenu = lazy(() => import('./pages/MobileMenu'));
const FooterReviewFormLazy = lazy(() => import('./pages/FooterReviewForm'));

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
    if (!apiKey) {
      setMessages(prev => [...prev, { role: 'model', text: "AI assistant is not configured. Please contact support." }]);
      return;
    }
    setLoading(true);
    const updatedMessages = [...messages, { role: 'user', text: userText }];
    setMessages(updatedMessages);
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "You are a friendly, expert plumbing assistant for Rob West Plumbing in Chicago. Provide helpful, safety-conscious advice. If a problem sounds serious (gas, flooding, sewer backup), urge them to call (773) 290-8232 immediately. Keep answers concise (under 3 sentences). Always be polite and local-focused.\n\n" + userText }] }]
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

const StaffPortal = ({ dynamicImages, content }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fileData, setFileData] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('content'); 
  const [editContent, setEditContent] = useState(content);

  useEffect(() => { const u = onAuthStateChanged(auth, setUser); return () => u(); }, []);
  useEffect(() => { setEditContent(content); }, [content]);

  const ALLOWED_EMAILS = ['rigo@robwestplumbing.com', 'rob@robwestplumbing.com' , 'joshuapetersen119@gmail.com'];

  const handleLogin = async (e) => {
    e.preventDefault(); setError('');
    setLoading(true);
    try { await signInAnonymously(auth); } catch { setError('Login failed.'); } finally { setLoading(false); }
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
      } catch { setError("Image upload failed"); } finally { setLoading(false); }
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
      } catch { setError("Upload failed"); } finally { setLoading(false); }
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
    } catch {
      setError("Failed to save content");
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (docId) => { if(confirm("Delete?")) { try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gallery', docId)); } catch { setError("Failed"); } } };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 animate-in fade-in duration-500">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md text-center">
          <Lock className="w-16 h-16 text-emerald-600 mx-auto mb-6" /><h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Staff Portal</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && <div className="text-red-500 text-xs font-bold">{error}</div>}
            <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700">{loading ? <Loader2 className="animate-spin" /> : 'Login'}</button>
          </form>
        </div>
      </div>
    );
  }

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
    if (page === 'home') return <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>}><HomePage setPage={setPage} content={siteContent} reviews={reviews} /></Suspense>;
    if (page === 'services') return <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>}><ServicesPage content={siteContent} /></Suspense>;
    if (page === 'community') return <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>}><CommunityPage dynamicImages={dynamicImages} content={siteContent} /></Suspense>;
    if (page === 'staff') return <StaffPortal setPage={setPage} dynamicImages={dynamicImages} content={siteContent} setContent={setSiteContent} />;
    if (page === 'about') return <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>}><AboutPage content={siteContent} /></Suspense>;

    // 2. Check if it is a Custom Page
    const customPage = siteContent.pages?.find(p => p.id === page && p.type === 'custom');
    if (customPage) return <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>}><CustomPage pageData={customPage} /></Suspense>;

    // 3. Fallback
    return <Suspense fallback={<div className="min-h-[50vh] flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>}><HomePage setPage={setPage} content={siteContent} reviews={reviews} /></Suspense>;
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

      <Suspense fallback={null}><MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} setPage={setPage} content={siteContent} /></Suspense>

      <main className="min-h-[70vh]">{renderPage()}</main>
      <GeminiAssistant />
      {/* Pass reviews state to footer */}
      <Suspense fallback={<div>Loading footer...</div>}><FooterReviewFormLazy onSubmit={handleAddReview} content={siteContent} reviews={reviews} /></Suspense>
      
      <footer className="bg-slate-950 text-slate-400 py-12">
        <div className="max-w-7xl mx-auto px-4 text-center md:text-left"><p className="text-xs uppercase tracking-widest">© 2025 Rob West Plumbing Inc. • {siteContent.global.license}</p></div>
      </footer>
    </div>
  );
};

export default App;