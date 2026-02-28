import React from 'react';
import { Phone, MapPin, Bed, Navigation } from 'lucide-react';
import type { Hospital } from '../../backend';

interface HospitalCardProps {
  hospital: Hospital;
  distance?: number;
}

function getBedColor(beds: number): { bg: string; text: string; label: string } {
  if (beds === 0) return { bg: 'rgba(230,57,70,0.2)', text: '#ff6b6b', label: 'Full' };
  if (beds <= 5) return { bg: 'rgba(244,162,97,0.2)', text: '#f4a261', label: `${beds} beds` };
  return { bg: 'rgba(82,183,136,0.2)', text: '#74c69d', label: `${beds} beds` };
}

export default function HospitalCard({ hospital, distance }: HospitalCardProps) {
  const beds = Number(hospital.bedsAvailable);
  const bedStyle = getBedColor(beds);

  return (
    <div className="rounded-2xl p-4 transition-all hover:scale-[1.01]"
      style={{ background: 'rgba(72,149,239,0.08)', border: '1px solid rgba(72,149,239,0.2)' }}>
      <div className="flex items-start gap-3">
        <img
          src="/assets/generated/hospital-icon.dim_128x128.png"
          alt="Hospital"
          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-display font-bold text-white text-sm leading-tight truncate">{hospital.name}</h3>
            <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold"
              style={{ background: bedStyle.bg, color: bedStyle.text }}>
              {bedStyle.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{hospital.address}</span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Bed className="w-3 h-3 text-blue-400" />
              <span>{beds} available beds</span>
            </div>
            {hospital.contact && (
              <a href={`tel:${hospital.contact}`}
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                <Phone className="w-3 h-3" />
                {hospital.contact}
              </a>
            )}
            {distance !== undefined && (
              <div className="flex items-center gap-1.5 text-xs text-amber-400">
                <Navigation className="w-3 h-3" />
                {distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
