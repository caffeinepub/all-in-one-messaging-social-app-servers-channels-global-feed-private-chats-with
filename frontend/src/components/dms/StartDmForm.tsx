import { useState } from 'react';
import { Principal } from '@icp-sdk/core/principal';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import UserAutocompleteInput from '../users/UserAutocompleteInput';
import { MessageSquarePlus } from 'lucide-react';

interface StartDmFormProps {
  onStart: (principal: Principal) => void;
}

export default function StartDmForm({ onStart }: StartDmFormProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrincipal, setSelectedPrincipal] = useState<Principal | null>(null);

  const handleSelectUser = (principal: Principal, displayName: string) => {
    setSelectedPrincipal(principal);
  };

  const handleStart = () => {
    if (selectedPrincipal) {
      onStart(selectedPrincipal);
      setSearchTerm('');
      setSelectedPrincipal(null);
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="search" className="text-sm font-medium">Start New Conversation</Label>
      <UserAutocompleteInput
        value={searchTerm}
        onChange={setSearchTerm}
        onSelect={handleSelectUser}
        placeholder="Search by username..."
      />
      {selectedPrincipal && (
        <Button onClick={handleStart} className="w-full" size="sm">
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          Start Conversation
        </Button>
      )}
    </div>
  );
}
