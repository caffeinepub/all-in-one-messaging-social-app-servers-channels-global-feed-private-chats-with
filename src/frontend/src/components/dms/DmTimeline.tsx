import { useGetDirectMessages } from '../../hooks/useQueries';
import { useViewPollingEnabled } from '../../hooks/useViewPollingEnabled';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import DmComposer from './DmComposer';
import MessageItem from '../messages/MessageItem';
import EmptyState from '../empty/EmptyState';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import type { Principal } from '@icp-sdk/core/principal';

interface DmTimelineProps {
  otherUserPrincipal: Principal;
}

export default function DmTimeline({ otherUserPrincipal }: DmTimelineProps) {
  const { identity } = useInternetIdentity();
  const pollingEnabled = useViewPollingEnabled('/messages');
  const { data: messages, isLoading } = useGetDirectMessages(otherUserPrincipal, pollingEnabled);

  const currentUserPrincipal = identity?.getPrincipal().toString();

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
              return (
                <MessageItem key={`${message.id}-${index}`} message={message} canDelete={isAuthor} />
              );
            })}
          </div>
        ) : (
          <EmptyState
            imageSrc="/assets/generated/empty-messages.dim_900x600.png"
            title="No messages yet"
            description="Start the conversation by sending a message!"
          />
        )}
      </ScrollArea>
      <div className="border-t border-border p-4">
        <DmComposer recipientPrincipal={otherUserPrincipal} />
      </div>
    </div>
  );
}
