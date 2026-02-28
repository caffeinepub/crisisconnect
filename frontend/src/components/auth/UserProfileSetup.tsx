import React, { useState } from 'react';
import { User, Phone, MapPin, Save } from 'lucide-react';
import { useSaveCallerUserProfile } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface UserProfileSetupProps {
  onComplete: () => void;
}

export default function UserProfileSetup({ onComplete }: UserProfileSetupProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [contact, setContact] = useState('');
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await saveProfile.mutateAsync({ name: name.trim(), city: city.trim(), contact: contact.trim() });
      toast.success('Profile saved! Welcome to CrisisConnect.');
      onComplete();
    } catch {
      toast.error('Failed to save profile. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #22223a)', border: '1px solid rgba(244,162,97,0.3)' }}>

        <div className="p-6 border-b border-amber-900/30">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(244,162,97,0.2)', border: '1px solid rgba(244,162,97,0.4)' }}>
              <User className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg">Complete Your Profile</h2>
              <p className="text-xs text-gray-400">Help us connect you with nearby resources</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              <User className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />
              Full Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Enter your name"
              required
              className="w-full px-4 py-2.5 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={e => setCity(e.target.value)}
              placeholder="Your city"
              className="w-full px-4 py-2.5 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              <Phone className="w-3.5 h-3.5 inline mr-1.5 text-amber-400" />
              Contact Number
            </label>
            <input
              type="tel"
              value={contact}
              onChange={e => setContact(e.target.value)}
              placeholder="Your phone number"
              className="w-full px-4 py-2.5 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <button
            type="submit"
            disabled={!name.trim() || saveProfile.isPending}
            className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #f4a261, #e76f51)' }}
          >
            {saveProfile.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Profile & Continue
          </button>
        </form>
      </div>
    </div>
  );
}
