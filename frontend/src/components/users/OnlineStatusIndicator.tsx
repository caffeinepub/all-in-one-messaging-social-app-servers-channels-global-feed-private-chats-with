import type { Principal } from '@icp-sdk/core/principal';

interface OnlineStatusIndicatorProps {
  userPrincipal: Principal;
  className?: string;
}

export default function OnlineStatusIndicator({ userPrincipal, className = '' }: OnlineStatusIndicatorProps) {
  // For now, show all authenticated users as online
  // This can be enhanced later with real activity tracking
  const isOnline = true;

  if (!isOnline) return null;

  return (
    <div className={`relative ${className}`}>
      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
    </div>
  );
}
