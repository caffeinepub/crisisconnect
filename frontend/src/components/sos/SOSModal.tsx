import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, MapPin, X, CheckCircle, Loader2, Phone, UserPlus } from 'lucide-react';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useRecordSOS, useGetMyEmergencyContacts } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';

interface SOSModalProps {
  open: boolean;
  onClose: () => void;
}

type SOSState = 'idle' | 'locating' | 'countdown' | 'sending' | 'sent' | 'error';

export default function SOSModal({ open, onClose }: SOSModalProps) {
  const [sosState, setSosState] = useState<SOSState>('idle');
  const [countdown, setCountdown] = useState(5);
  const [errorMsg, setErrorMsg] = useState('');
  const { position, requestLocation } = useGeolocation();
  const recordSOS = useRecordSOS();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  // Fetch emergency contacts — always call the hook, filter usage by auth state
  const { data: emergencyContacts = [], isLoading: contactsLoading } = useGetMyEmergencyContacts();

  const reset = useCallback(() => {
    setSosState('idle');
    setCountdown(5);
    setErrorMsg('');
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  // Start location + countdown when modal opens
  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    setSosState('locating');
    requestLocation()
      .then(() => {
        setSosState('countdown');
        setCountdown(5);
      })
      .catch(() => {
        // Proceed without location
        setSosState('countdown');
        setCountdown(5);
      });
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown timer
  useEffect(() => {
    if (sosState !== 'countdown') return;
    if (countdown <= 0) {
      handleSendSOS();
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [sosState, countdown]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSendSOS = async () => {
    setSosState('sending');
    try {
      await recordSOS.mutateAsync({
        lat: position?.lat ?? 0,
        lng: position?.lng ?? 0,
      });
      setSosState('sent');
      toast.error('🚨 SOS Alert Sent! Emergency services have been notified.', {
        duration: 6000,
      });
    } catch {
      setSosState('error');
      setErrorMsg('Failed to send SOS. Please call emergency services directly.');
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={sosState === 'countdown' ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a1a2e, #22223a)', border: '1px solid rgba(230,57,70,0.4)' }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-red-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(230,57,70,0.2)', border: '1px solid rgba(230,57,70,0.5)' }}>
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h2 className="font-display font-bold text-white text-lg">Emergency SOS</h2>
              <p className="text-xs text-gray-400">Alert will be sent to emergency services</p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {sosState === 'locating' && (
            <div className="text-center py-6">
              <Loader2 className="w-12 h-12 text-red-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Detecting your location...</p>
              <p className="text-gray-400 text-sm mt-1">Please allow location access</p>
            </div>
          )}

          {sosState === 'countdown' && (
            <div className="text-center py-4">
              <div className="relative w-28 h-28 mx-auto mb-6">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(230,57,70,0.2)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="45" fill="none"
                    stroke="#e63946" strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    strokeDashoffset={`${2 * Math.PI * 45 * (1 - countdown / 5)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-display font-black text-red-400">{countdown}</span>
                </div>
              </div>
              <p className="text-white font-bold text-xl mb-2">Sending SOS in {countdown}s</p>
              {position && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400 mb-4">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <span>{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span>
                </div>
              )}
              {!position && (
                <p className="text-amber-400 text-sm mb-4">⚠️ Location unavailable — SOS will be sent without coordinates</p>
              )}
              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl font-semibold text-white transition-all"
                style={{ background: 'rgba(244,162,97,0.2)', border: '1px solid rgba(244,162,97,0.4)' }}
              >
                Cancel SOS
              </button>
            </div>
          )}

          {sosState === 'sending' && (
            <div className="text-center py-6">
              <Loader2 className="w-12 h-12 text-red-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-medium">Sending emergency alert...</p>
            </div>
          )}

          {sosState === 'sent' && (
            <div className="py-2">
              {/* Success header */}
              <div className="text-center mb-5">
                <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-3" />
                <p className="text-white font-bold text-xl mb-1">SOS Sent Successfully!</p>
                <p className="text-gray-400 text-sm">Stay calm and stay safe.</p>
              </div>

              {/* Emergency Services Call Button — always shown */}
              <a
                href="tel:112"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-bold text-white text-lg mb-4 transition-all hover:opacity-90 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #e63946, #c1121f)', boxShadow: '0 4px 20px rgba(230,57,70,0.4)' }}
              >
                <Phone className="w-6 h-6" />
                Call Emergency Services (112)
              </a>

              {/* Additional quick-dial numbers */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <a
                  href="tel:911"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-red-300 transition-all hover:opacity-80"
                  style={{ background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.3)' }}
                >
                  <Phone className="w-4 h-4" />
                  911
                </a>
                <a
                  href="tel:108"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold text-red-300 transition-all hover:opacity-80"
                  style={{ background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.3)' }}
                >
                  <Phone className="w-4 h-4" />
                  108 (Ambulance)
                </a>
              </div>

              {/* Emergency Contacts section — only for authenticated users */}
              {isAuthenticated && (
                <div className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(244,162,97,0.25)', background: 'rgba(244,162,97,0.05)' }}>
                  <div className="px-4 py-3 border-b"
                    style={{ borderColor: 'rgba(244,162,97,0.2)' }}>
                    <p className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Your Emergency Contacts
                    </p>
                  </div>

                  {contactsLoading ? (
                    <div className="px-4 py-4 text-center">
                      <Loader2 className="w-5 h-5 text-amber-400 animate-spin mx-auto" />
                    </div>
                  ) : emergencyContacts.length > 0 ? (
                    <div className="divide-y" style={{ borderColor: 'rgba(244,162,97,0.1)' }}>
                      {emergencyContacts.map((contact) => (
                        <div key={contact.id.toString()} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-white font-medium text-sm truncate">{contact.name}</p>
                              <p className="text-gray-500 text-xs">{contact.relationship}</p>
                            </div>
                            <a
                              href={`tel:${contact.phone}`}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white shrink-0 transition-all hover:opacity-90 active:scale-95"
                              style={{ background: 'rgba(244,162,97,0.3)', border: '1px solid rgba(244,162,97,0.5)' }}
                            >
                              <Phone className="w-3.5 h-3.5" />
                              Call {contact.name.split(' ')[0]}
                            </a>
                          </div>
                          <p className="text-amber-400/70 text-xs mt-1">{contact.phone}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-4 text-center">
                      <UserPlus className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm mb-2">No emergency contacts added yet.</p>
                      <Link
                        to="/emergency-contacts"
                        onClick={handleClose}
                        className="text-amber-400 text-xs hover:text-amber-300 underline underline-offset-2 transition-colors"
                      >
                        Add contacts in Emergency Contacts →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Prompt unauthenticated users to login to add contacts */}
              {!isAuthenticated && (
                <div className="rounded-xl px-4 py-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-gray-400 text-xs">
                    <Link to="/login" onClick={handleClose} className="text-amber-400 hover:text-amber-300 underline underline-offset-2">
                      Login
                    </Link>
                    {' '}to add personal emergency contacts for faster notification.
                  </p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="w-full mt-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                Close
              </button>
            </div>
          )}

          {sosState === 'error' && (
            <div className="text-center py-4">
              <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-white font-bold text-xl mb-2">Failed to Send SOS</p>
              <p className="text-red-400 text-sm mb-4">{errorMsg}</p>

              {/* Emergency call button even on error */}
              <a
                href="tel:112"
                className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-bold text-white text-lg mb-3 transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #e63946, #c1121f)', boxShadow: '0 4px 20px rgba(230,57,70,0.4)' }}
              >
                <Phone className="w-6 h-6" />
                Call Emergency Services (112)
              </a>

              <div className="space-y-2">
                <button
                  onClick={() => { setSosState('countdown'); setCountdown(5); }}
                  className="w-full py-3 rounded-xl font-semibold text-white"
                  style={{ background: 'rgba(230,57,70,0.3)', border: '1px solid rgba(230,57,70,0.5)' }}
                >
                  Try Again
                </button>
                <button onClick={handleClose} className="w-full py-3 rounded-xl font-semibold text-gray-400 hover:text-white transition-colors">
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Emergency numbers footer */}
        <div className="px-6 pb-5">
          <div className="rounded-xl p-3 text-center text-xs text-gray-500"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            📞 Emergency: <a href="tel:911" className="text-red-400 font-bold hover:text-red-300">911</a>
            &nbsp;|&nbsp;
            Ambulance: <a href="tel:108" className="text-red-400 font-bold hover:text-red-300">108</a>
            &nbsp;|&nbsp;
            Fire: <a href="tel:101" className="text-red-400 font-bold hover:text-red-300">101</a>
            &nbsp;|&nbsp;
            Intl: <a href="tel:112" className="text-red-400 font-bold hover:text-red-300">112</a>
          </div>
        </div>
      </div>
    </div>
  );
}
