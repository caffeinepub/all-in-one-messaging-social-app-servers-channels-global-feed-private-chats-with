import { useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ExternalBlob } from '../../backend';
import type { UserProfile } from '../../backend';

interface UserAvatarProps {
  displayName: string;
  profile?: UserProfile | null;
  className?: string;
}

export default function UserAvatar({ displayName, profile, className }: UserAvatarProps) {
  const avatarSrc = useMemo(() => {
    if (!profile) return undefined;

    if (profile.avatarAttachment) {
      try {
        const buffer = new ArrayBuffer(profile.avatarAttachment.byteLength);
        const uint8Array = new Uint8Array(buffer);
        uint8Array.set(new Uint8Array(profile.avatarAttachment));
        const blob = ExternalBlob.fromBytes(uint8Array);
        return blob.getDirectURL();
      } catch (error) {
        console.error('Failed to process avatar attachment:', error);
        return profile.avatarUrl;
      }
    }

    return profile.avatarUrl;
  }, [profile]);

  const fallbackInitial = useMemo(() => {
    return displayName[0]?.toUpperCase() || '?';
  }, [displayName]);

  return (
    <Avatar className={className}>
      {avatarSrc && <AvatarImage src={avatarSrc} alt={displayName} />}
      <AvatarFallback>{fallbackInitial}</AvatarFallback>
    </Avatar>
  );
}
