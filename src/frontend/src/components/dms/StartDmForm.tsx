import { useState } from 'react';
import { Principal } from '@icp-sdk/core/principal';
import { Label } from '@/components/ui/label';
import UserAutocompleteInput from '../users/UserAutocompleteInput';

interface StartDmFormProps {
  onStart: (principal: Principal) => void;
}

export default function StartDmForm({ onStart }: StartDmFormProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSelectUser = (principal: Principal, displayName: string) => {
    onStart(principal);
    setSearchTerm('');
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="search" className="text-sm">Start New Conversation</Label>
      <UserAutocompleteInput
        value={searchTerm}
        onChange={setSearchTerm}
        onSelect={handleSelectUser}
        placeholder="Search by username..."
      />
    </div>
  );
}
