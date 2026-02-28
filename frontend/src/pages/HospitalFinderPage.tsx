import React, { useState } from 'react';
import { Hospital, MapPin, Loader2 } from 'lucide-react';
import { useHospitals } from '../hooks/useQueries';
import { useGeolocation } from '../hooks/useGeolocation';
import HospitalCard from '../components/hospitals/HospitalCard';
import { haversineDistance } from '../utils/haversine';
import { Skeleton } from '@/components/ui/skeleton';

export default function HospitalFinderPage() {
  const { data: hospitals, isLoading } = useHospitals();
  const { position, requestLocation, loading: geoLoading } = useGeolocation();
  const [search, setSearch] = useState('');
  const [filterAvailable, setFilterAvailable] = useState(false);

  const filtered = (hospitals || [])
    .filter(h => {
      const matchSearch =
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.address.toLowerCase().includes(search.toLowerCase());
      const matchAvail = filterAvailable ? Number(h.bedsAvailable) > 0 : true;
      return matchSearch && matchAvail;
    })
    .map(h => ({
      ...h,
      distance: position
        ? haversineDistance(position.lat, position.lng, h.lat, h.lng)
        : undefined,
    }))
    .sort((a, b) => {
      if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance;
      return 0;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-blue-400 text-sm font-medium mb-2">
          <Hospital className="w-4 h-4" />
          Hospital Finder
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-2">
          Nearest Hospitals
        </h1>
        <p className="text-gray-400">Find hospitals with available beds near you</p>
      </div>

      {/* Location bar */}
      <div
        className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6 p-4 rounded-2xl"
        style={{ background: 'rgba(72,149,239,0.08)', border: '1px solid rgba(72,149,239,0.2)' }}
      >
        <MapPin className="w-5 h-5 text-blue-400 flex-shrink-0" />
        {position ? (
          <span className="text-sm text-gray-300">
            Your location:{' '}
            <span className="text-blue-400">
              {position.lat.toFixed(4)}, {position.lng.toFixed(4)}
            </span>
          </span>
        ) : (
          <span className="text-sm text-gray-400">
            Location not detected — distances unavailable
          </span>
        )}
        <button
          onClick={requestLocation}
          disabled={geoLoading}
          className="sm:ml-auto flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
          style={{ background: 'rgba(72,149,239,0.3)', border: '1px solid rgba(72,149,239,0.4)' }}
        >
          {geoLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
          {position ? 'Update Location' : 'Detect Location'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div
          className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <Hospital className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search hospitals by name or address..."
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none"
          />
        </div>
        <button
          onClick={() => setFilterAvailable(!filterAvailable)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
          style={
            filterAvailable
              ? { background: 'rgba(82,183,136,0.2)', border: '1px solid rgba(82,183,136,0.4)', color: '#74c69d' }
              : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }
          }
        >
          {filterAvailable ? '✓ ' : ''}Available Beds Only
        </button>
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-sm text-gray-500 mb-4">
          {filtered.length} hospital{filtered.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Hospital list */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-24 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <Hospital className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No hospitals found</p>
            <p className="text-sm mt-1">Try adjusting your search or filters</p>
          </div>
        ) : (
          filtered.map(h => (
            <HospitalCard key={String(h.id)} hospital={h} distance={h.distance} />
          ))
        )}
      </div>
    </div>
  );
}
