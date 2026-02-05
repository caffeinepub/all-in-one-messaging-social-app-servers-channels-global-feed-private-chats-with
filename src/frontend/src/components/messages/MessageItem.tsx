import { Button } from '@/components/ui/button';
import { useGetUserProfile, useDeleteMessage } from '../../hooks/useQueries';
import UserAvatar from '../profile/UserAvatar';
import ProfilePopover from '../profile/ProfilePopover';
import { formatDistanceToNow } from 'date-fns';
import type { Message } from '../../backend';
import { ExternalBlob } from '../../backend';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface MessageItemProps {
  message: Message;
  canDelete?: boolean;
}

export default function MessageItem({ message, canDelete = false }: MessageItemProps) {
  const { data: authorProfile } = useGetUserProfile(message.authorPrincipal);
  const deleteMessage = useDeleteMessage();
  const displayName = authorProfile?.displayName || message.author || 'Anonymous';

  const timestamp = new Date(Number(message.timestamp) / 1_000_000);
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await deleteMessage.mutateAsync(message.id);
      toast.success('Message deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete message');
    }
  };

  return (
    <div className="flex gap-3 group">
      <ProfilePopover userPrincipal={message.authorPrincipal} displayName={displayName}>
        <button className="flex-shrink-0">
          <UserAvatar displayName={displayName} profile={authorProfile} className="h-10 w-10" />
        </button>
      </ProfilePopover>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-baseline gap-2">
          <ProfilePopover userPrincipal={message.authorPrincipal} displayName={displayName}>
            <button className="font-semibold text-sm hover:underline">{displayName}</button>
          </ProfilePopover>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deleteMessage.isPending}
              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
        {message.content && <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>}
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
