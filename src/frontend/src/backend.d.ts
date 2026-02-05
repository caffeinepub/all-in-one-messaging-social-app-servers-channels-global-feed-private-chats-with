import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface ProfileVisibilityStatus {
    bio: FieldVisibility;
    displayName: FieldVisibility;
    joinDate: FieldVisibility;
    avatar: FieldVisibility;
}
export interface ChannelInfo {
    id: string;
    name: string;
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
}
export interface ChannelView {
    id: string;
    messages: Array<Message>;
    name: string;
    createdAt: bigint;
}
export interface ExtendedUserProfile {
    bio: string;
    displayName: string;
    joinDate: bigint;
    displayNameVisibility: FieldVisibility;
    bioVisibility: FieldVisibility;
    avatarUrl?: string;
    avatarVisibility: FieldVisibility;
    avatarAttachment?: Attachment;
    joinDateVisibility: FieldVisibility;
}
export interface PublicUserProfile {
    bio: string;
    displayName: string;
    joinDate: bigint;
    avatarUrl?: string;
}
export interface NewServerParams {
    name: string;
}
export interface Post {
    id: string;
    content: string;
    author: string;
    imageUrl?: string;
    timestamp: bigint;
    attachments: Array<Attachment>;
    authorPrincipal: Principal;
}
export type Attachment = Uint8Array;
export interface Message {
    id: string;
    content: string;
    author: string;
    imageUrl?: string;
    timestamp: bigint;
    attachments: Array<Attachment>;
    authorPrincipal: Principal;
}
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
    createChannel(serverId: string, channelName: string): Promise<ChannelInfo>;
    createPost(content: string, attachments: Array<Attachment>, imageUrl: string | null): Promise<Post>;
    createServer(params: NewServerParams): Promise<ServerInfo>;
    deleteChannel(serverId: string, channelId: string): Promise<void>;
    deleteMessage(messageId: string): Promise<void>;
    deletePost(postId: string): Promise<void>;
    deleteServer(serverId: string): Promise<void>;
    editChannel(serverId: string, channelId: string, newName: string): Promise<void>;
    editServer(serverId: string, newName: string): Promise<void>;
    getAllChannels(serverId: string): Promise<Array<ChannelInfo>>;
    getAllServers(): Promise<Array<ServerInfo>>;
    getCallerUserProfile(): Promise<ExtendedUserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChannel(serverId: string, channelId: string): Promise<ChannelView | null>;
    getDirectMessages(otherUserPrincipal: Principal, limit: bigint): Promise<Array<Message>>;
    getLatestPosts(limit: bigint): Promise<Array<Post>>;
    getNewMessages(serverId: string, channelId: string, limit: bigint): Promise<Array<Message>>;
    getOlderDirectMessages(otherUserPrincipal: Principal, beforeTimestamp: bigint, limit: bigint): Promise<Array<Message>>;
    getOlderMessages(serverId: string, channelId: string, beforeTimestamp: bigint, limit: bigint): Promise<Array<Message>>;
    getOlderPosts(beforeTimestamp: bigint, limit: bigint): Promise<Array<Post>>;
    getProfileVisibility(user: Principal): Promise<ProfileVisibilityStatus | null>;
    getServer(serverId: string): Promise<ServerInfo | null>;
    getUserProfile(user: Principal): Promise<PublicUserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: ExtendedUserProfile): Promise<void>;
    searchUsers(searchTerm: string): Promise<Array<UserSearchResult>>;
    sendDirectMessage(recipientPrincipal: Principal, content: string, attachments: Array<Attachment>, imageUrl: string | null): Promise<Message>;
    sendMessage(serverId: string, channelId: string, content: string, attachments: Array<Attachment>, imageUrl: string | null): Promise<Message>;
    updateProfileFieldVisibility(field: string, visibility: FieldVisibility): Promise<void>;
    uploadAttachment(fileReference: ExternalBlob, fileType: string, size: bigint): Promise<Attachment>;
}
