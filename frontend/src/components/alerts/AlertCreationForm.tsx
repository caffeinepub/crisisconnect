import React, { useState } from 'react';
import { Send, ChevronDown, ChevronUp } from 'lucide-react';
import { usePostEmergencyAlert } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { toast } from 'sonner';
import type { EmergencyAlert } from '../../backend';

const ALERT_TYPES = [
  { value: 'fire', label: '🔥 Fire' },
  { value: 'flood', label: '🌊 Flood' },
  { value: 'accident', label: '🚗 Accident' },
  { value: 'medical', label: '🏥 Medical Emergency' },
  { value: 'other', label: '⚠️ Other' },
];

export default function AlertCreationForm() {
  const [expanded, setExpanded] = useState(false);
  const [alertType, setAlertType] = useState('medical');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const { identity } = useInternetIdentity();
  const postAlert = usePostEmergencyAlert();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const alert: EmergencyAlert = {
      id: BigInt(0),
      alertType,
      description: description.trim(),
      location: location.trim(),
      timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      authorId: identity?.getPrincipal(),
    };

    try {
      await postAlert.mutateAsync(alert);
      toast.success('Emergency alert posted successfully!');
      setDescription('');
      setLocation('');
      setExpanded(false);
    } catch {
      toast.error('Failed to post alert. Please try again.');
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(230,57,70,0.2)' }}>
            <Send className="w-4 h-4 text-red-400" />
          </div>
          <span className="font-semibold text-white">Post Emergency Alert</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>

      {expanded && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-3 border-t"
          style={{ borderColor: 'rgba(230,57,70,0.2)' }}>
          <div className="pt-3">
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Alert Type</label>
            <select
              value={alertType}
              onChange={e => setAlertType(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-red-500/40 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {ALERT_TYPES.map(t => (
                <option key={t.value} value={t.value} style={{ background: '#1a1a2e' }}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Description *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the emergency situation..."
              rows={3}
              required
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-red-500/40 transition-all resize-none"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Location</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="Street address or landmark"
              className="w-full px-3 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-red-500/40 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            />
          </div>
          <button
            type="submit"
            disabled={!description.trim() || postAlert.isPending}
            className="w-full py-2.5 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #e63946, #c1121f)' }}
          >
            {postAlert.isPending ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Post Alert
          </button>
        </form>
      )}
    </div>
  );
}
