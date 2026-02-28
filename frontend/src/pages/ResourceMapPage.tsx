import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGetHospitals, useGetVolunteers } from '../hooks/useQueries';
import { Loader2, MapPin, Navigation, Users, Building2, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Use any for the Leaflet global since the package is loaded via CDN
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LeafletMap = any;

// City to coordinates lookup table (best-effort for major cities)
const CITY_COORDS: Record<string, [number, number]> = {
  // Pakistan
  'karachi': [24.8607, 67.0011],
  'lahore': [31.5204, 74.3587],
  'islamabad': [33.6844, 73.0479],
  'rawalpindi': [33.5651, 73.0169],
  'faisalabad': [31.4504, 73.1350],
  'multan': [30.1575, 71.5249],
  'peshawar': [34.0151, 71.5249],
  'quetta': [30.1798, 66.9750],
  'hyderabad': [25.3960, 68.3578],
  'gujranwala': [32.1877, 74.1945],
  // India
  'mumbai': [19.0760, 72.8777],
  'delhi': [28.6139, 77.2090],
  'new delhi': [28.6139, 77.2090],
  'bangalore': [12.9716, 77.5946],
  'bengaluru': [12.9716, 77.5946],
  'chennai': [13.0827, 80.2707],
  'kolkata': [22.5726, 88.3639],
  'pune': [18.5204, 73.8567],
  'ahmedabad': [23.0225, 72.5714],
  'jaipur': [26.9124, 75.7873],
  // USA
  'new york': [40.7128, -74.0060],
  'los angeles': [34.0522, -118.2437],
  'chicago': [41.8781, -87.6298],
  'houston': [29.7604, -95.3698],
  'phoenix': [33.4484, -112.0740],
  'philadelphia': [39.9526, -75.1652],
  'san antonio': [29.4241, -98.4936],
  'san diego': [32.7157, -117.1611],
  'dallas': [32.7767, -96.7970],
  'san francisco': [37.7749, -122.4194],
  // UK
  'london': [51.5074, -0.1278],
  'manchester': [53.4808, -2.2426],
  'birmingham': [52.4862, -1.8904],
  'glasgow': [55.8642, -4.2518],
  'edinburgh': [55.9533, -3.1883],
  // Other major cities
  'dubai': [25.2048, 55.2708],
  'abu dhabi': [24.4539, 54.3773],
  'riyadh': [24.7136, 46.6753],
  'cairo': [30.0444, 31.2357],
  'nairobi': [-1.2921, 36.8219],
  'lagos': [6.5244, 3.3792],
  'johannesburg': [-26.2041, 28.0473],
  'sydney': [-33.8688, 151.2093],
  'melbourne': [-37.8136, 144.9631],
  'toronto': [43.6532, -79.3832],
  'vancouver': [49.2827, -123.1207],
  'paris': [48.8566, 2.3522],
  'berlin': [52.5200, 13.4050],
  'madrid': [40.4168, -3.7038],
  'rome': [41.9028, 12.4964],
  'amsterdam': [52.3676, 4.9041],
  'tokyo': [35.6762, 139.6503],
  'beijing': [39.9042, 116.4074],
  'shanghai': [31.2304, 121.4737],
  'singapore': [1.3521, 103.8198],
  'bangkok': [13.7563, 100.5018],
  'jakarta': [-6.2088, 106.8456],
  'kuala lumpur': [3.1390, 101.6869],
  'dhaka': [23.8103, 90.4125],
  'colombo': [6.9271, 79.8612],
  'kathmandu': [27.7172, 85.3240],
};

function getCityCoords(city: string): [number, number] | null {
  const normalized = city.toLowerCase().trim();
  if (CITY_COORDS[normalized]) return CITY_COORDS[normalized];
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }
  return null;
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Safe accessor for the global Leaflet object loaded via CDN
function getL(): LeafletMap {
  return (window as unknown as Record<string, LeafletMap>)['L'] ?? null;
}

type ActiveTab = 'hospitals' | 'volunteers';

export default function ResourceMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap>(null);
  const hospitalMarkersRef = useRef<LeafletMap[]>([]);
  const volunteerMarkersRef = useRef<LeafletMap[]>([]);

  const [mapReady, setMapReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('hospitals');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState('');

  const { data: hospitals = [], isLoading: hospitalsLoading } = useGetHospitals();
  const { data: volunteers = [], isLoading: volunteersLoading } = useGetVolunteers();

  const isLoading = hospitalsLoading || volunteersLoading;

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const initMap = () => {
      const L = getL();
      if (!L || !mapRef.current) return;

      // Fix default icon paths
      try {
        delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
      } catch (_) { /* ignore */ }

      const map = L.map(mapRef.current, {
        center: [30.0, 70.0],
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
      setTimeout(() => {
        map.invalidateSize();
        setMapReady(true);
      }, 300);
    };

    // Ensure Leaflet CSS is loaded
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    if (getL()) {
      initMap();
    } else if (!document.getElementById('leaflet-js')) {
      const script = document.createElement('script');
      script.id = 'leaflet-js';
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      // Script tag exists but may still be loading — poll
      const poll = setInterval(() => {
        if (getL()) {
          clearInterval(poll);
          initMap();
        }
      }, 100);
      return () => clearInterval(poll);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Invalidate size when sidebar toggles
  useEffect(() => {
    if (mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 300);
    }
  }, [sidebarOpen]);

  // Get user location
  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationError('');
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([latitude, longitude], 12);
          mapInstanceRef.current.invalidateSize();
        }
      },
      () => {
        setLocationError('Unable to retrieve your location.');
      }
    );
  }, []);

  // Add hospital markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const L = getL();
    if (!L) return;

    hospitalMarkersRef.current.forEach(m => { try { m.remove(); } catch (_) { /* ignore */ } });
    hospitalMarkersRef.current = [];

    hospitals.forEach(hospital => {
      if (!mapInstanceRef.current) return;
      const beds = Number(hospital.bedsAvailable);
      const bedsColor = beds > 20 ? '#22c55e' : beds > 5 ? '#f59e0b' : '#ef4444';

      const icon = L.divIcon({
        html: `<div style="background:#ef4444;width:28px;height:28px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4)"></div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        className: '',
      });

      const distanceText = userLocation
        ? `<p style="margin:4px 0;font-size:12px;color:#6b7280;">📍 ${haversineDistance(
            userLocation.lat, userLocation.lng, hospital.lat, hospital.lng
          ).toFixed(1)} km away</p>`
        : '';

      const directionsUrl = userLocation
        ? `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${hospital.lat},${hospital.lng}`
        : `https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lng}`;

      const marker = L.marker([hospital.lat, hospital.lng], { icon });
      marker.bindPopup(`
        <div style="min-width:200px;font-family:sans-serif;">
          <h3 style="margin:0 0 6px;font-size:15px;font-weight:700;color:#111;">${hospital.name}</h3>
          <p style="margin:4px 0;font-size:12px;color:#6b7280;">📍 ${hospital.address}</p>
          ${distanceText}
          <p style="margin:4px 0;font-size:12px;">
            <span style="color:${bedsColor};font-weight:600;">🛏 ${beds} beds available</span>
          </p>
          <p style="margin:4px 0;font-size:12px;color:#6b7280;">📞 ${hospital.contact}</p>
          <a href="${directionsUrl}" target="_blank" rel="noopener noreferrer"
            style="display:inline-block;margin-top:8px;padding:5px 12px;background:#3b82f6;color:white;border-radius:6px;font-size:12px;text-decoration:none;">
            Get Directions
          </a>
        </div>
      `);
      marker.addTo(mapInstanceRef.current);
      hospitalMarkersRef.current.push(marker);
    });
  }, [mapReady, hospitals, userLocation]);

  // Add volunteer markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    const L = getL();
    if (!L) return;

    volunteerMarkersRef.current.forEach(m => { try { m.remove(); } catch (_) { /* ignore */ } });
    volunteerMarkersRef.current = [];

    volunteers.forEach(volunteer => {
      if (!mapInstanceRef.current) return;
      const coords = getCityCoords(volunteer.city);
      if (!coords) return;

      // Small random jitter so volunteers in the same city don't stack exactly
      const jitter = () => (Math.random() - 0.5) * 0.05;
      const lat = coords[0] + jitter();
      const lng = coords[1] + jitter();

      const bgColor = volunteer.isActive ? '#22c55e' : '#94a3b8';
      const icon = L.divIcon({
        html: `<div style="background:${bgColor};width:26px;height:26px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;font-size:13px;">👤</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        className: '',
      });

      const skillBadges = volunteer.skills
        .map(s => `<span style="display:inline-block;padding:2px 8px;background:#e0f2fe;color:#0369a1;border-radius:999px;font-size:11px;margin:2px;">${s}</span>`)
        .join('');

      const marker = L.marker([lat, lng], { icon });
      marker.bindPopup(`
        <div style="min-width:190px;font-family:sans-serif;">
          <h3 style="margin:0 0 4px;font-size:15px;font-weight:700;color:#111;">${volunteer.name}</h3>
          <p style="margin:4px 0;font-size:12px;color:#6b7280;">📍 ${volunteer.city}</p>
          <p style="margin:4px 0;font-size:12px;">
            <span style="color:${bgColor};font-weight:600;">${volunteer.isActive ? '✅ Available' : '⏸ Unavailable'}</span>
          </p>
          <div style="margin-top:6px;display:flex;flex-wrap:wrap;gap:2px;">${skillBadges}</div>
        </div>
      `);
      marker.addTo(mapInstanceRef.current);
      volunteerMarkersRef.current.push(marker);
    });
  }, [mapReady, volunteers]);

  // Sorted hospitals by distance
  const sortedHospitals = [...hospitals].sort((a, b) => {
    if (!userLocation) return 0;
    const da = haversineDistance(userLocation.lat, userLocation.lng, a.lat, a.lng);
    const db = haversineDistance(userLocation.lat, userLocation.lng, b.lat, b.lng);
    return da - db;
  });

  const volunteersWithCoords = volunteers.filter(v => getCityCoords(v.city) !== null);
  const volunteersWithoutCoords = volunteers.filter(v => getCityCoords(v.city) === null);

  const focusHospital = (lat: number, lng: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 14);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
    }
  };

  const focusVolunteer = (city: string) => {
    const coords = getCityCoords(city);
    if (coords && mapInstanceRef.current) {
      mapInstanceRef.current.setView(coords, 12);
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
    }
  };

  return (
    <div className="flex h-[calc(100vh-64px)] relative overflow-hidden bg-background">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading map data...</p>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div
        className={`relative z-10 flex flex-col bg-card border-r border-border transition-all duration-300 ${
          sidebarOpen ? 'w-80' : 'w-0 overflow-hidden'
        }`}
      >
        {sidebarOpen && (
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-border space-y-3">
              <h2 className="font-bold text-lg text-foreground">Resource Map</h2>

              {/* Location button */}
              <button
                onClick={getUserLocation}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-border hover:bg-muted transition-colors text-foreground"
              >
                <Navigation className="w-4 h-4" />
                {userLocation ? 'Update My Location' : 'Use My Location'}
              </button>
              {locationError && (
                <p className="text-xs text-destructive">{locationError}</p>
              )}
              {userLocation && (
                <p className="text-xs text-muted-foreground">
                  📍 Location active — showing nearest first
                </p>
              )}

              {/* Tabs */}
              <div className="flex rounded-lg overflow-hidden border border-border">
                <button
                  onClick={() => setActiveTab('hospitals')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'hospitals'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  Hospitals ({hospitals.length})
                </button>
                <button
                  onClick={() => setActiveTab('volunteers')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                    activeTab === 'volunteers'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Volunteers ({volunteers.length})
                </button>
              </div>
            </div>

            {/* Legend */}
            <div className="px-4 py-2 border-b border-border bg-muted/30">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                {activeTab === 'hospitals' ? (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> &gt;20 beds
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> 5–20 beds
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> &lt;5 beds
                    </span>
                  </>
                ) : (
                  <>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Active
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-slate-400 inline-block" /> Inactive
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar Content */}
            <ScrollArea className="flex-1">
              <div className="p-3 space-y-2">
                {activeTab === 'hospitals' ? (
                  sortedHospitals.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <Building2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      No hospitals available
                    </div>
                  ) : (
                    sortedHospitals.map(hospital => {
                      const dist = userLocation
                        ? haversineDistance(userLocation.lat, userLocation.lng, hospital.lat, hospital.lng)
                        : null;
                      const beds = Number(hospital.bedsAvailable);
                      const bedsColor =
                        beds > 20 ? 'text-green-600' : beds > 5 ? 'text-amber-600' : 'text-red-600';

                      return (
                        <button
                          key={String(hospital.id)}
                          onClick={() => focusHospital(hospital.lat, hospital.lng)}
                          className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-medium text-sm text-foreground truncate">{hospital.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{hospital.address}</p>
                            </div>
                            {dist !== null && (
                              <span className="text-xs text-muted-foreground shrink-0">{dist.toFixed(1)} km</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`text-xs font-semibold ${bedsColor}`}>
                              🛏 {hospital.bedsAvailable} beds
                            </span>
                            <span className="text-xs text-muted-foreground">📞 {hospital.contact}</span>
                          </div>
                        </button>
                      );
                    })
                  )
                ) : (
                  <>
                    {volunteers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No volunteers registered yet
                      </div>
                    ) : (
                      <>
                        {volunteersWithCoords.map(volunteer => (
                          <button
                            key={String(volunteer.id)}
                            onClick={() => focusVolunteer(volunteer.city)}
                            className="w-full text-left p-3 rounded-lg border border-border hover:border-primary hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-medium text-sm text-foreground">{volunteer.name}</p>
                                <p className="text-xs text-muted-foreground">📍 {volunteer.city}</p>
                              </div>
                              <Badge
                                variant={volunteer.isActive ? 'default' : 'secondary'}
                                className="text-xs shrink-0"
                              >
                                {volunteer.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {volunteer.skills.slice(0, 3).map(skill => (
                                <span
                                  key={skill}
                                  className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                              {volunteer.skills.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{volunteer.skills.length - 3} more
                                </span>
                              )}
                            </div>
                          </button>
                        ))}

                        {volunteersWithoutCoords.length > 0 && (
                          <div className="mt-3">
                            <div className="flex items-center gap-1.5 px-1 mb-2">
                              <Info className="w-3.5 h-3.5 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {volunteersWithoutCoords.length} volunteer(s) with unknown city:
                              </p>
                            </div>
                            {volunteersWithoutCoords.map(volunteer => (
                              <div
                                key={String(volunteer.id)}
                                className="p-3 rounded-lg border border-dashed border-border bg-muted/20"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-medium text-sm text-foreground">{volunteer.name}</p>
                                    <p className="text-xs text-muted-foreground">📍 {volunteer.city}</p>
                                  </div>
                                  <Badge
                                    variant={volunteer.isActive ? 'default' : 'secondary'}
                                    className="text-xs shrink-0"
                                  >
                                    {volunteer.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {volunteer.skills.slice(0, 3).map(skill => (
                                    <span
                                      key={skill}
                                      className="text-xs px-1.5 py-0.5 bg-primary/10 text-primary rounded-full"
                                    >
                                      {skill}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Sidebar toggle button */}
      <button
        onClick={() => setSidebarOpen(prev => !prev)}
        className="absolute top-1/2 -translate-y-1/2 z-20 bg-card border border-border rounded-r-lg p-1.5 shadow-md hover:bg-muted transition-colors"
        style={{ left: sidebarOpen ? '320px' : '0px' }}
      >
        {sidebarOpen ? (
          <ChevronLeft className="w-4 h-4 text-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-foreground" />
        )}
      </button>

      {/* Map container */}
      <div className="flex-1 relative">
        <div
          ref={mapRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
          }}
        />

        {/* Map legend overlay */}
        <div className="absolute bottom-6 right-4 z-10 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg text-xs space-y-1.5">
          <p className="font-semibold text-foreground mb-1">Map Legend</p>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-red-500 inline-block shrink-0" />
            <span className="text-muted-foreground">Hospital</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-green-500 inline-block shrink-0" />
            <span className="text-muted-foreground">Active Volunteer</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-400 inline-block shrink-0" />
            <span className="text-muted-foreground">Inactive Volunteer</span>
          </div>
          {userLocation && (
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-muted-foreground">Your Location</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
