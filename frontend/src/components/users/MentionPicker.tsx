import { useEffect, useRef } from 'react';
import { useSearchUsers } from '../../hooks/useQueries';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Principal } from '@icp-sdk/core/principal';

interface MentionPickerProps {
  searchTerm: string;
  selectedIndex: number;
  onSelect: (principal: Principal, displayName: string) => void;
  onIndexChange: (index: number) => void;
}

export default function MentionPicker({
  searchTerm,
  selectedIndex,
  onSelect,
  onIndexChange,
}: MentionPickerProps) {
  const { data: searchResults, isLoading } = useSearchUsers(searchTerm);
  const selectedRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  useEffect(() => {
    onIndexChange(0);
  }, [searchResults, onIndexChange]);

  if (!searchTerm.trim()) {
    return null;
  }

  return (
    <div className="bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-hidden">
      <ScrollArea className="h-full max-h-60">
        {isLoading ? (
          <div className="p-3 text-sm text-muted-foreground text-center">Searching...</div>
        ) : searchResults && searchResults.length > 0 ? (
          <div className="py-1">
            {searchResults.map((result, index) => (
              <button
                key={result.principal.toString()}
                ref={index === selectedIndex ? selectedRef : null}
                onClick={() => onSelect(result.principal, result.displayName)}
                className={cn(
                  'w-full text-left px-3 py-2 flex items-center gap-2 transition-colors',
                  index === selectedIndex ? 'bg-accent' : 'hover:bg-accent'
                )}
              >
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{result.displayName}</span>
                  {result.isAdmin && (
                    <Badge variant="secondary" className="text-xs mt-0.5">
                      Moderator
                    </Badge>
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-3 text-sm text-muted-foreground text-center">No users found</div>
        )}
      </ScrollArea>
    </div>
  );
}
