import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import FirstAidChatbot from './FirstAidChatbot';

export default function ChatbotButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-[9990] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all hover:scale-110 active:scale-95"
        style={{
          background: open ? 'rgba(230,57,70,0.9)' : 'linear-gradient(135deg, #e63946, #c1121f)',
          boxShadow: '0 4px 20px rgba(230,57,70,0.5)',
        }}
        aria-label="First Aid Chatbot"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
        {!open && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-xs font-bold text-black">
            ?
          </span>
        )}
      </button>

      {/* Chatbot panel */}
      {open && <FirstAidChatbot onClose={() => setOpen(false)} />}
    </>
  );
}
