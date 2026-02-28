import Map "mo:core/Map";
import List "mo:core/List";
import Principal "mo:core/Principal";

module {
  public type OldActor = {
    userProfiles : Map.Map<Principal.Principal, { name : Text; city : Text; contact : Text }>;
    hospitals : Map.Map<Nat, { id : Nat; name : Text; address : Text; lat : Float; lng : Float; bedsAvailable : Nat; contact : Text }>;
    bloodDonors : Map.Map<Nat, { id : Nat; name : Text; bloodType : Text; city : Text; contact : Text; registeredAt : Int }>;
    volunteers : Map.Map<Nat, { id : Nat; name : Text; skills : [Text]; city : Text; isActive : Bool }>;
    sosEvents : Map.Map<Nat, { id : Nat; userId : ?Principal.Principal; lat : Float; lng : Float; timestamp : Int }>;
    emergencyAlerts : Map.Map<Nat, { id : Nat; authorId : ?Principal.Principal; alertType : Text; description : Text; location : Text; timestamp : Int }>;
    nextId : Nat;
  };

  public type EmergencyContact = {
    id : Nat;
    ownerPrincipal : Principal.Principal;
    name : Text;
    phone : Text;
    relationship : Text;
    createdAt : Int;
  };

  public type NewActor = {
    userProfiles : Map.Map<Principal.Principal, { name : Text; city : Text; contact : Text }>;
    hospitals : Map.Map<Nat, { id : Nat; name : Text; address : Text; lat : Float; lng : Float; bedsAvailable : Nat; contact : Text }>;
    bloodDonors : Map.Map<Nat, { id : Nat; name : Text; bloodType : Text; city : Text; contact : Text; registeredAt : Int }>;
    volunteers : Map.Map<Nat, { id : Nat; name : Text; skills : [Text]; city : Text; isActive : Bool }>;
    sosEvents : Map.Map<Nat, { id : Nat; userId : ?Principal.Principal; lat : Float; lng : Float; timestamp : Int }>;
    emergencyAlerts : Map.Map<Nat, { id : Nat; authorId : ?Principal.Principal; alertType : Text; description : Text; location : Text; timestamp : Int }>;
    emergencyContacts : Map.Map<Principal.Principal, List.List<EmergencyContact>>;
    nextId : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let emptyContacts = Map.empty<Principal.Principal, List.List<EmergencyContact>>();
    {
      old with
      emergencyContacts = emptyContacts;
    };
  };
};
