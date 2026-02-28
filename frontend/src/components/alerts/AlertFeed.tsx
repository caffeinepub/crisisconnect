import React from 'react';
import { Clock, MapPin, AlertTriangle } from 'lucide-react';
import { useEmergencyAlerts } from '../../hooks/useQueries';
import { Skeleton } from '@/components/ui/skeleton';
import type { EmergencyAlert } from '../../backend';

const ALERT_COLORS: Record<string, { bg: string; border: string; text: string; label: string }> = {
  fire: { bg: 'rgba(230,57,70,0.15)', border: 'rgba(230,57,70,0.4)', text: '#ff6b6b', label: '🔥 Fire' },
  flood: { bg: 'rgba(72,149,239,0.15)', border: 'rgba(72,149,239,0.4)', text: '#72b7ff', label: '🌊 Flood' },
  accident: { bg: 'rgba(244,162,97,0.15)', border: 'rgba(244,162,97,0.4)', text: '#f4a261', label: '🚗 Accident' },
  medical: { bg: 'rgba(82,183,136,0.15)', border: 'rgba(82,183,136,0.4)', text: '#74c69d', label: '🏥 Medical' },
  other: { bg: 'rgba(150,150,180,0.15)', border: 'rgba(150,150,180,0.3)', text: '#aaa', label: '⚠️ Alert' },
};

function AlertItem({ alert }: { alert: EmergencyAlert }) {
  const style = ALERT_COLORS[alert.alertType] || ALERT_COLORS.other;
  const ts = Number(alert.timestamp) / 1_000_000;
  const date = new Date(ts);
  const timeAgo = formatTimeAgo(date);

  return (
    <div className="rounded-xl p-3.5 transition-all hover:scale-[1.01]"
      style={{ background: style.bg, border: `1px solid ${style.border}` }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: style.border, color: style.text }}>
          {style.label}
        </span>
        <div className="flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
          <Clock className="w-3 h-3" />
          {timeAgo}
        </div>
      </div>
      <p className="text-sm text-gray-200 leading-relaxed mb-2">{alert.description}</p>
      {alert.location && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin className="w-3 h-3" />
          {alert.location}
        </div>
      )}
    </div>
  );
}

function formatTimeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString();
}

export default function AlertFeed() {
  const { data: alerts, isLoading } = useEmergencyAlerts();

  return (
    <div className="space-y-2.5">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
        ))
      ) : !alerts?.length ? (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No active alerts</p>
        </div>
      ) : (
        alerts.map(alert => <AlertItem key={String(alert.id)} alert={alert} />)
      )}
    </div>
  );
}
