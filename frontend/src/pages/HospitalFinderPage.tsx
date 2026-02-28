import React, { useEffect, useState, useCallback } from "react";
import { useGetHospitals } from "../hooks/useQueries";
import { Hospital } from "../backend";
import {
  fetchNearbyHospitals,
  getHospitalAddress,
  getHospitalPhone,
  haversineDistance,
  hasEmergency,
  type OverpassHospital,
} from "../utils/overpass";
import {
  MapPin,
  Phone,
  Bed,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  Navigation,
  Ambulance,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface DisplayHospital {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance: number;
  address: string;
  phone: string | null;
  bedsAvailable?: number;
  emergency: boolean;
  source: "backend" | "overpass";
}

export default function HospitalFinderPage() {
  const { data: backendHospitals = [], isLoading: backendLoading } = useGetHospitals();

  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);
  const [overpassLoading, setOverpassLoading] = useState(false);
  const [overpassError, setOverpassError] = useState<string | null>(null);
  const [allHospitals, setAllHospitals] = useState<DisplayHospital[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [maxDistance, setMaxDistance] = useState<number>(10);
  const [availableOnly, setAvailableOnly] = useState(false);

  const mergeHospitals = useCallback(
    (pos: [number, number], overpassResults: OverpassHospital[]) => {
      const overpassDisplayed: DisplayHospital[] = overpassResults.map((h) => ({
        id: `overpass-${h.id}`,
        name: h.tags?.name || "Unnamed Hospital",
        lat: h.lat,
        lng: h.lon,
        distance: haversineDistance(pos[0], pos[1], h.lat, h.lon),
        address: getHospitalAddress(h.tags),
        phone: getHospitalPhone(h.tags),
        emergency: hasEmergency(h.tags),
        source: "overpass" as const,
      }));

      const backendDisplayed: DisplayHospital[] = backendHospitals.map((h: Hospital) => ({
        id: `backend-${String(h.id)}`,
        name: h.name,
        lat: h.lat,
        lng: h.lng,
        distance: haversineDistance(pos[0], pos[1], h.lat, h.lng),
        address: h.address,
        phone: h.contact || null,
        bedsAvailable: Number(h.bedsAvailable),
        emergency: false,
        source: "backend" as const,
      }));

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
      setAllHospitals(merged);
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
        setOverpassError("Could not fetch live hospital data. Showing registered hospitals only.");
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

  // Re-merge when backend data loads
  useEffect(() => {
    if (userPos && backendHospitals.length > 0 && !overpassLoading) {
      fetchHospitals(userPos);
    }
  }, [backendHospitals.length]);

  const filteredHospitals = allHospitals.filter((h) => {
    const matchesSearch =
      searchQuery === "" ||
      h.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      h.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistance = h.distance <= maxDistance;
    const matchesAvailability =
      !availableOnly || h.bedsAvailable === undefined || h.bedsAvailable > 0;
    return matchesSearch && matchesDistance && matchesAvailability;
  });

  const getBedsBadge = (beds?: number) => {
    if (beds === undefined) return null;
    if (beds === 0)
      return (
        <Badge variant="destructive" className="text-xs">
          No Beds
        </Badge>
      );
    if (beds < 5)
      return (
        <Badge className="bg-amber-500 text-white text-xs">
          {beds} Beds
        </Badge>
      );
    return (
      <Badge className="bg-green-600 text-white text-xs">
        {beds} Beds
      </Badge>
    );
  };

  const isLoading = locationLoading || backendLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-r from-destructive/90 to-destructive text-white py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-white/20 rounded-full">
              <img src="/assets/generated/hospital-icon.dim_128x128.png" alt="" className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-bold">Hospital Finder</h1>
          </div>
          <p className="text-white/80 ml-14">
            Find hospitals near you with real-time availability and directions.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
        {/* Location status */}
        {locationDenied && (
          <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Location access required</p>
              <p className="text-xs text-muted-foreground">
                Enable location to see distances and find nearby hospitals.
              </p>
            </div>
            <Button size="sm" onClick={getUserLocation} className="bg-destructive hover:bg-destructive/90 text-white">
              Enable
            </Button>
          </div>
        )}

        {overpassError && (
          <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {overpassError}
          </div>
        )}

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hospitals by name or address..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[5, 10, 20, 50].map((d) => (
              <button
                key={d}
                onClick={() => setMaxDistance(d)}
                className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                  maxDistance === d
                    ? "bg-destructive text-white border-destructive"
                    : "bg-card text-foreground border-border hover:border-destructive/50"
                }`}
              >
                {d} km
              </button>
            ))}
            <button
              onClick={() => setAvailableOnly(!availableOnly)}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all flex items-center gap-1.5 ${
                availableOnly
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-card text-foreground border-border hover:border-green-600/50"
              }`}
            >
              <Bed className="w-3.5 h-3.5" />
              Beds Available
            </button>
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isLoading || overpassLoading
              ? "Searching..."
              : `${filteredHospitals.length} hospital${filteredHospitals.length !== 1 ? "s" : ""} found`}
          </p>
          {userPos && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Location detected
            </span>
          )}
        </div>

        {/* Hospital Cards */}
        {isLoading || overpassLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">No hospitals found</p>
            <p className="text-sm mt-1">Try increasing the distance filter or clearing your search.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredHospitals.map((h, index) => (
              <div
                key={h.id}
                className="bg-card border border-border rounded-xl p-4 hover:border-destructive/40 hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Rank */}
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {index + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <h3 className="font-bold text-foreground text-base leading-tight">{h.name}</h3>
                      <div className="flex items-center gap-2 flex-wrap shrink-0">
                        {userPos && (
                          <Badge className="bg-destructive text-white text-xs">
                            {h.distance.toFixed(2)} km
                          </Badge>
                        )}
                        {getBedsBadge(h.bedsAvailable)}
                        {h.emergency && (
                          <Badge className="bg-red-700 text-white text-xs">
                            🚑 Emergency
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 space-y-1">
                      <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-destructive/70" />
                        <span>
                          <span className="font-medium text-foreground/70">Address: </span>
                          {h.address}
                        </span>
                      </div>
                      {h.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="w-3.5 h-3.5 shrink-0 text-destructive/70" />
                          <a
                            href={`tel:${h.phone}`}
                            className="text-blue-500 hover:underline font-medium"
                          >
                            {h.phone}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      {userPos && (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&origin=${userPos[0]},${userPos[1]}&destination=${h.lat},${h.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          <Navigation className="w-3 h-3" />
                          Get Directions
                        </a>
                      )}
                      {h.phone && (
                        <a
                          href={`tel:${h.phone}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border hover:border-destructive/50 text-foreground text-xs font-semibold rounded-lg transition-colors"
                        >
                          <Phone className="w-3 h-3" />
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
