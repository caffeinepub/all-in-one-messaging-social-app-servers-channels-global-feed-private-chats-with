import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldOff } from 'lucide-react';
import { useGetServerBans, useUnbanMember, useIsCallerAdmin } from '../../../hooks/useQueries';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import { toast } from 'sonner';
import type { ServerInfo } from '../../../backend';

interface BansManagementPanelProps {
  serverId: string;
  serverInfo: ServerInfo;
}

export default function BansManagementPanel({ serverId, serverInfo }: BansManagementPanelProps) {
  const { identity } = useInternetIdentity();
  const { data: isCallerAdmin } = useIsCallerAdmin();
  const { data: bans, isLoading } = useGetServerBans(serverId);
  const unbanMember = useUnbanMember();

  const isOwner = identity && identity.getPrincipal().toString() === serverInfo.ownerPrincipal.toString();
  const canManage = isOwner || isCallerAdmin;

  const handleUnban = async (principal: any) => {
    try {
      await unbanMember.mutateAsync({ serverId, memberPrincipal: principal });
      toast.success('Member has been unbanned');
    } catch (error: any) {
      toast.error(error.message || 'Failed to unban member');
    }
  };

  if (isLoading) {
    return (
      <Card className="settings-card">
        <CardHeader>
          <CardTitle>Bans & Kicks</CardTitle>
          <CardDescription>Loading ban information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Bans & Kicks</h2>
        <p className="text-sm text-settings-muted-foreground">Manage banned users and moderation actions</p>
      </div>

      <Card className="settings-card">
        <CardHeader>
          <CardTitle className="text-base">Banned Users ({bans?.length || 0})</CardTitle>
          <CardDescription>Users who have been banned from this server</CardDescription>
        </CardHeader>
        <CardContent>
          {!bans || bans.length === 0 ? (
            <div className="text-center py-8">
              <ShieldOff className="h-12 w-12 mx-auto mb-3 text-settings-muted-foreground" />
              <p className="text-sm text-settings-muted-foreground">No banned users</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bans.map((ban) => (
                <div
                  key={ban.principal.toString()}
                  className="flex items-center justify-between p-3 rounded-lg bg-settings-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-mono truncate">{ban.principal.toString()}</p>
                    {ban.reason && (
                      <p className="text-xs text-settings-muted-foreground mt-1">Reason: {ban.reason}</p>
                    )}
                    <p className="text-xs text-settings-muted-foreground mt-1">
                      Banned: {new Date(Number(ban.banTimestamp) / 1000000).toLocaleDateString()}
                    </p>
                  </div>
                  {canManage && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnban(ban.principal)}
                      disabled={unbanMember.isPending}
                    >
                      {unbanMember.isPending ? 'Unbanning...' : 'Unban'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
