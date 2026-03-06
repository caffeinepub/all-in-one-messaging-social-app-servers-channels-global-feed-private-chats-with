import { useState, useRef, useEffect } from 'react';
import { useSearchUsers } from '../../hooks/useQueries';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Principal } from '@icp-sdk/core/principal';

interface UserAutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (principal: Principal, displayName: string) => void;
  placeholder?: string;
  className?: string;
}

export default function UserAutocompleteInput({
  value,
  onChange,
  onSelect,
  placeholder = 'Search users...',
  className,
}: UserAutocompleteInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { data: searchResults, isLoading } = useSearchUsers(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!searchResults || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        handleSelect(searchResults[selectedIndex].principal, searchResults[selectedIndex].displayName);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const handleSelect = (principal: Principal, displayName: string) => {
    onSelect(principal, displayName);
    onChange('');
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {showDropdown && value.trim() && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-hidden"
        >
          <ScrollArea className="h-full max-h-60">
            {isLoading ? (
              <div className="p-3 text-sm text-muted-foreground text-center">Searching...</div>
            ) : searchResults && searchResults.length > 0 ? (
              <div className="py-1">
                {searchResults.map((result, index) => (
                  <button
                    key={result.principal.toString()}
                    onClick={() => handleSelect(result.principal, result.displayName)}
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
      )}
    </div>
  );
}
