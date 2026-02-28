import React, { useState, useRef } from 'react';
import { useGetVolunteers, useRegisterVolunteer } from '../hooks/useQueries';
import { Volunteer } from '../backend';
import { Users, Search, MapPin, CheckCircle, Upload, FileText, X, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import VolunteerDetailModal from '../components/volunteer/VolunteerDetailModal';

const SKILL_COLORS = [
  'bg-red-600/20 text-red-300 border-red-600/30',
  'bg-amber-600/20 text-amber-300 border-amber-600/30',
  'bg-blue-600/20 text-blue-300 border-blue-600/30',
  'bg-emerald-600/20 text-emerald-300 border-emerald-600/30',
  'bg-purple-600/20 text-purple-300 border-purple-600/30',
  'bg-orange-600/20 text-orange-300 border-orange-600/30',
];

function VolunteerCard({ volunteer, onClick }: { volunteer: Volunteer; onClick?: () => void }) {
  return (
    <Card
      className={`bg-charcoal-800 border-charcoal-700 transition-all ${onClick ? 'hover:border-amber-500/50 hover:bg-charcoal-750 cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <p className="font-semibold text-white">{volunteer.name}</p>
            <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>{volunteer.city}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${volunteer.isActive ? 'bg-emerald-400' : 'bg-gray-500'}`} />
            <span className={`text-xs ${volunteer.isActive ? 'text-emerald-400' : 'text-gray-500'}`}>
              {volunteer.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        {volunteer.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {volunteer.skills.slice(0, 3).map((skill, idx) => (
              <span
                key={skill}
                className={`px-2 py-0.5 rounded-full text-xs font-medium border ${SKILL_COLORS[idx % SKILL_COLORS.length]}`}
              >
                {skill}
              </span>
            ))}
            {volunteer.skills.length > 3 && (
              <span className="px-2 py-0.5 rounded-full text-xs text-gray-500 border border-charcoal-600">
                +{volunteer.skills.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          {volunteer.proofText ? (
            <div className="flex items-center gap-1 text-xs text-emerald-400">
              <CheckCircle className="w-3 h-3" />
              <span>Proof Submitted</span>
            </div>
          ) : (
            <span className="text-xs text-gray-600">No proof</span>
          )}
          {onClick && (
            <span className="text-xs text-amber-400/70 hover:text-amber-400">View Details →</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function VolunteerPage() {
  const { data: volunteers = [], isLoading } = useGetVolunteers();
  const registerVolunteer = useRegisterVolunteer();

  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofText, setProofText] = useState('');
  const [proofError, setProofError] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProofFile(file);
    setProofError('');
    setIsReadingFile(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setProofText(text || file.name);
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setProofText(file.name);
      setIsReadingFile(false);
    };
    reader.readAsText(file);
  };

  const handleRemoveFile = () => {
    setProofFile(null);
    setProofText('');
    setProofError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofFile) {
      setProofError('Please upload a volunteer credential or proof document.');
      return;
    }
    const skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
    try {
      await registerVolunteer.mutateAsync({
        name,
        city,
        skills,
        isActive,
        proofText,
      });
      setShowForm(false);
      setName(''); setCity(''); setSkillsInput(''); setIsActive(true);
      setProofFile(null); setProofText(''); setProofError('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      // error handled by mutation
    }
  };

  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch = !searchQuery ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesActive =
      filterActive === 'all' ||
      (filterActive === 'active' && v.isActive) ||
      (filterActive === 'inactive' && !v.isActive);
    return matchesSearch && matchesActive;
  });

  return (
    <div className="min-h-screen bg-charcoal-950 text-white">
      {/* Header */}
      <div className="bg-charcoal-900 border-b border-charcoal-700 px-4 py-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-600 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Volunteer Directory</h1>
                <p className="text-gray-400 text-sm">Connect with emergency response volunteers</p>
              </div>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {showForm ? 'Cancel' : '+ Register as Volunteer'}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Registration Form */}
        {showForm && (
          <Card className="bg-charcoal-800 border-amber-600/30">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                Register as Volunteer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label className="text-gray-300">Full Name *</Label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your full name"
                      required
                      className="bg-charcoal-700 border-charcoal-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300">City *</Label>
                    <Input
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder="Your city"
                      required
                      className="bg-charcoal-700 border-charcoal-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <Label className="text-gray-300">Skills (comma-separated)</Label>
                    <Input
                      value={skillsInput}
                      onChange={e => setSkillsInput(e.target.value)}
                      placeholder="e.g. First Aid, CPR, Driving"
                      className="bg-charcoal-700 border-charcoal-600 text-white placeholder:text-gray-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-gray-300">Availability Status</Label>
                    <div className="flex items-center gap-3 mt-2">
                      <button
                        type="button"
                        onClick={() => setIsActive(true)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-emerald-600 text-white' : 'bg-charcoal-700 text-gray-400 border border-charcoal-600'}`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsActive(false)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!isActive ? 'bg-gray-600 text-white' : 'bg-charcoal-700 text-gray-400 border border-charcoal-600'}`}
                      >
                        Inactive
                      </button>
                    </div>
                  </div>
                </div>

                {/* Proof Upload */}
                <div className="space-y-2">
                  <Label className="text-gray-300">Upload Volunteer Credential / Proof *</Label>
                  <p className="text-xs text-gray-500">
                    Accepted proof types: <span className="text-amber-400">Government ID</span>, <span className="text-amber-400">First Aid Certification</span>, <span className="text-amber-400">Medical License</span>, <span className="text-amber-400">Driving License</span>, <span className="text-amber-400">Any official credential</span>.
                  </p>

                  {!proofFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-charcoal-600 rounded-lg cursor-pointer hover:border-amber-500/60 transition-colors bg-charcoal-700/50">
                      <Upload className="w-8 h-8 text-gray-500 mb-2" />
                      <span className="text-sm text-gray-400">Click to upload credential document</span>
                      <span className="text-xs text-gray-600 mt-1">TXT, PDF, JPG, PNG supported</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".txt,.pdf,.jpg,.jpeg,.png,.doc,.docx"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center gap-3 p-3 bg-charcoal-700 rounded-lg border border-charcoal-600">
                      <FileText className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300 flex-1 truncate">{proofFile.name}</span>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        className="text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {isReadingFile && (
                    <div className="flex items-center gap-2 text-sm text-amber-400">
                      <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                      <span>Reading document...</span>
                    </div>
                  )}

                  {proofError && (
                    <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-600/40 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-red-300">{proofError}</span>
                    </div>
                  )}

                  {proofFile && !proofError && !isReadingFile && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-900/30 border border-emerald-600/40 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-sm text-emerald-300">Document uploaded successfully</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={registerVolunteer.isPending || isReadingFile}
                    className="bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
                  >
                    {registerVolunteer.isPending ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Registering...
                      </span>
                    ) : 'Register as Volunteer'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="border-charcoal-600 text-gray-300 hover:bg-charcoal-700"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Search & Filter */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name, city, or skill..."
              className="pl-9 bg-charcoal-800 border-charcoal-700 text-white placeholder:text-gray-500"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive'] as const).map(status => (
              <button
                key={status}
                onClick={() => setFilterActive(status)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${filterActive === status ? 'bg-amber-600 text-white' : 'bg-charcoal-800 text-gray-400 hover:bg-charcoal-700 border border-charcoal-700'}`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Volunteers Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-36 bg-charcoal-800" />
            ))}
          </div>
        ) : filteredVolunteers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">No volunteers found</p>
            <p className="text-gray-600 text-sm mt-1">
              {searchQuery || filterActive !== 'all' ? 'Try adjusting your filters' : 'Be the first to register!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVolunteers.map(volunteer => (
              <VolunteerCard
                key={volunteer.id.toString()}
                volunteer={volunteer}
                onClick={() => setSelectedVolunteer(volunteer)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Volunteer Detail Modal */}
      <VolunteerDetailModal
        volunteer={selectedVolunteer}
        isOpen={!!selectedVolunteer}
        onClose={() => setSelectedVolunteer(null)}
      />
    </div>
  );
}
