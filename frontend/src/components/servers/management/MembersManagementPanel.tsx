import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { UserX, Ban } from 'lucide-react';
import { useGetServerMembers, useKickMember, useBanMember, useIsCallerAdmin } from '../../../hooks/useQueries';
import type { ServerMember } from '../../../hooks/useQueries';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import { toast } from 'sonner';
import type { ServerInfo } from '../../../backend';
import type { Principal } from '@icp-sdk/core/principal';
import OnlineStatusIndicator from '../../users/OnlineStatusIndicator';

interface MembersManagementPanelProps {
  serverId: string;
  serverInfo: ServerInfo;
}

export default function MembersManagementPanel({ serverId, serverInfo }: MembersManagementPanelProps) {
  const { identity } = useInternetIdentity();
  const { data: isCallerAdmin } = useIsCallerAdmin();
  const { data: members, isLoading } = useGetServerMembers(serverId);
  const kickMember = useKickMember();
  const banMember = useBanMember();
  const [actionMember, setActionMember] = useState<ServerMember | null>(null);
  const [actionType, setActionType] = useState<'kick' | 'ban' | null>(null);

  const isOwner = identity && identity.getPrincipal().toString() === serverInfo.ownerPrincipal.toString();
  const canManage = isOwner || isCallerAdmin;

  const handleKick = async () => {
    if (!actionMember) return;
    try {
      await kickMember.mutateAsync({ serverId, memberPrincipal: actionMember.principal });
      toast.success(`${actionMember.displayName} has been kicked from the server`);
      setActionMember(null);
      setActionType(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to kick member');
    }
  };

  const handleBan = async () => {
    if (!actionMember) return;
    try {
      await banMember.mutateAsync({ serverId, memberPrincipal: actionMember.principal });
      toast.success(`${actionMember.displayName} has been banned from the server`);
      setActionMember(null);
      setActionType(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to ban member');
    }
  };

  if (isLoading) {
    return (
      <Card className="settings-card">
        <CardHeader>
          <CardTitle>Member Management</CardTitle>
          <CardDescription>Loading members...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Member Management</h2>
        <p className="text-sm text-settings-muted-foreground">View and manage server members</p>
      </div>

      <Card className="settings-card">
        <CardHeader>
          <CardTitle className="text-base">Server Members ({members?.length || 0})</CardTitle>
          <CardDescription>All members currently in this server</CardDescription>
        </CardHeader>
        <CardContent>
          {!members || members.length === 0 ? (
            <p className="text-sm text-settings-muted-foreground">No members found</p>
          ) : (
            <div className="space-y-2">
              {members.map((member) => {
                const isSelf = identity && identity.getPrincipal().toString() === member.principal.toString();
                const isServerOwner = member.principal.toString() === serverInfo.ownerPrincipal.toString();
                const canActOnMember = canManage && !isSelf && !isServerOwner;

                return (
                  <div
                    key={member.principal.toString()}
                    className="flex items-center justify-between p-3 rounded-lg bg-settings-muted/50 hover:bg-settings-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                          {member.displayName.charAt(0).toUpperCase()}
                        </div>
                        <OnlineStatusIndicator userPrincipal={member.principal} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{member.displayName}</p>
                        <p className="text-xs text-settings-muted-foreground truncate font-mono">
                          {member.principal.toString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={member.role === 'Owner' ? 'default' : member.role === 'Moderator' ? 'secondary' : 'outline'}>
                        {member.role}
                      </Badge>
                      {canActOnMember && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActionMember(member);
                              setActionType('kick');
                            }}
                            disabled={kickMember.isPending || banMember.isPending}
                          >
                            <UserX className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setActionMember(member);
                              setActionType('ban');
                            }}
                            disabled={kickMember.isPending || banMember.isPending}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!actionMember && actionType === 'kick'} onOpenChange={(open) => !open && setActionMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kick Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to kick {actionMember?.displayName}? They can rejoin using an invite code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleKick} disabled={kickMember.isPending}>
              {kickMember.isPending ? 'Kicking...' : 'Kick Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!actionMember && actionType === 'ban'} onOpenChange={(open) => !open && setActionMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban {actionMember?.displayName}? They will not be able to rejoin this server.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBan} disabled={banMember.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {banMember.isPending ? 'Banning...' : 'Ban Member'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
