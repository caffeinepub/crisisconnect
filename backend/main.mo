import Map "mo:core/Map";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Nat "mo:core/Nat";
import List "mo:core/List";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration";

(with migration = Migration.run)
actor {
  // Include authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Types
  public type UserProfile = {
    name : Text;
    city : Text;
    contact : Text;
  };

  public type Hospital = {
    id : Nat;
    name : Text;
    address : Text;
    lat : Float;
    lng : Float;
    bedsAvailable : Nat;
    contact : Text;
  };

  public type BloodDonor = {
    id : Nat;
    name : Text;
    bloodType : Text;
    city : Text;
    contact : Text;
    registeredAt : Time.Time;
  };

  public type Volunteer = {
    id : Nat;
    name : Text;
    skills : [Text];
    city : Text;
    isActive : Bool;
  };

  public type SOSEvent = {
    id : Nat;
    userId : ?Principal;
    lat : Float;
    lng : Float;
    timestamp : Time.Time;
  };

  public type EmergencyAlert = {
    id : Nat;
    authorId : ?Principal;
    alertType : Text;
    description : Text;
    location : Text;
    timestamp : Time.Time;
  };

  public type EmergencyContact = {
    id : Nat;
    ownerPrincipal : Principal;
    name : Text;
    phone : Text;
    relationship : Text;
    createdAt : Int;
  };

  var nextId = 1;

  // Persistent stores
  let userProfiles = Map.empty<Principal, UserProfile>();
  let hospitals = Map.empty<Nat, Hospital>();
  let bloodDonors = Map.empty<Nat, BloodDonor>();
  let volunteers = Map.empty<Nat, Volunteer>();
  let sosEvents = Map.empty<Nat, SOSEvent>();
  let emergencyAlerts = Map.empty<Nat, EmergencyAlert>();
  let emergencyContacts = Map.empty<Principal, List.List<EmergencyContact>>();

  func getNextId() : Nat {
    let id = nextId;
    nextId += 1;
    id;
  };

  // ── User Profile ──────────────────────────────────────────────────────────

  /// Get the calling user's own profile. Requires authenticated user.
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their profile");
    };
    userProfiles.get(caller);
  };

  /// Save / update the calling user's own profile. Requires authenticated user.
  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save their profile");
    };
    userProfiles.add(caller, profile);
  };

  /// Fetch any user's profile. Users can only view their own; admins can view anyone's.
  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  // ── Hospital CRUD ─────────────────────────────────────────────────────────

  /// Add a hospital. Admin only.
  public shared ({ caller }) func addHospital(hospital : Hospital) : async Nat {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add hospitals");
    };
    let id = getNextId();
    let newHospital = { hospital with id };
    hospitals.add(id, newHospital);
    id;
  };

  /// Update an existing hospital. Admin only.
  public shared ({ caller }) func updateHospital(hospital : Hospital) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can update hospitals");
    };
    hospitals.add(hospital.id, hospital);
  };

  /// Get all hospitals. Public read.
  public query func getHospitals() : async [Hospital] {
    hospitals.values().toArray();
  };

  /// Get hospitals sorted by proximity (distance calculation done client-side).
  /// Public read.
  public query func findHospitalsByDistance(lat : Float, lng : Float) : async [Hospital] {
    hospitals.values().toArray();
  };

  // ── Blood Donor CRUD ──────────────────────────────────────────────────────

  /// Register as a blood donor. Requires authenticated user.
  public shared ({ caller }) func registerBloodDonor(donor : BloodDonor) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register as donors");
    };
    let id = getNextId();
    let newDonor = { donor with id };
    bloodDonors.add(id, newDonor);
    id;
  };

  /// Get all blood donors. Public read.
  public query func getBloodDonors() : async [BloodDonor] {
    bloodDonors.values().toArray();
  };

  /// Get donors filtered by blood type. Public read.
  public query func getDonorsByBloodType(bloodType : Text) : async [BloodDonor] {
    bloodDonors.values().toArray().filter(func(d : BloodDonor) : Bool { d.bloodType == bloodType });
  };

  // ── Volunteer CRUD ────────────────────────────────────────────────────────

  /// Register as a volunteer. Requires authenticated user.
  public shared ({ caller }) func registerVolunteer(volunteer : Volunteer) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register as volunteers");
    };
    let id = getNextId();
    let newVolunteer = { volunteer with id };
    volunteers.add(id, newVolunteer);
    id;
  };

  /// Get all volunteers. Public read.
  public query func getVolunteers() : async [Volunteer] {
    volunteers.values().toArray();
  };

  // ── SOS Events ────────────────────────────────────────────────────────────

  /// Record an SOS event. Accessible to everyone including unauthenticated
  /// users because SOS must work before login.
  public shared ({ caller }) func recordSOS(sos : SOSEvent) : async Nat {
    let id = getNextId();
    // Capture the actual caller principal (anonymous or authenticated).
    let userId : ?Principal = if (caller.isAnonymous()) { null } else { ?caller };
    let newSos = { sos with id; userId };
    sosEvents.add(id, newSos);
    id;
  };

  /// Get all SOS events. Admin only (sensitive location data).
  public query ({ caller }) func getSOSEvents() : async [SOSEvent] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can view SOS events");
    };
    sosEvents.values().toArray();
  };

  // ── Emergency Alerts ──────────────────────────────────────────────────────

  /// Post an emergency alert. Requires authenticated user.
  public shared ({ caller }) func postEmergencyAlert(alert : EmergencyAlert) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Must be logged in to post alerts");
    };
    let id = getNextId();
    let authorId : ?Principal = ?caller;
    let newAlert = { alert with id; authorId };
    emergencyAlerts.add(id, newAlert);
    id;
  };

  /// Get all emergency alerts sorted by most recent first. Public read.
  public query func getEmergencyAlerts() : async [EmergencyAlert] {
    let alerts = emergencyAlerts.toArray().map(func((_, a) : (Nat, EmergencyAlert)) : EmergencyAlert { a });
    alerts.sort(
      func(a : EmergencyAlert, b : EmergencyAlert) : Order.Order {
        // Descending by timestamp (most recent first)
        if (b.timestamp > a.timestamp) { #less }
        else if (b.timestamp < a.timestamp) { #greater }
        else { #equal };
      }
    );
  };

  // ── Dashboard Stats ───────────────────────────────────────────────────────

  /// Get summary statistics for the dashboard. Public read.
  public query func getDashboardStats() : async {
    hospitalCount : Nat;
    availableBeds : Nat;
    donorCount : Nat;
    volunteerCount : Nat;
  } {
    let hospitalsList = hospitals.values().toArray();
    var beds : Nat = 0;
    for (h in hospitalsList.vals()) {
      beds += h.bedsAvailable;
    };
    {
      hospitalCount = hospitals.size();
      availableBeds = beds;
      donorCount = bloodDonors.size();
      volunteerCount = volunteers.size();
    };
  };

  // ── Emergency Contacts ─────────────────────────────────────────────

  /// Add a new emergency contact for authenticated user. Returns contact ID.
  public shared ({ caller }) func addEmergencyContact(name : Text, phone : Text, relationship : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can add emergency contacts");
    };
    let id = getNextId();

    let contact : EmergencyContact = {
      id;
      ownerPrincipal = caller;
      name;
      phone;
      relationship;
      createdAt = Time.now();
    };

    let existingContacts = emergencyContacts.get(caller);
    switch (existingContacts) {
      case (null) {
        let contactsList = List.empty<EmergencyContact>();
        contactsList.add(contact);
        emergencyContacts.add(caller, contactsList);
      };
      case (?contactsList) {
        contactsList.add(contact);
      };
    };
    id;
  };

  /// Remove an emergency contact by its ID for the calling user.
  public shared ({ caller }) func removeEmergencyContact(contactId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can remove emergency contacts");
    };

    let existingContacts = emergencyContacts.get(caller);
    switch (existingContacts) {
      case (null) {};
      case (?contactsList) {
        let filteredContacts = contactsList.filter(func(c) { c.id != contactId });
        emergencyContacts.add(caller, filteredContacts);
      };
    };
  };

  /// Get all emergency contacts for the calling user.
  public query ({ caller }) func getMyEmergencyContacts() : async [EmergencyContact] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view emergency contacts");
    };
    switch (emergencyContacts.get(caller)) {
      case (null) { [] };
      case (?contactsList) { contactsList.toArray() };
    };
  };

  /// Admin/internal function to get emergency contacts for a specific principal
  public query ({ caller }) func getEmergencyContactsByPrincipal(userPrincipal : Principal) : async [EmergencyContact] {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can access emergency contacts for other users");
    };
    switch (emergencyContacts.get(userPrincipal)) {
      case (null) { [] };
      case (?contactsList) { contactsList.toArray() };
    };
  };
};
