import { useState } from 'react';
import { useGetAllServers } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import AuthGate from '../components/auth/AuthGate';
import ServerList from '../components/servers/ServerList';
import ChannelList from '../components/channels/ChannelList';
import ChannelTimeline from '../components/messages/ChannelTimeline';
import { Card, CardContent } from '@/components/ui/card';
import { Server } from 'lucide-react';
import type { ServerInfo } from '../backend';

export default function ServersPage() {
  const { identity } = useInternetIdentity();
  const { data: servers } = useGetAllServers();
  const [selectedServer, setSelectedServer] = useState<ServerInfo | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const handleSelectServer = (serverId: string) => {
    const server = servers?.find(s => s.id === serverId) || null;
    setSelectedServer(server);
    setSelectedChannelId(null);
  };

  const handleServerDeleted = () => {
    setSelectedServer(null);
    setSelectedChannelId(null);
  };

  const handleChannelDeleted = () => {
    setSelectedChannelId(null);
  };

  return (
    <AuthGate message="Sign in to access servers and channels">
      <div className="h-full flex flex-col md:flex-row overflow-hidden">
        <div className="md:w-64 border-b md:border-b-0 md:border-r border-border overflow-y-auto">
          <ServerList
            servers={servers || []}
            selectedServerId={selectedServer?.id || null}
            onSelectServer={handleSelectServer}
            onServerDeleted={handleServerDeleted}
            currentUserPrincipal={identity?.getPrincipal().toString()}
          />
        </div>

        {selectedServer ? (
          <>
            <div className="md:w-64 border-b md:border-b-0 md:border-r border-border overflow-y-auto">
              <ChannelList
                serverId={selectedServer.id}
                selectedChannelId={selectedChannelId}
                onSelectChannel={setSelectedChannelId}
                onChannelDeleted={handleChannelDeleted}
                serverOwnerPrincipal={identity?.getPrincipal().toString()}
                serverInfo={selectedServer}
              />
            </div>

            <div className="flex-1 overflow-hidden">
              {selectedChannelId ? (
                <ChannelTimeline serverId={selectedServer.id} channelId={selectedChannelId} />
              ) : (
                <Card className="m-4 border-dashed">
                  <CardContent className="pt-12 pb-12 text-center">
                    <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">Select a channel to view messages</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="max-w-md border-dashed">
              <CardContent className="pt-12 pb-12 text-center">
                <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Select a server to get started</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AuthGate>
  );
}
