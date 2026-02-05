import { useGetNewMessages, useGetServer } from '../../hooks/useQueries';
import { useViewPollingEnabled } from '../../hooks/useViewPollingEnabled';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import MessageComposer from './MessageComposer';
import MessageItem from './MessageItem';
import EmptyState from '../empty/EmptyState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';

interface ChannelTimelineProps {
  serverId: string;
  channelId: string;
}

export default function ChannelTimeline({ serverId, channelId }: ChannelTimelineProps) {
  const { identity } = useInternetIdentity();
  const pollingEnabled = useViewPollingEnabled('/servers');
  const { data: messages, isLoading } = useGetNewMessages(serverId, channelId, pollingEnabled);
  const { data: server } = useGetServer(serverId);

  const currentUserPrincipal = identity?.getPrincipal().toString();
  const isServerOwner = !!(server && currentUserPrincipal && server.owner === currentUserPrincipal);

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : messages && messages.length > 0 ? (
          <div className="space-y-4 pb-4">
            {messages.map((message, index) => {
              const isAuthor = currentUserPrincipal === message.authorPrincipal.toString();
              const canDelete = isAuthor || isServerOwner;
              return (
                <MessageItem key={`${message.id}-${index}`} message={message} canDelete={canDelete} />
              );
            })}
          </div>
        ) : (
          <EmptyState
            imageSrc="/assets/generated/empty-messages.dim_900x600.png"
            title="No messages yet"
            description="Be the first to send a message in this channel!"
          />
        )}
      </ScrollArea>
      <div className="border-t border-border p-4">
        <MessageComposer serverId={serverId} channelId={channelId} />
      </div>
    </div>
  );
}
