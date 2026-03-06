import { Badge } from '@/components/ui/badge';
import VerifiedBadge from './VerifiedBadge';
import type { Principal } from '@icp-sdk/core/principal';

interface ModeratorVisualTreatmentProps {
  displayName: string;
  isVerified: boolean;
  userPrincipal: Principal;
  className?: string;
  showLabel?: boolean;
}

export default function ModeratorVisualTreatment({
  displayName,
  isVerified,
  userPrincipal,
  className = '',
  showLabel = true,
}: ModeratorVisualTreatmentProps) {
  if (!isVerified) {
    return <p className={`font-semibold truncate ${className}`}>{displayName}</p>;
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <p className={`font-semibold truncate ${className}`}>{displayName}</p>
        <VerifiedBadge className="h-4 w-4" />
      </div>
      {showLabel && (
        <Badge variant="secondary" className="text-xs font-medium">
          Verified Moderator
        </Badge>
      )}
    </div>
  );
}
