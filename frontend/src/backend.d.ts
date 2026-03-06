import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ProfileVisibilityStatus {
    bio: FieldVisibility;
    displayName: FieldVisibility;
    joinDate: FieldVisibility;
    links: Array<FieldVisibility>;
    pronouns: FieldVisibility;
    avatar: FieldVisibility;
}
export interface ServerBranding {
    topic: string;
    icon?: string;
    banner?: string;
    description: string;
    bannerAttachment?: Attachment;
    iconAttachment?: Attachment;
}
export interface ChannelInfo {
    id: string;
    name: string;
}
export interface ServerInfoExtended {
    id: string;
    owner: string;
    ownerPrincipal: Principal;
    name: string;
    memberCount: bigint;
    inviteCode: string;
    branding: ServerBranding;
}
export interface ServerInfo {
    id: string;
    owner: string;
    ownerPrincipal: Principal;
    name: string;
}
export interface UserSearchResult {
    principal: Principal;
    displayName: string;
    isAdmin: boolean;
}
export interface ExtendedUserProfile {
    bio: string;
    displayName: string;
    joinDate: bigint;
    displayNameVisibility: FieldVisibility;
    bioVisibility: FieldVisibility;
    linksVisibilities: Array<FieldVisibility>;
    links: Array<string>;
    pronouns?: string;
    avatarUrl?: string;
    avatarVisibility: FieldVisibility;
    avatarAttachment?: Attachment;
    joinDateVisibility: FieldVisibility;
    pronounsVisibility: FieldVisibility;
}
export interface PublicUserProfile {
    bio: string;
    displayName: string;
    joinDate: bigint;
    links: Array<string>;
    pronouns?: string;
    avatarUrl?: string;
}
export interface NewServerParams {
    name: string;
}
export type Attachment = Uint8Array;
export enum FieldVisibility {
    privateVisibility = "privateVisibility",
    publicVisibility = "publicVisibility"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createChannel(serverId: string, name: string): Promise<ChannelInfo>;
    createServer(params: NewServerParams): Promise<ServerInfo>;
    deleteServer(serverId: string, confirmationName: string): Promise<void>;
    editServer(serverId: string, newName: string): Promise<void>;
    getAllServers(): Promise<Array<ServerInfo>>;
    getCallerUserProfile(): Promise<ExtendedUserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getProfileVisibility(user: Principal): Promise<ProfileVisibilityStatus | null>;
    getServer(serverId: string): Promise<ServerInfo | null>;
    getServerExtended(serverId: string): Promise<ServerInfoExtended | null>;
    getServerInviteCode(serverId: string): Promise<string | null>;
    getUserProfile(user: Principal): Promise<PublicUserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: ExtendedUserProfile): Promise<void>;
    searchUsers(searchTerm: string): Promise<Array<UserSearchResult>>;
    updateProfileFieldVisibility(field: string, value: bigint | null, visibility: FieldVisibility): Promise<void>;
}
