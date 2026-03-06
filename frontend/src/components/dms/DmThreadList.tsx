import { useGetDMThreads, useGetUserProfile, useCheckVerificationStatus } from '../../hooks/useQueries';
import type { DMThreadSummary } from '../../hooks/useQueries';
import { ScrollArea } from '@/components/ui/scroll-area';
import UserAvatar from '../profile/UserAvatar';
import ProfilePopover from '../profile/ProfilePopover';
import ModeratorVisualTreatment from '../users/ModeratorVisualTreatment';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Principal } from '@icp-sdk/core/principal';

interface DmThreadListProps {
  selectedUserPrincipal: Principal | null;
  onSelectThread: (userPrincipal: Principal) => void;
}

export default function DmThreadList({ selectedUserPrincipal, onSelectThread }: DmThreadListProps) {
  const { data: threads } = useGetDMThreads();

  if (!threads || threads.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        No conversations yet
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {threads.map((thread) => (
          <DmThreadItem
            key={thread.otherUser.toString()}
            thread={thread}
            isSelected={selectedUserPrincipal?.toString() === thread.otherUser.toString()}
            onSelect={() => onSelectThread(thread.otherUser)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

interface DmThreadItemProps {
  thread: DMThreadSummary;
  isSelected: boolean;
  onSelect: () => void;
}

function DmThreadItem({ thread, isSelected, onSelect }: DmThreadItemProps) {
  const { data: userProfile } = useGetUserProfile(thread.otherUser);
  const { data: isVerified } = useCheckVerificationStatus(thread.otherUser);
  const displayName = userProfile?.displayName || 'Anonymous';

  const timestamp = new Date(Number(thread.lastMessageTimestamp) / 1_000_000);
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full rounded-lg transition-colors flex items-center gap-3 p-3',
        isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
      )}
    >
      <ProfilePopover userPrincipal={thread.otherUser} displayName={displayName}>
        <div>
          <UserAvatar displayName={displayName} profile={userProfile} className="h-10 w-10" />
        </div>
      </ProfilePopover>
      <div className="flex-1 min-w-0 text-left">
        <ProfilePopover userPrincipal={thread.otherUser} displayName={displayName}>
          <div className="hover:underline">
            <ModeratorVisualTreatment
              displayName={displayName}
              isVerified={!!isVerified}
              userPrincipal={thread.otherUser}
              className="text-sm font-medium"
              showLabel={false}
            />
          </div>
        </ProfilePopover>
        <p className="text-xs opacity-70 truncate">{timeAgo}</p>
      </div>
    </button>
  );
}
