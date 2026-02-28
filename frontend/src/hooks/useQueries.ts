import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { toast } from 'sonner';
import type { Volunteer, BloodDonor, Hospital, EmergencyAlert, SOSEvent, UserProfile, EmergencyContact } from '../backend';

// ── User Profile ──────────────────────────────────────────────────────────

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

// ── Dashboard Stats ───────────────────────────────────────────────────────

export function useGetDashboardStats() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
  });
}

// ── Hospitals ─────────────────────────────────────────────────────────────

export function useGetHospitals() {
  const { actor, isFetching } = useActor();

  return useQuery<Hospital[]>({
    queryKey: ['hospitals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHospitals();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddHospital() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hospital: Hospital) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addHospital(hospital);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Hospital added successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add hospital: ${error.message}`);
    },
  });
}

export function useUpdateHospital() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (hospital: Hospital) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateHospital(hospital);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hospitals'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Hospital updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update hospital: ${error.message}`);
    },
  });
}

// ── Blood Donors ──────────────────────────────────────────────────────────

export function useGetBloodDonors() {
  const { actor, isFetching } = useActor();

  return useQuery<BloodDonor[]>({
    queryKey: ['bloodDonors'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBloodDonors();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRegisterBloodDonor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (donor: Omit<BloodDonor, 'id' | 'registeredAt'>) => {
      if (!actor) throw new Error('Actor not available');
      const payload: BloodDonor = {
        id: 0n,
        registeredAt: BigInt(Date.now()) * 1_000_000n,
        ...donor,
      };
      return actor.registerBloodDonor(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodDonors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Blood donor registered successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to register blood donor: ${error.message}`);
    },
  });
}

// ── Volunteers ────────────────────────────────────────────────────────────

export function useGetVolunteers() {
  const { actor, isFetching } = useActor();

  return useQuery<Volunteer[]>({
    queryKey: ['volunteers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVolunteers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRegisterVolunteer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (volunteer: Omit<Volunteer, 'id'>) => {
      if (!actor) throw new Error('Actor not available');
      const payload: Volunteer = {
        id: 0n,
        name: volunteer.name,
        skills: volunteer.skills,
        city: volunteer.city,
        isActive: volunteer.isActive,
      };
      return actor.registerVolunteer(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Volunteer registered successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to register volunteer: ${error.message}`);
    },
  });
}

// ── Emergency Alerts ──────────────────────────────────────────────────────

export function useGetEmergencyAlerts() {
  const { actor, isFetching } = useActor();

  return useQuery<EmergencyAlert[]>({
    queryKey: ['emergencyAlerts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getEmergencyAlerts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePostEmergencyAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alert: Omit<EmergencyAlert, 'id' | 'authorId' | 'timestamp'>) => {
      if (!actor) throw new Error('Actor not available');
      const payload: EmergencyAlert = {
        id: 0n,
        timestamp: BigInt(Date.now()) * 1_000_000n,
        ...alert,
      };
      return actor.postEmergencyAlert(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyAlerts'] });
      toast.success('Emergency alert posted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to post alert: ${error.message}`);
    },
  });
}

// ── SOS Events ────────────────────────────────────────────────────────────

export function useRecordSOS() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sos: Omit<SOSEvent, 'id' | 'userId' | 'timestamp'>) => {
      if (!actor) throw new Error('Actor not available');
      const payload: SOSEvent = {
        id: 0n,
        userId: undefined,
        timestamp: BigInt(Date.now()) * 1_000_000n,
        ...sos,
      };
      return actor.recordSOS(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sosEvents'] });
    },
    onError: (error: Error) => {
      console.error('SOS recording error:', error);
    },
  });
}

// ── Emergency Contacts ─────────────────────────────────────────────────────

export function useGetMyEmergencyContacts() {
  const { actor, isFetching } = useActor();

  return useQuery<EmergencyContact[]>({
    queryKey: ['myEmergencyContacts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyEmergencyContacts();
    },
    enabled: !!actor && !isFetching,
    retry: false,
  });
}

export function useAddEmergencyContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contact: { name: string; phone: string; relationship: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addEmergencyContact(contact.name, contact.phone, contact.relationship);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEmergencyContacts'] });
      toast.success('Emergency contact added successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add contact: ${error.message}`);
    },
  });
}

export function useRemoveEmergencyContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contactId: bigint) => {
      if (!actor) throw new Error('Actor not available');
      return actor.removeEmergencyContact(contactId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEmergencyContacts'] });
      toast.success('Emergency contact removed.');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove contact: ${error.message}`);
    },
  });
}
