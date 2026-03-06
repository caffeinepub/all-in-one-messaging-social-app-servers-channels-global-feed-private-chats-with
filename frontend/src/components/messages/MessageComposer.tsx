import { useState, useRef, useCallback } from 'react';
import { useSendMessage } from '../../hooks/useQueries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AttachmentUploader from '../media/AttachmentUploader';
import AttachmentPreview from '../media/AttachmentPreview';
import MentionPicker from '../users/MentionPicker';
import { toast } from 'sonner';
import { Send, Loader2 } from 'lucide-react';
import type { Principal } from '@icp-sdk/core/principal';
import type { Attachment } from '../../backend';

interface MessageComposerProps {
  serverId: string;
  channelId: string;
}

export default function MessageComposer({ serverId, channelId }: MessageComposerProps) {
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [mediaMode, setMediaMode] = useState<'upload' | 'url'>('upload');
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionStartIndex, setMentionStartIndex] = useState(0);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const sendMessage = useSendMessage();

  const handleMentionSelect = useCallback((principal: Principal, displayName: string) => {
    const beforeMention = content.substring(0, mentionStartIndex);
    const cursorPos = inputRef.current?.selectionStart || content.length;
    const afterCursor = content.substring(cursorPos);
    
    const newContent = beforeMention + '@' + displayName + ' ' + afterCursor;
    setContent(newContent);
    setShowMentionPicker(false);
    setMentionSearch('');
    
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = mentionStartIndex + displayName.length + 2;
        inputRef.current.focus();
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  }, [content, mentionStartIndex]);

  const handleContentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart || 0;
    setContent(value);

    const textBeforeCursor = value.substring(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1 && textBeforeCursor.substring(atIndex + 1).indexOf(' ') === -1) {
      setShowMentionPicker(true);
      setMentionSearch(textBeforeCursor.substring(atIndex + 1));
      setMentionStartIndex(atIndex);
    } else {
      setShowMentionPicker(false);
      setMentionSearch('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showMentionPicker) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex((prev) => prev + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex((prev) => Math.max(0, prev - 1));
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setShowMentionPicker(false);
      setMentionSearch('');
    }
  };

  const hasContent = content.trim().length > 0 || attachments.length > 0 || imageUrl.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasContent) {
      return;
    }

    try {
      await sendMessage.mutateAsync({
        serverId,
        channelId,
        content: content.trim(),
        attachments: mediaMode === 'upload' ? attachments : [],
        imageUrl: mediaMode === 'url' && imageUrl.trim() ? imageUrl.trim() : undefined,
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
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (use @ to mention)"
            className={content.includes('@') ? 'bg-accent/10' : ''}
          />
          {showMentionPicker && (
            <div className="absolute bottom-full left-0 right-0 mb-1 z-50">
              <MentionPicker
                searchTerm={mentionSearch}
                selectedIndex={selectedMentionIndex}
                onSelect={handleMentionSelect}
                onIndexChange={setSelectedMentionIndex}
              />
            </div>
          )}
        </div>
        <Button type="submit" size="icon" disabled={!hasContent || sendMessage.isPending}>
          {sendMessage.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </form>
  );
}
