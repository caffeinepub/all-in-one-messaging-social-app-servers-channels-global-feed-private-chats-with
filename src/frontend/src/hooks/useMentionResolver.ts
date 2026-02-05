import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Principal } from '@icp-sdk/core/principal';

export function useMentionResolver(displayName: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Principal | null>({
    queryKey: ['resolveMention', displayName],
    queryFn: async () => {
      if (!actor || !displayName) return null;
      const results = await actor.searchUsers(displayName);
      const exactMatch = results.find(r => r.displayName === displayName);
      return exactMatch?.principal || null;
    },
    enabled: !!actor && !isFetching && !!displayName,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
