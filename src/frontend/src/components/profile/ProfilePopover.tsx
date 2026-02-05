import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useGetUserProfile } from '../../hooks/useQueries';
import UserAvatar from './UserAvatar';
import { X } from 'lucide-react';
import type { Principal } from '@icp-sdk/core/principal';

interface ProfilePopoverProps {
  userPrincipal: Principal;
  displayName: string;
  children: React.ReactNode;
}

export default function ProfilePopover({ userPrincipal, displayName, children }: ProfilePopoverProps) {
  const [open, setOpen] = useState(false);
  const { data: profile } = useGetUserProfile(userPrincipal);

  const formatJoinDate = (timestamp: bigint) => {
    if (!timestamp || timestamp === BigInt(0)) return null;
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const joinDateStr = profile?.joinDate ? formatJoinDate(profile.joinDate) : null;

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
                {joinDateStr && (
                  <p className="text-xs text-muted-foreground">Joined {joinDateStr}</p>
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
