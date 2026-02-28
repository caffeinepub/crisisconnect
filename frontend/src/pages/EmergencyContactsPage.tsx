import React, { useState } from 'react';
import { Phone, UserPlus, Trash2, Users, AlertTriangle, Loader2, ShieldAlert } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetMyEmergencyContacts, useAddEmergencyContact, useRemoveEmergencyContact } from '../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@tanstack/react-router';

interface ContactFormData {
  name: string;
  phone: string;
  relationship: string;
}

const RELATIONSHIP_OPTIONS = [
  'Spouse / Partner',
  'Parent',
  'Child',
  'Sibling',
  'Friend',
  'Colleague',
  'Doctor',
  'Other',
];

export default function EmergencyContactsPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: contacts = [], isLoading } = useGetMyEmergencyContacts(isAuthenticated);
  const addContact = useAddEmergencyContact();
  const removeContact = useRemoveEmergencyContact();

  const [form, setForm] = useState<ContactFormData>({ name: '', phone: '', relationship: '' });
  const [errors, setErrors] = useState<Partial<ContactFormData>>({});
  const [removingId, setRemovingId] = useState<bigint | null>(null);

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.3)' }}>
            <ShieldAlert className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Login Required</h2>
          <p className="text-gray-400 text-sm mb-5">
            You must be logged in to manage your emergency contacts.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #e63946, #c1121f)' }}
          >
            Login to Continue
          </Link>
        </div>
      </div>
    );
  }

  const validate = (): boolean => {
    const newErrors: Partial<ContactFormData> = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[+\d\s\-()]{6,20}$/.test(form.phone.trim())) newErrors.phone = 'Enter a valid phone number';
    if (!form.relationship.trim()) newErrors.relationship = 'Relationship is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await addContact.mutateAsync({
      name: form.name.trim(),
      phone: form.phone.trim(),
      relationship: form.relationship.trim(),
    });
    setForm({ name: '', phone: '', relationship: '' });
    setErrors({});
  };

  const handleRemove = async (id: bigint) => {
    setRemovingId(id);
    try {
      await removeContact.mutateAsync(id);
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(244,162,97,0.15)', border: '1px solid rgba(244,162,97,0.3)' }}>
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="font-display font-bold text-white text-2xl">Emergency Contacts</h1>
        </div>
        <p className="text-gray-400 text-sm ml-13">
          Add trusted contacts who will be shown when you trigger an SOS alert. You can call them directly from the SOS screen.
        </p>
      </div>

      {/* Info Banner */}
      <div className="rounded-xl p-4 mb-6 flex items-start gap-3"
        style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.2)' }}>
        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-red-300 font-medium text-sm">How it works</p>
          <p className="text-gray-400 text-xs mt-0.5">
            When you press SOS, after the alert is sent, you'll see quick-call buttons for each contact below — alongside the emergency services dial button.
          </p>
        </div>
      </div>

      {/* Add Contact Form */}
      <div className="rounded-2xl p-6 mb-8"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 className="text-white font-semibold text-base mb-5 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-amber-400" />
          Add New Contact
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. John Doe"
              className="w-full px-4 py-2.5 rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all focus:ring-1"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: errors.name ? '1px solid rgba(230,57,70,0.6)' : '1px solid rgba(255,255,255,0.1)',
              }}
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Phone Number <span className="text-red-400">*</span>
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="e.g. +1 555 000 1234"
              className="w-full px-4 py-2.5 rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all focus:ring-1"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: errors.phone ? '1px solid rgba(230,57,70,0.6)' : '1px solid rgba(255,255,255,0.1)',
              }}
            />
            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
          </div>

          {/* Relationship */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Relationship <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <select
                value={form.relationship}
                onChange={e => setForm(f => ({ ...f, relationship: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none appearance-none transition-all focus:ring-1"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: errors.relationship ? '1px solid rgba(230,57,70,0.6)' : '1px solid rgba(255,255,255,0.1)',
                  color: form.relationship ? '#fff' : '#4b5563',
                }}
              >
                <option value="" disabled style={{ background: '#1a1a2e', color: '#9ca3af' }}>Select relationship</option>
                {RELATIONSHIP_OPTIONS.map(opt => (
                  <option key={opt} value={opt} style={{ background: '#1a1a2e', color: '#fff' }}>{opt}</option>
                ))}
              </select>
            </div>
            {errors.relationship && <p className="text-red-400 text-xs mt-1">{errors.relationship}</p>}
          </div>

          <button
            type="submit"
            disabled={addContact.isPending}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, rgba(244,162,97,0.8), rgba(230,57,70,0.8))' }}
          >
            {addContact.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Add Emergency Contact
              </>
            )}
          </button>
        </form>
      </div>

      {/* Contacts List */}
      <div>
        <h2 className="text-white font-semibold text-base mb-4 flex items-center gap-2">
          <Phone className="w-4 h-4 text-red-400" />
          Your Contacts
          {contacts.length > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(230,57,70,0.2)', color: '#ff6b6b' }}>
              {contacts.length}
            </span>
          )}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl p-4"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <Skeleton className="h-3 w-24" style={{ background: 'rgba(255,255,255,0.05)' }} />
                  </div>
                  <Skeleton className="h-9 w-20 rounded-lg" style={{ background: 'rgba(255,255,255,0.05)' }} />
                </div>
              </div>
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="rounded-2xl p-10 text-center"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium mb-1">No emergency contacts yet</p>
            <p className="text-gray-600 text-sm">Add contacts above so they appear on your SOS screen.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <div
                key={contact.id.toString()}
                className="rounded-xl p-4 flex items-center justify-between gap-4 transition-all"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(244,162,97,0.15)', border: '1px solid rgba(244,162,97,0.25)' }}>
                    <span className="text-amber-400 font-bold text-sm">
                      {contact.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{contact.name}</p>
                    <p className="text-gray-500 text-xs">{contact.relationship}</p>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-amber-400 text-xs hover:text-amber-300 transition-colors flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="w-3 h-3" />
                      {contact.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'rgba(244,162,97,0.2)', border: '1px solid rgba(244,162,97,0.35)' }}
                  >
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    Call
                  </a>
                  <button
                    onClick={() => handleRemove(contact.id)}
                    disabled={removingId === contact.id}
                    className="flex items-center justify-center w-9 h-9 rounded-lg text-gray-500 hover:text-red-400 transition-all disabled:opacity-50"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                    aria-label={`Remove ${contact.name}`}
                  >
                    {removingId === contact.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
