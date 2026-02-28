export interface OverpassHospital {
  id: number;
  lat: number;
  lon: number;
  distance?: number;
  tags?: {
    name?: string;
    "addr:street"?: string;
    "addr:road"?: string;
    "addr:housenumber"?: string;
    "addr:city"?: string;
    "addr:town"?: string;
    "addr:village"?: string;
    "addr:postcode"?: string;
    phone?: string;
    "contact:phone"?: string;
    "emergency:phone"?: string;
    mobile?: string;
    tel?: string;
    opening_hours?: string;
    emergency?: string;
    "healthcare:emergency"?: string;
    [key: string]: string | undefined;
  };
}

export function buildOverpassQuery(lat: number, lng: number, radiusMeters: number): string {
  return `[out:json];
(
  node["amenity"="hospital"](around:${radiusMeters},${lat},${lng});
  node["healthcare"="hospital"](around:${radiusMeters},${lat},${lng});
);
out body;
>;
out skel qt;`;
}

export async function fetchNearbyHospitals(
  lat: number,
  lng: number,
  radiusMeters: number = 10000
): Promise<OverpassHospital[]> {
  const query = buildOverpassQuery(lat, lng, radiusMeters);
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Overpass API error: ${res.status}`);
  const data = await res.json();
  return (data.elements || []) as OverpassHospital[];
}

export function getHospitalAddress(tags: OverpassHospital["tags"]): string {
  if (!tags) return "Address not available";
  const parts: string[] = [];
  const street = tags["addr:street"] || tags["addr:road"] || "";
  const number = tags["addr:housenumber"] || "";
  const city = tags["addr:city"] || tags["addr:town"] || tags["addr:village"] || "";
  const postcode = tags["addr:postcode"] || "";
  if (number && street) parts.push(`${number}, ${street}`);
  else if (street) parts.push(street);
  else if (number) parts.push(number);
  if (city) parts.push(city);
  if (postcode) parts.push(postcode);
  return parts.length > 0 ? parts.join(", ") : "Address not available";
}

export function getHospitalPhone(tags: OverpassHospital["tags"]): string | null {
  if (!tags) return null;
  const phoneFields = ["phone", "contact:phone", "emergency:phone", "mobile", "tel"];
  for (const field of phoneFields) {
    if (tags[field]) {
      const phone = tags[field]!.replace(/[^0-9+]/g, "");
      if (phone.length >= 10) return phone;
    }
  }
  return null;
}

export function getOpeningHours(tags: OverpassHospital["tags"]): string | null {
  return tags?.["opening_hours"] || null;
}

export function hasEmergency(tags: OverpassHospital["tags"]): boolean {
  return tags?.["emergency"] === "yes" || tags?.["healthcare:emergency"] === "yes";
}

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
