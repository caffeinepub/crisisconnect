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

  const { data: contacts = [], isLoading } = useGetMyEmergencyContacts();
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
        <p className="text-gray-300 text-sm">
          These contacts are private to you and will appear on your SOS screen so you can quickly call them during an emergency.
        </p>
      </div>

      {/* Add Contact Form */}
      <div className="rounded-2xl p-6 mb-8"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <h2 className="font-display font-bold text-white text-lg mb-5 flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-amber-400" />
          Add Emergency Contact
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Contact's full name"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${errors.name ? 'rgba(230,57,70,0.5)' : 'rgba(255,255,255,0.1)'}` }}
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Phone Number *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+1 234 567 8900"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${errors.phone ? 'rgba(230,57,70,0.5)' : 'rgba(255,255,255,0.1)'}` }}
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Relationship *</label>
            <select
              value={form.relationship}
              onChange={e => setForm(prev => ({ ...prev, relationship: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${errors.relationship ? 'rgba(230,57,70,0.5)' : 'rgba(255,255,255,0.1)'}` }}
            >
              <option value="" style={{ background: '#1a1a2e' }}>Select relationship...</option>
              {RELATIONSHIP_OPTIONS.map(r => (
                <option key={r} value={r} style={{ background: '#1a1a2e' }}>{r}</option>
              ))}
            </select>
            {errors.relationship && <p className="text-red-400 text-xs mt-1">{errors.relationship}</p>}
          </div>
          <button
            type="submit"
            disabled={addContact.isPending}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #f4a261, #e76f51)' }}
          >
            {addContact.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            Add Contact
          </button>
        </form>
      </div>

      {/* Contacts List */}
      <div>
        <h2 className="font-display font-bold text-white text-lg mb-4 flex items-center gap-2">
          <Phone className="w-5 h-5 text-amber-400" />
          Your Contacts
          {contacts.length > 0 && (
            <span className="text-xs font-normal text-gray-500 ml-1">({contacts.length})</span>
          )}
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
            ))}
          </div>
        ) : contacts.length === 0 ? (
          <div className="text-center py-12 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <Phone className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">No emergency contacts yet</p>
            <p className="text-gray-600 text-sm mt-1">Add contacts above to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {contacts.map(contact => (
              <div
                key={contact.id.toString()}
                className="flex items-center justify-between gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(244,162,97,0.15)', border: '1px solid rgba(244,162,97,0.3)' }}>
                    <Users className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{contact.name}</p>
                    <p className="text-gray-500 text-xs">{contact.relationship}</p>
                    <a
                      href={`tel:${contact.phone}`}
                      className="text-amber-400 text-xs hover:text-amber-300 transition-colors"
                    >
                      {contact.phone}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={`tel:${contact.phone}`}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ background: 'rgba(82,183,136,0.25)', border: '1px solid rgba(82,183,136,0.4)' }}
                  >
                    <Phone className="w-3.5 h-3.5 text-green-400" />
                    Call
                  </a>
                  <button
                    onClick={() => handleRemove(contact.id)}
                    disabled={removingId === contact.id}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ background: 'rgba(230,57,70,0.15)', border: '1px solid rgba(230,57,70,0.3)', color: '#ff6b6b' }}
                  >
                    {removingId === contact.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
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
