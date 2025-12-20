import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { auth, db, appId } from './firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { onSnapshot, doc, collection, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';
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

// --- ERROR BOUNDARY ---

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md text-center">
            <AlertCircle size={48} className="mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-black mb-2">Something went wrong</h1>
            <p className="text-slate-300 mb-6">{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button 
              onClick={() => window.location.reload()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold transition-all"
            >
              Reload Page
            </button>
            <p className="text-xs text-slate-500 mt-4">Error details have been logged to console</p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- COMPONENTS ---

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="text-center">
      <Loader2 className="animate-spin mx-auto mb-4" size={48} color="#059669" />
      <p className="text-slate-600 font-medium">Loading...</p>
    </div>
  </div>
);

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
  const [dynamicImages, setDynamicImages] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [contentError, setContentError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    const unsubscribe = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'site_content', 'main'),
      (docSnap) => {
        if (docSnap.exists()) {
          const fetchedData = docSnap.data();
          setContent({
            ...DEFAULT_CONTENT,
            ...fetchedData,
            pages: fetchedData.pages || DEFAULT_CONTENT.pages,
            global: { ...DEFAULT_CONTENT.global, ...(fetchedData.global || {}) },
            home: { ...DEFAULT_CONTENT.home, ...(fetchedData.home || {}) },
            services: { ...DEFAULT_CONTENT.services, ...(fetchedData.services || {}) },
            community: { ...DEFAULT_CONTENT.community, ...(fetchedData.community || {}) },
            about: { ...DEFAULT_CONTENT.about, ...(fetchedData.about || {}) },
          });
          setContentError('');
        }
      },
      (err) => {
        console.error('Content listener error:', err);
        setContentError(err.message || 'Failed to load content');
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(
      query(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setDynamicImages(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error('Gallery listener error:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db) return;
    const unsubscribe = onSnapshot(
      query(collection(db, 'artifacts', appId, 'public', 'data', 'reviews'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setReviews(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error('Reviews listener error:', err);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleSubmitReview = async (review) => {
    try {
      await addDoc(
        collection(db, 'artifacts', appId, 'public', 'data', 'reviews'),
        {
          ...review,
          rating: parseInt(review.rating) || 5,
          createdAt: serverTimestamp(),
        }
      );
      console.log('[App] Review submitted successfully');
    } catch (err) {
      console.error('[App] Error submitting review:', err);
      alert('Failed to submit review. Please try again.');
    }
  };

  const renderPage = () => {
    const pageData = content.pages?.find(p => p.id === page);
    if (pageData && pageData.type === 'custom') {
      return <Suspense fallback={<LoadingFallback />}><CustomPage content={content} pageData={pageData} /></Suspense>;
    }
    switch (page) {
      case 'home':
        return <Suspense fallback={<LoadingFallback />}><HomePage setPage={setPage} content={content} /></Suspense>;
      case 'services':
        return <Suspense fallback={<LoadingFallback />}><ServicesPage content={content} /></Suspense>;
      case 'community':
        return <Suspense fallback={<LoadingFallback />}><CommunityPage content={content} dynamicImages={dynamicImages} /></Suspense>;
      case 'about':
        return <Suspense fallback={<LoadingFallback />}><AboutPage content={content} /></Suspense>;
      case 'dashboard':
        return <Suspense fallback={<LoadingFallback />}><StaffDashboard /></Suspense>;
      default:
        return <Suspense fallback={<LoadingFallback />}><HomePage setPage={setPage} content={content} /></Suspense>;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {contentError && (
        <div className="bg-red-50 text-red-700 border border-red-100 px-4 py-3 text-sm font-semibold text-center">
          Live content unavailable: {contentError}
        </div>
      )}
      {/* Top Bar */}
      <div className="bg-emerald-950 text-white py-2 px-3 sm:px-4 text-xs sm:text-sm font-medium border-b border-emerald-900 hidden md:block">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0">
          <div className="flex gap-4 sm:gap-6 items-center flex-wrap text-xs">
            <span className="flex items-center gap-1.5 whitespace-nowrap"><MapPin size={12} className="text-emerald-400 flex-shrink-0" /> {content.global.address}</span>
            <span className="flex items-center gap-1.5 whitespace-nowrap"><Clock size={12} className="text-emerald-400 flex-shrink-0" /> {content.global.hours}</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm">
            <button onClick={() => { console.log('[App] Staff Portal tab clicked'); setPage('dashboard'); }} className="hover:text-emerald-400 flex items-center gap-1 transition-colors whitespace-nowrap"><Lock size={12} /> Staff Portal</button>
            <a href={`tel:${content.global.phone.replace(/\D/g,'')}`} className="hover:text-emerald-300 font-bold whitespace-nowrap">{content.global.phone}</a>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
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
            {/* Mobile Menu Button */}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-600 hover:text-emerald-600">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <Suspense fallback={<div></div>}>
          <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} setPage={(pageId) => { setPage(pageId); setMobileMenuOpen(false); }} content={content} />
        </Suspense>
      )}

      {/* Main Content */}
      <main className="w-full">
        {renderPage()}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <RobWestLogo className="h-10 sm:h-12 w-auto mb-3 sm:mb-4" logoUrl={content.global?.logo} />
              <p className="text-slate-300 text-xs sm:text-sm">{content.global?.tagline}</p>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Services</h3>
              <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-300">
                <li>Residential Plumbing</li>
                <li>Commercial Plumbing</li>
                <li>Emergency Repairs</li>
                <li>Water Heater Services</li>
              </ul>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Contact</h3>
              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-slate-300">
                <div className="flex items-center gap-2"><Phone size={14} /> {content.global?.phone}</div>
                <div className="flex items-center gap-2"><Mail size={14} /> {content.global?.email}</div>
                <div className="flex items-center gap-2"><MapPin size={14} /> {content.global?.address}</div>
              </div>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold mb-3 sm:mb-4">Follow Us</h3>
              <div className="flex gap-3 sm:gap-4">
                {content.global?.social?.facebook && <a href={content.global.social.facebook} className="text-slate-300 hover:text-white transition-colors"><Facebook size={18} /></a>}
                {content.global?.social?.instagram && <a href={content.global.social.instagram} className="text-slate-300 hover:text-white transition-colors"><Instagram size={18} /></a>}
                {content.global?.social?.youtube && <a href={content.global.social.youtube} className="text-slate-300 hover:text-white transition-colors"><Youtube size={18} /></a>}
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
            <Suspense fallback={<div></div>}><FooterReviewFormLazy onSubmit={handleSubmitReview} content={content} reviews={reviews} /></Suspense>
          </div>
        </div>
      </footer>

      {/* AI Assistant */}
      <Suspense fallback={<div></div>}><GeminiAssistant /></Suspense>
    </div>
  );
};

export default function AppWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}
