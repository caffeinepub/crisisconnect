import React, { useState } from 'react';
import { Users, Plus, Search, Loader2 } from 'lucide-react';
import { useVolunteers, useRegisterVolunteer } from '../hooks/useQueries';
import VolunteerCard from '../components/volunteer/VolunteerCard';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import type { Volunteer } from '../backend';

const SKILL_OPTIONS = [
  { value: 'first-aid', label: '🩺 First Aid' },
  { value: 'driving', label: '🚗 Driving' },
  { value: 'medical', label: '🏥 Medical' },
  { value: 'rescue', label: '🦺 Rescue' },
  { value: 'communication', label: '📡 Communication' },
];

export default function VolunteerPage() {
  const { data: volunteers, isLoading } = useVolunteers();
  const registerVolunteer = useRegisterVolunteer();

  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterSkill, setFilterSkill] = useState('');
  const [filterActive, setFilterActive] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [isActive, setIsActive] = useState(true);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const filtered = (volunteers || []).filter(v => {
    const matchSearch =
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.city.toLowerCase().includes(search.toLowerCase());
    const matchSkill = filterSkill ? v.skills.includes(filterSkill) : true;
    const matchActive = filterActive ? v.isActive : true;
    return matchSearch && matchSkill && matchActive;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const volunteer: Volunteer = {
      id: BigInt(0),
      name: name.trim(),
      skills: selectedSkills,
      city: city.trim(),
      isActive,
    };
    try {
      await registerVolunteer.mutateAsync(volunteer);
      toast.success('You have been registered as a volunteer!');
      setName('');
      setSelectedSkills([]);
      setCity('');
      setIsActive(true);
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
          <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-2">
            <Users className="w-4 h-4" />
            Volunteer Management
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-2">
            Emergency Volunteers
          </h1>
          <p className="text-gray-400">Register as a volunteer or find skilled helpers near you</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105"
          style={{ background: 'linear-gradient(135deg, #f4a261, #e76f51)' }}
        >
          <Plus className="w-4 h-4" />
          Register as Volunteer
        </button>
      </div>

      {/* Registration form */}
      {showForm && (
        <div
          className="rounded-2xl p-6 mb-8 animate-fade-in"
          style={{ background: 'rgba(244,162,97,0.08)', border: '1px solid rgba(244,162,97,0.25)' }}
        >
          <h2 className="font-display font-bold text-xl text-white mb-5">
            Register as Emergency Volunteer
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your full name"
                  required
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Your city"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-amber-500/40 transition-all"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-2">Skills</label>
              <div className="flex flex-wrap gap-2">
                {SKILL_OPTIONS.map(skill => (
                  <button
                    key={skill.value}
                    type="button"
                    onClick={() => toggleSkill(skill.value)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={
                      selectedSkills.includes(skill.value)
                        ? { background: 'rgba(244,162,97,0.3)', border: '1px solid rgba(244,162,97,0.5)', color: '#f4a261' }
                        : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }
                    }
                  >
                    {skill.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-300">Available / Active</label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className="relative w-12 h-6 rounded-full transition-all"
                style={{ background: isActive ? 'rgba(82,183,136,0.6)' : 'rgba(255,255,255,0.1)' }}
              >
                <span
                  className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                  style={{ left: isActive ? '26px' : '4px' }}
                />
              </button>
              <span className={`text-sm ${isActive ? 'text-green-400' : 'text-gray-500'}`}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!name.trim() || registerVolunteer.isPending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #f4a261, #e76f51)' }}
              >
                {registerVolunteer.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
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
            placeholder="Search volunteers by name or city..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
        </div>
        <select
          value={filterSkill}
          onChange={e => setFilterSkill(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm text-white outline-none transition-all"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <option value="" style={{ background: '#1a1a2e' }}>All Skills</option>
          {SKILL_OPTIONS.map(s => (
            <option key={s.value} value={s.value} style={{ background: '#1a1a2e' }}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          onClick={() => setFilterActive(!filterActive)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={
            filterActive
              ? { background: 'rgba(82,183,136,0.2)', border: '1px solid rgba(82,183,136,0.4)', color: '#74c69d' }
              : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }
          }
        >
          {filterActive ? '✓ ' : ''}Active Only
        </button>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-gray-500 mb-4">
          {filtered.length} volunteer{filtered.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Volunteer list */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-28 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          ))
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No volunteers found</p>
            <p className="text-sm mt-1">Be the first to register!</p>
          </div>
        ) : (
          filtered.map(v => <VolunteerCard key={String(v.id)} volunteer={v} />)
        )}
      </div>
    </div>
  );
}
