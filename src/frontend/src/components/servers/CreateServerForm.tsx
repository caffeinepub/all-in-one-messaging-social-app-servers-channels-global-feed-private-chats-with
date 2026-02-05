import { useState } from 'react';
import { useCreateServer } from '../../hooks/useQueries';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateServerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function CreateServerForm({ onSuccess, onCancel }: CreateServerFormProps) {
  const [name, setName] = useState('');
  const createServer = useCreateServer();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Server name is required');
      return;
    }

    try {
      await createServer.mutateAsync({ name: name.trim() });
      toast.success('Server created!');
      setName('');
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create server');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="serverName" className="text-xs">Server Name</Label>
        <Input
          id="serverName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Server"
          size={1}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={createServer.isPending} className="flex-1">
          {createServer.isPending ? 'Creating...' : 'Create'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
