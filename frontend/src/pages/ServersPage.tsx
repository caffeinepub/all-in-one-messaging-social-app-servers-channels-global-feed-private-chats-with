import { useState } from 'react';
import { useGetAllServers, useGetServer } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import ServerList from '../components/servers/ServerList';
import ServerManagementDialog from '../components/servers/management/ServerManagementDialog';
import ChannelList from '../components/channels/ChannelList';
import ChannelTimeline from '../components/messages/ChannelTimeline';
import EmptyState from '../components/empty/EmptyState';
import AuthGate from '../components/auth/AuthGate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ServerBrowser from '../components/servers/ServerBrowser';

export default function ServersPage() {
  const { identity } = useInternetIdentity();
  const { data: servers, isLoading } = useGetAllServers();
  const [selectedServerId, setSelectedServerId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [managementServerId, setManagementServerId] = useState<string | null>(null);

  const { data: selectedServer } = useGetServer(selectedServerId || '');
  const { data: managementServer } = useGetServer(managementServerId || '');

  const handleServerDeleted = () => {
    setManagementServerId(null);
    setSelectedServerId(null);
    setSelectedChannelId(null);
  };

  const handleChannelDeleted = () => {
    setSelectedChannelId(null);
  };

  const currentUserPrincipal = identity?.getPrincipal().toString();

  return (
    <AuthGate>
      <div className="container mx-auto p-4 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Servers</h1>
            <p className="text-muted-foreground">Manage your servers and channels</p>
          </div>
        </div>

        <Tabs defaultValue="my-servers" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="my-servers">My Servers</TabsTrigger>
            <TabsTrigger value="discover">Discover</TabsTrigger>
          </TabsList>

          <TabsContent value="my-servers" className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading servers...</p>
              </div>
            ) : !servers || servers.length === 0 ? (
              <EmptyState
                imageSrc="/assets/generated/empty-messages.dim_900x600.png"
                title="No servers yet"
                description="Create your first server to get started"
              />
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <ServerList
                    servers={servers}
                    selectedServerId={selectedServerId}
                    onSelectServer={setSelectedServerId}
                    onServerDeleted={handleServerDeleted}
                    currentUserPrincipal={currentUserPrincipal}
                    onOpenManagement={setManagementServerId}
                  />
                </div>

                {selectedServerId && selectedServer ? (
                  <>
                    <div className="lg:col-span-1">
                      <ChannelList
                        serverId={selectedServerId}
                        selectedChannelId={selectedChannelId}
                        onSelectChannel={setSelectedChannelId}
                        onChannelDeleted={handleChannelDeleted}
                        serverInfo={selectedServer}
                      />
                    </div>

                    <div className="lg:col-span-1">
                      {selectedChannelId ? (
                        <ChannelTimeline
                          serverId={selectedServerId}
                          channelId={selectedChannelId}
                        />
                      ) : (
                        <EmptyState
                          imageSrc="/assets/generated/empty-messages.dim_900x600.png"
                          title="Select a channel"
                          description="Choose a channel to view messages"
                        />
                      )}
                    </div>
                  </>
                ) : (
                  <div className="lg:col-span-2">
                    <EmptyState
                      imageSrc="/assets/generated/empty-messages.dim_900x600.png"
                      title="Select a server"
                      description="Choose a server to view its channels"
                    />
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="discover">
            <ServerBrowser />
          </TabsContent>
        </Tabs>

        {managementServerId && managementServer && (
          <ServerManagementDialog
            server={managementServer}
            open={!!managementServerId}
            onOpenChange={(open) => !open && setManagementServerId(null)}
            onServerDeleted={handleServerDeleted}
          />
        )}
      </div>
    </AuthGate>
  );
}
