import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Hospital, BloodDonor, Volunteer, EmergencyAlert, SOSEvent, UserProfile, EmergencyContact } from '../backend';
import { toast } from 'sonner';

// ── User Profile ──────────────────────────────────────────────────────────────

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
    },
  });
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────

export function useDashboardStats() {
  const { actor, isFetching } = useActor();

  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getDashboardStats();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

// ── Hospitals ─────────────────────────────────────────────────────────────────

export function useHospitals() {
  const { actor, isFetching } = useActor();

  return useQuery<Hospital[]>({
    queryKey: ['hospitals'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getHospitals();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 60000,
  });
}

// ── Blood Donors ──────────────────────────────────────────────────────────────

export function useBloodDonors() {
  const { actor, isFetching } = useActor();

  return useQuery<BloodDonor[]>({
    queryKey: ['bloodDonors'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBloodDonors();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useRegisterBloodDonor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (donor: BloodDonor) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerBloodDonor(donor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodDonors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

// ── Volunteers ────────────────────────────────────────────────────────────────

export function useVolunteers() {
  const { actor, isFetching } = useActor();

  return useQuery<Volunteer[]>({
    queryKey: ['volunteers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getVolunteers();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 30000,
  });
}

export function useRegisterVolunteer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (volunteer: Volunteer) => {
      if (!actor) throw new Error('Actor not available');
      return actor.registerVolunteer(volunteer);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
  });
}

// ── Emergency Alerts ──────────────────────────────────────────────────────────

export function useEmergencyAlerts() {
  const { actor, isFetching } = useActor();

  return useQuery<EmergencyAlert[]>({
    queryKey: ['emergencyAlerts'],
    queryFn: async () => {
      if (!actor) return [];
      const alerts = await actor.getEmergencyAlerts();
      return alerts.slice(0, 20);
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function usePostEmergencyAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alert: EmergencyAlert) => {
      if (!actor) throw new Error('Actor not available');
      return actor.postEmergencyAlert(alert);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyAlerts'] });
    },
  });
}

// ── SOS Events ────────────────────────────────────────────────────────────────

export function useRecordSOS() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (sos: SOSEvent) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordSOS(sos);
    },
  });
}

// ── Emergency Contacts ────────────────────────────────────────────────────────

export function useGetMyEmergencyContacts(enabled: boolean = true) {
  const { actor, isFetching } = useActor();

  return useQuery<EmergencyContact[]>({
    queryKey: ['myEmergencyContacts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyEmergencyContacts();
    },
    enabled: !!actor && !isFetching && enabled,
  });
}

export function useAddEmergencyContact() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, phone, relationship }: { name: string; phone: string; relationship: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.addEmergencyContact(name, phone, relationship);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myEmergencyContacts'] });
      toast.success('Emergency contact added successfully!');
    },
    onError: () => {
      toast.error('Failed to add emergency contact. Please try again.');
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
    onError: () => {
      toast.error('Failed to remove contact. Please try again.');
    },
  });
}
