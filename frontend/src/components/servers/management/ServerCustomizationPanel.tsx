import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEditServer, useGetServer, useIsCallerAdmin } from '../../../hooks/useQueries';
import { toast } from 'sonner';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import type { ServerInfo } from '../../../backend';

interface ServerCustomizationPanelProps {
  serverId: string;
  serverInfo: ServerInfo;
}

export default function ServerCustomizationPanel({ serverId, serverInfo }: ServerCustomizationPanelProps) {
  const { identity } = useInternetIdentity();
  const { data: server } = useGetServer(serverId);
  const { data: isCallerAdmin } = useIsCallerAdmin();
  const editServer = useEditServer();
  const [serverName, setServerName] = useState(server?.name || serverInfo.name || '');

  useEffect(() => {
    if (server) {
      setServerName(server.name);
    }
  }, [server]);

  const isOwner = identity && server && identity.getPrincipal().toString() === server.ownerPrincipal.toString();
  const canManage = isOwner || isCallerAdmin;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverName.trim()) {
      toast.error('Server name cannot be empty');
      return;
    }

    try {
      await editServer.mutateAsync({ serverId, newName: serverName.trim() });
      toast.success('Server settings updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update server settings');
    }
  };

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Server Settings</CardTitle>
          <CardDescription>Only the server owner or verified moderators can modify these settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You do not have permission to edit this server's settings.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Server Settings</CardTitle>
        <CardDescription>Customize your server's name and appearance</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="serverName">Server Name</Label>
            <Input
              id="serverName"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="Enter server name"
              required
            />
          </div>
          <Button type="submit" disabled={editServer.isPending}>
            {editServer.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
