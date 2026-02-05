import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useGetUserProfile } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import UserAvatar from './UserAvatar';
import { X } from 'lucide-react';
import type { Principal } from '@icp-sdk/core/principal';
import type { UserProfile } from '../../backend';

interface ExtendedUserProfile extends UserProfile {
  bio?: string;
  status?: string;
  pronouns?: string;
  links?: string[];
  showIdToOthers?: boolean;
  bannerUrl?: string;
  themeColor?: string;
}

interface ProfilePopoverProps {
  userPrincipal: Principal;
  displayName: string;
  children: React.ReactNode;
}

export default function ProfilePopover({ userPrincipal, displayName, children }: ProfilePopoverProps) {
  const [open, setOpen] = useState(false);
  const { identity } = useInternetIdentity();
  const { data: profile } = useGetUserProfile(userPrincipal);

  const isOwnProfile = identity?.getPrincipal().toString() === userPrincipal.toString();
  const extendedProfile = profile as ExtendedUserProfile | null;
  const showId = isOwnProfile || extendedProfile?.showIdToOthers !== false;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <UserAvatar displayName={displayName} profile={profile} className="h-16 w-16" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-lg truncate">{displayName}</h3>
                {showId && (
                  <p className="text-xs text-muted-foreground truncate">{userPrincipal.toString()}</p>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-6 w-6">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {extendedProfile && (
            <>
              {(extendedProfile.bio || extendedProfile.status || extendedProfile.pronouns) && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    {extendedProfile.status && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Status</p>
                        <p className="text-sm">{extendedProfile.status}</p>
                      </div>
                    )}
                    {extendedProfile.pronouns && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Pronouns</p>
                        <p className="text-sm">{extendedProfile.pronouns}</p>
                      </div>
                    )}
                    {extendedProfile.bio && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">Bio</p>
                        <p className="text-sm whitespace-pre-wrap">{extendedProfile.bio}</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {extendedProfile.links && extendedProfile.links.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">Links</p>
                    {extendedProfile.links.map((link, index) => (
                      <a
                        key={index}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline block truncate"
                      >
                        {link}
                      </a>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
