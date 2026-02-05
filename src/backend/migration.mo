import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";

module {
  type FieldVisibility = {
    #publicVisibility;
    #privateVisibility;
  };

  type OldUserProfile = {
    displayName : Text;
    avatarUrl : ?Text;
    avatarAttachment : ?Storage.ExternalBlob;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
  };

  type NewUserProfile = {
    displayName : Text;
    displayNameVisibility : FieldVisibility;
    avatarUrl : ?Text;
    avatarAttachment : ?Storage.ExternalBlob;
    avatarVisibility : FieldVisibility;
    bio : Text;
    bioVisibility : FieldVisibility;
    joinDate : Int;
    joinDateVisibility : FieldVisibility;
  };

  type NewActor = {
    userProfiles : Map.Map<Principal, NewUserProfile>;
  };

  public func run(old : OldActor) : NewActor {
    let newProfiles = old.userProfiles.map<Principal, OldUserProfile, NewUserProfile>(
      func(_principal, oldProfile) {
        {
          displayName = oldProfile.displayName;
          displayNameVisibility = #publicVisibility;
          avatarUrl = oldProfile.avatarUrl;
          avatarAttachment = oldProfile.avatarAttachment;
          avatarVisibility = #publicVisibility;
          bio = "";
          bioVisibility = #publicVisibility;
          joinDate = 0;
          joinDateVisibility = #publicVisibility;
        };
      }
    );
    { userProfiles = newProfiles };
  };
};
