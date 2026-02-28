import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from '@tanstack/react-router';
import {
  Activity, Hospital, Droplets, Users, Map, LayoutDashboard,
  LogOut, Menu, X, ChevronRight, User, Phone
} from 'lucide-react';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useGetCallerUserProfile } from '../../hooks/useQueries';
import SOSButton from '../sos/SOSButton';
import UserProfileSetup from '../auth/UserProfileSetup';
import ChatbotButton from '../chatbot/ChatbotButton';
import { Toaster } from 'sonner';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/hospitals', label: 'Hospitals', icon: Hospital },
  { to: '/blood-donors', label: 'Blood Donors', icon: Droplets },
  { to: '/volunteers', label: 'Volunteers', icon: Users },
  { to: '/map', label: 'Resource Map', icon: Map },
  { to: '/emergency-contacts', label: 'Emergency Contacts', icon: Phone },
];

export default function AppLayout() {
  const { identity, clear, isInitializing } = useInternetIdentity();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthenticated = !!identity;
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0d14' }}>
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 nav-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="flex items-center gap-3 group">
              <div className="relative">
                <img
                  src="/assets/generated/logo.dim_256x256.png"
                  alt="CrisisConnect"
                  className="w-9 h-9 rounded-lg object-cover"
                />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full status-blink"
                  style={{ background: '#e63946' }} />
              </div>
              <div className="hidden sm:block">
                <span className="font-display font-bold text-white text-lg leading-none">Crisis</span>
                <span className="font-display font-bold text-red-400 text-lg leading-none">Connect</span>
              </div>
            </Link>

            {/* Desktop Nav */}
            {isAuthenticated && (
              <nav className="hidden lg:flex items-center gap-1">
                {NAV_LINKS.map(({ to, label, icon: Icon }) => {
                  const active = location.pathname === to;
                  return (
                    <Link
                      key={to}
                      to={to}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        active
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                      style={active ? { background: 'rgba(230,57,70,0.15)', color: '#ff6b6b' } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* Right side */}
            <div className="flex items-center gap-3">
              {/* SOS Button - always visible */}
              <SOSButton />

              {isAuthenticated ? (
                <>
                  {/* User info */}
                  <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(244,162,97,0.2)' }}>
                      <User className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <span className="text-sm text-gray-300 max-w-[120px] truncate">
                      {userProfile?.name || 'User'}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                !isInitializing && (
                  <Link
                    to="/login"
                    className="hidden sm:flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
                    style={{ background: 'rgba(244,162,97,0.2)', border: '1px solid rgba(244,162,97,0.3)' }}
                  >
                    Login
                  </Link>
                )
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-white/5 py-3 px-4"
            style={{ background: 'rgba(13,13,20,0.98)' }}>
            {isAuthenticated ? (
              <>
                {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-red-400" />
                      <span className="font-medium">{label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </Link>
                ))}
                <div className="border-t border-white/5 mt-2 pt-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
                    <User className="w-4 h-4 text-amber-400" />
                    {userProfile?.name || 'User'}
                  </div>
                  <button
                    onClick={() => { handleLogout(); setMobileOpen(false); }}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-white/5 rounded-lg transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-3 text-amber-400 font-medium"
              >
                Login to CrisisConnect
              </Link>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t py-6 px-4"
        style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(13,13,20,0.8)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-center text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-red-400" />
            <span>© {new Date().getFullYear()} CrisisConnect. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* Profile setup modal */}
      {showProfileSetup && <UserProfileSetup onComplete={() => queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] })} />}

      {/* Floating chatbot */}
      <ChatbotButton />

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#22223a',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#f0f0f0',
          },
        }}
      />
    </div>
  );
}
