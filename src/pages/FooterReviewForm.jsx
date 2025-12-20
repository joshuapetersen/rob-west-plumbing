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
    <div className="bg-slate-900 border-t border-slate-800 py-12 sm:py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* REVIEWS DISPLAY SECTION */}
        <div className="mb-12 sm:mb-16 md:mb-20">
           <div className="text-center mb-8 sm:mb-12">
              <h4 className="text-emerald-500 font-bold uppercase tracking-widest text-xs mb-2 sm:mb-3">Customer Feedback</h4>
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-4 sm:mb-6">What Our Neighbors Say</h3>
              <div className="inline-flex items-center justify-center gap-3 sm:gap-4 bg-slate-800 px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-2xl border border-slate-700/50">
                 <span className="text-3xl sm:text-4xl font-black text-white">{averageRating}</span>
                 <div className="flex flex-col items-start">
                   <div className="flex gap-1 mb-1">
                     {[1,2,3,4,5].map(star => (
                       <Star key={star} size={14} fill={star <= Math.round(averageRating) ? "#fbbf24" : "none"} stroke={star <= Math.round(averageRating) ? "none" : "#475569"} />
                     ))}
                   </div>
                   <span className="text-slate-400 text-xs font-bold uppercase tracking-wide">{reviews.length} Verified Reviews</span>
                 </div>
              </div>
           </div>

           {reviews.length > 0 ? (
             <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
               {reviews.slice(0, 3).map((review, idx) => (
                 <div key={idx} className="bg-slate-800/50 p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-slate-800 hover:border-emerald-500/30 transition-all">
                    <div className="flex gap-1 mb-3 sm:mb-4">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} fill={i < (review.rating || 5) ? "#fbbf24" : "none"} stroke={i < (review.rating || 5) ? "none" : "#475569"} />
                      ))}
                    </div>
                    <p className="text-slate-300 mb-4 sm:mb-6 italic leading-relaxed text-sm sm:text-base">"{review.text}"</p>
                    <div className="flex items-center gap-2 sm:gap-3 mt-auto">
                      <div className="w-7 sm:w-8 h-7 sm:h-8 rounded-full bg-emerald-900/50 text-emerald-400 flex items-center justify-center font-black text-xs">
                        {review.name.charAt(0)}
                      </div>
                      <p className="text-emerald-400 font-bold text-xs sm:text-sm">{review.name}</p>
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-center p-8 sm:p-12 bg-slate-800/30 rounded-2xl sm:rounded-3xl border border-slate-800 border-dashed">
                <MessageSquare className="mx-auto text-slate-600 mb-3 sm:mb-4" size={28} />
                <p className="text-slate-500 italic font-medium text-sm sm:text-base">Be the first to leave a review!</p>
             </div>
           )}
        </div>

        {/* LEAVE A REVIEW FORM */}
        <div className="max-w-2xl mx-auto border-t border-slate-800 pt-12 sm:pt-16">
          <h4 className="text-white font-bold text-center mb-6 sm:mb-8 uppercase tracking-widest text-xs sm:text-sm">Share Your Experience</h4>
          {submitted ? <div className="bg-emerald-600 text-white p-5 sm:p-6 rounded-lg sm:rounded-2xl text-center animate-in fade-in zoom-in"><CheckCircle2 className="mx-auto mb-2" size={24} /><p className="font-bold text-sm sm:text-base">Thank you for your feedback!</p></div> : 
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 mb-12 sm:mb-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"><input type="text" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} className="bg-slate-800 text-white placeholder:text-slate-500 rounded-lg sm:rounded-xl p-3 sm:p-4 font-bold text-sm sm:text-base border border-slate-700 focus:border-emerald-500 focus:outline-none transition-colors" required /><div className="flex items-center justify-center bg-slate-800 rounded-lg sm:rounded-xl px-3 sm:px-4 gap-1 border border-slate-700">{[1,2,3,4,5].map(star => (<Star key={star} size={20} fill={star <= rating ? "#fbbf24" : "none"} stroke={star <= rating ? "none" : "#475569"} className="cursor-pointer hover:scale-110 transition-transform" onClick={() => setRating(star)} />))}</div></div>
              <textarea placeholder="Describe your experience with us..." rows={4} value={text} onChange={e => setText(e.target.value)} className="w-full bg-slate-800 text-white placeholder:text-slate-500 rounded-lg sm:rounded-xl p-3 sm:p-4 font-bold text-sm sm:text-base resize-none border border-slate-700 focus:border-emerald-500 focus:outline-none transition-colors" required />
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 text-sm sm:text-base">Submit Review <Send size={16} /></button>
            </form>}
            
            {/* SOCIAL MEDIA LINKS */}
            <div className="flex flex-col items-center gap-4 sm:gap-6 border-t border-slate-800 pt-8 sm:pt-12">
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Connect With Us</p>
              <div className="flex gap-3 sm:gap-4">
                {social.facebook && <a href={social.facebook} target="_blank" rel="noopener noreferrer" className="bg-slate-800 p-3 sm:p-4 rounded-lg sm:rounded-2xl text-slate-400 hover:text-white hover:bg-[#1877F2] transition-all hover:-translate-y-1 shadow-lg"><Facebook size={20} /></a>}
                {social.instagram && <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="bg-slate-800 p-3 sm:p-4 rounded-lg sm:rounded-2xl text-slate-400 hover:text-white hover:bg-gradient-to-tr hover:from-yellow-500 hover:via-red-500 hover:to-purple-500 transition-all hover:-translate-y-1 shadow-lg"><Instagram size={20} /></a>}
                {social.youtube && <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="bg-slate-800 p-3 sm:p-4 rounded-lg sm:rounded-2xl text-slate-400 hover:text-white hover:bg-red-600 transition-all hover:-translate-y-1 shadow-lg"><Youtube size={20} /></a>}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default FooterReviewForm;