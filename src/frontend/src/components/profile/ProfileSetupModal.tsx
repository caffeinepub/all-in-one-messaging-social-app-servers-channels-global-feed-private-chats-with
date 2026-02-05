import { useState } from 'react';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AvatarUploader from './AvatarUploader';
import { toast } from 'sonner';
import type { Attachment, ExtendedUserProfile, FieldVisibility } from '../../backend';

export default function ProfileSetupModal() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarAttachment, setAvatarAttachment] = useState<Attachment | null>(null);
  const [avatarMode, setAvatarMode] = useState<'url' | 'upload'>('url');

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    try {
      const profileData: ExtendedUserProfile = {
        displayName: displayName.trim(),
        displayNameVisibility: 'publicVisibility' as FieldVisibility,
        avatarUrl: avatarMode === 'url' ? (avatarUrl.trim() || undefined) : undefined,
        avatarAttachment: avatarMode === 'upload' ? avatarAttachment || undefined : undefined,
        avatarVisibility: 'publicVisibility' as FieldVisibility,
        bio: '',
        bioVisibility: 'publicVisibility' as FieldVisibility,
        joinDate: BigInt(0),
        joinDateVisibility: 'publicVisibility' as FieldVisibility,
      };

      await saveProfile.mutateAsync(profileData);
      toast.success('Profile created successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create profile');
    }
  };

  return (
    <Dialog open={showProfileSetup} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Welcome! Set up your profile</DialogTitle>
          <DialogDescription>Choose a display name to get started. You can update this later.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name *</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Avatar (optional)</Label>
            <Tabs value={avatarMode} onValueChange={(v) => setAvatarMode(v as 'url' | 'upload')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="url">URL</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>
              <TabsContent value="url" className="space-y-2">
                <Input
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  type="url"
                />
              </TabsContent>
              <TabsContent value="upload" className="space-y-2">
                <AvatarUploader
                  onUploadComplete={setAvatarAttachment}
                  currentAttachment={avatarAttachment}
                />
              </TabsContent>
            </Tabs>
          </div>
          <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? 'Creating...' : 'Create Profile'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
