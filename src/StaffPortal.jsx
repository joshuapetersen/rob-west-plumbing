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

// --- DEFAULT CONTENT (Fallback / Initial State) ---
const DEFAULT_CONTENT = {
  pages: [
    { id: 'home', label: 'Home', type: 'fixed', enabled: true, order: 0 },
    { id: 'services', label: 'Services', type: 'fixed', enabled: true, order: 1 },
    { id: 'community', label: 'Community', type: 'fixed', enabled: true, order: 2 },
    { id: 'about', label: 'About', type: 'fixed', enabled: true, order: 3 },
  ],
};

// Compress image utility
const compressImage = async (file) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      const maxWidth = 1200;
      const maxHeight = 1200;
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(resolve, 'image/jpeg', 0.8);
    };
    img.src = URL.createObjectURL(file);
  });
};

const StaffPortal = ({ dynamicImages, content }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fileData, setFileData] = useState(null);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('content'); 
  const [editContent, setEditContent] = useState(content);

  useEffect(() => { const u = onAuthStateChanged(auth, setUser); return () => u(); }, []);
  useEffect(() => { setEditContent(content); }, [content]);

  const handleLogin = async (e) => {
    e.preventDefault(); setError('');
    if (passwordInput !== 'admindev1213') { setError('Invalid password.'); return; }
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

  const updateTeamMember = (idx, key, value) => {
    const newTeam = [...(editContent.about.team || [])];
    newTeam[idx] = { ...newTeam[idx], [key]: value };
    setEditContent(prev => ({ ...prev, about: { ...prev.about, team: newTeam } }));
  };

  const deleteTeamMember = (idx) => {
    const newTeam = [...(editContent.about.team || [])];
    newTeam.splice(idx, 1);
    setEditContent(prev => ({ ...prev, about: { ...prev.about, team: newTeam } }));
  };

  const updatePageLabel = (id, label) => {
    const newPages = editContent.pages.map(p => p.id === id ? { ...p, label } : p);
    setEditContent(prev => ({ ...prev, pages: newPages }));
  };

  const togglePageVisibility = (id) => {
    const newPages = editContent.pages.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p);
    setEditContent(prev => ({ ...prev, pages: newPages }));
  };

  const addCustomPage = () => {
    const newPage = { id: `custom-${Date.now()}`, label: "New Page", type: 'custom', enabled: true, order: editContent.pages.length, title: "Page Title", content: "Page content here..." };
    setEditContent(prev => ({ ...prev, pages: [...prev.pages, newPage] }));
  };

  const deleteCustomPage = (id) => {
    const newPages = editContent.pages.filter(p => p.id !== id);
    setEditContent(prev => ({ ...prev, pages: newPages }));
  };

  const updateCustomPageContent = (id, key, value) => {
    const newPages = editContent.pages.map(p => p.id === id ? { ...p, [key]: value } : p);
    setEditContent(prev => ({ ...prev, pages: newPages }));
  };

  const saveContent = async () => {
    setLoading(true); setError(''); setSuccess(false);
    try {
      await setDoc(doc(db, 'content', appId), editContent);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to save content");
    } finally {
      setLoading(false);
    }
  };

  const saveToGallery = async () => {
    if (!fileData) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'gallery'), { url: fileData, timestamp: new Date() });
      setFileData(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Upload failed");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4 animate-in fade-in duration-500">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100 w-full max-w-md text-center">
          <Lock className="w-16 h-16 text-emerald-600 mx-auto mb-6" /><h2 className="text-3xl font-black mb-2 uppercase tracking-tighter">Staff Portal</h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="password" required placeholder="Password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
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
          <p className="text-emerald-600 font-bold">Logged in</p>
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
      
      {/* PAGES MANAGER TAB */}
      {activeTab === 'pages' && (
        <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
          <div className="flex justify-between items-center mb-8 pb-8 border-b border-slate-100">
             <div><h3 className="text-2xl font-black uppercase tracking-tight">Pages & Navigation</h3><p className="text-slate-500 text-sm">Manage menu tabs and add custom pages.</p></div>
             <div className="flex gap-2">
                <button onClick={addCustomPage} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-700 flex items-center gap-2"><Plus size={18} /> Add Page</button>
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

          <div className="mt-8 pt-8 border-t border-slate-200 flex justify-center">
            <button onClick={saveContent} disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg hover:scale-105 transition-all">{loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Save Changes</>}</button>
          </div>
        </div>
      )}

      {/* CONTENT EDITOR TAB */}
      {activeTab === 'content' && (
        <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
           <div className="flex justify-between items-center mb-8 pb-8 border-b border-slate-100">
             <div><h3 className="text-2xl font-black uppercase tracking-tight">Edit Site Content</h3><p className="text-slate-500 text-sm">Update text and main images across the website.</p></div>
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

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Business Name</label>
                    <input type="text" value={editContent.global.businessName} onChange={(e) => setEditContent(prev => ({ ...prev, global: { ...prev.global, businessName: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Tagline</label>
                    <input type="text" value={editContent.global.tagline} onChange={(e) => setEditContent(prev => ({ ...prev, global: { ...prev.global, tagline: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Phone</label>
                    <input type="text" value={editContent.global.phone} onChange={(e) => setEditContent(prev => ({ ...prev, global: { ...prev.global, phone: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Email</label>
                    <input type="text" value={editContent.global.email} onChange={(e) => setEditContent(prev => ({ ...prev, global: { ...prev.global, email: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Address</label>
                    <input type="text" value={editContent.global.address} onChange={(e) => setEditContent(prev => ({ ...prev, global: { ...prev.global, address: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Instagram URL</label>
                    <input type="url" value={editContent.global.social?.instagram} onChange={(e) => setEditContent(prev => ({ ...prev, global: { ...prev.global, social: { ...prev.global.social, instagram: e.target.value } } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Facebook URL</label>
                    <input type="url" value={editContent.global.social?.facebook} onChange={(e) => setEditContent(prev => ({ ...prev, global: { ...prev.global, social: { ...prev.global.social, facebook: e.target.value } } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
                  </div>
                </div>
              </div>

              {/* HOME */}
              <div className="space-y-4">
                <h4 className="font-black text-lg text-emerald-800 uppercase tracking-widest border-b border-emerald-100 pb-2">Home Page</h4>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Hero Title</label>
                    <input type="text" value={editContent.home.heroTitle} onChange={(e) => setEditContent(prev => ({ ...prev, home: { ...prev.home, heroTitle: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Hero Subtitle</label>
                    <input type="text" value={editContent.home.heroSubtitle} onChange={(e) => setEditContent(prev => ({ ...prev, home: { ...prev.home, heroSubtitle: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Hero Description</label>
                  <textarea rows={4} value={editContent.home.heroDescription} onChange={(e) => setEditContent(prev => ({ ...prev, home: { ...prev.home, heroDescription: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold resize-none" />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Hero Background Image</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-lg border border-slate-300 overflow-hidden flex items-center justify-center">
                       <img src={editContent.home.heroImage} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                       <input type="file" accept="image/*" onChange={(e) => handleContentImageUpload(e, 'home', 'heroImage')} className="text-sm font-bold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                    </div>
                  </div>
                </div>
              </div>

              {/* SERVICES */}
              <div className="space-y-4">
                <h4 className="font-black text-lg text-emerald-800 uppercase tracking-widest border-b border-emerald-100 pb-2">Services Page</h4>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Services Title</label>
                  <input type="text" value={editContent.services.title} onChange={(e) => setEditContent(prev => ({ ...prev, services: { ...prev.services, title: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Services Description</label>
                  <textarea rows={4} value={editContent.services.description} onChange={(e) => setEditContent(prev => ({ ...prev, services: { ...prev.services, description: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold resize-none" />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Services Background Image</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-lg border border-slate-300 overflow-hidden flex items-center justify-center">
                       <img src={editContent.services.image} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                       <input type="file" accept="image/*" onChange={(e) => handleContentImageUpload(e, 'services', 'image')} className="text-sm font-bold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                    </div>
                  </div>
                </div>
              </div>

              {/* COMMUNITY */}
              <div className="space-y-4">
                <h4 className="font-black text-lg text-emerald-800 uppercase tracking-widest border-b border-emerald-100 pb-2">Community Page</h4>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Community Title</label>
                  <input type="text" value={editContent.community.title} onChange={(e) => setEditContent(prev => ({ ...prev, community: { ...prev.community, title: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Community Description</label>
                  <textarea rows={4} value={editContent.community.description} onChange={(e) => setEditContent(prev => ({ ...prev, community: { ...prev.community, description: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold resize-none" />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Community Background Image</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-lg border border-slate-300 overflow-hidden flex items-center justify-center">
                       <img src={editContent.community.image} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                       <input type="file" accept="image/*" onChange={(e) => handleContentImageUpload(e, 'community', 'image')} className="text-sm font-bold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                    </div>
                  </div>
                </div>
              </div>

              {/* ABOUT */}
              <div className="space-y-4">
                <h4 className="font-black text-lg text-emerald-800 uppercase tracking-widest border-b border-emerald-100 pb-2">About Page</h4>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">About Title</label>
                  <input type="text" value={editContent.about.title} onChange={(e) => setEditContent(prev => ({ ...prev, about: { ...prev.about, title: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">About Description</label>
                  <textarea rows={4} value={editContent.about.description} onChange={(e) => setEditContent(prev => ({ ...prev, about: { ...prev.about, description: e.target.value } }))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold resize-none" />
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">About Background Image</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-lg border border-slate-300 overflow-hidden flex items-center justify-center">
                       <img src={editContent.about.image} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                       <input type="file" accept="image/*" onChange={(e) => handleContentImageUpload(e, 'about', 'image')} className="text-sm font-bold text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                    </div>
                  </div>
                </div>
              </div>
           </div>

           <div className="mt-8 pt-8 border-t border-slate-200 flex justify-center">
             <button onClick={saveContent} disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg hover:scale-105 transition-all">{loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Save Changes</>}</button>
           </div>
        </div>
      )}

      {/* TEAM MANAGER TAB */}
      {activeTab === 'team' && (
        <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
           {/* Header */}
           <div className="flex justify-between items-center mb-8 pb-8 border-b border-slate-100">
              <div><h3 className="text-2xl font-black uppercase tracking-tight">Team Manager</h3><p className="text-slate-500 text-sm">Add, edit, or remove team members.</p></div>
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
                 <div key={idx} className="bg-white border border-slate-200 rounded-[2rem] p-6 shadow-sm hover:shadow-lg transition-shadow">
                    {/* Image Upload */}
                    <div className="mb-4">
                       <div className="w-full h-32 bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center mb-2">
                          <img src={member.image} className="w-full h-full object-cover" />
                       </div>
                       <input type="file" accept="image/*" onChange={(e) => handleTeamImageUpload(e, idx)} className="text-xs font-bold text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 w-full" />
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

                    {/* Delete Button */}
                    <button onClick={() => deleteTeamMember(idx)} className="w-full mt-4 bg-red-500 text-white py-2 rounded-xl font-bold hover:bg-red-600 transition-colors flex items-center justify-center gap-2"><Trash2 size={16} /> Remove Member</button>
                 </div>
              ))}
           </div>

           <div className="mt-8 pt-8 border-t border-slate-200 flex justify-center">
             <button onClick={saveContent} disabled={loading} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 shadow-lg hover:scale-105 transition-all">{loading ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Save Changes</>}</button>
           </div>
        </div>
      )}

      {/* GALLERY TAB */}
      {activeTab === 'gallery' && (
        <div className="bg-white p-6 lg:p-10 rounded-[2.5rem] shadow-xl border border-slate-200">
          <div className="lg:grid lg:grid-cols-3 gap-8">
             <div className="lg:col-span-2 bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-inner h-fit">
                <h3 className="text-xl font-black uppercase tracking-tight mb-6">Upload New Image</h3>
                <div className="space-y-4">
                   <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, setFileData)} className="w-full text-sm font-bold text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                   {fileData && <><img src={fileData} className="w-full h-24 object-cover rounded-xl mb-3" /><button disabled={loading} onClick={saveToGallery} className="w-full bg-emerald-600 text-white py-2 rounded-xl font-bold">Confirm Upload</button></>}
                </div>
             </div>
             <div className="lg:col-span-1 bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-inner h-fit">
                <h3 className="text-xl font-black uppercase tracking-tight mb-6">Gallery Images ({dynamicImages.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto p-2">
                  {dynamicImages.map((img) => (<div key={img.id} className="relative group aspect-square bg-white rounded-2xl overflow-hidden shadow-sm"><img src={img.url} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-red-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => deleteImage(img.id)}><Trash2 className="text-white" /></div></div>))}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffPortal;