import { useState } from 'react';
import { useCreateChannel } from '../../hooks/useQueries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateChannelFormProps {
  serverId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateChannelForm({ serverId, onSuccess, onCancel }: CreateChannelFormProps) {
  const [name, setName] = useState('');
  const createChannel = useCreateChannel();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Channel name is required');
      return;
    }

    try {
      await createChannel.mutateAsync({ serverId, channelName: name.trim() });
      toast.success('Channel created!');
      setName('');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create channel');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="channelName" className="text-xs">Channel Name</Label>
        <Input
          id="channelName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="general"
          size={1}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={createChannel.isPending} className="flex-1">
          {createChannel.isPending ? 'Creating...' : 'Create'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
