import { useState } from 'react';
import { useCreatePost } from '../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AttachmentUploader from '../media/AttachmentUploader';
import AttachmentPreview from '../media/AttachmentPreview';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import type { Attachment } from '../../backend';

export default function PostComposer() {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [mediaMode, setMediaMode] = useState<'upload' | 'url'>('upload');
  const createPost = useCreatePost();

  const hasContent = content.trim().length > 0 || attachments.length > 0 || imageUrl.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasContent) {
      toast.error('Please add some content or media');
      return;
    }

    try {
      await createPost.mutateAsync({
        content: content.trim(),
        attachments: mediaMode === 'upload' ? attachments : [],
        imageUrl: mediaMode === 'url' && imageUrl.trim() ? imageUrl.trim() : undefined,
      });
      setContent('');
      setAttachments([]);
      setImageUrl('');
      toast.success('Post created!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create post');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Create a Post</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            className="min-h-24 resize-none"
          />
          
          <div className="space-y-2">
            <Label>Add Media (optional)</Label>
            <Tabs value={mediaMode} onValueChange={(v) => setMediaMode(v as 'upload' | 'url')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="url">URL</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="space-y-2">
                <AttachmentUploader onUpload={(attachment) => setAttachments([...attachments, attachment])} />
                {attachments.length > 0 && (
                  <AttachmentPreview
                    attachments={attachments}
                    onRemove={(index) => setAttachments(attachments.filter((_, i) => i !== index))}
                  />
                )}
              </TabsContent>
              <TabsContent value="url" className="space-y-2">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  type="url"
                />
                {imageUrl && (
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full max-h-64 object-cover"
                      onError={() => toast.error('Invalid image URL')}
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <Button type="submit" disabled={!hasContent || createPost.isPending} className="w-full">
            {createPost.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Post
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
