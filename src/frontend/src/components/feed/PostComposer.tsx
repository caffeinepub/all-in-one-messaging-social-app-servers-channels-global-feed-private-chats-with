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
import { Send } from 'lucide-react';
import type { Attachment } from '../../backend';

export default function PostComposer() {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [mediaMode, setMediaMode] = useState<'upload' | 'url'>('upload');
  const createPost = useCreatePost();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const hasContent = content.trim().length > 0;
    const hasUploadedMedia = attachments.length > 0;
    const hasUrlMedia = imageUrl.trim().length > 0;

    if (!hasContent && !hasUploadedMedia && !hasUrlMedia) {
      toast.error('Please add some content or media');
      return;
    }

    try {
      await createPost.mutateAsync({
        content: content.trim(),
        attachments: mediaMode === 'upload' ? attachments : [],
        imageUrl: mediaMode === 'url' && imageUrl.trim() ? imageUrl.trim() : null,
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
                <TabsTrigger value="upload">Upload Image</TabsTrigger>
                <TabsTrigger value="url">Image URL</TabsTrigger>
              </TabsList>
              <TabsContent value="upload" className="space-y-2">
                {attachments.length > 0 && (
                  <AttachmentPreview
                    attachments={attachments}
                    onRemove={(index) => setAttachments(attachments.filter((_, i) => i !== index))}
                  />
                )}
                <AttachmentUploader onUpload={(attachment) => setAttachments([...attachments, attachment])} />
              </TabsContent>
              <TabsContent value="url" className="space-y-2">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  type="url"
                />
                {imageUrl && (
                  <img src={imageUrl} alt="Preview" className="rounded-lg w-full max-h-64 object-cover" onError={() => toast.error('Invalid image URL')} />
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={createPost.isPending} className="gap-2">
              {createPost.isPending ? 'Posting...' : 'Post'}
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
