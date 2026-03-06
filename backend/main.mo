import Map "mo:core/Map";
import Text "mo:core/Text";
import Time "mo:core/Time";
import List "mo:core/List";
import Iter "mo:core/Iter";
import AccessControl "authorization/access-control";
import Runtime "mo:core/Runtime";
import Storage "blob-storage/Storage";
import Principal "mo:core/Principal";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import Array "mo:core/Array";
import Nat "mo:core/Nat";

actor {
  // Type definitions truncated for brevity..
  type Attachment = Storage.ExternalBlob;

  public type Message = {
    id : Text;
    author : Text;
    authorPrincipal : Principal;
    content : Text;
    timestamp : Int;
    attachments : [Attachment];
    imageUrl : ?Text;
  };

  public type DMThreadSummary = { 
    otherUser : Principal;
    lastMessageTimestamp : Int;
  };

  type Channel = {
    id : Text;
    name : Text;
    messages : List.List<Message>;
    createdAt : Int;
  };

  public type ChannelView = {
    id : Text;
    name : Text;
    messages : [Message];
    createdAt : Int;
  };

  public type PermanentlyBannedPrincipal = {
    principal : Principal;
    banTimestamp : Int;
    bannedBy : ?Principal;
    reason : ?Text;
  };

  public type TempBannedPrincipal = {
    principal : Principal;
    banTimestamp : Int;
    bannedBy : ?Principal;
    banDuration : ?Int;
    reason : ?Text;
  };

  public type ModerationAction = {
    principal : Principal;
    actionTimestamp : Int;
    actionBy : ?Principal;
    serverId : Text;
    reason : ?Text;
  };

  public type ServerRole = {
    #Owner;
    #Moderator;
    #Member;
  };

  public type ServerMember = {
    principal : Principal;
    displayName : Text;
    role : ServerRole;
    joinedAt : Int;
  };

  public type ServerBan = {
    principal : Principal;
    bannedBy : Principal;
    banTimestamp : Int;
    reason : ?Text;
  };

  public type ServerBranding = {
    icon : ?Text;
    iconAttachment : ?Attachment;
    banner : ?Text;
    bannerAttachment : ?Attachment;
    description : Text;
    topic : Text;
  };

  public type InviteCode = {
    code : Text;
    serverId : Text;
    createdAt : Int;
    createdBy : Principal;
  };

  let permanentlyBannedPrincipals = List.empty<PermanentlyBannedPrincipal>();
  let tempBannedPrincipals = List.empty<TempBannedPrincipal>();
  let kickedPrincipals = List.empty<ModerationAction>();

  type Server = {
    id : Text;
    name : Text;
    owner : Text;
    ownerPrincipal : Principal;
    createdAt : Int;
    channels : Map.Map<Text, Channel>;
    members : Map.Map<Principal, ServerMember>;
    moderators : Map.Map<Principal, Bool>;
    bannedUsers : Map.Map<Principal, ServerBan>;
    inviteCodes : List.List<Text>;
    branding : ServerBranding;
  };

  public type Post = {
    id : Text;
    author : Text;
    authorPrincipal : Principal;
    content : Text;
    timestamp : Int;
    attachments : [Attachment];
    imageUrl : ?Text;
  };

  public type FieldVisibility = {
    #publicVisibility;
    #privateVisibility;
  };

  public type ExtendedUserProfile = {
    displayName : Text;
    displayNameVisibility : FieldVisibility;
    avatarUrl : ?Text;
    avatarAttachment : ?Attachment;
    avatarVisibility : FieldVisibility;
    bio : Text;
    bioVisibility : FieldVisibility;
    joinDate : Int;
    joinDateVisibility : FieldVisibility;
    pronouns : ?Text;
    pronounsVisibility : FieldVisibility;
    links : [Text];
    linksVisibilities : [FieldVisibility];
  };

  public type PublicUserProfile = {
    displayName : Text;
    avatarUrl : ?Text;
    bio : Text;
    joinDate : Int;
    pronouns : ?Text;
    links : [Text];
  };

  public type ProfileVisibilityStatus = {
    displayName : FieldVisibility;
    avatar : FieldVisibility;
    bio : FieldVisibility;
    joinDate : FieldVisibility;
    pronouns : FieldVisibility;
    links : [FieldVisibility];
  };

  let serverMap = Map.empty<Text, Server>();
  let globalFeed = List.empty<Post>();
  let userProfiles = Map.empty<Principal, ExtendedUserProfile>();
  let dmConversations = Map.empty<Text, List.List<Message>>();
  let deletedMessages = Map.empty<Text, Bool>();
  let deletedPosts = Map.empty<Text, Bool>();
  let dmThreadSummaries = Map.empty<Text, DMThreadSummary>();
  let inviteCodeMap = Map.empty<Text, InviteCode>();
  var messageCounter = 0;
  var postCounter = 0;
  var inviteCounter = 0;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type ServerInfo = {
    id : Text;
    name : Text;
    owner : Text;
    ownerPrincipal : Principal;
  };

  public type ServerInfoExtended = {
    id : Text;
    name : Text;
    owner : Text;
    ownerPrincipal : Principal;
    branding : ServerBranding;
    inviteCode : Text;
    memberCount : Nat;
  };

  public type ChannelInfo = {
    id : Text;
    name : Text;
  };

  public type NewServerParams = {
    name : Text;
  };

  public type UserSearchResult = {
    principal : Principal;
    displayName : Text;
    isAdmin : Bool;
  };

  let VERIFIED_MODERATOR_PRINCIPAL : Text = "pegss-3sotn-xldcq-mf5ry-7ywms-nk4gm-c37mh-vf56p-yxs2i-m3uqp-iqe";

  func getDMKey(user1 : Principal, user2 : Principal) : Text {
    let p1 = user1.toText();
    let p2 = user2.toText();
    if (Text.compare(p1, p2) == #less) { p1 # ":" # p2 } else {
      p2 # ":" # p1;
    };
  };

  func isVerifiedModerator(principal : Principal) : Bool {
    principal.toText() == VERIFIED_MODERATOR_PRINCIPAL;
  };

  func isGlobalAdmin(principal : Principal) : Bool {
    isVerifiedModerator(principal);
  };

  func hasModeratorPrivileges(principal : Principal, server : Server) : Bool {
    principal == server.ownerPrincipal or isVerifiedModerator(principal) or (switch (server.moderators.get(principal)) {
      case (?true) { true };
      case (_) { false };
    });
  };

  func isServerOwner(principal : Principal, server : Server) : Bool {
    principal == server.ownerPrincipal;
  };

  func isBanned(principal : Principal, serverId : Text) : Bool {
    switch (serverMap.get(serverId)) {
      case (null) { false };
      case (?server) {
        switch (server.bannedUsers.get(principal)) {
          case (null) { false };
          case (?_) { true };
        };
      };
    };
  };

  func isMember(principal : Principal, serverId : Text) : Bool {
    switch (serverMap.get(serverId)) {
      case (null) { false };
      case (?server) {
        switch (server.members.get(principal)) {
          case (null) { false };
          case (?_) { true };
        };
      };
    };
  };

  func generateInviteCode(serverId : Text) : Text {
    let code = "invite" # inviteCounter.toText() # "_" # serverId;
    inviteCounter += 1;
    code;
  };

  // ----- User Profile Management -----
  public query ({ caller }) func getCallerUserProfile() : async ?ExtendedUserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?PublicUserProfile {
    // Any authenticated user (including guests) can view public profiles
    let profile = switch (userProfiles.get(user)) {
      case (null) { return null };
      case (?p) { p };
    };

    ?{
      displayName = if (profile.displayNameVisibility == #publicVisibility or caller == user) {
        profile.displayName;
      } else { "Private" };
      avatarUrl = if (profile.avatarVisibility == #publicVisibility or caller == user) {
        profile.avatarUrl;
      } else { null };
      bio = if (profile.bioVisibility == #publicVisibility or caller == user) {
        profile.bio;
      } else { "Private" };
      joinDate = if (profile.joinDateVisibility == #publicVisibility or caller == user) {
        profile.joinDate;
      } else { 0 };
      pronouns = if (profile.pronounsVisibility == #publicVisibility or caller == user) {
        profile.pronouns;
      } else { null };
      links = if (profile.linksVisibilities.size() > 0 and profile.linksVisibilities[0] == #publicVisibility or caller == user) {
        profile.links;
      } else { [] };
    };
  };

  public query ({ caller }) func getProfileVisibility(user : Principal) : async ?ProfileVisibilityStatus {
    if (caller != user) {
      Runtime.trap("Unauthorized: Can only view your own profile visibility settings");
    };

    switch (userProfiles.get(user)) {
      case (null) { null };
      case (?profile) {
        ?{
          displayName = profile.displayNameVisibility;
          avatar = profile.avatarVisibility;
          bio = profile.bioVisibility;
          joinDate = profile.joinDateVisibility;
          pronouns = profile.pronounsVisibility;
          links = profile.linksVisibilities;
        };
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : ExtendedUserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    if (profile.displayName.size() == 0) {
      Runtime.trap("displayName is required");
    };

    if (profile.links.size() > 3) {
      Runtime.trap("Cannot save more than 3 links");
    };

    let profileWithJoinDate = switch (userProfiles.get(caller)) {
      case (null) {
        { profile with joinDate = Time.now() };
      };
      case (?existingProfile) {
        { profile with joinDate = existingProfile.joinDate };
      };
    };

    userProfiles.add(caller, profileWithJoinDate);
  };

  public shared ({ caller }) func updateProfileFieldVisibility(field : Text, value : ?Nat, visibility : FieldVisibility) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profile visibility");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile does not exist");
      };
      case (?profile) {
        let updatedProfile = switch (field) {
          case ("displayName") {
            { profile with displayNameVisibility = visibility };
          };
          case ("avatar") {
            { profile with avatarVisibility = visibility };
          };
          case ("bio") {
            { profile with bioVisibility = visibility };
          };
          case ("joinDate") {
            { profile with joinDateVisibility = visibility };
          };
          case ("pronouns") {
            { profile with pronounsVisibility = visibility };
          };
          case ("links") {
            switch (value) {
              case (?index) {
                if (index >= profile.linksVisibilities.size()) {
                  Runtime.trap("Invalid link index");
                };
                var updatedVisibilities = profile.linksVisibilities.toVarArray<FieldVisibility>();
                updatedVisibilities[index] := visibility;
                { profile with linksVisibilities = updatedVisibilities.toArray() };
              };
              case (null) { Runtime.trap("Index is required for links field") };
            };
          };
          case (_) { Runtime.trap("Invalid profile field") };
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func searchUsers(searchTerm : Text) : async [UserSearchResult] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search for users");
    };

    let moderators = List.empty<UserSearchResult>();
    let regularUsers = List.empty<UserSearchResult>();

    for ((principal, profile) in userProfiles.entries()) {
      let matchesUsername = principal.toText().contains(#text searchTerm);
      let matchesDisplayName = profile.displayName.contains(#text searchTerm);
      let matchesPronouns = switch (profile.pronouns) {
        case (null) { false };
        case (?p) { p.contains(#text searchTerm) };
      };
      let matchesLinks = profile.links.any(func(link) { link.contains(#text searchTerm) });

      if (matchesUsername or matchesDisplayName or matchesPronouns or matchesLinks) {
        let result = {
          principal = principal;
          displayName = profile.displayName;
          isAdmin = isVerifiedModerator(principal);
        };

        if (result.isAdmin) {
          moderators.add(result);
        } else {
          regularUsers.add(result);
        };
      };
    };

    let sortedResults = List.empty<UserSearchResult>();
    for (mod in moderators.values()) {
      sortedResults.add(mod);
    };
    for (user in regularUsers.values()) {
      sortedResults.add(user);
    };
    sortedResults.toArray();
  };

  // ----- Server Management -----
  public shared ({ caller }) func createServer(params : NewServerParams) : async ServerInfo {
    if (not (AccessControl.hasPermission(
      accessControlState,
      caller,
      #user,
    ))) {
      Runtime.trap("Unauthorized: Only users can create servers");
    };

    let profile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile required before creating servers") };
      case (?p) { p };
    };

    let serverId = params.name # ":" # caller.toText();
    let inviteCode = generateInviteCode(serverId);
    
    let newServer = {
      id = serverId;
      name = params.name;
      owner = profile.displayName;
      ownerPrincipal = caller;
      createdAt = Time.now();
      channels = Map.empty<Text, Channel>();
      members = Map.empty<Principal, ServerMember>();
      moderators = Map.empty<Principal, Bool>();
      bannedUsers = Map.empty<Principal, ServerBan>();
      inviteCodes = List.fromArray([inviteCode]);
      branding = {
        icon = null;
        iconAttachment = null;
        banner = null;
        bannerAttachment = null;
        description = "";
        topic = "";
      };
    };

    let ownerMember = {
      principal = caller;
      displayName = profile.displayName;
      role = #Owner;
      joinedAt = Time.now();
    };
    newServer.members.add(caller, ownerMember);

    serverMap.add(serverId, newServer);
    inviteCodeMap.add(inviteCode, {
      code = inviteCode;
      serverId = serverId;
      createdAt = Time.now();
      createdBy = caller;
    });

    {
      id = serverId;
      name = params.name;
      owner = profile.displayName;
      ownerPrincipal = caller;
    };
  };

  public shared ({ caller }) func editServer(serverId : Text, newName : Text) : async () {
    if (not (AccessControl.hasPermission(
      accessControlState,
      caller,
      #user,
    ))) {
      Runtime.trap("Unauthorized: Only users can edit servers");
    };

    switch (serverMap.get(serverId)) {
      case (null) { Runtime.trap("Server not found") };
      case (?server) {
        if (not hasModeratorPrivileges(caller, server)) {
          Runtime.trap("Unauthorized: Only server owner or moderator can edit server");
        };

        let newInviteCode = generateInviteCode(serverId);
        server.inviteCodes.add(newInviteCode);
        inviteCodeMap.add(newInviteCode, {
          code = newInviteCode;
          serverId = serverId;
          createdAt = Time.now();
          createdBy = caller;
        });

        let updatedServer = { server with name = newName };
        serverMap.add(serverId, updatedServer);
      };
    };
  };

  public shared ({ caller }) func deleteServer(serverId : Text, confirmationName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete servers");
    };

    switch (serverMap.get(serverId)) {
      case (null) { Runtime.trap("Server not found") };
      case (?server) {
        if (caller != server.ownerPrincipal and not isVerifiedModerator(caller)) {
          Runtime.trap("Unauthorized: Only server owner or verified moderator can delete server");
        };

        if (confirmationName != server.name) {
          Runtime.trap("Server name confirmation does not match");
        };

        for (inviteCode in server.inviteCodes.values()) {
          inviteCodeMap.remove(inviteCode);
        };

        serverMap.remove(serverId);
      };
    };
  };

  public query ({ caller }) func getServer(serverId : Text) : async ?ServerInfo {
    // Any user (including guests) can view basic server info
    serverMap.get(serverId).map(func(server) {
      { id = server.id; name = server.name; owner = server.owner; ownerPrincipal = server.ownerPrincipal };
    });
  };

  public query ({ caller }) func getServerExtended(serverId : Text) : async ?ServerInfoExtended {
    // Any user (including guests) can view extended server info for browsing
    switch (serverMap.get(serverId)) {
      case (null) { null };
      case (?server) {
        let inviteCode = switch (server.inviteCodes.toArray()[0]) {
          case (code) { code };
        };
        ?{
          id = server.id;
          name = server.name;
          owner = server.owner;
          ownerPrincipal = server.ownerPrincipal;
          branding = server.branding;
          inviteCode = inviteCode;
          memberCount = server.members.size();
        };
      };
    };
  };

  public query ({ caller }) func getAllServers() : async [ServerInfo] {
    // Any user (including guests) can browse all servers
    serverMap.values().toArray().map(func(server) {
      { id = server.id; name = server.name; owner = server.owner; ownerPrincipal = server.ownerPrincipal };
    });
  };

  public query ({ caller }) func getServerInviteCode(serverId : Text) : async ?Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view invite codes");
    };

    switch (serverMap.get(serverId)) {
      case (null) { null };
      case (?server) {
        if (not isMember(caller, serverId)) {
          Runtime.trap("Unauthorized: Only server members can view invite codes");
        };
        ?(server.inviteCodes.toArray()[0]);
      };
    };
  };

  // ----- Channel Administration -----
  public shared ({ caller }) func createChannel(serverId : Text, name : Text) : async ChannelInfo {
    if (not (AccessControl.hasPermission(
      accessControlState,
      caller,
      #user,
    ))) {
      Runtime.trap("Unauthorized: Only users can create channels");
    };

    switch (serverMap.get(serverId)) {
      case (null) {
        Runtime.trap("Server not found");
      };
      case (?server) {
        if (not hasModeratorPrivileges(caller, server)) {
          Runtime.trap("Unauthorized: Only moderators can create channels");
        };

        let channelId = name # ":" # caller.toText();
        let newChannel = {
          id = channelId;
          name;
          messages = List.empty<Message>();
          createdAt = Time.now();
        };

        server.channels.add(channelId, newChannel);

        { id = channelId; name };
      };
    };
  };
};
