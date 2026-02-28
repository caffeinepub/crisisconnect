import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface EmergencyAlert {
    id: bigint;
    alertType: string;
    authorId?: Principal;
    description: string;
    timestamp: Time;
    location: string;
}
export type Time = bigint;
export interface BloodDonor {
    id: bigint;
    contact: string;
    proofText: string;
    city: string;
    name: string;
    detectedBloodType: string;
    verifiedBloodType: string;
    registeredAt: Time;
}
export interface Hospital {
    id: bigint;
    lat: number;
    lng: number;
    contact: string;
    name: string;
    bedsAvailable: bigint;
    address: string;
}
export interface EmergencyContact {
    id: bigint;
    relationship: string;
    ownerPrincipal: Principal;
    name: string;
    createdAt: bigint;
    phone: string;
}
export interface Volunteer {
    id: bigint;
    proofText: string;
    city: string;
    name: string;
    isActive: boolean;
    skills: Array<string>;
}
export interface SOSEvent {
    id: bigint;
    lat: number;
    lng: number;
    userId?: Principal;
    timestamp: Time;
}
export interface UserProfile {
    contact: string;
    city: string;
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addBloodDonor(name: string, city: string, contact: string, proofText: string, detectedBloodType: string): Promise<{
        __kind__: "error";
        error: string;
    } | {
        __kind__: "success";
        success: bigint;
    }>;
    addEmergencyContact(name: string, phone: string, relationship: string): Promise<bigint>;
    addGalleryItem(blobId: string): Promise<bigint>;
    addHospital(hospital: Hospital): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    findHospitalsByDistance(lat: number, lng: number): Promise<Array<Hospital>>;
    getBloodDonors(): Promise<Array<BloodDonor>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDashboardStats(): Promise<{
        hospitalCount: bigint;
        volunteerCount: bigint;
        availableBeds: bigint;
        donorCount: bigint;
    }>;
    getDonorsByBloodType(bloodType: string): Promise<Array<BloodDonor>>;
    getEmergencyAlerts(): Promise<Array<EmergencyAlert>>;
    getEmergencyContactsByPrincipal(userPrincipal: Principal): Promise<Array<EmergencyContact>>;
    getGalleryItems(): Promise<Array<[bigint, string]>>;
    getHospitals(): Promise<Array<Hospital>>;
    getMyEmergencyContacts(): Promise<Array<EmergencyContact>>;
    getSOSEvents(): Promise<Array<SOSEvent>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVolunteers(): Promise<Array<Volunteer>>;
    isCallerAdmin(): Promise<boolean>;
    postEmergencyAlert(alert: EmergencyAlert): Promise<bigint>;
    recordSOS(sos: SOSEvent): Promise<bigint>;
    registerVolunteer(volunteer: Volunteer): Promise<bigint>;
    removeEmergencyContact(contactId: bigint): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateHospital(hospital: Hospital): Promise<void>;
}
