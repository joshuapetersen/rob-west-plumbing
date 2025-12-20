import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createEditor, Transforms } from 'slate';
import { Slate, Editable, withReact } from 'slate-react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, addDoc, doc, setDoc, deleteDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  Lock, LogOut, Upload, Image as ImageIcon, Loader2, AlertCircle, 
  Trash2, Camera, Save, Edit3, Plus, Layout, Eye, EyeOff, CheckCircle2,
  Mail, Phone, MapPin, Facebook, Instagram, Youtube
} from 'lucide-react';
import { db, auth, appId } from '../firebase.js';

import CustomPageEditor from './CustomPageEditor.jsx';

// --- UTILITIES ---
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
        canvas.width = scaleSize < 1 ? MAX_WIDTH : img.width;
        canvas.height = scaleSize < 1 ? img.height * scaleSize : img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Default structure to prevent crashes if DB is empty
const DEFAULT_CONTENT = {
  pages: [
    { id: 'home', label: 'Home', type: 'fixed', enabled: true, order: 0 },
    { id: 'services', label: 'Services', type: 'fixed', enabled: true, order: 1 },
    { id: 'community', label: 'Community', type: 'fixed', enabled: true, order: 2 },
    { id: 'about', label: 'About', type: 'fixed', enabled: true, order: 3 },
  ],
  global: {
    logo: "",
    phone: "(773) 290-8232",
    address: "1102 N California Ave",
    hours: "7 AM - 7 PM",
    license: "License #055-037380",
    social: { facebook: "", instagram: "", youtube: "" }
  },
  home: {
    heroTitle: "Quality & Reliability Meet Service.",
    heroSubtitle: "Welcome to Rob West Plumbing Inc.",
    heroImage: "",
    promoText: "Customer Satisfaction",
    promoLinkText: "Facebook",
    promoLinkUrl: ""
  },
  services: { title: "Full Service Plumbing", description: "Expert solutions." },
  community: { title: "Our Roots", description: "Serving Chicago." },
  about: { title: "About Us", description: "Family-owned.", image: "", team: [] }
};

