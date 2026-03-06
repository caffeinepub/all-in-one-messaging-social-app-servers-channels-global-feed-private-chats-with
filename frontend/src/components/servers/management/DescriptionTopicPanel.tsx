import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useGetServerExtended, useUpdateServerBranding, useIsCallerAdmin } from '../../../hooks/useQueries';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import { toast } from 'sonner';
import type { ServerInfo, ServerBranding } from '../../../backend';

interface DescriptionTopicPanelProps {
  serverId: string;
  serverInfo: ServerInfo;
}

export default function DescriptionTopicPanel({ serverId, serverInfo }: DescriptionTopicPanelProps) {
  const { identity } = useInternetIdentity();
  const { data: isCallerAdmin } = useIsCallerAdmin();
  const { data: serverExtended, isLoading } = useGetServerExtended(serverId);
  const updateBranding = useUpdateServerBranding();

  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');

  useEffect(() => {
    if (serverExtended?.branding) {
      setDescription(serverExtended.branding.description || '');
      setTopic(serverExtended.branding.topic || '');
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
        description: description.trim(),
        topic: topic.trim(),
      };
      await updateBranding.mutateAsync({ serverId, branding: updatedBranding });
      toast.success('Server description updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update description');
    }
  };

  if (isLoading) {
    return (
      <Card className="settings-card">
        <CardHeader>
          <CardTitle>Description & Topic</CardTitle>
          <CardDescription>Loading server information...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManage) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-1">Description & Topic</h2>
          <p className="text-sm text-settings-muted-foreground">Server description and topic information</p>
        </div>
        <Card className="settings-card">
          <CardContent className="pt-6">
            <p className="text-sm text-settings-muted-foreground">
              Only the server owner or verified moderators can modify these settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Description & Topic</h2>
        <p className="text-sm text-settings-muted-foreground">Tell members what your server is about</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="settings-card">
          <CardHeader>
            <CardTitle className="text-base">Server Description</CardTitle>
            <CardDescription>A detailed description of your server's purpose and community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your server..."
                rows={5}
                maxLength={500}
              />
              <p className="text-xs text-settings-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="settings-card">
          <CardHeader>
            <CardTitle className="text-base">Server Topic</CardTitle>
            <CardDescription>A short topic or tagline for your server</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Gaming, Technology, Art..."
                maxLength={100}
              />
              <p className="text-xs text-settings-muted-foreground">
                {topic.length}/100 characters
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
