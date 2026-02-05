import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetUserProfile, useDeletePost } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import UserAvatar from '../profile/UserAvatar';
import ProfilePopover from '../profile/ProfilePopover';
import { formatDistanceToNow } from 'date-fns';
import type { Post } from '../../backend';
import { ExternalBlob } from '../../backend';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface PostItemProps {
  post: Post;
}

export default function PostItem({ post }: PostItemProps) {
  const { identity } = useInternetIdentity();
  const { data: authorProfile } = useGetUserProfile(post.authorPrincipal);
  const deletePost = useDeletePost();
  const displayName = authorProfile?.displayName || post.author || 'Anonymous';

  const timestamp = new Date(Number(post.timestamp) / 1_000_000);
  const timeAgo = formatDistanceToNow(timestamp, { addSuffix: true });

  const isAuthor = identity && identity.getPrincipal().toString() === post.authorPrincipal.toString();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;

    try {
      await deletePost.mutateAsync(post.id);
      toast.success('Post deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete post');
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <ProfilePopover userPrincipal={post.authorPrincipal} displayName={displayName}>
            <button>
              <UserAvatar displayName={displayName} profile={authorProfile} />
            </button>
          </ProfilePopover>
          <div className="flex-1 min-w-0">
            <ProfilePopover userPrincipal={post.authorPrincipal} displayName={displayName}>
              <button className="font-semibold truncate hover:underline block text-left">
                {displayName}
              </button>
            </ProfilePopover>
            <p className="text-sm text-muted-foreground">{timeAgo}</p>
          </div>
          {isAuthor && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={deletePost.isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {post.content && <p className="whitespace-pre-wrap break-words">{post.content}</p>}
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt="Post image"
            className="rounded-lg w-full object-cover max-h-96"
          />
        )}
        {post.attachments && post.attachments.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {post.attachments.map((attachment, index) => {
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
                  className="rounded-lg w-full object-cover max-h-96"
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
