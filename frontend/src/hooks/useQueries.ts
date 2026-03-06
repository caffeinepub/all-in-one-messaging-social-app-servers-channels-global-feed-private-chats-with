import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { POLLING_INTERVAL_ACTIVE } from '../constants/polling';
import type { Principal } from '@icp-sdk/core/principal';
import type { ExtendedUserProfile, PublicUserProfile, ServerInfo, ServerInfoExtended, Attachment, UserSearchResult, FieldVisibility, ProfileVisibilityStatus, ServerBranding } from '../backend';
import { ExternalBlob } from '../backend';
import { toast } from 'sonner';

// Local type definitions for types not exported by backend
export interface Message {
  id: string;
  author: string;
  authorPrincipal: Principal;
  content: string;
  timestamp: bigint;
  attachments: Array<Attachment>;
  imageUrl?: string;
}

export interface Post {
  id: string;
  author: string;
  authorPrincipal: Principal;
  content: string;
  timestamp: bigint;
  attachments: Array<Attachment>;
  imageUrl?: string;
}

export interface ChannelInfo {
  id: string;
  name: string;
}

export interface DMThreadSummary {
  otherUser: Principal;
  lastMessageTimestamp: bigint;
}

export interface ServerMember {
  principal: Principal;
  displayName: string;
  role: 'Owner' | 'Moderator' | 'Member';
  joinedAt: bigint;
}

export interface ServerBan {
  principal: Principal;
  bannedBy: Principal;
  banTimestamp: bigint;
  reason?: string;
}

export type ServerRole = 'Owner' | 'Moderator' | 'Member';

// User Profile Queries
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<ExtendedUserProfile | null>({
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

export function useGetUserProfile(user: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<PublicUserProfile | null>({
    queryKey: ['userProfile', user.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getUserProfile(user);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetProfileVisibility(user: Principal) {
  const { actor, isFetching } = useActor();

  return useQuery<ProfileVisibilityStatus | null>({
    queryKey: ['profileVisibility', user.toString()],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getProfileVisibility(user);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: ExtendedUserProfile) => {
      if (!actor) throw new Error('Actor not available');
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profileVisibility'] });
    },
  });
}

export function useUpdateProfileFieldVisibility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { field: string; visibility: FieldVisibility; value?: bigint | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProfileFieldVisibility(params.field, params.value || null, params.visibility);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      queryClient.invalidateQueries({ queryKey: ['profileVisibility'] });
    },
  });
}

export function useSearchUsers(searchTerm: string) {
  const { actor, isFetching } = useActor();

  return useQuery<UserSearchResult[]>({
    queryKey: ['searchUsers', searchTerm],
    queryFn: async () => {
      if (!actor) return [];
      return actor.searchUsers(searchTerm);
    },
    enabled: !!actor && !isFetching && searchTerm.trim().length > 0,
  });
}

// Verified User Query - using dedicated backend API
export function useCheckVerificationStatus(principal: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['verificationStatus', principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return false;
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.checkVerificationStatus(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
    staleTime: 5 * 60 * 1000,
  });
}

// Caller Admin Check - using dedicated backend API
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ['callerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 5 * 60 * 1000,
  });
}

// Server Queries
export function useGetAllServers() {
  const { actor, isFetching } = useActor();

  return useQuery<ServerInfo[]>({
    queryKey: ['servers'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllServers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetServer(serverId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ServerInfo | null>({
    queryKey: ['server', serverId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getServer(serverId);
    },
    enabled: !!actor && !isFetching && !!serverId,
  });
}

export function useGetServerExtended(serverId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ServerInfoExtended | null>({
    queryKey: ['serverExtended', serverId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getServerExtended(serverId);
    },
    enabled: !!actor && !isFetching && !!serverId,
  });
}

export function useGetServerInviteCode(serverId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<string | null>({
    queryKey: ['serverInviteCode', serverId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getServerInviteCode(serverId);
    },
    enabled: !!actor && !isFetching && !!serverId,
  });
}

export function useGetServerMembers(serverId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ServerMember[]>({
    queryKey: ['serverMembers', serverId],
    queryFn: async () => {
      if (!actor) return [];
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.getServerMembers(serverId);
    },
    enabled: !!actor && !isFetching && !!serverId,
  });
}

export function useGetServerBans(serverId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ServerBan[]>({
    queryKey: ['serverBans', serverId],
    queryFn: async () => {
      if (!actor) return [];
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.getServerBans(serverId);
    },
    enabled: !!actor && !isFetching && !!serverId,
  });
}

export function useGetCallerServerRole(serverId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ServerRole | null>({
    queryKey: ['callerServerRole', serverId],
    queryFn: async () => {
      if (!actor) return null;
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.getCallerServerRole(serverId);
    },
    enabled: !!actor && !isFetching && !!serverId,
  });
}

export function useCreateServer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createServer(params);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success('Server created successfully!');
    },
  });
}

