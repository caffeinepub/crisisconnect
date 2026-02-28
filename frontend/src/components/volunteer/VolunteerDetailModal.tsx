import React from 'react';
import { Volunteer } from '../../backend';
import { X, MapPin, CheckCircle, FileText, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface VolunteerDetailModalProps {
  volunteer: Volunteer | null;
  isOpen: boolean;
  onClose: () => void;
}

const SKILL_COLORS = [
  'bg-red-600/20 text-red-300 border-red-600/30',
  'bg-amber-600/20 text-amber-300 border-amber-600/30',
  'bg-blue-600/20 text-blue-300 border-blue-600/30',
  'bg-emerald-600/20 text-emerald-300 border-emerald-600/30',
  'bg-purple-600/20 text-purple-300 border-purple-600/30',
  'bg-orange-600/20 text-orange-300 border-orange-600/30',
];

export default function VolunteerDetailModal({ volunteer, isOpen, onClose }: VolunteerDetailModalProps) {
  if (!volunteer) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="bg-charcoal-900 border-charcoal-700 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            Volunteer Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Name & Status */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-white">{volunteer.name}</h2>
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-400">
                <MapPin className="w-3.5 h-3.5" />
                <span>{volunteer.city}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div className={`w-2.5 h-2.5 rounded-full ${volunteer.isActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
              <span className={`text-sm font-medium ${volunteer.isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
                {volunteer.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Skills */}
          {volunteer.skills.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Skills</p>
              <div className="flex flex-wrap gap-2">
                {volunteer.skills.map((skill, idx) => (
                  <span
                    key={skill}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium border ${SKILL_COLORS[idx % SKILL_COLORS.length]}`}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Proof Submitted */}
          <div className="p-3 rounded-lg border border-charcoal-700 bg-charcoal-800">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Credential / Proof</p>
            {volunteer.proofText ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-sm text-emerald-300 font-medium">Proof Submitted</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{volunteer.proofText.length > 60 ? volunteer.proofText.slice(0, 60) + '…' : volunteer.proofText}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-600 flex-shrink-0" />
                <p className="text-sm text-gray-500">No proof submitted</p>
              </div>
            )}
          </div>

          {/* Volunteer ID */}
          <div className="text-xs text-gray-600 text-right">
            Volunteer ID: #{volunteer.id.toString()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
