import React from 'react';
import { Hospital, Droplets, Users, Bed, Activity, Bell } from 'lucide-react';
import { useGetDashboardStats } from '../hooks/useQueries';
import StatCard from '../components/dashboard/StatCard';
import AlertFeed from '../components/alerts/AlertFeed';
import AlertCreationForm from '../components/alerts/AlertCreationForm';

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetDashboardStats();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
          <span className="w-2 h-2 rounded-full status-blink" style={{ background: '#e63946' }} />
          Live Dashboard
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl text-white mb-2">
          Emergency Resource Overview
        </h1>
        <p className="text-gray-400">Real-time status of emergency resources in your area</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={Hospital}
          label="Registered Hospitals"
          value={stats?.hospitalCount}
          color="blue"
          loading={isLoading}
        />
        <StatCard
          icon={Bed}
          label="Available Beds"
          value={stats?.availableBeds}
          color="green"
          loading={isLoading}
        />
        <StatCard
          icon={Droplets}
          label="Blood Donors"
          value={stats?.donorCount}
          color="red"
          loading={isLoading}
        />
        <StatCard
          icon={Users}
          label="Active Volunteers"
          value={stats?.volunteerCount}
          color="amber"
          loading={isLoading}
        />
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alert feed */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(230,57,70,0.2)' }}>
              <Bell className="w-4 h-4 text-red-400" />
            </div>
            <h2 className="font-display font-bold text-xl text-white">Live Emergency Alerts</h2>
            <span className="text-xs px-2 py-0.5 rounded-full text-red-400 font-medium"
              style={{ background: 'rgba(230,57,70,0.15)' }}>
              Auto-refresh 10s
            </span>
          </div>
          <AlertFeed />
        </div>

        {/* Post alert + quick stats */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'rgba(244,162,97,0.2)' }}>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <h2 className="font-display font-bold text-xl text-white">Actions</h2>
          </div>
          <AlertCreationForm />

          {/* Quick links */}
          <div className="rounded-2xl p-4 space-y-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Access</p>
            {[
              { href: '/hospitals', icon: Hospital, label: 'Find Hospitals', color: '#72b7ff' },
              { href: '/blood-donors', icon: Droplets, label: 'Blood Donors', color: '#ff6b6b' },
              { href: '/volunteers', icon: Users, label: 'Volunteers', color: '#f4a261' },
            ].map(({ href, icon: Icon, label, color }) => (
              <a key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-300 hover:text-white transition-all hover:bg-white/5">
                <Icon className="w-4 h-4" style={{ color }} />
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
