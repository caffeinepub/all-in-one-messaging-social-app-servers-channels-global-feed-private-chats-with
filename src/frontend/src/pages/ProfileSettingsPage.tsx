import { useState, useEffect } from 'react';
import { useGetCallerUserProfile, useSaveCallerUserProfile } from '../hooks/useQueries';
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
import { Plus, X } from 'lucide-react';
import type { Attachment, UserProfile } from '../backend';

interface ExtendedUserProfile extends UserProfile {
  bio?: string;
  status?: string;
  pronouns?: string;
  links?: string[];
  showIdToOthers?: boolean;
  bannerUrl?: string;
  themeColor?: string;
}

export default function ProfileSettingsPage() {
  const { identity } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const saveProfile = useSaveCallerUserProfile();
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarAttachment, setAvatarAttachment] = useState<Attachment | null>(null);
  const [avatarMode, setAvatarMode] = useState<'url' | 'upload'>('url');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState('');
  const [pronouns, setPronouns] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [newLink, setNewLink] = useState('');
  const [showIdToOthers, setShowIdToOthers] = useState(true);
  const [bannerUrl, setBannerUrl] = useState('');
  const [themeColor, setThemeColor] = useState('');

  useEffect(() => {
    if (userProfile) {
      const extendedProfile = userProfile as ExtendedUserProfile;
      setDisplayName(userProfile.displayName);
      setAvatarUrl(userProfile.avatarUrl || '');
      setAvatarAttachment(userProfile.avatarAttachment || null);
      setAvatarMode(userProfile.avatarAttachment ? 'upload' : 'url');
      setBio(extendedProfile.bio || '');
      setStatus(extendedProfile.status || '');
      setPronouns(extendedProfile.pronouns || '');
      setLinks(extendedProfile.links || []);
      setShowIdToOthers(extendedProfile.showIdToOthers !== false);
      setBannerUrl(extendedProfile.bannerUrl || '');
      setThemeColor(extendedProfile.themeColor || '');
    }
  }, [userProfile]);

  const handleAddLink = () => {
    if (newLink.trim() && links.length < 5) {
      setLinks([...links, newLink.trim()]);
      setNewLink('');
    }
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    try {
      const profileData: any = {
        displayName: displayName.trim(),
        avatarUrl: avatarMode === 'url' ? (avatarUrl.trim() || undefined) : undefined,
        avatarAttachment: avatarMode === 'upload' ? avatarAttachment || undefined : undefined,
      };

      // Add extended fields if they have values
      if (bio.trim()) profileData.bio = bio.trim();
      if (status.trim()) profileData.status = status.trim();
      if (pronouns.trim()) profileData.pronouns = pronouns.trim();
      if (links.length > 0) profileData.links = links;
      profileData.showIdToOthers = showIdToOthers;
      if (bannerUrl.trim()) profileData.bannerUrl = bannerUrl.trim();
      if (themeColor.trim()) profileData.themeColor = themeColor.trim();

      await saveProfile.mutateAsync(profileData);
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    }
  };

  return (
    <AuthGate message="Sign in to view and edit your profile">
      <div className="h-full overflow-y-auto pb-20 md:pb-4">
        <div className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Profile & Settings</h1>
            <p className="text-muted-foreground">Manage your account information</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your display name and avatar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center gap-4">
                  <UserAvatar displayName={displayName || 'Your Name'} profile={userProfile} className="h-20 w-20" />
                  <div className="flex-1">
                    <p className="font-semibold">{displayName || 'Your Name'}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {identity?.getPrincipal().toString()}
                    </p>
                  </div>
                </div>

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

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="status">Status (optional)</Label>
                  <Input
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    placeholder="What's your current status?"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pronouns">Pronouns (optional)</Label>
                  <Input
                    id="pronouns"
                    value={pronouns}
                    onChange={(e) => setPronouns(e.target.value)}
                    placeholder="e.g., they/them, she/her, he/him"
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio (optional)</Label>
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

                <div className="space-y-2">
                  <Label htmlFor="bannerUrl">Banner URL (optional)</Label>
                  <Input
                    id="bannerUrl"
                    value={bannerUrl}
                    onChange={(e) => setBannerUrl(e.target.value)}
                    placeholder="https://example.com/banner.jpg"
                    type="url"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="themeColor">Theme Color (optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="themeColor"
                      value={themeColor}
                      onChange={(e) => setThemeColor(e.target.value)}
                      placeholder="#FF5733"
                      maxLength={7}
                    />
                    <input
                      type="color"
                      value={themeColor || '#000000'}
                      onChange={(e) => setThemeColor(e.target.value)}
                      className="h-10 w-20 rounded border border-input cursor-pointer"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Links (optional, max 5)</Label>
                  {links.map((link, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input value={link} readOnly className="flex-1" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveLink(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {links.length < 5 && (
                    <div className="flex gap-2">
                      <Input
                        value={newLink}
                        onChange={(e) => setNewLink(e.target.value)}
                        placeholder="https://example.com"
                        type="url"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddLink();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddLink}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="showId">Show my ID to others</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow other users to see your principal ID
                    </p>
                  </div>
                  <Switch id="showId" checked={showIdToOthers} onCheckedChange={setShowIdToOthers} />
                </div>

                <Button type="submit" disabled={saveProfile.isPending}>
                  {saveProfile.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </form>
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
