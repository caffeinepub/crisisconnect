import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { BloodDonor, Hospital, Volunteer, SOSEvent, EmergencyAlert, UserProfile, EmergencyContact } from '../backend';
import { toast } from 'sonner';

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
      toast.success('Profile saved successfully');
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
      toast.success('Hospital added successfully');
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
      toast.success('Hospital updated successfully');
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

export function useAddBloodDonor() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      city,
      contact,
      proofText,
      detectedBloodType,
    }: {
      name: string;
      city: string;
      contact: string;
      proofText: string;
      detectedBloodType: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.addBloodDonor(name, city, contact, proofText, detectedBloodType);
      if (result.__kind__ === 'error') {
        throw new Error(result.error);
      }
      return result.success;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloodDonors'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Registered as blood donor successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to register: ${error.message}`);
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
      return actor.registerVolunteer({ ...volunteer, id: BigInt(0) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      toast.success('Registered as volunteer successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to register: ${error.message}`);
    },
  });
}

// ── SOS Events ────────────────────────────────────────────────────────────

export function useRecordSOS() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (sos: Pick<SOSEvent, 'lat' | 'lng'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.recordSOS({
        ...sos,
        id: BigInt(0),
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sosEvents'] });
      toast.success('SOS recorded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to record SOS: ${error.message}`);
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
    refetchInterval: 30000,
  });
}

export function usePostEmergencyAlert() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alert: Omit<EmergencyAlert, 'id' | 'authorId' | 'timestamp'>) => {
      if (!actor) throw new Error('Actor not available');
      return actor.postEmergencyAlert({
        ...alert,
        id: BigInt(0),
        timestamp: BigInt(Date.now()) * BigInt(1_000_000),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencyAlerts'] });
      toast.success('Alert posted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to post alert: ${error.message}`);
    },
  });
}

// ── Emergency Contacts ────────────────────────────────────────────────────

export function useGetMyEmergencyContacts() {
  const { actor, isFetching } = useActor();

  return useQuery<EmergencyContact[]>({
    queryKey: ['myEmergencyContacts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyEmergencyContacts();
    },
    enabled: !!actor && !isFetching,
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
      toast.success('Emergency contact added');
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
      toast.success('Emergency contact removed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove contact: ${error.message}`);
    },
  });
}
