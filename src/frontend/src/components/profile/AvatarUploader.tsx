import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useUploadAttachment } from '../../hooks/useQueries';
import { ExternalBlob } from '../../backend';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import type { Attachment } from '../../backend';

interface AvatarUploaderProps {
  onUploadComplete: (attachment: Attachment) => void;
  currentAttachment?: Attachment | null;
}

export default function AvatarUploader({ onUploadComplete, currentAttachment }: AvatarUploaderProps) {
  const uploadAttachment = useUploadAttachment();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const MAX_FILE_SIZE = 10 * 1024 * 1024;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Only image files (JPEG, PNG, GIF, WebP) are allowed');
      e.target.value = '';
      return;
    }

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

      onUploadComplete(attachment);
      toast.success('Avatar uploaded successfully');
      e.target.value = '';
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        id="avatar-upload-input"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />
      <Button
        type="button"
        variant="outline"
        onClick={() => document.getElementById('avatar-upload-input')?.click()}
        disabled={uploading}
        className="w-full"
      >
        {uploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : currentAttachment ? (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Change Avatar
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Choose Avatar Image
          </>
        )}
      </Button>
      {uploading && uploadProgress > 0 && (
        <Progress value={uploadProgress} className="w-full" />
      )}
      {currentAttachment && !uploading && (
        <p className="text-xs text-muted-foreground">Avatar uploaded successfully</p>
      )}
    </div>
  );
}
