import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { POLLING_INTERVAL_ACTIVE } from '../constants/polling';
import type { Principal } from '@icp-sdk/core/principal';
import type { ExtendedUserProfile, PublicUserProfile, ServerInfo, ChannelInfo, Post, Message, Attachment, UserSearchResult, FieldVisibility } from '../backend';
import { ExternalBlob } from '../backend';

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
    },
  });
}

export function useUpdateProfileFieldVisibility() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { field: string; visibility: FieldVisibility }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.updateProfileFieldVisibility(params.field, params.visibility);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
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

export function useCreateServer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { name: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createServer({ name: params.name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
  });
}

export function useDeleteServer() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (serverId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteServer(serverId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
  });
}

// Channel Queries
export function useGetAllChannels(serverId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<ChannelInfo[]>({
    queryKey: ['channels', serverId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllChannels(serverId);
    },
    enabled: !!actor && !isFetching && !!serverId,
  });
}

export function useCreateChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { serverId: string; channelName: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createChannel(params.serverId, params.channelName);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels', variables.serverId] });
    },
  });
}

export function useEditChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { serverId: string; channelId: string; newName: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.editChannel(params.serverId, params.channelId, params.newName);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels', variables.serverId] });
    },
  });
}

export function useDeleteChannel() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { serverId: string; channelId: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteChannel(params.serverId, params.channelId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['channels', variables.serverId] });
      queryClient.invalidateQueries({ queryKey: ['messages', variables.serverId, variables.channelId] });
    },
  });
}

// Message Queries
export function useGetNewMessages(serverId: string, channelId: string, pollingEnabled: boolean) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', serverId, channelId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNewMessages(serverId, channelId, BigInt(50));
    },
    enabled: !!actor && !isFetching && !!serverId && !!channelId,
    refetchInterval: pollingEnabled ? POLLING_INTERVAL_ACTIVE : false,
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      serverId: string;
      channelId: string;
      content: string;
      attachments: Attachment[];
      imageUrl: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(
        params.serverId,
        params.channelId,
        params.content,
        params.attachments,
        params.imageUrl
      );
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
    mutationFn: async (messageId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deleteMessage(messageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      queryClient.invalidateQueries({ queryKey: ['directMessages'] });
    },
  });
}

// Post Queries
export function useGetLatestPosts(pollingEnabled: boolean) {
  const { actor, isFetching } = useActor();

  return useQuery<Post[]>({
    queryKey: ['posts'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLatestPosts(BigInt(50));
    },
    enabled: !!actor && !isFetching,
    refetchInterval: pollingEnabled ? POLLING_INTERVAL_ACTIVE : false,
  });
}

export function useCreatePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { content: string; attachments: Attachment[]; imageUrl: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createPost(params.content, params.attachments, params.imageUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

export function useDeletePost() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.deletePost(postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });
}

// Direct Message Queries
export function useGetDirectMessages(otherUserPrincipal: Principal, pollingEnabled: boolean) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['directMessages', otherUserPrincipal.toString()],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDirectMessages(otherUserPrincipal, BigInt(50));
    },
    enabled: !!actor && !isFetching && !!otherUserPrincipal,
    refetchInterval: pollingEnabled ? POLLING_INTERVAL_ACTIVE : false,
  });
}

export function useSendDirectMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      recipientPrincipal: Principal;
      content: string;
      attachments: Attachment[];
      imageUrl: string | null;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendDirectMessage(
        params.recipientPrincipal,
        params.content,
        params.attachments,
        params.imageUrl
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['directMessages', variables.recipientPrincipal.toString()] });
    },
  });
}

// Upload Attachment
export function useUploadAttachment() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (params: { fileReference: ExternalBlob; fileType: string; size: bigint }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.uploadAttachment(params.fileReference, params.fileType, params.size);
    },
  });
}
