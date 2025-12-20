import React, { useState } from 'react';
import { Star, MessageSquare, CheckCircle2, Facebook, Instagram, Youtube, Send } from 'lucide-react';

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

export default FooterReviewForm;