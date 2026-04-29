import { useState, useRef, useEffect } from 'react';
import { 
  Send, MessageSquare, Sparkles, Bot, User, Plus, Loader2, 
  AlertCircle, ChevronRight, Zap, History, Info, MapPin, 
  CheckCircle, ShieldAlert 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { chatAPI } from '../lib/api';
import { ROLES } from '../lib/constants';
import useAuthStore from '../stores/authStore';
import { EmptyState } from '../components/ui/States';

// ─── Suggested Questions Configuration ───────────────────────────────────────
const SUGGESTIONS = {
  [ROLES.PARENT]: [
    { text: "Where is my child's bus?", icon: MapPin, color: "text-blue-600 bg-blue-50" },
    { text: "Today's attendance status?", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { text: "Safety tips for students?", icon: ShieldAlert, color: "text-amber-600 bg-amber-50" },
    { text: "Upcoming school holidays?", icon: Zap, color: "text-purple-600 bg-purple-50" },
  ],
  [ROLES.STAFF]: [
    { text: "Attendance summary for today", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
    { text: "Active bus route status", icon: MapPin, color: "text-blue-600 bg-blue-50" },
    { text: "Emergency alert protocol", icon: ShieldAlert, color: "text-amber-600 bg-amber-50" },
    { text: "Student transport load", icon: Zap, color: "text-purple-600 bg-purple-50" },
  ],
  [ROLES.ADMIN]: [
    { text: "Fleet status overview", icon: MapPin, color: "text-blue-600 bg-blue-50" },
    { text: "System analytics report", icon: Zap, color: "text-purple-600 bg-purple-50" },
    { text: "Critical security alerts", icon: ShieldAlert, color: "text-amber-600 bg-amber-50" },
    { text: "Attendance compliance", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50" },
  ],
};

const Chatbot = () => {
  const user = useAuthStore(s => s.user);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (sessionId) inputRef.current?.focus();
  }, [sessionId]);

  const createSession = async () => {
    try {
      setCreatingSession(true);
      setError(null);
      const res = await chatAPI.createSession();
      if (res.data.success) {
        setSessionId(res.data.session._id);
        setMessages([]);
        toast.success('AI Session Started');
      }
    } catch (err) {
      toast.error('Failed to connect to AI');
      setError('AI Service Unavailable');
    } finally {
      setCreatingSession(false);
    }
  };

  const sendMessage = async (textOverride = null) => {
    const text = textOverride || input;
    const trimmed = text.trim();
    if (!trimmed || !sessionId || loading) return;

    const userMsg = { role: 'user', content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setInput('');
    setLoading(true);
    setError(null);

    try {
      const res = await chatAPI.sendMessage({ sessionId, prompt: trimmed });
      const botMsg = {
        role: 'bot',
        content: res.data.chat?.response || 'I processed your request, but the result was empty.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const botMsg = { 
        role: 'bot', 
        content: 'I apologize, but I encountered a processing error. Please try again or rephrase your question.', 
        isError: true,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const roleSuggestions = SUGGESTIONS[user?.role] || SUGGESTIONS[ROLES.ADMIN];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-5xl mx-auto h-[calc(100vh-7rem)] flex flex-col gap-4"
    >
      {/* ── Header ── */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100 shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-200">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">SafeRoute AI</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Enterprise Safety Consultant</p>
          </div>
        </div>
        
        <button
          onClick={createSession}
          disabled={creatingSession}
          className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          {creatingSession ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          NEW SESSION
        </button>
      </div>

      {/* ── Chat Container ── */}
      <div className="flex-1 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col overflow-hidden min-h-0 relative">
        {!sessionId ? (
          <EmptyState
            icon={Bot}
            title="AI Assistant Offline"
            description="Start a new hybrid chat session to access real-time school safety information and transportation updates."
            action={createSession}
            actionLabel="Connect to SafeRoute AI"
          />
        ) : (
          <>
            {/* Scrollable Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide bg-slate-50/30">
              {/* Hybrid Welcome Box */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8 py-8"
                >
                  <div className="text-center space-y-3">
                    <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-3xl mx-auto flex items-center justify-center border-2 border-white shadow-xl">
                      <Bot size={32} />
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">How can I assist you today?</h2>
                    <p className="text-slate-500 text-sm max-w-md mx-auto">
                      Ask me about student records, bus tracking, attendance compliance, or any safety related inquiry.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {roleSuggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(s.text)}
                        className="group flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl text-left hover:border-blue-300 hover:shadow-xl hover:shadow-blue-500/5 transition-all animate-in slide-in-from-bottom-2 duration-500"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${s.color}`}>
                          <s.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700 truncate">{s.text}</p>
                          <p className="text-[10px] text-slate-400 font-medium">Quick Action • Instant Response</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Message List */}
              <AnimatePresence>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-end gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`h-8 w-8 rounded-xl shrink-0 flex items-center justify-center shadow-sm border ${
                        msg.role === 'user' 
                          ? 'bg-slate-900 text-white border-slate-800' 
                          : msg.isError ? 'bg-red-50 text-red-600 border-red-100' : 'bg-white text-blue-600 border-slate-100'
                      }`}>
                        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                      </div>
                      
                      <div className={`relative px-5 py-4 rounded-[1.5rem] text-sm leading-relaxed shadow-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none font-medium'
                          : msg.isError
                            ? 'bg-red-50 border border-red-100 text-red-700 rounded-bl-none'
                            : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                      }`}>
                        {msg.content}
                        <div className={`text-[9px] mt-2 font-bold uppercase tracking-wider ${msg.role === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                          {msg.role === 'user' ? 'You' : 'SafeRoute AI'} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {loading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-white border border-slate-100 text-blue-600 flex items-center justify-center shadow-sm">
                    <Bot size={16} />
                  </div>
                  <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={bottomRef} />
            </div>

            {/* Input Wrapper */}
            <div className="p-6 bg-white border-t border-slate-100 relative">
              {/* Active Info Bar */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Hybrid AI Connection
              </div>

              <div className="flex gap-3">
                <div className="flex-1 relative group">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask SafeRoute AI anything..."
                    disabled={loading}
                    className="w-full pl-5 pr-14 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white focus:ring-0 outline-none text-sm font-medium transition-all disabled:opacity-50 shadow-inner"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-slate-300">
                    <div className="h-6 w-px bg-slate-200 mx-1" />
                    <Info size={18} className="hover:text-blue-500 cursor-help transition-colors" />
                  </div>
                </div>
                
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white w-14 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 transition-all active:scale-90 disabled:opacity-40 disabled:shadow-none shrink-0"
                >
                  <Send size={20} />
                </button>
              </div>
              
              <div className="mt-4 flex items-center justify-between px-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <Zap size={12} className="text-amber-500" />
                    Fast Response
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <History size={12} className="text-blue-500" />
                    History Saved
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">ENTER to send • SafeRoute v1.0</p>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Chatbot;