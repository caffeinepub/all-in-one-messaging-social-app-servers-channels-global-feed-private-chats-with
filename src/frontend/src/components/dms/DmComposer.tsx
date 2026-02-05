import { useState, useRef } from 'react';
import { useSendDirectMessage } from '../../hooks/useQueries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AttachmentUploader from '../media/AttachmentUploader';
import AttachmentPreview from '../media/AttachmentPreview';
import UserAutocompleteInput from '../users/UserAutocompleteInput';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import type { Principal } from '@icp-sdk/core/principal';
import type { Attachment } from '../../backend';

interface DmComposerProps {
  recipientPrincipal: Principal;
}

export default function DmComposer({ recipientPrincipal }: DmComposerProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [mediaMode, setMediaMode] = useState<'upload' | 'url'>('upload');
  const [showMentionAutocomplete, setShowMentionAutocomplete] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendDm = useSendDirectMessage();

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setContent(value);
    setCursorPosition(cursorPos);

    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && atIndex === cursorPos - 1) {
      setShowMentionAutocomplete(true);
      setMentionSearch('');
    } else if (atIndex !== -1 && textBeforeCursor.substring(atIndex + 1).indexOf(' ') === -1) {
      setShowMentionAutocomplete(true);
      setMentionSearch(textBeforeCursor.substring(atIndex + 1));
    } else {
      setShowMentionAutocomplete(false);
      setMentionSearch('');
    }
  };

  const handleMentionSelect = (principal: Principal, displayName: string) => {
    const textBeforeCursor = content.substring(0, cursorPosition);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    const textAfterCursor = content.substring(cursorPosition);
    
    const newContent = content.substring(0, atIndex) + '@' + displayName + ' ' + textAfterCursor;
    setContent(newContent);
    setShowMentionAutocomplete(false);
    setMentionSearch('');
    
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = atIndex + displayName.length + 2;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && attachments.length === 0 && !imageUrl.trim()) {
      return;
    }

    try {
      await sendDm.mutateAsync({
        recipientPrincipal,
        content: content.trim(),
        attachments: mediaMode === 'upload' ? attachments : [],
        imageUrl: mediaMode === 'url' && imageUrl.trim() ? imageUrl.trim() : null,
      });
      setContent('');
      setAttachments([]);
      setImageUrl('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <Tabs value={mediaMode} onValueChange={(v) => setMediaMode(v as 'upload' | 'url')} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
        </TabsList>
        <TabsContent value="upload">
          {attachments.length > 0 && (
            <AttachmentPreview
              attachments={attachments}
              onRemove={(index) => setAttachments(attachments.filter((_, i) => i !== index))}
            />
          )}
        </TabsContent>
        <TabsContent value="url">
          {imageUrl && (
            <div className="mb-2">
              <img src={imageUrl} alt="Preview" className="rounded-lg max-h-32 object-cover" onError={() => toast.error('Invalid image URL')} />
            </div>
          )}
          <Input
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Image URL"
            type="url"
          />
        </TabsContent>
      </Tabs>
      <div className="flex items-end gap-2 relative">
        {mediaMode === 'upload' && (
          <AttachmentUploader onUpload={(attachment) => setAttachments([...attachments, attachment])} />
        )}
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={content}
            onChange={handleContentChange}
            placeholder="Type a message... (use @ to mention)"
            className="flex-1"
          />
          {showMentionAutocomplete && (
            <div className="absolute bottom-full left-0 right-0 mb-1 z-50">
              <UserAutocompleteInput
                value={mentionSearch}
                onChange={setMentionSearch}
                onSelect={handleMentionSelect}
                placeholder="Search users to mention..."
              />
            </div>
          )}
        </div>
        <Button type="submit" size="icon" disabled={sendDm.isPending}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
