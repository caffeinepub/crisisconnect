import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import { Shield, Activity, Hospital, Droplets, Users, AlertTriangle, Zap } from 'lucide-react';
import SOSButton from '../components/sos/SOSButton';

const FEATURES = [
  { icon: Hospital, label: 'Hospital Finder', desc: 'Locate nearest hospitals with real-time bed availability', color: '#72b7ff' },
  { icon: Droplets, label: 'Blood Donors', desc: 'Connect with registered blood donors by type and city', color: '#ff6b6b' },
  { icon: Users, label: 'Volunteers', desc: 'Coordinate with trained emergency volunteers near you', color: '#f4a261' },
  { icon: AlertTriangle, label: 'Live Alerts', desc: 'Real-time emergency alerts from your community', color: '#74c69d' },
  { icon: Zap, label: 'First Aid AI', desc: 'Step-by-step first aid guidance for any emergency', color: '#9b5de5' },
  { icon: Activity, label: 'Resource Map', desc: 'Interactive map of all emergency resources nearby', color: '#f4a261' },
];

export default function LoginPage() {
  const { login, loginStatus, identity, isInitializing } = useInternetIdentity();
  const navigate = useNavigate();

  useEffect(() => {
    if (identity) {
      navigate({ to: '/dashboard' });
    }
  }, [identity, navigate]);

  const isLoggingIn = loginStatus === 'logging-in';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0d14' }}>
      {/* Minimal nav for login page */}
      <header className="sticky top-0 z-50 nav-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img src="/assets/generated/logo.dim_256x256.png" alt="CrisisConnect" className="w-9 h-9 rounded-lg object-cover" />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full status-blink" style={{ background: '#e63946' }} />
              </div>
              <div>
                <span className="font-display font-bold text-white text-lg leading-none">Crisis</span>
                <span className="font-display font-bold text-red-400 text-lg leading-none">Connect</span>
              </div>
            </div>
            <SOSButton />
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/assets/generated/hero-banner.dim_1440x400.png"
            alt="Emergency Response"
            className="w-full h-full object-cover opacity-30"
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(13,13,20,0.3), rgba(13,13,20,1))' }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
            style={{ background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.3)', color: '#ff6b6b' }}>
            <span className="w-2 h-2 rounded-full status-blink" style={{ background: '#e63946' }} />
            Emergency Response Platform — Active 24/7
          </div>

          <h1 className="font-display font-black text-5xl sm:text-6xl text-white mb-4 leading-tight">
            Crisis<span className="text-red-400">Connect</span>
          </h1>
          <p className="text-xl text-gray-300 mb-3 max-w-2xl mx-auto leading-relaxed">
            AI-powered emergency response platform connecting you with hospitals, blood donors, and volunteers in real-time.
          </p>
          <p className="text-sm text-gray-500 mb-10">
            Every second counts. We're here when it matters most.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={login}
              disabled={isLoggingIn || isInitializing}
              className="flex items-center gap-3 px-8 py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #e63946, #c1121f)',
                boxShadow: '0 4px 30px rgba(230,57,70,0.4)',
              }}
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
              {isLoggingIn ? 'Connecting...' : 'Login to CrisisConnect'}
            </button>

            <div className="text-sm text-gray-500 flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              Secured by Internet Identity
            </div>
          </div>
        </div>
      </div>

      {/* Features grid */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="font-display font-bold text-2xl text-white text-center mb-10">
          Everything you need in an emergency
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, label, desc, color }) => (
            <div key={label} className="rounded-2xl p-5 transition-all hover:scale-[1.02]"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${color}20` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <h3 className="font-display font-bold text-white mb-1">{label}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-6 px-4 mt-auto"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(13,13,20,0.8)' }}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-400" />
            <span>© {new Date().getFullYear()} CrisisConnect. All rights reserved.</span>
          </div>
          <div className="flex items-center gap-1">
            Built with <span className="text-red-400 mx-1">♥</span> using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'crisisconnect')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400 hover:text-amber-300 transition-colors ml-1"
            >
              caffeine.ai
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
