import { useGetUserProfile } from '../../hooks/useQueries';
import UserAvatar from '../profile/UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Principal } from '@icp-sdk/core/principal';
import type { Message } from '../../backend';

interface DmThreadListProps {
  threads: [Principal, Message][];
  selectedPrincipal: Principal | null;
  onSelectThread: (principal: Principal) => void;
}

function ThreadItem({
  otherUser,
  lastMessage,
  isSelected,
  onSelect,
}: {
  otherUser: Principal;
  lastMessage: Message;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const { data: profile } = useGetUserProfile(otherUser);
  const displayName = profile?.displayName || 'User';

  const timestamp = new Date(Number(lastMessage.timestamp) / 1_000_000);
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left p-3 rounded-lg transition-colors',
        isSelected ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
      )}
    >
      <div className="flex items-center gap-3">
        <UserAvatar displayName={displayName} profile={profile} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{displayName}</p>
          <p className="text-sm opacity-70 truncate">{lastMessage.content || 'Attachment'}</p>
          <p className="text-xs opacity-60">{timeAgo}</p>
        </div>
      </div>
    </button>
  );
}

export default function DmThreadList({ threads, selectedPrincipal, onSelectThread }: DmThreadListProps) {
  if (threads.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-4">No conversations yet</p>;
  }

  return (
    <div className="space-y-2">
      {threads.map(([otherUser, lastMessage]) => (
        <ThreadItem
          key={otherUser.toString()}
          otherUser={otherUser}
          lastMessage={lastMessage}
          isSelected={selectedPrincipal?.toString() === otherUser.toString()}
          onSelect={() => onSelectThread(otherUser)}
        />
      ))}
    </div>
  );
}
