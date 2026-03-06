import { useState } from 'react';
import AuthGate from '../components/auth/AuthGate';
import DmTimeline from '../components/dms/DmTimeline';
import DmThreadList from '../components/dms/DmThreadList';
import StartDmForm from '../components/dms/StartDmForm';
import { useGetDMThreads } from '../hooks/useQueries';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MessageCircle, Plus } from 'lucide-react';
import type { Principal } from '@icp-sdk/core/principal';

export default function DirectMessagesPage() {
  const [selectedPrincipal, setSelectedPrincipal] = useState<Principal | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data: threads, isLoading } = useGetDMThreads();

  const handleStartDm = (principal: Principal) => {
    setSelectedPrincipal(principal);
    setSheetOpen(false);
  };

  return (
    <AuthGate message="Sign in to view and send direct messages">
      <div className="h-full flex flex-col md:flex-row overflow-hidden">
        <div className="md:w-80 border-b md:border-b-0 md:border-r border-border overflow-y-auto">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Direct Messages</h2>
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button size="sm" variant="outline" className="md:hidden">
                    <Plus className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="h-[80vh]">
                  <SheetHeader>
                    <SheetTitle>Start New Conversation</SheetTitle>
                  </SheetHeader>
                  <div className="mt-4">
                    <StartDmForm onStart={handleStartDm} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="hidden md:block">
              <StartDmForm onStart={handleStartDm} />
            </div>
            
            {isLoading ? (
              <div className="text-sm text-muted-foreground text-center py-4">Loading conversations...</div>
            ) : threads && threads.length > 0 ? (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Conversations</h3>
                <DmThreadList
                  selectedUserPrincipal={selectedPrincipal}
                  onSelectThread={setSelectedPrincipal}
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {selectedPrincipal ? (
            <DmTimeline otherUserPrincipal={selectedPrincipal} />
          ) : (
            <Card className="m-4 border-dashed">
              <CardContent className="pt-12 pb-12 text-center space-y-4">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground mb-2">Select a conversation or start a new one</p>
                  <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                      <Button className="md:hidden">
                        <Plus className="h-4 w-4 mr-2" />
                        New Conversation
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="h-[80vh]">
                      <SheetHeader>
                        <SheetTitle>Start New Conversation</SheetTitle>
                      </SheetHeader>
                      <div className="mt-4">
                        <StartDmForm onStart={handleStartDm} />
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
