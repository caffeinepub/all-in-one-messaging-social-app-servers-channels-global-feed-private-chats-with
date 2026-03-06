import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { useState } from 'react';
import { useGetServerInviteCode } from '../../../hooks/useQueries';
import type { ServerInfo } from '../../../backend';

interface InvitesManagementPanelProps {
  serverId: string;
  serverInfo: ServerInfo;
}

export default function InvitesManagementPanel({ serverId, serverInfo }: InvitesManagementPanelProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const { data: inviteCode, isLoading } = useGetServerInviteCode(serverId);

  const inviteLink = inviteCode ? `${window.location.origin}/?invite=${encodeURIComponent(inviteCode)}` : '';

  const handleCopyCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      toast.success('Invite code copied to clipboard');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      toast.success('Invite link copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Card className="settings-card">
        <CardHeader>
          <CardTitle>Server Invites</CardTitle>
          <CardDescription>Loading invite information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Server Invites</h2>
        <p className="text-sm text-settings-muted-foreground">Share your server with others using invite codes or links</p>
      </div>

      <Card className="settings-card">
        <CardHeader>
          <CardTitle className="text-base">Invite Code</CardTitle>
          <CardDescription>A short code that users can enter to join your server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteCode">Code</Label>
            <div className="flex gap-2">
              <Input
                id="inviteCode"
                value={inviteCode || 'Loading...'}
                readOnly
                className="font-mono text-sm"
              />
              <Button type="button" variant="outline" onClick={handleCopyCode} disabled={!inviteCode}>
                {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-settings-muted-foreground">
              Users can enter this code on the homepage to join your server.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="settings-card">
        <CardHeader>
          <CardTitle className="text-base">Invite Link</CardTitle>
          <CardDescription>A permanent URL that anyone can use to join your server</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inviteLink">Link</Label>
            <div className="flex gap-2">
              <Input
                id="inviteLink"
                value={inviteLink || 'Loading...'}
                readOnly
                className="font-mono text-xs"
              />
              <Button type="button" variant="outline" onClick={handleCopyLink} disabled={!inviteLink}>
                {copiedLink ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-settings-muted-foreground">
              Share this link anywhere. The invite code remains valid even if the server is renamed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
