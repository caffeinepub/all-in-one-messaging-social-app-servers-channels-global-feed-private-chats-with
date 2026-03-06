import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface ExternalLinkSafetyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  url: string;
}

export default function ExternalLinkSafetyDialog({
  open,
  onOpenChange,
  onConfirm,
  url,
}: ExternalLinkSafetyDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-warning" />
            <AlertDialogTitle>External Link Warning</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-3 pt-2">
            <p>You are about to visit an external website:</p>
            <div className="p-3 bg-muted rounded-md">
              <code className="text-xs break-all">{url}</code>
            </div>
            <p className="text-sm">
              This link leads to a website outside of this application. Please be cautious and verify the URL before proceeding. External sites may contain harmful content or attempt to collect your personal information.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
