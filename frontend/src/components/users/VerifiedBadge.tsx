import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VerifiedBadgeProps {
  className?: string;
}

export default function VerifiedBadge({ className }: VerifiedBadgeProps) {
  return (
    <CheckCircle2 
      className={cn('inline-block text-blue-500 h-5 w-5', className)} 
      aria-label="Verified user"
    />
  );
}
