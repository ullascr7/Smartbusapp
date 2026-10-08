import React, { useState } from 'react';
import { X, Sparkles, Send, Bot, User, ArrowRight, Loader2, Compass } from 'lucide-react';
import { api } from '../services/api.js';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSource?: string;
  currentDest?: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  currentSource,
  currentDest
}) => {
  const [query, setQuery] = useState('');
  const [conversation, setConversation] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: `Hello! I am **SmartBus AI Assistant** 🚌. I can help you plan your journey from rural villages or cities across Karnataka, explain intermediate handpost boarding stops, or calculate route fares at the official ₹1.50/km rate. How can I help you today?`
    }
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (textToSend?: string) => {
    const q = textToSend || query;
    if (!q.trim() || loading) return;

    const userMessage = q.trim();
    setConversation(prev => [...prev, { sender: 'user', text: userMessage }]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.ai.getAdvice(userMessage, currentSource, currentDest);
      setConversation(prev => [...prev, { sender: 'assistant', text: res.reply }]);
    } catch (e: any) {
      setConversation(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'I am temporarily unable to reach the travel assistance engine. However, buses run regularly between Karnataka taluks with automated fare calculation at ₹1.50/km.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sampleQuestions = [
    'How do I travel from Bilikere to Bengaluru?',
    'How is distance & fare calculated for intermediate village stops?',
    'What luggage is allowed on KSRTC Sarige buses?',
    'How does live driver tracking work?'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[85vh] max-h-[700px]">
        {/* Header */}
        <div className="bg-linear-to-r from-red-600 via-red-700 to-amber-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-lg font-black tracking-tight">SmartBus AI Travel Assistant</h2>
                <span className="text-[10px] font-bold bg-amber-400 text-amber-950 px-1.5 py-0.2 rounded">
                  Gemini
                </span>
              </div>
              <p className="text-xs text-red-100">
                Village Transit Planning • Route Guidance • Karnataka Travel Advice
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-slate-50/50">
          {conversation.map((msg, i) => {
            const isBot = msg.sender === 'assistant';
            return (
              <div
                key={i}
                className={`flex gap-3 ${isBot ? 'items-start' : 'items-end flex-row-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    isBot ? 'bg-red-600 text-white' : 'bg-slate-800 text-white'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                    isBot
                      ? 'bg-white text-slate-800 border border-slate-200 shadow-2xs whitespace-pre-line'
                      : 'bg-red-600 text-white shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold p-2 bg-white rounded-xl border border-slate-200 w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-red-600" />
              <span>Analyzing Karnataka route network & schedules...</span>
            </div>
          )}
        </div>

        {/* Quick Query Pills */}
        <div className="px-4 py-2 bg-white border-t border-slate-100 overflow-x-auto shrink-0 flex items-center gap-1.5 text-xs text-slate-600">
          <span className="font-bold text-[11px] text-slate-400 shrink-0">Try asking:</span>
          {sampleQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1 bg-slate-100 hover:bg-red-50 hover:text-red-700 rounded-lg whitespace-nowrap font-medium transition-colors cursor-pointer text-[11px]"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything about bus routes, villages, or ticket booking..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-hidden font-medium"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md shadow-red-600/20 transition-all flex items-center justify-center cursor-pointer disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
