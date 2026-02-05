import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ExternalBlob } from '../../backend';
import type { Attachment } from '../../backend';

interface AttachmentPreviewProps {
  attachments: Attachment[];
  onRemove: (index: number) => void;
}

export default function AttachmentPreview({ attachments, onRemove }: AttachmentPreviewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {attachments.map((attachment, index) => {
        const buffer = new ArrayBuffer(attachment.byteLength);
        const uint8Array = new Uint8Array(buffer);
        uint8Array.set(new Uint8Array(attachment));
        const blob = ExternalBlob.fromBytes(uint8Array);
        const url = blob.getDirectURL();
        
        return (
          <div key={index} className="relative group">
            <img
              src={url}
              alt={`Attachment ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg border border-border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onRemove(index)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
