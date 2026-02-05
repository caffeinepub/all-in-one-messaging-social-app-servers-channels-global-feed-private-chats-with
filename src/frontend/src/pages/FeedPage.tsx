import { useGetLatestPosts } from '../hooks/useQueries';
import { useViewPollingEnabled } from '../hooks/useViewPollingEnabled';
import PostComposer from '../components/feed/PostComposer';
import PostItem from '../components/feed/PostItem';
import EmptyState from '../components/empty/EmptyState';
import AuthGate from '../components/auth/AuthGate';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function FeedPage() {
  const pollingEnabled = useViewPollingEnabled('/');
  const { data: posts, isLoading } = useGetLatestPosts(pollingEnabled);

  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-4">
      <div className="container max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Global Feed</h1>
          <p className="text-muted-foreground">Share your thoughts with the community</p>
        </div>

        <AuthGate message="Sign in to create posts and join the conversation">
          <PostComposer />
        </AuthGate>

        {isLoading ? (
          <Card className="p-8 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </Card>
        ) : posts && posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map((post, index) => (
              <PostItem key={`${post.timestamp}-${index}`} post={post} />
            ))}
          </div>
        ) : (
          <EmptyState
            imageSrc="/assets/generated/empty-feed.dim_900x600.png"
            title="No posts yet"
            description="Be the first to share something with the community!"
          />
        )}
      </div>
    </div>
  );
}
