import { useState, useEffect } from 'react';
import { useGetCallerUserProfile, useSaveCallerUserProfile, useUpdateProfileFieldVisibility } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AuthGate from '../components/auth/AuthGate';
import UserAvatar from '../components/profile/UserAvatar';
import AvatarUploader from '../components/profile/AvatarUploader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Eye, EyeOff, Copy } from 'lucide-react';
import type { Attachment, ExtendedUserProfile, FieldVisibility } from '../backend';

export default function ProfileSettingsPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const updateVisibility = useUpdateProfileFieldVisibility();
  
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarAttachment, setAvatarAttachment] = useState<Attachment | null>(null);
  const [avatarMode, setAvatarMode] = useState<'url' | 'upload'>('url');
  const [bio, setBio] = useState('');
  
  // Visibility states
  const [displayNameVisibility, setDisplayNameVisibility] = useState<FieldVisibility>('publicVisibility' as FieldVisibility);
  const [avatarVisibility, setAvatarVisibility] = useState<FieldVisibility>('publicVisibility' as FieldVisibility);
  const [bioVisibility, setBioVisibility] = useState<FieldVisibility>('publicVisibility' as FieldVisibility);
  const [joinDateVisibility, setJoinDateVisibility] = useState<FieldVisibility>('publicVisibility' as FieldVisibility);
  
  // Principal ID reveal state
  const [showPrincipalId, setShowPrincipalId] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName);
      setAvatarUrl(userProfile.avatarUrl || '');
      setAvatarAttachment(userProfile.avatarAttachment || null);
      setAvatarMode(userProfile.avatarAttachment ? 'upload' : 'url');
      setBio(userProfile.bio || '');
      setDisplayNameVisibility(userProfile.displayNameVisibility);
      setAvatarVisibility(userProfile.avatarVisibility);
      setBioVisibility(userProfile.bioVisibility);
      setJoinDateVisibility(userProfile.joinDateVisibility);
    }
  }, [userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    try {
      const profileData: ExtendedUserProfile = {
        displayName: displayName.trim(),
        displayNameVisibility,
        avatarUrl: avatarMode === 'url' ? (avatarUrl.trim() || undefined) : undefined,
        avatarAttachment: avatarMode === 'upload' ? avatarAttachment || undefined : undefined,
        avatarVisibility,
        bio: bio.trim(),
        bioVisibility,
        joinDate: userProfile?.joinDate || BigInt(0),
        joinDateVisibility,
      };

      await saveProfile.mutateAsync(profileData);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  const handleVisibilityToggle = async (field: string, currentVisibility: FieldVisibility) => {
    const newVisibility: FieldVisibility = (currentVisibility === 'publicVisibility' ? 'privateVisibility' : 'publicVisibility') as FieldVisibility;
    
    try {
      await updateVisibility.mutateAsync({ field, visibility: newVisibility });
      
      // Update local state
      switch (field) {
        case 'displayName':
          setDisplayNameVisibility(newVisibility);
          break;
        case 'avatar':
          setAvatarVisibility(newVisibility);
          break;
        case 'bio':
          setBioVisibility(newVisibility);
          break;
        case 'joinDate':
          setJoinDateVisibility(newVisibility);
          break;
      }
      
      toast.success('Visibility updated');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update visibility');
    }
  };

  const handleCopyPrincipalId = () => {
    if (identity) {
      navigator.clipboard.writeText(identity.getPrincipal().toString());
      toast.success('Principal ID copied to clipboard');
    }
  };

  const formatJoinDate = (timestamp: bigint) => {
    if (!timestamp || timestamp === BigInt(0)) return 'Not available';
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <AuthGate message="Sign in to view and edit your profile">
      <div className="h-full overflow-y-auto pb-20 md:pb-4">
        <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Profile & Settings</h1>
            <p className="text-muted-foreground">Manage your account information and privacy</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your display name, avatar, and bio</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-4">
                  <UserAvatar displayName={displayName || 'Your Name'} profile={userProfile} className="h-20 w-20" />
                  <div className="flex-1">
                    <p className="font-semibold">{displayName || 'Your Name'}</p>
                    <p className="text-sm text-muted-foreground">
                      Joined {userProfile ? formatJoinDate(userProfile.joinDate) : 'recently'}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVisibilityToggle('displayName', displayNameVisibility)}
                      disabled={updateVisibility.isPending}
                    >
                      {displayNameVisibility === 'publicVisibility' ? (
                        <><Eye className="h-4 w-4 mr-2" /> Public</>
                      ) : (
                        <><EyeOff className="h-4 w-4 mr-2" /> Private</>
                      )}
                    </Button>
                  </div>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    required
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Avatar (optional)</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVisibilityToggle('avatar', avatarVisibility)}
                      disabled={updateVisibility.isPending}
                    >
                      {avatarVisibility === 'publicVisibility' ? (
                        <><Eye className="h-4 w-4 mr-2" /> Public</>
                      ) : (
                        <><EyeOff className="h-4 w-4 mr-2" /> Private</>
                      )}
                    </Button>
                  </div>
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

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="bio">Bio (optional)</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVisibilityToggle('bio', bioVisibility)}
                      disabled={updateVisibility.isPending}
                    >
                      {bioVisibility === 'publicVisibility' ? (
                        <><Eye className="h-4 w-4 mr-2" /> Public</>
                      ) : (
                        <><EyeOff className="h-4 w-4 mr-2" /> Private</>
                      )}
                    </Button>
                  </div>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">{bio.length}/500 characters</p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Join Date</Label>
                      <p className="text-sm text-muted-foreground">
                        {userProfile ? formatJoinDate(userProfile.joinDate) : 'Not available'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleVisibilityToggle('joinDate', joinDateVisibility)}
                      disabled={updateVisibility.isPending}
                    >
                      {joinDateVisibility === 'publicVisibility' ? (
                        <><Eye className="h-4 w-4 mr-2" /> Public</>
                      ) : (
                        <><EyeOff className="h-4 w-4 mr-2" /> Private</>
                      )}
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={saveProfile.isPending}>
                  {saveProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>View your principal ID (for advanced users only)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Principal ID</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPrincipalId(!showPrincipalId)}
                    className="flex-shrink-0"
                  >
                    {showPrincipalId ? (
                      <><EyeOff className="h-4 w-4 mr-2" /> Hide my ID</>
                    ) : (
                      <><Eye className="h-4 w-4 mr-2" /> Show my ID</>
                    )}
                  </Button>
                  {showPrincipalId && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCopyPrincipalId}
                    >
                      <Copy className="h-4 w-4 mr-2" /> Copy
                    </Button>
                  )}
                </div>
                {showPrincipalId && identity && (
                  <div className="p-3 bg-muted rounded-md">
                    <code className="text-xs break-all">{identity.getPrincipal().toString()}</code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <footer className="text-center text-sm text-muted-foreground py-8">
            © 2026. Built with ❤️ using{' '}
            <a href="https://caffeine.ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">
              caffeine.ai
            </a>
          </footer>
        </div>
      </div>
    </AuthGate>
  );
}
