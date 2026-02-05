import List "mo:core/List";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import AccessControl "authorization/access-control";
import Iter "mo:core/Iter";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import Migration "migration";

(with migration = Migration.run)
actor {
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

  type Server = {
    id : Text;
    name : Text;
    owner : Text;
    ownerPrincipal : Principal;
    createdAt : Int;
    channels : Map.Map<Text, Channel>;
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
  };

  public type PublicUserProfile = {
    displayName : Text;
    avatarUrl : ?Text;
    bio : Text;
    joinDate : Int;
  };

  public type ProfileVisibilityStatus = {
    displayName : FieldVisibility;
    avatar : FieldVisibility;
    bio : FieldVisibility;
    joinDate : FieldVisibility;
  };

  // Persistent storage
  let serverMap = Map.empty<Text, Server>();
  let globalFeed = List.empty<Post>();
  let userProfiles = Map.empty<Principal, ExtendedUserProfile>();
  let dmConversations = Map.empty<Text, List.List<Message>>();
  let deletedMessages = Map.empty<Text, Bool>();
  let deletedPosts = Map.empty<Text, Bool>();
  var messageCounter = 0;
  var postCounter = 0;

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  public type ServerInfo = {
    id : Text;
    name : Text;
    owner : Text;
    ownerPrincipal : Principal;
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
  };

  func getDMKey(user1 : Principal, user2 : Principal) : Text {
    let p1 = user1.toText();
    let p2 = user2.toText();
    if (Text.compare(p1, p2) == #less) {
      p1 # ":" # p2;
    } else {
      p2 # ":" # p1;
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?ExtendedUserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  // Get public or owned profile with proper field filtering
  public query ({ caller }) func getUserProfile(user : Principal) : async ?PublicUserProfile {
    let profile = switch (userProfiles.get(user)) {
      case (null) { return null };
      case (?p) { p };
    };

    ?{
      displayName = if (profile.displayNameVisibility == #publicVisibility or caller == user) {
        profile.displayName;
      } else {
        "Private";
      };
      avatarUrl = if (profile.avatarVisibility == #publicVisibility or caller == user) {
        profile.avatarUrl;
      } else {
        null;
      };
      bio = if (profile.bioVisibility == #publicVisibility or caller == user) {
        profile.bio;
      } else {
        "Private";
      };
      joinDate = if (profile.joinDateVisibility == #publicVisibility or caller == user) {
        profile.joinDate;
      } else {
        0;
      };
    };
  };

  // Get all profile visibilities (for owner's view only)
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

  public shared ({ caller }) func updateProfileFieldVisibility(field : Text, visibility : FieldVisibility) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can update profile visibility");
    };

    switch (userProfiles.get(caller)) {
      case (null) {
        Runtime.trap("User profile does not exist");
      };
      case (?profile) {
        let updatedProfile = switch (field) {
          case ("displayName") { { profile with displayNameVisibility = visibility } };
          case ("avatar") { { profile with avatarVisibility = visibility } };
          case ("bio") { { profile with bioVisibility = visibility } };
          case ("joinDate") { { profile with joinDateVisibility = visibility } };
          case (_) {
            Runtime.trap("Invalid profile field");
          };
        };
        userProfiles.add(caller, updatedProfile);
      };
    };
  };

  public query ({ caller }) func searchUsers(searchTerm : Text) : async [UserSearchResult] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can search for users");
    };

    let results = List.empty<UserSearchResult>();

    for ((principal, profile) in userProfiles.entries()) {
      if (profile.displayName.contains(#text searchTerm)) {
        results.add({
          principal = principal;
          displayName = profile.displayName;
        });
      };
    };

    results.toArray();
  };

  // Server and Channel Management
  public shared ({ caller }) func createServer(params : NewServerParams) : async ServerInfo {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create servers");
    };

    let profile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile required before creating servers") };
      case (?p) { p };
    };

    let serverId = params.name # ":" # caller.toText();
    let newServer = {
      id = serverId;
      name = params.name;
      owner = profile.displayName;
      ownerPrincipal = caller;
      createdAt = Time.now();
      channels = Map.empty<Text, Channel>();
    };

    serverMap.add(serverId, newServer);

    {
      id = serverId;
      name = params.name;
      owner = profile.displayName;
      ownerPrincipal = caller;
    };
  };

  public shared ({ caller }) func editServer(serverId : Text, newName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can edit servers");
    };

    switch (serverMap.get(serverId)) {
      case (null) { Runtime.trap("Server not found") };
      case (?server) {
        if (caller != server.ownerPrincipal) {
          Runtime.trap("Unauthorized: Only server owner can edit server");
        };

        let updatedServer = { server with name = newName };
        serverMap.add(serverId, updatedServer);
      };
    };
  };

  public shared ({ caller }) func deleteServer(serverId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete servers");
    };

    switch (serverMap.get(serverId)) {
      case (null) { Runtime.trap("Server not found") };
      case (?server) {
        if (caller != server.ownerPrincipal) {
          Runtime.trap("Unauthorized: Only server owner can delete server");
        };

        serverMap.remove(serverId);
      };
    };
  };

  public query ({ caller }) func getServer(serverId : Text) : async ?ServerInfo {
    serverMap.get(serverId).map(func(server) {
      { id = server.id; name = server.name; owner = server.owner; ownerPrincipal = server.ownerPrincipal };
    });
  };

  public query ({ caller }) func getAllServers() : async [ServerInfo] {
    serverMap.values().toArray().map(func(server) {
      { id = server.id; name = server.name; owner = server.owner; ownerPrincipal = server.ownerPrincipal };
    });
  };

  public query ({ caller }) func getAllChannels(serverId : Text) : async [ChannelInfo] {
    switch (serverMap.get(serverId)) {
      case (null) { [] };
      case (?server) {
        server.channels.values().toArray().map(func(channel) {
          { id = channel.id; name = channel.name };
        });
      };
    };
  };

  public shared ({ caller }) func createChannel(serverId : Text, channelName : Text) : async ChannelInfo {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create channels");
    };

    switch (serverMap.get(serverId)) {
      case (null) {
        Runtime.trap("Server not found");
      };
      case (?server) {
        if (caller != server.ownerPrincipal) {
          Runtime.trap("Unauthorized: Only server owner can create channels");
        };

        let channelId = channelName # ":" # serverId;
        let newChannel = {
          id = channelId;
          name = channelName;
          messages = List.empty<Message>();
          createdAt = Time.now();
        };

        server.channels.add(channelId, newChannel);
        serverMap.add(serverId, server);

        {
          id = channelId;
          name = channelName;
        };
      };
    };
  };

  public shared ({ caller }) func editChannel(serverId : Text, channelId : Text, newName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can edit channels");
    };

    switch (serverMap.get(serverId)) {
      case (null) { Runtime.trap("Server not found") };
      case (?server) {
        if (caller != server.ownerPrincipal) {
          Runtime.trap("Unauthorized: Only server owner can edit channels");
        };

        switch (server.channels.get(channelId)) {
          case (null) { Runtime.trap("Channel not found") };
          case (?channel) {
            let updatedChannel = { channel with name = newName };
            server.channels.add(channelId, updatedChannel);
            serverMap.add(serverId, server);
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteChannel(serverId : Text, channelId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete channels");
    };

    switch (serverMap.get(serverId)) {
      case (null) { Runtime.trap("Server not found") };
      case (?server) {
        if (caller != server.ownerPrincipal) {
          Runtime.trap("Unauthorized: Only server owner can delete channels");
        };

        server.channels.remove(channelId);
        serverMap.add(serverId, server);
      };
    };
  };

  func channelToChannelView(channel : Channel) : ChannelView {
    let filteredMessages = channel.messages.filter(
      func(msg) { not isMessageDeleted(msg.id) }
    );
    {
      id = channel.id;
      name = channel.name;
      messages = filteredMessages.toArray();
      createdAt = channel.createdAt;
    };
  };

  public query ({ caller }) func getChannel(serverId : Text, channelId : Text) : async ?ChannelView {
    switch (serverMap.get(serverId)) {
      case (null) { null };
      case (?server) {
        switch (server.channels.get(channelId)) {
          case (null) { null };
          case (?channel) {
            ?channelToChannelView(channel);
          };
        };
      };
    };
  };

  public query ({ caller }) func getNewMessages(serverId : Text, channelId : Text, limit : Nat) : async [Message] {
    switch (serverMap.get(serverId)) {
      case (null) { Runtime.trap("Server not found") };
      case (?server) {
        switch (server.channels.get(channelId)) {
          case (null) { Runtime.trap("Channel not found") };
          case (?channel) {
            let filteredMessages = channel.messages.filter(
              func(msg) { not isMessageDeleted(msg.id) }
            );
            let messages = filteredMessages.toArray();
            let totalMessages = messages.size();
            if (totalMessages <= limit) { return messages };
            Array.tabulate<Message>(limit, func(i) { messages[i] });
          };
        };
      };
    };
  };

  public query ({ caller }) func getOlderMessages(serverId : Text, channelId : Text, beforeTimestamp : Int, limit : Nat) : async [Message] {
    switch (serverMap.get(serverId)) {
      case (null) { Runtime.trap("Server not found") };
      case (?server) {
        switch (server.channels.get(channelId)) {
          case (null) { Runtime.trap("Channel not found") };
          case (?channel) {
            let filteredMessages = channel.messages.filter(
              func(msg) { msg.timestamp < beforeTimestamp and not isMessageDeleted(msg.id) }
            );
            let messages = filteredMessages.toArray();
            if (messages.size() <= limit) {
              return messages;
            };
            Array.tabulate<Message>(limit, func(i) { messages[i] });
          };
        };
      };
    };
  };

  public query ({ caller }) func getDirectMessages(otherUserPrincipal : Principal, limit : Nat) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view direct messages");
    };

    let dmKey = getDMKey(caller, otherUserPrincipal);
    switch (dmConversations.get(dmKey)) {
      case (null) { [] };
      case (?conversation) {
        let filteredMessages = conversation.filter(
          func(msg) { not isMessageDeleted(msg.id) }
        );
        let messages = filteredMessages.toArray();
        let totalMessages = messages.size();
        if (totalMessages <= limit) {
          return messages;
        };
        Array.tabulate<Message>(limit, func(i) { messages[i] });
      };
    };
  };

  public query ({ caller }) func getOlderDirectMessages(otherUserPrincipal : Principal, beforeTimestamp : Int, limit : Nat) : async [Message] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view direct messages");
    };

    let dmKey = getDMKey(caller, otherUserPrincipal);
    switch (dmConversations.get(dmKey)) {
      case (null) { [] };
      case (?conversation) {
        let filteredMessages = conversation.filter(
          func(msg) { msg.timestamp < beforeTimestamp and not isMessageDeleted(msg.id) }
        );
        let messages = filteredMessages.toArray();
        if (messages.size() <= limit) {
          return messages;
        };
        Array.tabulate<Message>(limit, func(i) { messages[i] });
      };
    };
  };

  public shared ({ caller }) func sendMessage(serverId : Text, channelId : Text, content : Text, attachments : [Attachment], imageUrl : ?Text) : async Message {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send messages");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile required before sending messages") };
      case (?_) {};
    };

    switch (serverMap.get(serverId)) {
      case (null) { Runtime.trap("Server not found") };
      case (?server) {
        switch (server.channels.get(channelId)) {
          case (null) { Runtime.trap("Channel not found") };
          case (?channel) {
            let newMessage = {
              id = channelId # "msg" # serverId # "_" # messageCounter.toText();
              author = caller.toText();
              authorPrincipal = caller;
              content;
              timestamp = Time.now();
              attachments;
              imageUrl;
            };
            messageCounter += 1;
            channel.messages.add(newMessage);
            server.channels.add(channelId, channel);
            serverMap.add(serverId, server);
            newMessage;
          };
        };
      };
    };
  };

  public shared ({ caller }) func sendDirectMessage(
    recipientPrincipal : Principal,
    content : Text,
    attachments : [Attachment],
    imageUrl : ?Text,
  ) : async Message {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can send direct messages");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile required before sending messages") };
      case (?_) {};
    };

    // Verify recipient exists
    switch (userProfiles.get(recipientPrincipal)) {
      case (null) { Runtime.trap("Recipient user not found") };
      case (?_) {};
    };

    let dmKey = getDMKey(caller, recipientPrincipal);
    let conversation = switch (dmConversations.get(dmKey)) {
      case (null) { List.empty<Message>() };
      case (?conv) { conv };
    };

    let newMessage = {
      id = dmKey # "_" # messageCounter.toText();
      author = caller.toText();
      authorPrincipal = caller;
      content;
      timestamp = Time.now();
      attachments;
      imageUrl;
    };

    conversation.add(newMessage);
    dmConversations.add(dmKey, conversation);
    messageCounter += 1;
    newMessage;
  };

  public shared ({ caller }) func createPost(content : Text, attachments : [Attachment], imageUrl : ?Text) : async Post {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can create posts");
    };

    switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User profile required before creating posts") };
      case (?_) {};
    };

    let newPost = {
      id = "post" # postCounter.toText();
      author = caller.toText();
      authorPrincipal = caller;
      content;
      timestamp = Time.now();
      attachments;
      imageUrl;
    };

    globalFeed.add(newPost);
    postCounter += 1;
    newPost;
  };

  public query ({ caller }) func getLatestPosts(limit : Nat) : async [Post] {
    let filteredPosts = globalFeed.filter(
      func(post) { not isPostDeleted(post.id) }
    );
    let posts = filteredPosts.toArray();
    let totalPosts = posts.size();
    if (totalPosts <= limit) {
      return posts;
    };
    Array.tabulate<Post>(limit, func(i) { posts[i] });
  };

  public query ({ caller }) func getOlderPosts(beforeTimestamp : Int, limit : Nat) : async [Post] {
    let filteredPosts = globalFeed.filter(
      func(post) { post.timestamp < beforeTimestamp and not isPostDeleted(post.id) }
    );
    let posts = filteredPosts.toArray();
    if (posts.size() <= limit) {
      return posts;
    };
    Array.tabulate<Post>(limit, func(i) { posts[i] });
  };

  public shared ({ caller }) func uploadAttachment(fileReference : Storage.ExternalBlob, fileType : Text, size : Nat) : async Attachment {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can upload attachments");
    };
    let maxSize = 10_000_000;
    if (size > maxSize) {
      Runtime.trap("File size exceeds maximum allowed size of 10MB");
    };
    fileReference;
  };

  // Global Deletion
  public shared ({ caller }) func deleteMessage(messageId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete messages");
    };

    let messageToDelete = findMessageById(messageId);
    switch (messageToDelete) {
      case (null) { Runtime.trap("Message does not exist") };
      case (?message) {
        // Check if caller is the author
        if (caller == message.authorPrincipal) {
          deletedMessages.add(messageId, true);
          return;
        };

        // Check if caller is the server owner (for channel messages only)
        let serverOwner = findServerOwnerForMessage(messageId);
        switch (serverOwner) {
          case (?ownerPrincipal) {
            if (caller == ownerPrincipal) {
              deletedMessages.add(messageId, true);
              return;
            };
          };
          case (null) {};
        };

        Runtime.trap("Unauthorized: Only message author or server owner can delete this message");
      };
    };
  };

  public shared ({ caller }) func deletePost(postId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can delete posts");
    };

    let postToDelete = findPostById(postId);
    switch (postToDelete) {
      case (null) { Runtime.trap("Post does not exist") };
      case (?post) {
        if (caller == post.authorPrincipal) {
          deletedPosts.add(postId, true);
        } else {
          Runtime.trap("Unauthorized: Only post author can delete this post");
        };
      };
    };
  };

  func findMessageById(messageId : Text) : ?Message {
    for ((_, server) in serverMap.entries()) {
      for ((_, channel) in server.channels.entries()) {
        let messages = channel.messages.toArray();
        for (message in messages.values()) {
          if (message.id == messageId) {
            return ?message;
          };
        };
      };
    };
    for ((_, conversation) in dmConversations.entries()) {
      let messages = conversation.toArray();
      for (message in messages.values()) {
        if (message.id == messageId) {
          return ?message;
        };
      };
    };
    null;
  };

  func findPostById(postId : Text) : ?Post {
    let posts = globalFeed.toArray();
    for (post in posts.values()) {
      if (post.id == postId) {
        return ?post;
      };
    };
    null;
  };

  func findServerOwnerForMessage(messageId : Text) : ?Principal {
    for ((_, server) in serverMap.entries()) {
      for ((_, channel) in server.channels.entries()) {
        let messages = channel.messages.toArray();
        for (message in messages.values()) {
          if (message.id == messageId) {
            return ?server.ownerPrincipal;
          };
        };
      };
    };
    null;
  };

  func isMessageDeleted(messageId : Text) : Bool {
    switch (deletedMessages.get(messageId)) {
      case (null) { false };
      case (?_) { true };
    };
  };

  func isPostDeleted(postId : Text) : Bool {
    switch (deletedPosts.get(postId)) {
      case (null) { false };
      case (?_) { true };
    };
  };
};
