import React, { useState, useRef, useEffect } from 'react';
import { Send, RotateCcw, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { useFirstAidBot } from '../../hooks/useFirstAidBot';
import { EMERGENCY_CATEGORIES } from '../../utils/firstAidDecisionTree';
import type { ChatMessage } from '../../hooks/useFirstAidBot';

interface FirstAidChatbotProps {
  onClose: () => void;
}

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isBot = msg.role === 'bot';

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-3`}>
      <div className={`max-w-[85%] ${isBot ? 'order-2' : 'order-1'}`}>
        {isBot && (
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(230,57,70,0.3)' }}>
              <AlertTriangle className="w-3 h-3 text-red-400" />
            </div>
            <span className="text-xs text-gray-500">First Aid Bot</span>
          </div>
        )}
        <div
          className={`px-3 py-2.5 rounded-2xl text-sm ${
            isBot
              ? 'text-gray-200 rounded-tl-sm'
              : 'text-white rounded-tr-sm'
          }`}
          style={isBot
            ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.08)' }
            : { background: 'linear-gradient(135deg, rgba(230,57,70,0.6), rgba(193,18,31,0.6))' }
          }
        >
          {/* Render bold markdown */}
          {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={i} className="text-white">{part.slice(2, -2)}</strong>
              : <span key={i}>{part}</span>
          )}
        </div>

        {/* Guidance steps */}
        {msg.guidance && (
          <div className="mt-2 rounded-xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="px-3 py-2 flex items-center gap-2"
              style={{ background: msg.guidance.urgency === 'critical' ? 'rgba(230,57,70,0.2)' : 'rgba(244,162,97,0.15)' }}>
              <span className="text-lg">{msg.guidance.emoji}</span>
              <span className="font-semibold text-white text-sm">{msg.guidance.title}</span>
              {msg.guidance.callEmergency && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-bold"
                  style={{ background: 'rgba(230,57,70,0.4)', color: '#ff6b6b' }}>
                  CALL 911
                </span>
              )}
            </div>
            <div className="p-3 space-y-2">
              {msg.guidance.steps.map(step => (
                <div key={step.step} className="flex gap-2.5 text-xs">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center font-bold text-white"
                    style={{ background: 'rgba(230,57,70,0.4)', fontSize: '10px' }}>
                    {step.step}
                  </span>
                  <span className="text-gray-300 leading-relaxed">{step.instruction}</span>
                </div>
              ))}
            </div>
            {msg.guidance.warnings.length > 0 && (
              <div className="px-3 pb-3 space-y-1">
                {msg.guidance.warnings.map((w, i) => (
                  <div key={i} className="flex gap-2 text-xs text-amber-400">
                    <span>⚠️</span>
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category buttons */}
        {msg.showCategories && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {EMERGENCY_CATEGORIES.map(cat => (
              <CategoryButton key={cat.id} cat={cat} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CategoryButton({ cat }: { cat: typeof EMERGENCY_CATEGORIES[0] }) {
  // This needs access to selectCategory — we'll use a context or pass it differently
  // For simplicity, we'll use a custom event
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent('chatbot-select-category', { detail: cat.id }));
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium text-gray-300 hover:text-white transition-all text-left"
      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
    >
      <span>{cat.emoji}</span>
      <span className="truncate">{cat.label}</span>
    </button>
  );
}

export default function FirstAidChatbot({ onClose }: FirstAidChatbotProps) {
  const { messages, sendMessage, selectCategory, reset } = useFirstAidBot();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Listen for category selection from CategoryButton
  useEffect(() => {
    const handler = (e: Event) => {
      const catId = (e as CustomEvent).detail;
      selectCategory(catId);
    };
    window.addEventListener('chatbot-select-category', handler);
    return () => window.removeEventListener('chatbot-select-category', handler);
  }, [selectCategory]);

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="fixed bottom-24 right-6 z-[9989] w-[360px] max-w-[calc(100vw-3rem)] rounded-2xl overflow-hidden shadow-2xl animate-slide-in-right"
      style={{
        background: 'linear-gradient(180deg, #1a1a2e, #14141f)',
        border: '1px solid rgba(230,57,70,0.3)',
        maxHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(230,57,70,0.1)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(230,57,70,0.3)' }}>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <p className="font-display font-bold text-white text-sm">First Aid Assistant</p>
            <p className="text-xs text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all" title="Reset chat">
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" style={{ minHeight: 0 }}>
        {messages.map(msg => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a symptom or emergency..."
            className="flex-1 px-3 py-2 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-1 focus:ring-red-500/50 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40 hover:scale-105"
            style={{ background: 'linear-gradient(135deg, #e63946, #c1121f)' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2 text-center">
          ⚠️ For real emergencies, always call 911 first
        </p>
      </div>
    </div>
  );
}
