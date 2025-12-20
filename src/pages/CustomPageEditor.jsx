import React, { useMemo } from 'react';
import { Image as ImageIcon, Upload } from 'lucide-react';

const CustomPageEditor = ({ page, updateCustomPageContent, compressImage }) => {
  const textValue = useMemo(() => {
    const content = page?.content;
    if (!content) return '';
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) {
        return parsed
          .map(n => {
            if (n && typeof n === 'object' && Array.isArray(n.children)) {
              return n.children.map(c => (c && typeof c === 'object' ? (c.text || '') : '')).join('');
            }
            return '';
          })
          .join('\n');
      }
      // If parsed is a string, just use it
      if (typeof parsed === 'string') return parsed;
      // Fallback to raw content
      return content;
    } catch {
      // Not JSON? Treat as plain text
      return content;
    }
  }, [page?.content]);

  const handleContentChange = (e) => {
    updateCustomPageContent(page.id, 'content', e.target.value);
  };

  const handleImageChange = async (file) => {
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      updateCustomPageContent(page.id, 'image', compressed);
    } catch (err) {
      console.error('Image upload error:', err);
    }
  };

  return (
    <div className="bg-white p-8 rounded-3xl border border-slate-200 mb-8 shadow-sm text-left animate-in fade-in">
      <h5 className="font-black text-lg mb-6 flex items-center gap-3 border-b border-slate-50 pb-4">{page.label} <span className="text-[10px] font-bold text-slate-300">({page.id})</span></h5>
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Document Headline</label>
          <input
            type="text"
            value={page.title || ''}
            onChange={(e) => updateCustomPageContent(page.id, 'title', e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Enter Page Title..."
          />
        </div>

        {/* Image Editor Section */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Page Feature Image</label>
          {page.image ? (
            <div className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200">
              <img src={page.image} alt="Page Feature" className="w-full h-48 object-cover" />
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-emerald-50 transition-colors flex items-center gap-2">
                  <Upload size={14} /> Swap Image
                  <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e.target.files[0])} />
                </label>
              </div>
            </div>
          ) : (
            <label className="block w-full cursor-pointer group">
              <div className="border-2 border-dashed rounded-xl border-slate-300 p-8 text-center hover:border-emerald-400 hover:bg-white transition-all">
                <ImageIcon className="mx-auto mb-2 text-slate-400 group-hover:text-emerald-500" size={32} />
                <p className="font-bold text-slate-400 text-xs uppercase tracking-widest group-hover:text-emerald-600">Upload Image</p>
                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageChange(e.target.files[0])} />
              </div>
            </label>
          )}
        </div>

        {/* Text Editor Section */}
        <div className="flex-1 border border-slate-200 rounded-xl p-4 bg-white focus-within:ring-2 focus-within:ring-emerald-500 transition-all">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Page Content</label>
          <textarea
            className="w-full h-[calc(100%-20px)] outline-none text-sm font-medium text-slate-700 resize-none leading-relaxed"
            placeholder="Start typing your page content here..."
            value={textValue}
            onChange={handleContentChange}
          />
        </div>
      </div>
    </div>
  );
};

export default CustomPageEditor;