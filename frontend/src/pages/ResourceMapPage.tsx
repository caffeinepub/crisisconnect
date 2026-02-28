import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Map as MapIcon, MapPin, Loader2, AlertCircle, Navigation, BedDouble, Phone } from 'lucide-react';
import { useHospitals, useBloodDonors } from '../hooks/useQueries';
import { useGeolocation } from '../hooks/useGeolocation';
import { haversineDistance, formatDistance } from '../utils/haversine';
import type { Hospital } from '../backend';

// Leaflet is loaded via CDN in index.html as global `L`
declare const L: any;

// City coordinates lookup for blood donor map markers
const CITY_COORDS: Record<string, [number, number]> = {
  'new york': [40.7128, -74.006],
  'los angeles': [34.0522, -118.2437],
  'chicago': [41.8781, -87.6298],
  'houston': [29.7604, -95.3698],
  'phoenix': [33.4484, -112.074],
  'london': [51.5074, -0.1278],
  'paris': [48.8566, 2.3522],
  'berlin': [52.52, 13.405],
  'tokyo': [35.6762, 139.6503],
  'mumbai': [19.076, 72.8777],
  'delhi': [28.6139, 77.209],
  'bangalore': [12.9716, 77.5946],
  'chennai': [13.0827, 80.2707],
  'kolkata': [22.5726, 88.3639],
  'hyderabad': [17.385, 78.4867],
  'karachi': [24.8607, 67.0011],
  'lahore': [31.5204, 74.3587],
  'dhaka': [23.8103, 90.4125],
  'cairo': [30.0444, 31.2357],
  'nairobi': [-1.2921, 36.8219],
  'sydney': [-33.8688, 151.2093],
  'toronto': [43.6532, -79.3832],
  'dubai': [25.2048, 55.2708],
  'singapore': [1.3521, 103.8198],
};

function getCityCoords(city: string): [number, number] | null {
  const lower = city.toLowerCase().trim();
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (lower.includes(key) || key.includes(lower)) return coords;
  }
  return null;
}

interface HospitalWithDistance extends Hospital {
  distance: number | null;
}

interface CityEntry {
  city: string;
  count: number;
  types: string[];
}

function getBedColor(beds: number): string {
  if (beds === 0) return '#e63946';
  if (beds < 10) return '#e63946';
  if (beds <= 50) return '#f4a261';
  return '#52b788';
}

function getBedLabel(beds: number): string {
  if (beds === 0) return 'No beds';
  if (beds < 10) return 'Critical';
  if (beds <= 50) return 'Limited';
  return 'Available';
}

