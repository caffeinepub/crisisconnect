import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import SOSModal from './SOSModal';

export default function SOSButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm text-white sos-pulse"
        style={{
          background: 'linear-gradient(135deg, #e63946, #c1121f)',
          boxShadow: '0 0 0 0 rgba(230, 57, 70, 0.7)',
        }}
        aria-label="Send SOS Emergency Alert"
      >
        <span className="absolute inset-0 rounded-full ping-slow opacity-75"
          style={{ background: 'rgba(230, 57, 70, 0.4)' }}
        />
        <AlertTriangle className="w-4 h-4 relative z-10" />
        <span className="relative z-10 hidden sm:inline">SOS</span>
      </button>
      <SOSModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
