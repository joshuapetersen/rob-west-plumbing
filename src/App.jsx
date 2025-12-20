import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { auth, db, appId } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, doc } from 'firebase/firestore';
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
const StaffDashboard = lazy(() => import('./pages/StaffDashboard'));
const GeminiAssistant = lazy(() => import('./components/GeminiAssistant'));

// Use environment variable for Gemini, or fallback to empty string to prevent crash if missing
// If you have a VITE_GEMINI_API_KEY in your .env file, it will use that.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

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
    email: "info@robwestplumbing.com",
    tagline: "Family-owned, licensed, bonded, and insured plumbing company serving Chicago for over 20 years.",
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

const App = () => {
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [user, setUser] = useState(null);
  const [page, setPage] = useState(() => {
    // Load page from localStorage on initial load
    return localStorage.getItem('currentPage') || 'home';
  });

  // Persist current page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentPage', page);
  }, [page]);

  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'site_content', 'main'), (docSnap) => {
      if (docSnap.exists()) {
        const fetchedData = docSnap.data();
        setContent({
          ...DEFAULT_CONTENT,
          ...fetchedData,
          pages: fetchedData.pages || DEFAULT_CONTENT.pages,
          global: { ...DEFAULT_CONTENT.global, ...(fetchedData.global || {}) },
          about: { ...DEFAULT_CONTENT.about, ...(fetchedData.about || {}) },
        });
      }
    });
    return () => unsubscribe();
  }, []);

  const renderPage = () => {
    const pageData = content.pages?.find(p => p.id === page);
    if (pageData && pageData.type === 'custom') {
      return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>}><CustomPage content={content} pageData={pageData} /></Suspense>;
    }
    switch (page) {
      case 'home':
        return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>}><HomePage setPage={setPage} content={content} /></Suspense>;
      case 'services':
        return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>}><ServicesPage content={content} /></Suspense>;
      case 'community':
        return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>}><CommunityPage content={content} /></Suspense>;
      case 'about':
        return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>}><AboutPage content={content} /></Suspense>;
      case 'dashboard':
        return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>}><StaffDashboard /></Suspense>;
      default:
        return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={48} /></div>}><HomePage setPage={setPage} content={content} /></Suspense>;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Bar */}
      <div className="bg-emerald-950 text-white py-2 px-4 text-xs font-medium border-b border-emerald-900 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex gap-6 items-center">
            <span className="flex items-center gap-1.5"><MapPin size={12} className="text-emerald-400" /> {content.global.address}</span>
            <span className="flex items-center gap-1.5"><Clock size={12} className="text-emerald-400" /> {content.global.hours}</span>
          </div>
          <div className="flex items-center gap-6">
            <button onClick={() => { console.log('[App] Staff Portal tab clicked'); setPage('dashboard'); }} className="hover:text-emerald-400 flex items-center gap-1 transition-colors"><Lock size={12} /> Staff Portal</button>
            <a href={`tel:${content.global.phone.replace(/\D/g,'')}`} className="hover:text-emerald-300 font-bold">{content.global.phone}</a>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <RobWestLogo logoUrl={content.global?.logo} />
            </div>
            <div className="hidden md:flex space-x-8">
              {content.pages?.filter(p => p.enabled).map(p => (
                <button key={p.id} onClick={() => { console.log('[App] Nav tab clicked:', p.id); setPage(p.id); }} className={`px-3 py-2 text-sm font-medium transition-colors ${page === p.id ? 'text-emerald-600 border-b-2 border-emerald-600' : 'text-slate-600 hover:text-emerald-600'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="w-full">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <RobWestLogo className="h-12 w-auto mb-4" logoUrl={content.global?.logo} />
              <p className="text-slate-300 text-sm">{content.global?.tagline}</p>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Services</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>Residential Plumbing</li>
                <li>Commercial Plumbing</li>
                <li>Emergency Repairs</li>
                <li>Water Heater Services</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Contact</h3>
              <div className="space-y-2 text-sm text-slate-300">
                <div className="flex items-center gap-2"><Phone size={16} /> {content.global?.phone}</div>
                <div className="flex items-center gap-2"><Mail size={16} /> {content.global?.email}</div>
                <div className="flex items-center gap-2"><MapPin size={16} /> {content.global?.address}</div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold mb-4">Follow Us</h3>
              <div className="flex gap-4">
                {content.global?.social?.facebook && <a href={content.global.social.facebook} className="text-slate-300 hover:text-white transition-colors"><Facebook size={20} /></a>}
                {content.global?.social?.instagram && <a href={content.global.social.instagram} className="text-slate-300 hover:text-white transition-colors"><Instagram size={20} /></a>}
                {content.global?.social?.youtube && <a href={content.global.social.youtube} className="text-slate-300 hover:text-white transition-colors"><Youtube size={20} /></a>}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center">
            <Suspense fallback={<div></div>}><FooterReviewFormLazy onSubmit={(review) => console.log('Review submitted:', review)} content={content} reviews={[]} /></Suspense>
          </div>
        </div>
      </footer>

      {/* AI Assistant */}
      <Suspense fallback={<div></div>}><GeminiAssistant /></Suspense>
    </div>
  );
};

export default App;