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
    bloodType: string;
    contact: string;
    city: string;
    name: string;
    registeredAt: Time;
}
export interface EmergencyContact {
    id: bigint;
    relationship: string;
    ownerPrincipal: Principal;
    name: string;
    createdAt: bigint;
    phone: string;
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
export interface Volunteer {
    id: bigint;
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
    /**
     * / Add a new emergency contact for authenticated user. Returns contact ID.
     */
    addEmergencyContact(name: string, phone: string, relationship: string): Promise<bigint>;
    /**
     * / Add a hospital. Admin only.
     */
    addHospital(hospital: Hospital): Promise<bigint>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    /**
     * / Get hospitals sorted by proximity (distance calculation done client-side).
     * / Public read.
     */
    findHospitalsByDistance(lat: number, lng: number): Promise<Array<Hospital>>;
    /**
     * / Get all blood donors. Public read.
     */
    getBloodDonors(): Promise<Array<BloodDonor>>;
    /**
     * / Get the calling user's own profile. Requires authenticated user.
     */
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    /**
     * / Get summary statistics for the dashboard. Public read.
     */
    getDashboardStats(): Promise<{
        hospitalCount: bigint;
        volunteerCount: bigint;
        availableBeds: bigint;
        donorCount: bigint;
    }>;
    /**
     * / Get donors filtered by blood type. Public read.
     */
    getDonorsByBloodType(bloodType: string): Promise<Array<BloodDonor>>;
    /**
     * / Get all emergency alerts sorted by most recent first. Public read.
     */
    getEmergencyAlerts(): Promise<Array<EmergencyAlert>>;
    /**
     * / Admin/internal function to get emergency contacts for a specific principal
     */
    getEmergencyContactsByPrincipal(userPrincipal: Principal): Promise<Array<EmergencyContact>>;
    /**
     * / Get all hospitals. Public read.
     */
    getHospitals(): Promise<Array<Hospital>>;
    /**
     * / Get all emergency contacts for the calling user.
     */
    getMyEmergencyContacts(): Promise<Array<EmergencyContact>>;
    /**
     * / Get all SOS events. Admin only (sensitive location data).
     */
    getSOSEvents(): Promise<Array<SOSEvent>>;
    /**
     * / Fetch any user's profile. Users can only view their own; admins can view anyone's.
     */
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    /**
     * / Get all volunteers. Public read.
     */
    getVolunteers(): Promise<Array<Volunteer>>;
    isCallerAdmin(): Promise<boolean>;
    /**
     * / Post an emergency alert. Requires authenticated user.
     */
    postEmergencyAlert(alert: EmergencyAlert): Promise<bigint>;
    /**
     * / Record an SOS event. Accessible to everyone including unauthenticated
     * / users because SOS must work before login.
     */
    recordSOS(sos: SOSEvent): Promise<bigint>;
    /**
     * / Register as a blood donor. Requires authenticated user.
     */
    registerBloodDonor(donor: BloodDonor): Promise<bigint>;
    /**
     * / Register as a volunteer. Requires authenticated user.
     */
    registerVolunteer(volunteer: Volunteer): Promise<bigint>;
    /**
     * / Remove an emergency contact by its ID for the calling user.
     */
    removeEmergencyContact(contactId: bigint): Promise<void>;
    /**
     * / Save / update the calling user's own profile. Requires authenticated user.
     */
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    /**
     * / Update an existing hospital. Admin only.
     */
    updateHospital(hospital: Hospital): Promise<void>;
}
