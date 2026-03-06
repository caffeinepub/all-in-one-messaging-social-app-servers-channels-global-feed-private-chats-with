import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useGetUserProfile, useCheckVerificationStatus, useGetProfileVisibility } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import UserAvatar from './UserAvatar';
import VerifiedBadge from '../users/VerifiedBadge';
import ExternalLinkSafetyDialog from './ExternalLinkSafetyDialog';
import { X, Link as LinkIcon } from 'lucide-react';
import type { Principal } from '@icp-sdk/core/principal';

const BACKGROUND_PRESETS: Record<string, string> = {
  default: 'bg-gradient-to-br from-background to-muted',
  sunset: 'bg-gradient-to-br from-orange-500/20 to-pink-500/20',
  ocean: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20',
  forest: 'bg-gradient-to-br from-green-500/20 to-emerald-500/20',
  midnight: 'bg-gradient-to-br from-purple-900/30 to-blue-900/30',
  aurora: 'bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20',
};

interface ProfilePopoverProps {
  userPrincipal: Principal;
  displayName: string;
  children: React.ReactNode;
}

export default function ProfilePopover({ userPrincipal, displayName, children }: ProfilePopoverProps) {
  const [open, setOpen] = useState(false);
  const [linkToOpen, setLinkToOpen] = useState<string | null>(null);
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetUserProfile(userPrincipal);
  const { data: isVerified } = useCheckVerificationStatus(userPrincipal);
  const { data: visibility } = useGetProfileVisibility(userPrincipal);

  const isOwnProfile = identity && identity.getPrincipal().toString() === userPrincipal.toString();

  const formatJoinDate = (timestamp: bigint) => {
    if (!timestamp || timestamp === BigInt(0)) return null;
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const joinDateStr = profile?.joinDate ? formatJoinDate(profile.joinDate) : null;
  const backgroundClass = BACKGROUND_PRESETS['default'];

  // Filter visible links based on visibility settings
  const visibleLinks = profile?.links
    ?.map((link, index) => {
      if (!link.trim()) return null;
      if (isOwnProfile) return link;
      if (visibility?.links && visibility.links[index] === 'publicVisibility') return link;
      return null;
    })
    .filter((link): link is string => link !== null) || [];

  const handleLinkClick = (e: React.MouseEvent, link: string) => {
    e.preventDefault();
    setLinkToOpen(link);
  };

  const handleConfirmLink = () => {
    if (linkToOpen) {
      window.open(linkToOpen, '_blank', 'noopener,noreferrer');
      setLinkToOpen(null);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {children}
        </PopoverTrigger>
        <PopoverContent className={`w-80 ${backgroundClass}`} align="start">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar displayName={displayName} profile={profile} className="h-16 w-16" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg truncate flex items-center gap-1.5">
                    <span>{displayName}</span>
                    {isVerified && <VerifiedBadge className="h-5 w-5" />}
                  </h3>
                  {isVerified && (
                    <Badge variant="secondary" className="mt-1 text-xs font-medium">
                      Verified Moderator
                    </Badge>
                  )}
                  {profile?.pronouns && (
                    <p className="text-sm text-muted-foreground mt-1">{profile.pronouns}</p>
                  )}
                  {joinDateStr && (
                    <p className="text-xs text-muted-foreground mt-1">Joined {joinDateStr}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-6 w-6">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {profile?.bio && profile.bio.trim() && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Bio</p>
                  <p className="text-sm whitespace-pre-wrap">{profile.bio}</p>
                </div>
              </>
            )}

            {visibleLinks.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Links</p>
                  <div className="space-y-1">
                    {visibleLinks.map((link, index) => (
                      <button
                        key={index}
                        onClick={(e) => handleLinkClick(e, link)}
                        className="flex items-center gap-2 text-sm text-primary hover:underline w-full text-left"
                      >
                        <LinkIcon className="h-3 w-3 shrink-0" />
                        <span className="truncate">{link}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <ExternalLinkSafetyDialog
        open={!!linkToOpen}
        onOpenChange={(open) => !open && setLinkToOpen(null)}
        onConfirm={handleConfirmLink}
        url={linkToOpen || ''}
      />
    </>
  );
}
