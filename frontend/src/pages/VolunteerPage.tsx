import React, { useState } from 'react';
import { useGetVolunteers, useRegisterVolunteer } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Plus, Search, Filter, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';

const SKILL_OPTIONS = [
  'First Aid',
  'CPR',
  'Medical',
  'Search & Rescue',
  'Firefighting',
  'Logistics',
  'Communication',
  'Transportation',
  'Mental Health',
  'Translation',
  'IT Support',
  'Cooking',
];

interface VolunteerFormData {
  name: string;
  city: string;
  skills: string[];
  isActive: boolean;
}

const defaultForm: VolunteerFormData = {
  name: '',
  city: '',
  skills: [],
  isActive: true,
};

export default function VolunteerPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: volunteers = [], isLoading } = useGetVolunteers();
  const registerVolunteer = useRegisterVolunteer();

  const [form, setForm] = useState<VolunteerFormData>(defaultForm);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const toggleSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!form.name.trim()) {
      setErrorMessage('Name is required.');
      return;
    }
    if (!form.city.trim()) {
      setErrorMessage('City is required.');
      return;
    }
    if (form.skills.length === 0) {
      setErrorMessage('Please select at least one skill.');
      return;
    }

    try {
      await registerVolunteer.mutateAsync({
        name: form.name.trim(),
        city: form.city.trim(),
        skills: form.skills,
        isActive: form.isActive,
      });
      setSuccessMessage(`${form.name} has been registered as a volunteer!`);
      setForm(defaultForm);
      setShowForm(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(message);
    }
  };

  const filteredVolunteers = volunteers.filter(v => {
    const matchesSearch =
      !searchQuery ||
      v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSkill =
      !skillFilter || v.skills.some(s => s.toLowerCase().includes(skillFilter.toLowerCase()));
    const matchesActive =
      activeFilter === 'all' ||
      (activeFilter === 'active' && v.isActive) ||
      (activeFilter === 'inactive' && !v.isActive);
    return matchesSearch && matchesSkill && matchesActive;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="w-8 h-8 text-primary" />
            Volunteer Directory
          </h1>
          <p className="text-muted-foreground mt-1">
            Connect with trained volunteers ready to help in emergencies.
          </p>
        </div>
        {isAuthenticated && (
          <Button
            onClick={() => {
              setShowForm(prev => !prev);
              setSuccessMessage('');
              setErrorMessage('');
            }}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showForm ? 'Cancel' : 'Register as Volunteer'}
          </Button>
        )}
      </div>

      {/* Success / Error messages */}
      {successMessage && (
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-300">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Registration Form */}
      {showForm && isAuthenticated && (
        <Card className="border-primary/20 shadow-md">
          <CardHeader>
            <CardTitle>Register as a Volunteer</CardTitle>
            <CardDescription>
              Fill in your details to join the volunteer network.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="vol-name">Full Name *</Label>
                  <Input
                    id="vol-name"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                    disabled={registerVolunteer.isPending}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vol-city">City *</Label>
                  <Input
                    id="vol-city"
                    placeholder="Your city"
                    value={form.city}
                    onChange={e => setForm(prev => ({ ...prev, city: e.target.value }))}
                    disabled={registerVolunteer.isPending}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Skills * (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      disabled={registerVolunteer.isPending}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        form.skills.includes(skill)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:border-primary'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                {form.skills.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Selected: {form.skills.join(', ')}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="vol-active"
                  checked={form.isActive}
                  onCheckedChange={checked => setForm(prev => ({ ...prev, isActive: checked }))}
                  disabled={registerVolunteer.isPending}
                />
                <Label htmlFor="vol-active">
                  {form.isActive ? 'Available for deployment' : 'Not currently available'}
                </Label>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={registerVolunteer.isPending}
                  className="flex items-center gap-2"
                >
                  {registerVolunteer.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Registering...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Register Volunteer
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setForm(defaultForm);
                    setErrorMessage('');
                  }}
                  disabled={registerVolunteer.isPending}
                >
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {!isAuthenticated && (
        <Alert>
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Please log in to register as a volunteer.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or city..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="relative min-w-[160px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Filter by skill..."
            value={skillFilter}
            onChange={e => setSkillFilter(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'inactive'] as const).map(f => (
            <Button
              key={f}
              variant={activeFilter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* Volunteer List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredVolunteers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No volunteers found</p>
          <p className="text-sm">
            {volunteers.length === 0
              ? 'Be the first to register as a volunteer!'
              : 'Try adjusting your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVolunteers.map(volunteer => (
            <Card
              key={String(volunteer.id)}
              className="hover:shadow-md transition-shadow border-border"
            >
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{volunteer.name}</h3>
                    <p className="text-sm text-muted-foreground">{volunteer.city}</p>
                  </div>
                  <Badge
                    variant={volunteer.isActive ? 'default' : 'secondary'}
                    className="flex items-center gap-1 shrink-0"
                  >
                    {volunteer.isActive ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )}
                    {volunteer.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {volunteer.skills.map(skill => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats footer */}
      {!isLoading && volunteers.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          Showing {filteredVolunteers.length} of {volunteers.length} volunteers
        </p>
      )}
    </div>
  );
}
