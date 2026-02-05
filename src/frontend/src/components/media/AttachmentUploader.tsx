import { useState } from 'react';
import { useUploadAttachment } from '../../hooks/useQueries';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ImagePlus, Loader2 } from 'lucide-react';
import { ExternalBlob } from '../../backend';
import type { Attachment } from '../../backend';

interface AttachmentUploaderProps {
  onUpload: (attachment: Attachment) => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function AttachmentUploader({ onUpload }: AttachmentUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const uploadAttachment = useUploadAttachment();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only image files (JPEG, PNG, GIF, WebP) are allowed');
      e.target.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10MB');
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      const attachment = await uploadAttachment.mutateAsync({
        fileReference: blob,
        fileType: file.type,
        size: BigInt(file.size),
      });

      onUpload(attachment);
      toast.success('Image uploaded successfully');
      e.target.value = '';
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div>
      <input
        type="file"
        id="attachment-upload"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => document.getElementById('attachment-upload')?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ImagePlus className="h-4 w-4" />
        )}
      </Button>
      {uploading && uploadProgress > 0 && (
        <div className="text-xs text-muted-foreground mt-1">
          Uploading: {uploadProgress}%
        </div>
      )}
    </div>
  );
}
