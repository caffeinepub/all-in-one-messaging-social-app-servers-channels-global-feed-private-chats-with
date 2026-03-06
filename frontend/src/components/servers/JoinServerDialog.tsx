import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useJoinServerByInvite, useJoinServerById } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface JoinServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serverId?: string;
}

export default function JoinServerDialog({ open, onOpenChange, serverId }: JoinServerDialogProps) {
  const [inviteCode, setInviteCode] = useState('');
  const joinByInvite = useJoinServerByInvite();
  const joinById = useJoinServerById();

  useEffect(() => {
    if (!open) {
      setInviteCode('');
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (serverId) {
        // Direct join by server ID
        await joinById.mutateAsync(serverId);
      } else {
        // Join by invite code
        if (!inviteCode.trim()) {
          toast.error('Please enter an invite code');
          return;
        }
        await joinByInvite.mutateAsync(inviteCode.trim());
      }
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to join server');
    }
  };

  const isLoading = joinByInvite.isPending || joinById.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Join Server</DialogTitle>
          <DialogDescription>
            {serverId
              ? 'Click join to become a member of this server'
              : 'Enter an invite code to join a server'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          {!serverId && (
            <div className="space-y-2 py-4">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Enter invite code"
                disabled={isLoading}
              />
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Joining...' : 'Join Server'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
