import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useGetServerExtended, useUpdateServerBranding, useIsCallerAdmin } from '../../../hooks/useQueries';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Image as ImageIcon } from 'lucide-react';
import type { ServerInfo, ServerBranding } from '../../../backend';

interface BrandingManagementPanelProps {
  serverId: string;
  serverInfo: ServerInfo;
}

export default function BrandingManagementPanel({ serverId, serverInfo }: BrandingManagementPanelProps) {
  const { identity } = useInternetIdentity();
  const { data: isCallerAdmin } = useIsCallerAdmin();
  const { data: serverExtended, isLoading } = useGetServerExtended(serverId);
  const updateBranding = useUpdateServerBranding();

  const [iconUrl, setIconUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');

  useEffect(() => {
    if (serverExtended?.branding) {
      setIconUrl(serverExtended.branding.icon || '');
      setBannerUrl(serverExtended.branding.banner || '');
    }
  }, [serverExtended]);

  const isOwner = identity && identity.getPrincipal().toString() === serverInfo.ownerPrincipal.toString();
  const canManage = isOwner || isCallerAdmin;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serverExtended?.branding) return;

    try {
      const updatedBranding: ServerBranding = {
        ...serverExtended.branding,
        icon: iconUrl || undefined,
        banner: bannerUrl || undefined,
      };
      await updateBranding.mutateAsync({ serverId, branding: updatedBranding });
      toast.success('Server branding updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update branding');
    }
  };

  if (isLoading) {
    return (
      <Card className="settings-card">
        <CardHeader>
          <CardTitle>Branding</CardTitle>
          <CardDescription>Loading branding information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManage) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Branding</h2>
          <p className="text-sm text-settings-muted-foreground">Server icon and banner customization</p>
        </div>
        <Card className="settings-card">
          <CardContent className="pt-6">
            <p className="text-sm text-settings-muted-foreground">
              Only the server owner or verified moderators can modify branding settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Branding</h2>
        <p className="text-sm text-settings-muted-foreground">Customize your server's visual identity</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="settings-card">
          <CardHeader>
            <CardTitle className="text-base">Server Icon</CardTitle>
            <CardDescription>A square image that represents your server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {iconUrl && (
              <div className="flex justify-center">
                <img src={iconUrl} alt="Server icon" className="h-24 w-24 rounded-lg object-cover" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="iconUrl">Icon URL</Label>
              <input
                id="iconUrl"
                type="url"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                placeholder="https://example.com/icon.png"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-settings-muted-foreground">
                Enter a URL to an image (recommended: 512x512px)
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="settings-card">
          <CardHeader>
            <CardTitle className="text-base">Server Banner</CardTitle>
            <CardDescription>A wide image displayed at the top of your server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {bannerUrl && (
              <div className="flex justify-center">
                <img src={bannerUrl} alt="Server banner" className="w-full max-w-md h-32 rounded-lg object-cover" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="bannerUrl">Banner URL</Label>
              <input
                id="bannerUrl"
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="https://example.com/banner.png"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p className="text-xs text-settings-muted-foreground">
                Enter a URL to an image (recommended: 1600x400px)
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={updateBranding.isPending}>
            {updateBranding.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
