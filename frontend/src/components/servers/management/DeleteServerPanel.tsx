import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useDeleteServer, useIsCallerAdmin } from '../../../hooks/useQueries';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import { toast } from 'sonner';
import type { ServerInfo } from '../../../backend';

interface DeleteServerPanelProps {
  serverId: string;
  serverInfo: ServerInfo;
  onDeleteSuccess?: () => void;
}

export default function DeleteServerPanel({ serverId, serverInfo, onDeleteSuccess }: DeleteServerPanelProps) {
  const { identity } = useInternetIdentity();
  const { data: isCallerAdmin } = useIsCallerAdmin();
  const deleteServer = useDeleteServer();
  const [confirmationName, setConfirmationName] = useState('');
  const [showDialog, setShowDialog] = useState(false);

  const isOwner = identity && identity.getPrincipal().toString() === serverInfo.ownerPrincipal.toString();
  const canDelete = isOwner || isCallerAdmin;

  const handleDelete = async () => {
    if (confirmationName !== serverInfo.name) {
      toast.error('Server name does not match');
      return;
    }

    try {
      await deleteServer.mutateAsync({ serverId, confirmationName });
      toast.success('Server deleted successfully');
      setShowDialog(false);
      if (onDeleteSuccess) {
        onDeleteSuccess();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete server');
    }
  };

  if (!canDelete) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1 text-destructive">Delete Server</h2>
          <p className="text-sm text-settings-muted-foreground">Permanently remove this server</p>
        </div>
        <Card className="settings-card border-destructive/50">
          <CardContent className="pt-6">
            <p className="text-sm text-settings-muted-foreground">
              Only the server owner or verified moderators can delete this server.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1 text-destructive">Danger Zone</h2>
        <p className="text-sm text-settings-muted-foreground">Irreversible and destructive actions</p>
      </div>

      <Card className="settings-card border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive">Delete Server</CardTitle>
          <CardDescription>Permanently delete this server and all its data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-destructive">Warning: This action cannot be undone</p>
              <ul className="text-xs text-settings-muted-foreground space-y-1 list-disc list-inside">
                <li>All channels and messages will be permanently deleted</li>
                <li>All members will be removed from the server</li>
                <li>Server invites will no longer work</li>
                <li>This action is immediate and irreversible</li>
              </ul>
            </div>
          </div>

          <Button
            variant="destructive"
            onClick={() => setShowDialog(true)}
            className="w-full"
          >
            Delete Server
          </Button>
        </CardContent>
      </Card>

      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Server: {serverInfo.name}</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="confirmName">Type the server name to confirm:</Label>
              <Input
                id="confirmName"
                value={confirmationName}
                onChange={(e) => setConfirmationName(e.target.value)}
                placeholder={serverInfo.name}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmationName('')}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={confirmationName !== serverInfo.name || deleteServer.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteServer.isPending ? 'Deleting...' : 'Delete Server'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
