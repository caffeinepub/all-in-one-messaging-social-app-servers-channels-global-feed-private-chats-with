import { useState } from 'react';
import AuthGate from '../components/auth/AuthGate';
import DmTimeline from '../components/dms/DmTimeline';
import StartDmForm from '../components/dms/StartDmForm';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import type { Principal } from '@icp-sdk/core/principal';

export default function DirectMessagesPage() {
  const [selectedPrincipal, setSelectedPrincipal] = useState<Principal | null>(null);

  return (
    <AuthGate message="Sign in to view and send direct messages">
      <div className="h-full flex flex-col md:flex-row overflow-hidden">
        <div className="md:w-80 border-b md:border-b-0 md:border-r border-border overflow-y-auto">
          <div className="p-4 space-y-4">
            <h2 className="font-semibold text-lg">Direct Messages</h2>
            <StartDmForm onStart={setSelectedPrincipal} />
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {selectedPrincipal ? (
            <DmTimeline otherUserPrincipal={selectedPrincipal} />
          ) : (
            <Card className="m-4 border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Select a conversation or start a new one</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
