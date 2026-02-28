import React from 'react';
import { Phone, MapPin } from 'lucide-react';
import type { BloodDonor } from '../../backend';

interface DonorCardProps {
  donor: BloodDonor;
}

const BLOOD_TYPE_COLORS: Record<string, string> = {
  'A+': '#e63946', 'A-': '#c1121f',
  'B+': '#f4a261', 'B-': '#e76f51',
  'AB+': '#9b5de5', 'AB-': '#7b2d8b',
  'O+': '#52b788', 'O-': '#2d6a4f',
};

export default function DonorCard({ donor }: DonorCardProps) {
  const bloodColor = BLOOD_TYPE_COLORS[donor.bloodType] || '#e63946';

  return (
    <div className="rounded-2xl p-4 transition-all hover:scale-[1.01]"
      style={{ background: 'rgba(230,57,70,0.07)', border: '1px solid rgba(230,57,70,0.2)' }}>
      <div className="flex items-start gap-3">
        <img
          src="/assets/generated/blood-drop-icon.dim_128x128.png"
          alt="Blood Donor"
          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-display font-bold text-white text-sm truncate">{donor.name}</h3>
            <span className="flex-shrink-0 text-sm font-black px-2.5 py-0.5 rounded-full text-white"
              style={{ background: bloodColor }}>
              {donor.bloodType}
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <MapPin className="w-3 h-3 text-red-400" />
              {donor.city}
            </div>
            {donor.contact && (
              <a href={`tel:${donor.contact}`}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors">
                <Phone className="w-3 h-3" />
                {donor.contact}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