export function useEditServer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { serverId: string; newName: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editServer(params.serverId, params.newName);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['server', variables.serverId] });
      queryClient.invalidateQueries({ queryKey: ['serverExtended', variables.serverId] });
      toast.success('Server updated successfully!');
    },
  });
}

export function useDeleteServer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { serverId: string; confirmationName: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteServer(params.serverId, params.confirmationName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success('Server deleted successfully');
    },
  });
}

export function useJoinServerByInvite() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.joinServerByInvite(inviteCode);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success('Successfully joined server!');
    },
  });
}

export function useJoinServerById() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serverId: string) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.joinServerById(serverId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast.success('Successfully joined server!');
    },
  });
}

export function useKickMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { serverId: string; memberPrincipal: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.kickMember(params.serverId, params.memberPrincipal);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serverMembers', variables.serverId] });
      queryClient.invalidateQueries({ queryKey: ['serverExtended', variables.serverId] });
    },
  });
}

export function useBanMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { serverId: string; memberPrincipal: Principal; reason?: string }) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.banMember(params.serverId, params.memberPrincipal, params.reason);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serverMembers', variables.serverId] });
      queryClient.invalidateQueries({ queryKey: ['serverBans', variables.serverId] });
      queryClient.invalidateQueries({ queryKey: ['serverExtended', variables.serverId] });
    },
  });
}

export function useUnbanMember() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { serverId: string; memberPrincipal: Principal }) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.unbanMember(params.serverId, params.memberPrincipal);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serverBans', variables.serverId] });
    },
  });
}

export function useUpdateServerBranding() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { serverId: string; branding: ServerBranding }) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.updateServerBranding(params.serverId, params.branding);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['serverExtended', variables.serverId] });
      toast.success('Server branding updated!');
    },
  });
}

// Channel Queries
export function useGetChannels(serverId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ChannelInfo[]>({
    queryKey: ['channels', serverId],
    queryFn: async () => {
      if (!actor) return [];
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.getChannels(serverId);
    },
    enabled: !!actor && !isFetching && !!serverId,
  });
}

export function useCreateChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { serverId: string; name: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createChannel(params.serverId, params.name);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels', variables.serverId] });
      toast.success('Channel created successfully!');
    },
  });
}

export function useEditChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { serverId: string; channelId: string; newName: string }) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.editChannel(params.serverId, params.channelId, params.newName);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels', variables.serverId] });
      toast.success('Channel updated successfully!');
    },
  });
}

export function useDeleteChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { serverId: string; channelId: string }) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.deleteChannel(params.serverId, params.channelId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels', variables.serverId] });
      toast.success('Channel deleted successfully');
    },
  });
}

// Message Queries
export function useGetMessages(serverId: string, channelId: string, pollingEnabled: boolean) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', serverId, channelId],
    queryFn: async () => {
      if (!actor) return [];
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.getMessages(serverId, channelId);
    },
    enabled: !!actor && !isFetching && !!serverId && !!channelId,
    refetchInterval: pollingEnabled ? POLLING_INTERVAL_ACTIVE : false,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { serverId: string; channelId: string; content: string; attachments: Attachment[]; imageUrl?: string }) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.sendMessage(params.serverId, params.channelId, params.content, params.attachments, params.imageUrl || null);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.serverId, variables.channelId] });
    },
  });
}

export function useDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { serverId: string; channelId: string; messageId: string }) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.deleteMessage(params.serverId, params.channelId, params.messageId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.serverId, variables.channelId] });
    },
  });
}

// Feed Queries
export function useGetGlobalFeed(pollingEnabled: boolean) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['globalFeed'],
    queryFn: async () => {
      if (!actor) return [];
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.getGlobalFeed();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: pollingEnabled ? POLLING_INTERVAL_ACTIVE : false,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { content: string; attachments: Attachment[]; imageUrl?: string }) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.createPost(params.content, params.attachments, params.imageUrl || null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalFeed'] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['globalFeed'] });
    },
  });
}

// DM Queries
export function useGetDMThreads() {
  const { actor, isFetching } = useActor();

  return useQuery<DMThreadSummary[]>({
    queryKey: ['dmThreads'],
    queryFn: async () => {
      if (!actor) return [];
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.getDMThreads();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDMMessages(otherUser: Principal, pollingEnabled: boolean) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['dmMessages', otherUser.toString()],
    queryFn: async () => {
      if (!actor) return [];
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.getDMMessages(otherUser);
    },
    enabled: !!actor && !isFetching && !!otherUser,
    refetchInterval: pollingEnabled ? POLLING_INTERVAL_ACTIVE : false,
  });
}

export function useSendDM() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { recipient: Principal; content: string; attachments: Attachment[]; imageUrl?: string }) => {
      if (!actor) throw new Error('Actor not available');
      // @ts-ignore - method exists in actual backend but not in type definition
      return actor.sendDM(params.recipient, params.content, params.attachments, params.imageUrl || null);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['dmMessages', variables.recipient.toString()] });
      queryClient.invalidateQueries({ queryKey: ['dmThreads'] });
    },
  });
}
