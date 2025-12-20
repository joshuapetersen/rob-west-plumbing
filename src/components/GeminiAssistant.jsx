import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, X, Loader2, SendHorizontal } from 'lucide-react';

// GeminiAssistant component
const GeminiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'system', text: "Hello! I'm the Rob West AI Assistant. ✨ Describe your plumbing issue, and I'll give you a quick assessment!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_GEMINI_API_KEY);
  const messagesEndRef = useRef(null);

  // Log API key status on mount
  useEffect(() => {
    console.log('🔑 Gemini API Key loaded:', apiKey ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}` : 'MISSING');
    if (!apiKey) {
      console.error('❌ CRITICAL: Gemini API key is missing or undefined');
    }
  }, [apiKey]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isOpen]);

  const callGemini = async (userText) => {
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a helpful plumbing assistant for Rob West Plumbing. The user has described this issue: "${userText}". Provide a brief, friendly assessment and suggest next steps. Keep it under 200 words.`
            }]
          }]
        })
      });
      const data = await response.json();
      
      // Log the actual response for debugging
      console.log('Gemini API Response:', { status: response.status, data });
      
      if (!response.ok) {
        console.error('API Error Status:', response.status, 'Message:', data?.error?.message);
        const errorMsg = data?.error?.message || `API Error: ${response.status}`;
        setMessages(prev => [...prev, { role: 'model', text: `⚠️ API Error: ${errorMsg}. Please contact support.` }]);
      } else {
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't process that. Please call us for help.";
        setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
      }
    } catch (error) {
      console.error("Gemini API Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: `⚠️ Connection Error: ${error.message}. Please try again or call us.` }]);
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
            {!apiKey && (
              <div className="bg-red-100 border border-red-300 text-red-700 p-3 rounded-lg text-xs">
                ❌ <strong>API Key Error:</strong> Gemini API key is missing. Please check your .env file.
              </div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : msg.text.includes('⚠️') ? 'bg-red-100 border border-red-300 text-red-700 rounded-tl-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none shadow-sm'}`}>{msg.text}</div>
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
        {isOpen ? <X size={24} /> : <Sparkles size={24} />}
        {!isOpen && <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Ask AI Helper</span>}
      </button>
    </div>
  );
};

export default GeminiAssistant;