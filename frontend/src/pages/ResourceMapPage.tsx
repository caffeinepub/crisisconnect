import React, { useEffect, useRef, useState, useCallback } from "react";
import { useGetHospitals } from "../hooks/useQueries";
import {
  fetchNearbyHospitals,
  getHospitalAddress,
  getHospitalPhone,
  getOpeningHours,
  hasEmergency,
  haversineDistance,
  type OverpassHospital,
} from "../utils/overpass";
import { Hospital } from "../backend";
import { MapPin, Navigation, X, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Leaflet loaded via CDN — declare global
declare const L: any;

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
const ROUTING_CSS = "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css";
const ROUTING_JS = "https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.js";

function loadCSS(href: string) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// Unified hospital type for display
interface DisplayHospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
  address: string;
  phone: string | null;
  openingHours: string | null;
  emergency: boolean;
  bedsAvailable?: number;
  source: "backend" | "overpass";
}

export default function ResourceMapPage() {
  const { data: backendHospitals = [] } = useGetHospitals();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const hospitalMarkersRef = useRef<Map<string, any>>(new Map());
  const routingControlRef = useRef<any>(null);

  const [leafletReady, setLeafletReady] = useState(false);
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [overpassLoading, setOverpassLoading] = useState(false);
  const [overpassError, setOverpassError] = useState<string | null>(null);
  const [displayHospitals, setDisplayHospitals] = useState<DisplayHospital[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [showDirections, setShowDirections] = useState(false);

  // Load Leaflet + routing machine CSS/JS
  useEffect(() => {
    loadCSS(LEAFLET_CSS);
    loadCSS(ROUTING_CSS);
    loadScript(LEAFLET_JS)
      .then(() => loadScript(ROUTING_JS))
      .then(() => setLeafletReady(true))
      .catch(() => setLeafletReady(false));
  }, []);

  // Initialize map once Leaflet is ready
  useEffect(() => {
    if (!leafletReady || !mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
  }, [leafletReady]);

  const removeRoutingControl = useCallback(() => {
    if (routingControlRef.current && mapInstanceRef.current) {
      try {
        if (typeof routingControlRef.current.remove === "function") {
          routingControlRef.current.remove();
        } else {
          mapInstanceRef.current.removeControl(routingControlRef.current);
        }
      } catch (_) {
        // ignore cleanup errors
      }
      routingControlRef.current = null;
    }
  }, []);

  const mergeHospitals = useCallback(
    (pos: [number, number], overpassResults: OverpassHospital[]) => {
      const MAX_DISTANCE_KM = 5;

      const overpassDisplayed: DisplayHospital[] = overpassResults
        .map((h) => ({
          id: `overpass-${h.id}`,
          name: h.tags?.name || "Unnamed Hospital",
          lat: h.lat,
          lng: h.lon,
          distance: haversineDistance(pos[0], pos[1], h.lat, h.lon),
          address: getHospitalAddress(h.tags),
          phone: getHospitalPhone(h.tags),
          openingHours: getOpeningHours(h.tags),
          emergency: hasEmergency(h.tags),
          source: "overpass" as const,
        }))
        .filter((h) => h.distance <= MAX_DISTANCE_KM);

      const backendDisplayed: DisplayHospital[] = backendHospitals
        .map((h: Hospital) => ({
          id: `backend-${String(h.id)}`,
          name: h.name,
          lat: h.lat,
          lng: h.lng,
          distance: haversineDistance(pos[0], pos[1], h.lat, h.lng),
          address: h.address,
          phone: h.contact || null,
          openingHours: null,
          emergency: false,
          bedsAvailable: Number(h.bedsAvailable),
          source: "backend" as const,
        }))
        .filter((h) => h.distance <= MAX_DISTANCE_KM);

      const merged: DisplayHospital[] = [...overpassDisplayed];
      for (const bh of backendDisplayed) {
        const isDuplicate = merged.some(
          (oh) =>
            oh.name.toLowerCase() === bh.name.toLowerCase() ||
            haversineDistance(oh.lat, oh.lng, bh.lat, bh.lng) < 0.1
        );
        if (!isDuplicate) merged.push(bh);
      }

      merged.sort((a, b) => a.distance - b.distance);
      setDisplayHospitals(merged);
    },
    [backendHospitals]
  );

  const fetchHospitals = useCallback(
    async (pos: [number, number]) => {
      setOverpassLoading(true);
      setOverpassError(null);
      try {
        const results = await fetchNearbyHospitals(pos[0], pos[1], 10000);
        mergeHospitals(pos, results);
      } catch {
        setOverpassError("Could not fetch nearby hospitals. Showing registered hospitals only.");
        mergeHospitals(pos, []);
      } finally {
        setOverpassLoading(false);
      }
    },
    [mergeHospitals]
  );

  const getUserLocation = useCallback(() => {
    setLocationLoading(true);
    setLocationDenied(false);
    if (!navigator.geolocation) {
      setLocationDenied(true);
      setLocationLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setUserPos(coords);
        setLocationLoading(false);
        fetchHospitals(coords);
      },
      () => {
        setLocationDenied(true);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [fetchHospitals]);

  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  // Place user marker when coords + map are ready
  useEffect(() => {
    if (!mapInstanceRef.current || !userPos || !leafletReady) return;
    const map = mapInstanceRef.current;
    map.setView(userPos, 13);
    map.invalidateSize();

    if (userMarkerRef.current) userMarkerRef.current.remove();

    const userIcon = L.divIcon({
      html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`,
      className: "",
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });

    userMarkerRef.current = L.marker(userPos, { icon: userIcon })
      .addTo(map)
      .bindPopup("<strong>📍 Your Location</strong>");
  }, [userPos, leafletReady]);

  // Add hospital markers when hospitals + map are ready
  useEffect(() => {
    if (!mapInstanceRef.current || !userPos || !leafletReady || displayHospitals.length === 0) return;
    const map = mapInstanceRef.current;

    // Remove old markers
    hospitalMarkersRef.current.forEach((marker) => marker.remove());
    hospitalMarkersRef.current.clear();

    displayHospitals.forEach((h) => {
      const isSelected = h.id === selectedHospitalId;
      const color = isSelected ? "#22c55e" : "#ef4444";

      const icon = L.divIcon({
        html: `<div style="width:32px;height:32px;background:${color};border:2px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.4);font-size:16px;cursor:pointer;">🏥</div>`,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const bedInfo =
        h.bedsAvailable !== undefined
          ? `<div style="font-size:12px;margin-bottom:4px;">🛏️ <strong>Beds:</strong> <span style="color:${h.bedsAvailable === 0 ? "#ef4444" : h.bedsAvailable < 5 ? "#f59e0b" : "#22c55e"};font-weight:bold;">${h.bedsAvailable} available</span></div>`
          : "";
      const phoneInfo = h.phone
        ? `<div style="font-size:12px;margin-bottom:4px;">📞 <a href="tel:${h.phone}" style="color:#3b82f6;">${h.phone}</a></div>`
        : "";
      const hoursInfo = h.openingHours
        ? `<div style="font-size:12px;margin-bottom:4px;">🕒 ${h.openingHours}</div>`
        : "";
      const emergencyBadge = h.emergency
        ? `<div style="font-size:11px;background:#fee2e2;color:#b91c1c;padding:2px 8px;border-radius:999px;display:inline-block;margin-bottom:6px;font-weight:600;">🚑 24/7 Emergency</div>`
        : "";

      const popupContent = `
        <div style="min-width:220px;max-width:280px;font-family:sans-serif;padding:4px;">
          <div style="font-weight:bold;font-size:14px;margin-bottom:6px;border-bottom:1px solid #eee;padding-bottom:6px;">🏥 ${h.name}</div>
          ${emergencyBadge}
          <div style="font-size:12px;margin-bottom:4px;">📍 <strong>Address:</strong> ${h.address}</div>
          <div style="font-size:12px;margin-bottom:4px;">📏 <strong>Distance:</strong> ${h.distance.toFixed(2)} km${h.distance < 1 ? ' <span style="color:#22c55e;font-weight:600;">Very Near</span>' : ""}</div>
          ${phoneInfo}${hoursInfo}${bedInfo}
          <button
            onclick="window.__mapGetDirections && window.__mapGetDirections('${h.id}')"
            style="margin-top:8px;width:100%;padding:8px;background:#ef4444;color:white;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;"
          >
            🗺️ Get Directions
          </button>
        </div>
      `;

      const marker = L.marker([h.lat, h.lng], { icon })
        .addTo(map)
        .bindPopup(popupContent, { maxWidth: 300 });

      marker.on("click", () => setSelectedHospitalId(h.id));
      hospitalMarkersRef.current.set(h.id, marker);
    });
  }, [displayHospitals, leafletReady, userPos, selectedHospitalId]);

  // Expose directions handler to popup buttons
  useEffect(() => {
    (window as any).__mapGetDirections = (hospitalId: string) => {
      const h = displayHospitals.find((x) => x.id === hospitalId);
      if (h) handleGetDirections(h);
    };
    return () => {
      delete (window as any).__mapGetDirections;
    };
  }, [displayHospitals]);

  const handleSelectHospital = useCallback(
    (h: DisplayHospital) => {
      if (!mapInstanceRef.current) return;
      setSelectedHospitalId(h.id);
      setShowDirections(false);
      removeRoutingControl();
      mapInstanceRef.current.flyTo([h.lat, h.lng], 16, { duration: 1 });
      setTimeout(() => {
        const marker = hospitalMarkersRef.current.get(h.id);
        if (marker) marker.openPopup();
      }, 900);
    },
    [removeRoutingControl]
  );

  const handleGetDirections = useCallback(
    (h: DisplayHospital) => {
      if (!userPos || !mapInstanceRef.current || !leafletReady) return;
      const LRouting = L.Routing;
      if (!LRouting) return;

      setSelectedHospitalId(h.id);
      setShowDirections(true);
      removeRoutingControl();

      setTimeout(() => {
        try {
          const ctrl = LRouting.control({
            waypoints: [L.latLng(userPos[0], userPos[1]), L.latLng(h.lat, h.lng)],
            routeWhileDragging: false,
            showAlternatives: false,
            lineOptions: { styles: [{ color: "#ef4444", weight: 4 }] },
            createMarker: () => null,
            addWaypoints: false,
            draggableWaypoints: false,
            fitSelectedRoutes: true,
            router: LRouting.osrmv1({ serviceUrl: "https://router.project-osrm.org/route/v1" }),
          }).addTo(mapInstanceRef.current);
          routingControlRef.current = ctrl;

          const bounds = L.latLngBounds([L.latLng(userPos[0], userPos[1]), L.latLng(h.lat, h.lng)]);
          mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        } catch (e) {
          console.error("Routing error:", e);
        }
      }, 500);
    },
    [userPos, leafletReady, removeRoutingControl]
  );

  const handleCloseDirections = useCallback(() => {
    setShowDirections(false);
    removeRoutingControl();
  }, [removeRoutingControl]);

  const getBedsBadge = (beds?: number) => {
    if (beds === undefined) return null;
    if (beds === 0) return <Badge variant="destructive">No Beds</Badge>;
    if (beds < 5) return <Badge className="bg-amber-500 text-white">{beds} Beds</Badge>;
    return <Badge className="bg-green-600 text-white">{beds} Beds</Badge>;
  };

  // Loading state
  if (locationLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-foreground">
        <Loader2 className="w-10 h-10 animate-spin text-destructive" />
        <p className="text-lg font-medium">Finding your location...</p>
      </div>
    );
  }

  // Location denied
  if (locationDenied) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-destructive" />
        <h2 className="text-xl font-bold text-foreground">Location Access Required</h2>
        <p className="text-muted-foreground max-w-sm">
          Please enable location access in your browser to find nearby hospitals.
        </p>
        <Button onClick={getUserLocation} className="bg-destructive hover:bg-destructive/90 text-white">
          <MapPin className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-destructive" />
          <h1 className="text-lg font-bold text-foreground">Resource Map</h1>
          {overpassLoading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {overpassError && (
            <span className="text-xs text-amber-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {overpassError}
            </span>
          )}
          <Badge variant="outline" className="text-xs">
            {displayHospitals.length} hospitals within 5 km
          </Badge>
          {showDirections && (
            <Button size="sm" variant="outline" onClick={handleCloseDirections}>
              <X className="w-3 h-3 mr-1" /> Close Directions
            </Button>
          )}
        </div>
      </div>

      {/* Map + Sidebar layout */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Map */}
        <div className="flex-1 min-h-[400px] lg:min-h-0 relative">
          <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: "400px" }} />
          {!leafletReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin text-destructive" />
                <span className="text-sm">Loading map…</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 xl:w-96 bg-card border-t lg:border-t-0 lg:border-l border-border flex flex-col">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              🏥 Nearby Hospitals
              <span className="text-xs text-muted-foreground font-normal">
                ({displayHospitals.length} found)
              </span>
            </h2>
          </div>

          <ScrollArea className="flex-1">
            {overpassLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Searching nearby hospitals...</span>
              </div>
            ) : displayHospitals.length === 0 ? (
              <div className="text-center py-12 px-4 text-muted-foreground">
                <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No hospitals found within 5 km</p>
                <p className="text-xs mt-1">Try moving to a different area or check your connection.</p>
              </div>
            ) : (
              <div className="p-3 space-y-2">
                {displayHospitals.map((h, index) => (
                  <div
                    key={h.id}
                    onClick={() => handleSelectHospital(h)}
                    className={`relative rounded-xl border p-3 cursor-pointer transition-all ${
                      selectedHospitalId === h.id
                        ? "border-destructive bg-destructive/5 shadow-sm"
                        : "border-border bg-background hover:border-destructive/40 hover:shadow-sm"
                    }`}
                  >
                    {/* Rank badge */}
                    <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold flex items-center justify-center">
                      {index + 1}
                    </div>
                    {/* Distance badge */}
                    <div className="absolute top-3 right-3 bg-destructive text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                      {h.distance.toFixed(2)} km
                    </div>

                    <div className="pl-8 pr-16">
                      <h3 className="font-semibold text-sm text-foreground leading-tight mb-1">
                        {h.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-1">📍 {h.address}</p>
                      {h.phone && (
                        <p className="text-xs text-muted-foreground mb-1">
                          📞{" "}
                          <a
                            href={`tel:${h.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-500 hover:underline"
                          >
                            {h.phone}
                          </a>
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {h.emergency && (
                          <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                            🚑 Emergency
                          </span>
                        )}
                        {getBedsBadge(h.bedsAvailable)}
                      </div>
                    </div>

                    <div className="mt-3 pl-8 flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleGetDirections(h);
                        }}
                        disabled={!userPos}
                        title={!userPos ? "Enable location to get directions" : undefined}
                        className="flex-1 py-1.5 px-3 bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Navigation className="w-3 h-3" />
                        {selectedHospitalId === h.id && showDirections ? "Directions Active" : "Get Directions"}
                      </button>
                      {selectedHospitalId === h.id && showDirections && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCloseDirections();
                          }}
                          className="py-1.5 px-3 bg-muted hover:bg-muted/80 text-foreground text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <X className="w-3 h-3" />
                          Close
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
