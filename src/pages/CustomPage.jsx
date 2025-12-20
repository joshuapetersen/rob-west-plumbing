import React from 'react';

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

export default CustomPage;