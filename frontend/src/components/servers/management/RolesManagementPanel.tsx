import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Crown, User } from 'lucide-react';
import { useGetCallerServerRole } from '../../../hooks/useQueries';
import type { ServerInfo } from '../../../backend';

interface RolesManagementPanelProps {
  serverId: string;
  serverInfo: ServerInfo;
}

export default function RolesManagementPanel({ serverId, serverInfo }: RolesManagementPanelProps) {
  const { data: callerRole, isLoading } = useGetCallerServerRole(serverId);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Owner':
        return <Crown className="h-5 w-5 text-settings-accent" />;
      case 'Moderator':
        return <Shield className="h-5 w-5 text-settings-accent" />;
      default:
        return <User className="h-5 w-5 text-settings-muted-foreground" />;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'Owner':
        return 'Full control over all server settings, members, and content';
      case 'Moderator':
        return 'Can manage server settings, moderate content, and manage members';
      default:
        return 'Can view and participate in channels';
    }
  };

  if (isLoading) {
    return (
      <Card className="settings-card">
        <CardHeader>
          <CardTitle>Roles & Permissions</CardTitle>
          <CardDescription>Loading role information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Roles & Permissions</h2>
        <p className="text-sm text-settings-muted-foreground">View your role and permissions in this server</p>
      </div>

      <Card className="settings-card">
        <CardHeader>
          <CardTitle className="text-base">Your Role</CardTitle>
          <CardDescription>Your current role and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-settings-muted/50 rounded-lg flex items-start gap-4">
            {getRoleIcon(callerRole || 'Member')}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <p className="font-semibold">{callerRole || 'Member'}</p>
                <Badge variant={callerRole === 'Owner' ? 'default' : callerRole === 'Moderator' ? 'secondary' : 'outline'}>
                  {callerRole || 'Member'}
                </Badge>
              </div>
              <p className="text-sm text-settings-muted-foreground">
                {getRoleDescription(callerRole || 'Member')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="settings-card">
        <CardHeader>
          <CardTitle className="text-base">Role Hierarchy</CardTitle>
          <CardDescription>Understanding server roles</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-settings-muted/30">
            <Crown className="h-5 w-5 text-settings-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Owner</p>
              <p className="text-xs text-settings-muted-foreground">Complete control over the server</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-settings-muted/30">
            <Shield className="h-5 w-5 text-settings-accent shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Moderator</p>
              <p className="text-xs text-settings-muted-foreground">Can manage settings and moderate content</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-settings-muted/30">
            <User className="h-5 w-5 text-settings-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Member</p>
              <p className="text-xs text-settings-muted-foreground">Can participate in channels</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
