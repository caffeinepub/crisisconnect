import React, { useState } from 'react';
import { Droplets, Plus, Search, Loader2 } from 'lucide-react';
import { useBloodDonors, useRegisterBloodDonor } from '../hooks/useQueries';
import DonorCard from '../components/blood/DonorCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { BloodDonor } from '../backend';

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function BloodDonorPage() {
  const { data: donors, isLoading } = useBloodDonors();
  const registerDonor = useRegisterBloodDonor();

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterBloodType, setFilterBloodType] = useState('');
  const [filterCity, setFilterCity] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [bloodType, setBloodType] = useState('O+');
  const [city, setCity] = useState('');
  const [contact, setContact] = useState('');

  const filtered = (donors || []).filter(d => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.city.toLowerCase().includes(search.toLowerCase());
    const matchBlood = filterBloodType ? d.bloodType === filterBloodType : true;
    const matchCity = filterCity
      ? d.city.toLowerCase().includes(filterCity.toLowerCase())
      : true;
    return matchSearch && matchBlood && matchCity;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const donor: BloodDonor = {
      id: BigInt(0),
      name: name.trim(),
      bloodType,
      city: city.trim(),
      contact: contact.trim(),
      registeredAt: BigInt(Date.now()) * BigInt(1_000_000),
    };
    try {
      await registerDonor.mutateAsync(donor);
      toast.success('You have been registered as a blood donor!');
      setName('');
      setCity('');
      setContact('');
      setBloodType('O+');
      setShowForm(false);
    } catch {
      toast.error('Failed to register. Please try again.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
            <Droplets className="w-4 h-4" />
            Blood Donor Registry
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-2">
            Blood Donors
          </h1>
          <p className="text-gray-400">Register as a donor or find donors by blood type</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #e63946, #c1121f)' }}
        >
          <Plus className="w-4 h-4" />
          Register as Donor
        </button>
      </div>

      {/* Registration form */}
      {showForm && (
        <div
          className="rounded-2xl p-6 mb-8 animate-fade-in"
          style={{ background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.25)' }}
        >
          <h2 className="font-display font-bold text-xl text-white mb-5">
            Register as Blood Donor
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your full name"
                required
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-red-500/40 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Blood Type *</label>
              <select
                value={bloodType}
                onChange={e => setBloodType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white outline-none focus:ring-2 focus:ring-red-500/40 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {BLOOD_TYPES.map(bt => (
                  <option key={bt} value={bt} style={{ background: '#1a1a2e' }}>
                    {bt}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">City</label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Your city"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-red-500/40 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Contact Number</label>
              <input
                type="tel"
                value={contact}
                onChange={e => setContact(e.target.value)}
                placeholder="Your phone number"
                className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-red-500/40 transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
            </div>
            <div className="sm:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={!name.trim() || registerDonor.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #e63946, #c1121f)' }}
              >
                {registerDonor.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Droplets className="w-4 h-4" />
                )}
                Register
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm text-gray-400 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div
          className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search donors by name or city..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
        </div>
        <select
          value={filterBloodType}
          onChange={e => setFilterBloodType(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <option value="" style={{ background: '#1a1a2e' }}>All Blood Types</option>
          {BLOOD_TYPES.map(bt => (
            <option key={bt} value={bt} style={{ background: '#1a1a2e' }}>
              {bt}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={filterCity}
          onChange={e => setFilterCity(e.target.value)}
          placeholder="Filter by city..."
          className="px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        />
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-gray-500 mb-4">
          {filtered.length} donor{filtered.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Donor list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-24 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-500">
            <Droplets className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No donors found</p>
            <p className="text-sm mt-1">Be the first to register!</p>
          </div>
        ) : (
          filtered.map(d => <DonorCard key={String(d.id)} donor={d} />)
        )}
      </div>
    </div>
  );
}