export default function ResourceMapPage() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRefs = useRef<Record<number, any>>({});

  const { data: hospitals } = useHospitals();
  const { data: donors } = useBloodDonors();
  const { position, requestLocation, loading: geoLoading, error: geoError } = useGeolocation();

  const [mapReady, setMapReady] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Hospitals enriched with distance, sorted nearest first
  const hospitalsWithDistance: HospitalWithDistance[] = React.useMemo(() => {
    if (!hospitals?.length) return [];
    const enriched = hospitals.map(h => ({
      ...h,
      distance: position ? haversineDistance(position.lat, position.lng, h.lat, h.lng) : null,
    }));
    if (position) {
      enriched.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
    }
    return enriched;
  }, [hospitals, position]);

  // Check if Leaflet is available
  useEffect(() => {
    const check = () => {
      if (typeof L !== 'undefined') {
        setLeafletReady(true);
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  }, []);

  // Auto-request location on mount
  useEffect(() => {
    requestLocation().catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize map
  useEffect(() => {
    if (!leafletReady || !mapRef.current || mapInstanceRef.current) return;

    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapRef.current, {
      center: [20, 0] as [number, number],
      zoom: 2,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRefs.current = {};
        setMapReady(false);
      }
    };
  }, [leafletReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add / update user location marker and re-center map
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !position) return;
    const map = mapInstanceRef.current;

    const userIcon = L.divIcon({
      className: '',
      html: `<div style="
        width:20px;height:20px;border-radius:50%;
        background:#4895ef;border:3px solid white;
        box-shadow:0 0 0 5px rgba(72,149,239,0.35);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    const marker = L.marker([position.lat, position.lng], { icon: userIcon, zIndexOffset: 1000 })
      .addTo(map)
      .bindPopup('<div style="font-weight:700;color:#1a1a2e;font-size:13px">📍 Your Location</div>');

    map.setView([position.lat, position.lng], 13);

    return () => {
      map.removeLayer(marker);
    };
  }, [mapReady, position]);

  // Add hospital markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !hospitalsWithDistance.length) return;
    const map = mapInstanceRef.current;
    const markers: any[] = [];
    markerRefs.current = {};

    hospitalsWithDistance.forEach((h, idx) => {
      if (!h.lat || !h.lng) return;
      const beds = Number(h.bedsAvailable);
      const color = getBedColor(beds);
      const isNearest = idx === 0 && position !== null;
      const size = isNearest ? 36 : 28;

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:${isNearest ? '50%' : '8px'};
          background:${color};border:${isNearest ? '3px' : '2px'} solid white;
          display:flex;align-items:center;justify-content:center;
          font-size:${isNearest ? '18px' : '14px'};
          box-shadow:${isNearest ? '0 0 0 4px rgba(255,255,255,0.25), 0 4px 12px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.4)'};
        ">🏥</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
      });

      const distanceHtml = h.distance !== null
        ? `<span style="color:#4895ef;font-weight:600;font-size:12px">📏 ${formatDistance(h.distance)} away</span><br/>`
        : '';

      const nearestBadge = isNearest
        ? `<span style="background:#4895ef;color:white;font-size:10px;padding:1px 6px;border-radius:99px;font-weight:700">NEAREST</span><br/>`
        : '';

      const marker = L.marker([h.lat, h.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:180px;font-family:sans-serif">
            ${nearestBadge}
            <strong style="color:#1a1a2e;font-size:14px">${h.name}</strong><br/>
            <span style="color:#666;font-size:12px">${h.address}</span><br/>
            <span style="color:${color};font-weight:700;font-size:12px">🛏 ${beds} beds — ${getBedLabel(beds)}</span><br/>
            ${distanceHtml}
            ${h.contact ? `<a href="tel:${h.contact}" style="color:#4895ef;font-size:12px;text-decoration:none">📞 ${h.contact}</a>` : ''}
          </div>
        `);

      markers.push(marker);
      markerRefs.current[Number(h.id)] = marker;
    });

    return () => {
      markers.forEach(m => map.removeLayer(m));
      markerRefs.current = {};
    };
  }, [mapReady, hospitalsWithDistance, position]); // eslint-disable-line react-hooks/exhaustive-deps

  // Add blood donor city markers
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current || !donors?.length) return;
    const map = mapInstanceRef.current;
    const markers: any[] = [];

    const cityRecord: Record<string, CityEntry> = {};
    donors.forEach(d => {
      const key = d.city.toLowerCase().trim();
      if (!cityRecord[key]) {
        cityRecord[key] = { city: d.city, count: 0, types: [] };
      }
      cityRecord[key].count++;
      if (!cityRecord[key].types.includes(d.bloodType)) {
        cityRecord[key].types.push(d.bloodType);
      }
    });

    Object.values(cityRecord).forEach(({ city, count, types }) => {
      const coords = getCityCoords(city);
      if (!coords) return;

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          width:26px;height:26px;border-radius:50%;
          background:#e63946;border:2px solid white;
          display:flex;align-items:center;justify-content:center;
          font-size:13px;box-shadow:0 2px 8px rgba(0,0,0,0.4);
        ">🩸</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker(coords, { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:140px;font-family:sans-serif">
            <strong style="color:#1a1a2e;font-size:14px">📍 ${city}</strong><br/>
            <span style="color:#e63946;font-weight:700;font-size:12px">${count} donor${count !== 1 ? 's' : ''}</span><br/>
            <span style="color:#555;font-size:12px">Types: ${types.join(', ')}</span>
          </div>
        `);
      markers.push(marker);
    });

    return () => {
      markers.forEach(m => map.removeLayer(m));
    };
  }, [mapReady, donors]);

  const flyToHospital = useCallback((h: HospitalWithDistance) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView([h.lat, h.lng], 15, { animate: true });
    const marker = markerRefs.current[Number(h.id)];
    if (marker) {
      setTimeout(() => marker.openPopup(), 400);
    }
  }, []);

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 4rem)' }}>
      {/* Header bar */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-3 flex items-center justify-between"
        style={{ background: 'rgba(20,20,31,0.95)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm">
            <MapIcon className="w-4 h-4" />
            Emergency Resources Map
          </div>
          {geoLoading && (
            <span className="flex items-center gap-1.5 text-blue-400 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              Locating you…
            </span>
          )}
          {position && !geoLoading && (
            <span className="flex items-center gap-1.5 text-green-400 text-xs">
              <Navigation className="w-3 h-3" />
              Location found
            </span>
          )}
          {geoError && !geoLoading && !position && (
            <span className="flex items-center gap-1.5 text-red-400 text-xs">
              <AlertCircle className="w-3 h-3" />
              Location unavailable
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!position && !geoLoading && (
            <button
              onClick={() => requestLocation().catch(() => {})}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-all"
              style={{ background: 'rgba(72,149,239,0.25)', border: '1px solid rgba(72,149,239,0.4)' }}
            >
              <MapPin className="w-3 h-3" />
              Enable Location
            </button>
          )}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {sidebarOpen ? 'Hide' : 'Show'} Hospitals
          </button>
        </div>
      </div>

      {/* Geolocation error banner */}
      {geoError && !geoLoading && !position && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm text-amber-300"
          style={{ background: 'rgba(244,162,97,0.1)', borderBottom: '1px solid rgba(244,162,97,0.2)' }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>Please enable location access in your browser to see nearby hospitals and distances.</span>
        </div>
      )}

      {/* Main content: map + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Hospital sidebar */}
        {sidebarOpen && (
          <div
            className="flex-shrink-0 flex flex-col overflow-hidden"
            style={{
              width: '280px',
              background: '#0f0f1a',
              borderRight: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex-shrink-0 px-3 py-2.5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-white font-semibold text-sm">
                Nearby Hospitals
                {hospitalsWithDistance.length > 0 && (
                  <span className="ml-2 text-gray-500 font-normal text-xs">
                    ({hospitalsWithDistance.length})
                  </span>
                )}
              </p>
              {position && (
                <p className="text-gray-500 text-xs mt-0.5">Sorted by distance from you</p>
              )}
              {!position && (
                <p className="text-gray-500 text-xs mt-0.5">Enable location for distances</p>
              )}
            </div>

            <div className="flex-1 overflow-y-auto">
              {hospitalsWithDistance.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-600 text-sm px-4 text-center">
                  <MapPin className="w-6 h-6 mb-2 opacity-40" />
                  No hospitals registered yet
                </div>
              ) : (
                hospitalsWithDistance.map((h, idx) => {
                  const beds = Number(h.bedsAvailable);
                  const bedColor = getBedColor(beds);
                  const isNearest = idx === 0 && position !== null;

                  return (
                    <button
                      key={Number(h.id)}
                      onClick={() => flyToHospital(h)}
                      className="w-full text-left px-3 py-2.5 transition-all hover:bg-white/5 focus:outline-none"
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        background: isNearest ? 'rgba(72,149,239,0.08)' : undefined,
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {isNearest && (
                              <span
                                className="text-xs font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                style={{ background: '#4895ef', color: 'white', fontSize: '9px' }}
                              >
                                NEAREST
                              </span>
                            )}
                            <span className="text-white text-xs font-semibold truncate">{h.name}</span>
                          </div>
                          <p className="text-gray-500 text-xs truncate">{h.address}</p>
                        </div>
                        {h.distance !== null && (
                          <span className="text-blue-400 text-xs font-medium flex-shrink-0">
                            {formatDistance(h.distance)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mt-1.5">
                        <div className="flex items-center gap-1">
                          <BedDouble className="w-3 h-3" style={{ color: bedColor }} />
                          <span className="text-xs font-semibold" style={{ color: bedColor }}>
                            {beds} beds
                          </span>
                        </div>
                        {h.contact && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span className="text-xs truncate">{h.contact}</span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Sidebar stats */}
            <div className="flex-shrink-0 grid grid-cols-2 gap-px"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.04)' }}>
              <div className="px-3 py-2 text-center" style={{ background: '#0f0f1a' }}>
                <p className="text-blue-400 font-bold text-lg">{hospitalsWithDistance.length}</p>
                <p className="text-gray-500 text-xs">Hospitals</p>
              </div>
              <div className="px-3 py-2 text-center" style={{ background: '#0f0f1a' }}>
                <p className="text-green-400 font-bold text-lg">
                  {hospitalsWithDistance.reduce((s, h) => s + Number(h.bedsAvailable), 0)}
                </p>
                <p className="text-gray-500 text-xs">Total Beds</p>
              </div>
            </div>
          </div>
        )}

        {/* Map area */}
        <div className="flex-1 relative overflow-hidden">
          {!leafletReady ? (
            <div className="w-full h-full flex items-center justify-center" style={{ background: '#14141f' }}>
              <div className="text-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading map…</p>
              </div>
            </div>
          ) : (
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          )}

          {/* Map legend overlay */}
          <div
            className="absolute bottom-4 right-4 z-[1000] rounded-xl p-3 flex flex-col gap-1.5"
            style={{ background: 'rgba(15,15,26,0.92)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}
          >
            <p className="text-gray-400 text-xs font-semibold mb-0.5">Legend</p>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: '#4895ef', border: '2px solid white' }} />
              Your Location
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{ background: '#52b788', border: '2px solid white' }} />
              Hospital (&gt;50 beds)
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{ background: '#f4a261', border: '2px solid white' }} />
              Hospital (10–50 beds)
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-4 h-4 rounded flex-shrink-0" style={{ background: '#e63946', border: '2px solid white' }} />
              Hospital (&lt;10 beds)
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ background: '#e63946', border: '2px solid white' }} />
              Blood Donors
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
