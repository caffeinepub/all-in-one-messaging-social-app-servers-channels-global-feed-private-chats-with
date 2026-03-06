import { Button } from '@/components/ui/button';
import { useGetUserProfile, useCheckVerificationStatus } from '../../hooks/useQueries';
import type { Message } from '../../hooks/useQueries';
import UserAvatar from '../profile/UserAvatar';
import ProfilePopover from '../profile/ProfilePopover';
import MentionText from '../text/MentionText';
import ModeratorVisualTreatment from '../users/ModeratorVisualTreatment';
import OnlineStatusIndicator from '../users/OnlineStatusIndicator';
import { formatDistanceToNow } from 'date-fns';
import { ExternalBlob } from '../../backend';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface MessageItemProps {
  message: Message;
  canDelete?: boolean;
  serverId?: string;
  channelId?: string;
}

export default function MessageItem({ message, canDelete = false, serverId, channelId }: MessageItemProps) {
  const { data: authorProfile } = useGetUserProfile(message.authorPrincipal);
  const { data: isVerified } = useCheckVerificationStatus(message.authorPrincipal);
  const displayName = authorProfile?.displayName || 'Anonymous';

  const timestamp = new Date(Number(message.timestamp) / 1_000_000);
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

  const handleDelete = async () => {
    // Note: Delete functionality requires backend implementation
    // For now, just show a message
    toast.error('Message deletion is not yet implemented in the backend');
  };

  return (
    <div className="flex gap-3 group">
      <ProfilePopover userPrincipal={message.authorPrincipal} displayName={displayName}>
        <button className="shrink-0 relative">
          <UserAvatar displayName={displayName} profile={authorProfile} className="h-10 w-10" />
          <OnlineStatusIndicator userPrincipal={message.authorPrincipal} />
        </button>
      </ProfilePopover>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-baseline gap-2">
          <ProfilePopover userPrincipal={message.authorPrincipal} displayName={displayName}>
            <button className="hover:underline">
              <ModeratorVisualTreatment
                displayName={displayName}
                isVerified={!!isVerified}
                userPrincipal={message.authorPrincipal}
                className="text-sm"
                showLabel={false}
              />
            </button>
          </ProfilePopover>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {canDelete && serverId && channelId && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words">
            <MentionText content={message.content} />
          </p>
        )}
        {message.imageUrl && (
          <img
            src={message.imageUrl}
            alt="Message image"
            className="rounded-lg w-full object-cover max-h-64"
          />
        )}
        {message.attachments && message.attachments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {message.attachments.map((attachment, index) => {
              const buffer = new ArrayBuffer(attachment.byteLength);
              const uint8Array = new Uint8Array(buffer);
              uint8Array.set(new Uint8Array(attachment));
              const blob = ExternalBlob.fromBytes(uint8Array);
              const url = blob.getDirectURL();
              return (
                <img
                  key={index}
                  src={url}
                  alt={`Attachment ${index + 1}`}
                  className="rounded-lg w-full object-cover max-h-64"
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
