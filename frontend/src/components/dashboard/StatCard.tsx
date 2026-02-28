import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | bigint | null | undefined;
  color: 'red' | 'amber' | 'blue' | 'green';
  loading?: boolean;
  suffix?: string;
}

const COLOR_MAP = {
  red: {
    bg: 'rgba(230,57,70,0.1)',
    border: 'rgba(230,57,70,0.3)',
    icon: 'rgba(230,57,70,0.2)',
    iconColor: '#ff6b6b',
    glow: '0 0 20px rgba(230,57,70,0.2)',
    value: '#ff6b6b',
  },
  amber: {
    bg: 'rgba(244,162,97,0.1)',
    border: 'rgba(244,162,97,0.3)',
    icon: 'rgba(244,162,97,0.2)',
    iconColor: '#f4a261',
    glow: '0 0 20px rgba(244,162,97,0.2)',
    value: '#f4a261',
  },
  blue: {
    bg: 'rgba(72,149,239,0.1)',
    border: 'rgba(72,149,239,0.3)',
    icon: 'rgba(72,149,239,0.2)',
    iconColor: '#72b7ff',
    glow: '0 0 20px rgba(72,149,239,0.2)',
    value: '#72b7ff',
  },
  green: {
    bg: 'rgba(82,183,136,0.1)',
    border: 'rgba(82,183,136,0.3)',
    icon: 'rgba(82,183,136,0.2)',
    iconColor: '#74c69d',
    glow: '0 0 20px rgba(82,183,136,0.2)',
    value: '#74c69d',
  },
};

export default function StatCard({ icon: Icon, label, value, color, loading, suffix }: StatCardProps) {
  const c = COLOR_MAP[color];
  const displayValue = value !== null && value !== undefined ? Number(value).toLocaleString() : '—';

  return (
    <div
      className="rounded-2xl p-5 transition-all hover:scale-[1.02]"
      style={{ background: c.bg, border: `1px solid ${c.border}`, boxShadow: c.glow }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: c.icon }}>
          <Icon className="w-5 h-5" style={{ color: c.iconColor }} />
        </div>
        <div className="w-2 h-2 rounded-full status-blink" style={{ background: c.iconColor }} />
      </div>
      {loading ? (
        <>
          <Skeleton className="h-8 w-20 mb-2" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <Skeleton className="h-4 w-28" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </>
      ) : (
        <>
          <div className="font-display font-black text-3xl mb-1" style={{ color: c.value }}>
            {displayValue}{suffix && <span className="text-lg ml-1 font-semibold">{suffix}</span>}
          </div>
          <div className="text-sm text-gray-400 font-medium">{label}</div>
        </>
      )}
    </div>
  );
}
