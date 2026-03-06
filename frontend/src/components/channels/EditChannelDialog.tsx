import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEditChannel } from '../../hooks/useQueries';
import { toast } from 'sonner';

interface EditChannelDialogProps {
  serverId: string;
  channelId: string;
  channelName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function EditChannelDialog({
  serverId,
  channelId,
  channelName,
  open,
  onOpenChange,
  onSuccess,
}: EditChannelDialogProps) {
  const [newName, setNewName] = useState(channelName);
  const editChannel = useEditChannel();

  useEffect(() => {
    setNewName(channelName);
  }, [channelName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Channel name cannot be empty');
      return;
    }

    try {
      await editChannel.mutateAsync({ serverId, channelId, newName: newName.trim() });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update channel');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Channel Settings</DialogTitle>
          <DialogDescription>Update the channel name and settings</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="channelName">Channel Name</Label>
            <Input
              id="channelName"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter channel name"
              required
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={editChannel.isPending}>
              {editChannel.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