const StaffDashboard = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // Login State
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  // Dashboard State
  const [activeTab, setActiveTab] = useState('content');
  const [editContent, setEditContent] = useState(DEFAULT_CONTENT);
  const [dynamicImages, setDynamicImages] = useState([]);
  const [fileData, setFileData] = useState(null);
  const [success, setSuccess] = useState(false);

  // 1. Authentication Listener
  useEffect(() => {
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Load content immediately upon login with proper merging
        const unsubContent = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'site_content', 'main'), (s) => {
          if (s.exists()) {
            const fetchedData = s.data();
            // Critical Fix: Merge fetched data with defaults so missing arrays don't crash the UI
            setEditContent({
              ...DEFAULT_CONTENT,
              ...fetchedData,
              pages: fetchedData.pages || DEFAULT_CONTENT.pages,
              global: { ...DEFAULT_CONTENT.global, ...(fetchedData.global || {}) },
              about: { ...DEFAULT_CONTENT.about, ...(fetchedData.about || {}) },
            });
          } else {
            // Document doesn't exist yet? Use defaults.
            setEditContent(DEFAULT_CONTENT);
          }
        });
        // Load gallery
        const unsubGallery = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), orderBy('createdAt', 'desc')), (s) => {
          setDynamicImages(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => { unsubContent(); unsubGallery(); };
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Login Handler (Strict Auth)
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // If already signed in (anonymous or otherwise), sign out first
      if (auth.currentUser) {
        await signOut(auth);
      }
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
    } catch (err) {
      setError('Invalid Email or Password.');
    } finally {
      setLoading(false);
    }
  };

  // 3. Save Logic (Persistence Fix)
  const saveContent = async () => {
    if (!user) return; // Strict Check
    setLoading(true);
    setError('');
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'site_content', 'main');
      await setDoc(docRef, editContent, { merge: true });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setError("Save Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Gallery Logic
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setLoading(true);
      try {
        const compressed = await compressImage(file);
        setFileData(compressed);
        setError('');
      } catch { setError('Image compression failed'); } 
      finally { setLoading(false); }
    }
  };

  const saveToGallery = async () => {
    if (!fileData || !user) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), {
        url: fileData,
        createdAt: new Date().toISOString(),
        uploadedBy: user.email
      });
      setSuccess(true);
      setFileData(null);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) { setError('Upload Failed'); } 
    finally { setLoading(false); }
  };

  const deleteImage = async (docId) => {
    if (!confirm("Delete this image permanently?")) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'gallery', docId));
    } catch { setError("Delete Failed"); }
  };

  // 5. Team Logic
  const handleTeamImageUpload = async (idx, file) => {
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      const newTeam = [...(editContent.about.team || [])];
      newTeam[idx] = { ...newTeam[idx], image: compressed };
      setEditContent(prev => ({ ...prev, about: { ...prev.about, team: newTeam } }));
    } catch { setError("Image error"); }
  };

  const addTeamMember = () => {
    const newMember = { name: "New Member", role: "Role", bio: "Bio...", image: "" };
    setEditContent(prev => ({ ...prev, about: { ...prev.about, team: [...(prev.about.team || []), newMember] } }));
  };

  const removeTeamMember = (idx) => {
    if (!confirm("Remove this member?")) return;
    const newTeam = [...(editContent.about.team || [])];
    newTeam.splice(idx, 1);
    setEditContent(prev => ({ ...prev, about: { ...prev.about, team: newTeam } }));
  };

  const updateTeamMember = (idx, field, val) => {
    const newTeam = [...(editContent.about.team || [])];
    newTeam[idx] = { ...newTeam[idx], [field]: val };
    setEditContent(prev => ({ ...prev, about: { ...prev.about, team: newTeam } }));
  };

  // 6. Content Image Logic
  const handleContentImageUpload = async (section, key, file) => {
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setEditContent(prev => ({ ...prev, [section]: { ...prev[section], [key]: compressed } }));
    } catch { setError("Image error"); }
  };

  // 7. Page Logic

  // Toggle visibility of a page by id
  const togglePageVisibility = (pageId) => {
    setEditContent(prev => ({
      ...prev,
      pages: prev.pages.map(page =>
        page.id === pageId ? { ...page, enabled: !page.enabled } : page
      )
    }));
  };

  // Navigate to Content tab and scroll to the matching section
  const openPageEditor = (pageId) => {
    setActiveTab('content');
    // allow tab render
    setTimeout(() => {
      const el = document.getElementById(`content-section-${pageId}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  // Delete a custom page by id
  const deleteCustomPage = (pageId) => {
    if (!window.confirm('Delete this custom page?')) return;
    setEditContent(prev => ({
      ...prev,
      pages: prev.pages.filter(page => page.id !== pageId)
    }));
  };

  // Update custom page content by id and field
  const updateCustomPageContent = (pageId, field, value) => {
    setEditContent(prev => ({
      ...prev,
      pages: prev.pages.map(page =>
        page.id === pageId ? { ...page, [field]: value } : page
      )
    }));
  };
  const addCustomPage = () => {
    const label = prompt("Page Name:");
    if (!label) return;
    const id = label.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newPage = { id, label, type: 'custom', enabled: true, title: label, content: 'Content...' };
    setEditContent(prev => ({ ...prev, pages: [...(prev.pages || []), newPage] }));
  };

  const triggerTestEmail = async () => {
      // Placeholder for EmailJS trigger
      alert(`Simulation: Verification email sent to ${user?.email}`);
  };

  // --- RENDER: LOGIN WALL ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md text-center">
          <Lock className="w-16 h-16 text-emerald-600 mx-auto mb-6" />
          <h2 className="text-3xl font-black mb-2 uppercase tracking-tighter text-slate-900">Staff Portal</h2>
          <p className="text-slate-400 font-bold mb-8 text-sm">Authorized Personnel Only</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="text" 
              required 
              placeholder="Email" 
              value={emailInput} 
              onChange={(e) => setEmailInput(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500" 
            />
            <input 
              type="password" 
              required 
              placeholder="Password" 
              value={passwordInput} 
              onChange={(e) => setPasswordInput(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold outline-none focus:ring-2 focus:ring-emerald-500" 
            />
            {error && <div className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg">{error}</div>}
            <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg">
              {loading ? <Loader2 className="animate-spin" /> : 'Secure Login'}
            </button>
          </form>
          <div className="mt-6">
            <button onClick={() => { try { localStorage.setItem('currentPage', 'home'); } catch {} window.location.reload(); }} className="text-slate-500 font-bold hover:text-emerald-600 uppercase text-xs transition-colors py-3 px-6 rounded-xl bg-slate-50 border border-slate-200 shadow-sm">Back to Site</button>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 p-4 lg:p-10 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <div>
            <h2 className="text-4xl font-black uppercase tracking-tighter leading-none mb-1">Staff Dashboard</h2>
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-emerald-600 font-bold uppercase text-[10px] tracking-widest">Authenticated: {user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
             <button onClick={triggerTestEmail} className="flex items-center gap-2 text-slate-500 font-bold hover:text-emerald-600 uppercase text-xs transition-colors py-3 px-6 rounded-xl bg-white border border-slate-200 shadow-sm"><Mail size={16} /> Test Email</button>
             <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-white font-bold hover:bg-red-600 uppercase text-xs transition-colors py-3 px-6 rounded-xl bg-red-500 shadow-lg shadow-red-200"><LogOut size={16} /> Logout</button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-10 overflow-x-auto pb-4 border-b border-slate-200">
          {['content', 'team', 'gallery', 'pages'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)} 
              className={`px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all ${activeTab === tab ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-200 scale-105' : 'bg-white border border-slate-200 text-slate-400 hover:bg-slate-100'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main Editor Card */}
        <div className="bg-white p-6 lg:p-12 rounded-[3rem] border border-slate-200 shadow-2xl shadow-slate-200/50">
           <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-50">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight">Edit {activeTab}</h3>
                <p className="text-slate-400 text-sm font-bold mt-1">Changes are pushed live immediately.</p>
              </div>
              <button onClick={saveContent} disabled={loading} className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 flex items-center gap-3 shadow-xl transition-transform hover:scale-105 active:scale-95 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Save Changes</>}
              </button>
           </div>

           {success && <div className="mb-8 bg-emerald-50 border border-emerald-100 text-emerald-800 p-6 rounded-2xl font-black flex items-center gap-3 animate-in slide-in-from-top"><CheckCircle2 /> Save Successful.</div>}
           {error && <div className="mb-8 bg-red-50 border border-red-100 text-red-800 p-6 rounded-2xl font-black flex items-center gap-3 animate-in shake"><AlertCircle /> {error}</div>}

           {/* --- TAB: CONTENT EDITOR --- */}
           {activeTab === 'content' && (
             <div className="space-y-12">
               {/* Global Section */}
               <div className="space-y-6">
                 <h4 className="font-black text-slate-300 uppercase text-xs tracking-widest border-b border-slate-50 pb-2">Global Settings</h4>
                 <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Phone Number</label>
                       <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4"><Phone size={16} className="text-slate-300 mr-3" />
                       <input type="text" value={editContent.global?.phone || ''} onChange={(e) => setEditContent({...editContent, global: {...editContent.global, phone: e.target.value}})} className="w-full bg-transparent p-3 font-bold text-slate-700 outline-none" /></div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Address</label>
                       <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4"><MapPin size={16} className="text-slate-300 mr-3" />
                       <input type="text" value={editContent.global?.address || ''} onChange={(e) => setEditContent({...editContent, global: {...editContent.global, address: e.target.value}})} className="w-full bg-transparent p-3 font-bold text-slate-700 outline-none" /></div>
                    </div>
                 </div>
                 <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Facebook URL</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4"><Facebook size={16} className="text-blue-600 mr-3" />
                        <input type="text" value={editContent.global?.social?.facebook || ''} onChange={(e) => setEditContent({...editContent, global: {...editContent.global, social: {...editContent.global.social, facebook: e.target.value}}})} className="w-full bg-transparent p-3 font-bold text-xs text-slate-700 outline-none" /></div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Instagram URL</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4"><Instagram size={16} className="text-pink-600 mr-3" />
                        <input type="text" value={editContent.global?.social?.instagram || ''} onChange={(e) => setEditContent({...editContent, global: {...editContent.global, social: {...editContent.global.social, instagram: e.target.value}}})} className="w-full bg-transparent p-3 font-bold text-xs text-slate-700 outline-none" /></div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">YouTube URL</label>
                        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4"><Youtube size={16} className="text-red-600 mr-3" />
                        <input type="text" value={editContent.global?.social?.youtube || ''} onChange={(e) => setEditContent({...editContent, global: {...editContent.global, social: {...editContent.global.social, youtube: e.target.value}}})} className="w-full bg-transparent p-3 font-bold text-xs text-slate-700 outline-none" /></div>
                    </div>
                 </div>
               </div>

               {/* Home Section */}
               <div id="content-section-home" className="space-y-6 pt-8 border-t border-slate-50">
                  <h4 className="font-black text-slate-300 uppercase text-xs tracking-widest border-b border-slate-50 pb-2">Home Page</h4>
                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Hero Headline</label>
                           <textarea rows={3} value={editContent.home?.heroTitle || ''} onChange={(e) => setEditContent({...editContent, home: {...editContent.home, heroTitle: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-black text-xl text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Hero Subtext</label>
                           <textarea rows={4} value={editContent.home?.heroSubtitle || ''} onChange={(e) => setEditContent({...editContent, home: {...editContent.home, heroSubtitle: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-sm text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                        </div>
                     </div>
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-center">
                        <p className="text-xs font-black text-slate-400 uppercase mb-4">Hero Background Image</p>
                        <img src={editContent.home?.heroImage} className="w-full h-32 object-cover rounded-xl mb-4 shadow-sm" />
                        <input type="file" accept="image/*" onChange={(e) => handleContentImageUpload('home', 'heroImage', e.target.files[0])} className="text-xs" />
                     </div>
                  </div>
               </div>

               {/* Services Section */}
              <div id="content-section-services" className="space-y-6 pt-8 border-t border-slate-50">
                  <h4 className="font-black text-slate-300 uppercase text-xs tracking-widest border-b border-slate-50 pb-2">Services Page</h4>
                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Services Title</label>
                           <input type="text" value={editContent.services?.title || ''} onChange={(e) => setEditContent({...editContent, services: {...editContent.services, title: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Services Description</label>
                           <textarea rows={3} value={editContent.services?.description || ''} onChange={(e) => setEditContent({...editContent, services: {...editContent.services, description: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                        </div>
                     </div>
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-center">
                        <p className="text-xs font-black text-slate-400 uppercase mb-4">Services Page Image</p>
                        <img src={editContent.services?.image} className="w-full h-32 object-cover rounded-xl mb-4 shadow-sm" />
                        <input type="file" accept="image/*" onChange={(e) => handleContentImageUpload('services', 'image', e.target.files[0])} className="text-xs" />
                     </div>
                  </div>
               </div>

               {/* Community Section */}
              <div id="content-section-community" className="space-y-6 pt-8 border-t border-slate-50">
                  <h4 className="font-black text-slate-300 uppercase text-xs tracking-widest border-b border-slate-50 pb-2">Community Page</h4>
                  <div className="grid md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Community Title</label>
                           <input type="text" value={editContent.community?.title || ''} onChange={(e) => setEditContent({...editContent, community: {...editContent.community, title: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Community Description</label>
                           <textarea rows={3} value={editContent.community?.description || ''} onChange={(e) => setEditContent({...editContent, community: {...editContent.community, description: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                        </div>
                     </div>
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-center">
                        <p className="text-xs font-black text-slate-400 uppercase mb-4">Community Page Image</p>
                        <img src={editContent.community?.image} className="w-full h-32 object-cover rounded-xl mb-4 shadow-sm" />
                        <input type="file" accept="image/*" onChange={(e) => handleContentImageUpload('community', 'image', e.target.files[0])} className="text-xs" />
                     </div>
                  </div>
               </div>

               {/* About Section */}
              <div id="content-section-about" className="space-y-6 pt-8 border-t border-slate-50">
                  <h4 className="font-black text-slate-300 uppercase text-xs tracking-widest border-b border-slate-50 pb-2">About Page</h4>
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">About Title</label>
                        <input type="text" value={editContent.about?.title || ''} onChange={(e) => setEditContent({...editContent, about: {...editContent.about, title: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">About Description</label>
                        <textarea rows={5} value={editContent.about?.description || ''} onChange={(e) => setEditContent({...editContent, about: {...editContent.about, description: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-medium text-slate-600 outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                     </div>
                     <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 border-dashed text-center">
                        <p className="text-xs font-black text-slate-400 uppercase mb-4">About Page Image</p>
                        <img src={editContent.about?.image} className="w-full h-32 object-cover rounded-xl mb-4 shadow-sm" />
                        <input type="file" accept="image/*" onChange={(e) => handleContentImageUpload('about', 'image', e.target.files[0])} className="text-xs" />
                     </div>
                  </div>
               </div>
             </div>
           )}

           {/* --- TAB: TEAM MANAGER --- */}
           {activeTab === 'team' && (
             <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <button onClick={addTeamMember} className="border-4 border-dashed border-slate-200 rounded-[2.5rem] flex flex-col items-center justify-center p-10 hover:bg-emerald-50 hover:border-emerald-200 transition-all min-h-[450px] group">
                   <div className="bg-slate-50 p-6 rounded-full group-hover:scale-110 transition-transform mb-4"><Plus size={40} className="text-slate-300 group-hover:text-emerald-500" /></div>
                   <span className="font-black uppercase tracking-tighter text-slate-300 group-hover:text-emerald-600">Register New Member</span>
                </button>
                {editContent.about?.team?.map((member, idx) => (
                   <div key={idx} className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 relative group shadow-sm transition-all hover:shadow-xl hover:bg-white hover:-translate-y-2">
                      <button onClick={() => removeTeamMember(idx)} className="absolute top-6 right-6 bg-white text-red-400 hover:text-red-600 transition-colors shadow-md p-3 rounded-full z-10 border border-red-50"><Trash2 size={18} /></button>
                      <div className="aspect-square bg-white rounded-[2rem] mb-6 overflow-hidden relative shadow-inner border border-slate-100">
                         <img src={member.image || "https://placehold.co/400x400/f1f5f9/94a3b8?text=Member"} className="w-full h-full object-cover" />
                         <label className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer text-white font-black transition-opacity backdrop-blur-sm">
                            <Camera size={32} className="mb-2" />
                            <span className="text-[10px] tracking-widest uppercase">Change Photo</span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleTeamImageUpload(idx, e.target.files[0])} />
                         </label>
                      </div>
                      <div className="space-y-4">
                         <div>
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Full Name</label>
                           <input type="text" placeholder="Name" value={member.name} onChange={(e) => updateTeamMember(idx, 'name', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 font-black text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
                         </div>
                         <div>
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Title / Specialty</label>
                           <input type="text" placeholder="Role" value={member.role} onChange={(e) => updateTeamMember(idx, 'role', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-600 text-sm" />
                         </div>
                         <div>
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Public Biography</label>
                           <textarea placeholder="Experience summary..." value={member.bio} onChange={(e) => updateTeamMember(idx, 'bio', e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-3 resize-none focus:ring-2 focus:ring-emerald-500 outline-none font-medium text-sm leading-relaxed" rows={3} />
                         </div>
                      </div>
                   </div>
                ))}
             </div>
           )}

           {/* --- TAB: GALLERY --- */}
           {activeTab === 'gallery' && (
             <div className="grid lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-6">
                   <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 text-center">
                      <h4 className="font-black text-slate-800 uppercase tracking-tighter text-xl mb-2">Upload Asset</h4>
                      <p className="text-slate-400 text-xs font-bold mb-6">Add new photos to the community feed.</p>
                      <label className="block w-full cursor-pointer group">
                        <div className="border-3 border-dashed rounded-3xl border-slate-200 p-10 group-hover:border-emerald-400 group-hover:bg-white transition-all bg-white shadow-sm">
                          <ImageIcon className="mx-auto mb-4 text-slate-300 group-hover:text-emerald-500" size={40}/>
                          <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest group-hover:text-emerald-600">Select File</p>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e)} />
                        </div>
                      </label>
                      {fileData && (
                        <div className="mt-6 animate-in zoom-in">
                           <img src={fileData} className="w-full h-32 object-cover rounded-2xl mb-4 shadow-lg border-4 border-white" />
                           <button onClick={saveToGallery} className="w-full bg-emerald-600 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all hover:bg-emerald-700 shadow-xl active:scale-95 text-xs">Confirm Post</button>
                        </div>
                      )}
                   </div>
                </div>
                <div className="lg:col-span-8 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 shadow-inner">
                   <h4 className="font-black text-slate-400 uppercase tracking-widest text-xs mb-6 ml-2">Active Gallery Feed ({dynamicImages.length})</h4>
                   <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                      {dynamicImages.map(img => (
                        <div key={img.id} className="relative group aspect-square rounded-2xl overflow-hidden shadow-sm bg-white border border-slate-200 transform transition-all hover:scale-105 hover:z-10 hover:shadow-xl">
                          <img src={img.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-red-900/80 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity backdrop-blur-sm" onClick={() => deleteImage(img.id)}>
                            <div className="flex flex-col items-center gap-2 text-white">
                              <Trash2 size={24} />
                              <span className="font-black text-[9px] uppercase tracking-widest">Delete</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {dynamicImages.length === 0 && <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl"><p className="text-slate-400 font-bold italic text-sm">Gallery is empty.</p></div>}
                   </div>
                </div>
             </div>
           )}

           {/* --- TAB: PAGES --- */}
           {activeTab === 'pages' && (
             <div className="w-full space-y-8">
               {/* Pages List */}
               <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest mb-6">Manage Pages</h4>
                  <div className="grid grid-cols-1 gap-4">
                    {editContent.pages && editContent.pages.map((page) => (
                      <div key={page.id} className={`p-5 rounded-2xl border flex items-center gap-5 transition-all ${page.enabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                         <div className="p-3 bg-slate-100 rounded-xl text-slate-400"><Layout size={20} /></div>
                         <div className="grow">
                           <div className="flex items-center gap-3 mb-1">
                              <span className="font-black uppercase text-slate-900 text-sm tracking-tight">{page.label}</span>
                              <span className="text-[9px] uppercase font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">{page.type}</span>
                           </div>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Slug: /{page.id}</p>
                         </div>
                         <div className="flex items-center gap-2">
                            <button onClick={() => togglePageVisibility(page.id)} title="Toggle Visibility" className={`p-3 rounded-xl transition-all ${page.enabled ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}>
                              {page.enabled ? <Eye size={18} /> : <EyeOff size={18} />}
                            </button>
                            {page.type === 'fixed' && (
                              <button onClick={() => openPageEditor(page.id)} title="Edit Content" className="p-3 bg-white text-slate-600 rounded-xl border border-slate-200 hover:bg-slate-100 transition-all">Edit</button>
                            )}
                            {page.type === 'custom' && (
                              <button onClick={() => deleteCustomPage(page.id)} title="Delete Page" className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all"><Trash2 size={18} /></button>
                            )}
                         </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={addCustomPage} className="w-full border-3 border-dashed border-slate-200 p-6 rounded-2xl font-black text-slate-300 hover:border-emerald-200 hover:text-emerald-500 hover:bg-emerald-50 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest">+ Create Custom Page</button>
               </div>
               
               {/* Custom Page Editor */}
               {editContent.pages && editContent.pages.filter(p => p.type === 'custom').length > 0 && (
                 <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 shadow-inner">
                    <h4 className="text-xs font-black uppercase text-slate-400 mb-8 tracking-widest text-left flex items-center gap-2"><Edit3 size={16} /> Custom Page Editor</h4>
                    {editContent.pages.filter(p => p.type === 'custom').map(page => (
                      <CustomPageEditor
                        key={page.id}
                        page={page}
                        updateCustomPageContent={updateCustomPageContent}
                        compressImage={compressImage}
                      />
                    ))}
                 </div>
               )}
               
               {editContent.pages && editContent.pages.filter(p => p.type === 'custom').length === 0 && (
                 <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-dashed border-slate-200 text-center">
                    <p className="text-slate-400 font-bold italic py-12">No custom pages yet. Click "+ Create Custom Page" to add one.</p>
                 </div>
               )}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
