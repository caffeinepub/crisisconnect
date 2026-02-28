import React from 'react';
import { Phone, MapPin, CheckCircle, XCircle } from 'lucide-react';
import type { Volunteer } from '../../backend';

interface VolunteerCardProps {
  volunteer: Volunteer;
}

const SKILL_COLORS: Record<string, string> = {
  'first-aid': 'rgba(230,57,70,0.3)',
  'driving': 'rgba(72,149,239,0.3)',
  'medical': 'rgba(82,183,136,0.3)',
  'rescue': 'rgba(244,162,97,0.3)',
  'communication': 'rgba(155,93,229,0.3)',
};

export default function VolunteerCard({ volunteer }: VolunteerCardProps) {
  return (
    <div className="rounded-2xl p-4 transition-all hover:scale-[1.01]"
      style={{ background: 'rgba(244,162,97,0.07)', border: '1px solid rgba(244,162,97,0.2)' }}>
      <div className="flex items-start gap-3">
        <img
          src="/assets/generated/volunteer-icon.dim_128x128.png"
          alt="Volunteer"
          className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h3 className="font-display font-bold text-white text-sm truncate">{volunteer.name}</h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {volunteer.isActive ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="w-3.5 h-3.5" /> Active
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <XCircle className="w-3.5 h-3.5" /> Inactive
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
            <MapPin className="w-3 h-3 text-amber-400" />
            {volunteer.city}
          </div>
          {volunteer.skills.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {volunteer.skills.map(skill => (
                <span key={skill} className="text-xs px-2 py-0.5 rounded-full text-gray-300 capitalize"
                  style={{ background: SKILL_COLORS[skill] || 'rgba(255,255,255,0.1)' }}>
                  {skill}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
